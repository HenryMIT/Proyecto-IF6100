import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { CartService, CartItem } from '../../shared/services/cart';
import { FacturaServices } from '../../shared/services/factura-services';
import { Token } from '../../shared/services/token';
import { ExchangeRateService } from '../../shared/services/exchange-rate';
import { PaypalCheckout } from '../paypal-checkout/paypal-checkout';
import { combineLatest, EmptyError, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CreateFactura, FacturaProducto } from '../../shared/models/Factura';
import { FacturaPdfData } from '../../shared/models/pdfInterfaz';
import { PrintService } from '../../shared/services/print-service';
import { Router } from '@angular/router';
import { DialogService } from '../forms/dialogo-generico/dialog.service';
import { Productos } from '../../shared/services/productos';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-carrito-compras',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, PaypalCheckout],
  templateUrl: './carrito-compras.html',
  styleUrls: ['./carrito-compras.css']
})
export class CarritoCompras implements OnDestroy {
  private readonly cartService = inject(CartService);
  private readonly facturaService = inject(FacturaServices);
  private readonly token = inject(Token);
  private readonly exchange = inject(ExchangeRateService);
  private readonly printService = inject(PrintService);
  private destroy$ = new Subject<void>();
  public errorLogin = signal(false);
  public paymentProcessing = signal(false);
  private readonly dialogService = inject(DialogService);
  private readonly router = inject(Router);
  private readonly productosService = inject(Productos);

  // client id tomado del environment (usa sandbox si no está configurado)
  paypalClientId = environment.paypalClientId;

  cart$: Observable<CartItem[]> = this.cartService.cart$;
  total$: Observable<number> = this.cartService.total$;

  // total en USD para pasar a PayPal (pedimos la tasa fresca al montar para usar el tipo de cambio del día)
  totalUsd$: Observable<number> = combineLatest([
    this.total$,
    this.exchange.getRate('CRC', 'USD', true)
  ]).pipe(
    map(([total, rate]) => {
      const usd = total * rate;
      return isFinite(usd) && usd > 0 ? Math.round(usd * 100) / 100 : 0;
    })
  );

  continuarCompra() {
    this.router.navigate(['/home']);
  }

  remove(id: number | undefined) {
    if (!id) return;
    this.cartService.removeProduct(id);
  }

  updateQuantity(id: number | undefined, value: string | number) {
    if (!id) return;

    const cantidad = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(cantidad) || cantidad < 0) return;

    const nuevaCantidad = Math.floor(cantidad);

    // 0 elimina el producto como ya hacías
    if (nuevaCantidad === 0) {
      this.cartService.updateQuantity(id, 0);
      return;
    }

    // 🔹 Validar contra el stock en BD
    this.productosService.getProducto(id).pipe(take(1)).subscribe({
      next: (producto) => {
        const stock = producto.cantidad ?? 0; // 👈 asumiendo campo "cantidad" en el backend

        if (nuevaCantidad > stock) {
          this.dialogService
            .informar(
              `Solo hay ${stock} unidades disponibles de este producto en stock.`,
              'Stock insuficiente'
            )
            .subscribe();

          // Opcional: ajusta a la cantidad máxima disponible
          if (stock > 0) {
            this.cartService.updateQuantity(id, stock);
          }

          return;
        }

        // Si hay stock suficiente, actualiza normal
        this.cartService.updateQuantity(id, nuevaCantidad);
      },
      error: (err) => {
        console.error('Error consultando stock del producto:', err);
        this.dialogService
          .error('No se pudo validar el stock del producto. Inténtalo de nuevo.', 'Error de stock')
          .subscribe();
      }
    });
  }

  onPayError(err: any) {
    console.error('Error en pago PayPal:', err);
    this.errorLogin.set(true);
    this.paymentProcessing.set(false);
  }

  // Maneja el pago exitoso
  async onPaySuccess(details: any) {
    this.paymentProcessing.set(true);

    try {
      // Obtener items del carrito y total
      const items = this.cartService.getItems();
      const total = items.reduce((acc, it) => acc + (it.precio || 0) * (it.cantidad || 0), 0);

      if (items.length === 0) {
        console.warn('Carrito vacío, no se puede crear factura');
        this.paymentProcessing.set(false);
        return;
      }

      // Obtener id_usuario desde el token
      const decoded = this.token.decodeToken();
      const id_usuario = decoded?.sub;


      if (!id_usuario) {
        console.error('Usuario no identificado');
        this.errorLogin.set(true);
        this.paymentProcessing.set(false);
        return;
      }

      // Paso 1: Crear la factura (una sola vez)
      const factura: CreateFactura = {
        id_usuario,
        comentario: 'PayPal',
      };

      console.log('Creando factura...', factura);
      const id_factura = await this.facturaService.createFactura(factura).toPromise();
      const id = Number(id_factura?.id) || 0;

      if (!id_factura) {
        throw new Error('No se obtuvo ID de factura');
      }

      // Paso 2: Crear registros factura_productos de forma SECUENCIAL
      for (const item of items) {
        const facturaProducto: FacturaProducto = {
          id_factura: id,
          id_producto: Number(item.id_Producto),
          cantidad: item.cantidad || 1
        };

        console.log('Creando factura_producto:', facturaProducto);
        await this.facturaService.creatFacturaProducto(facturaProducto).toPromise();
      }
      console.log(decoded.nombre);

      this.imprimirFacturaPDF(id, decoded);
      this.dialogoPago(id);
      this.dialogService.confirmar('Su pago fue realizado con exito.', '¡Pago Exitoso!');
    } catch (err) {
      console.error('Error en flujo de pago:', err);
      this.errorLogin.set(true);
      this.paymentProcessing.set(false);
      this.dialogService
        .error('Error procesando el pago. Intenta de nuevo. ', 'Error')
        .subscribe();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  imprimirFacturaPDF(id: number, decoded: any) {
    this.facturaService.obtenerDetalleFactura(id).subscribe({
      next: (facturaDetalle) => {
        // Generar y descargar el PDF de la factura
        const items = this.cartService.getItems();

        let nombre = decoded.nombre || '';
        let correo = decoded.correo || '';

        const data: FacturaPdfData = {
          numero: id,                 // el id de la factura que te devolvió el backend
          fecha: new Date(),
          clienteNombre: nombre,     // lo que tengas del usuario
          clienteCorreo: correo,   // opcional
          items: items.map(it => ({
            descripcion: it.descripcion,
            cantidad: it.cantidad || 1,
            precioUnitario: it.precio || 0
          })),
          subtotal: items.reduce((acc, it) => acc + (it.precio || 0) * (it.cantidad || 0), 0),
          impuestos: 0, // o calcula IVA aquí
          total: /* subtotal + impuestos */
            items.reduce((acc, it) => acc + (it.precio || 0) * (it.cantidad || 0), 0)
        };
        this.printService.printFactura(data, true);
      },
    });
  }

  dialogoPago(id: number) {
    this.facturaService.obtenerDetalleFactura(id).subscribe({
      next: (detalle: any[]) => {
        console.log('Detalle de factura:', detalle);

        let mensaje = `DETALLE DE FACTURA #${id}\n\n`;

        if (!detalle || detalle.length === 0) {
          mensaje += 'Esta factura no tiene productos.';
        } else {
          // Encabezado tipo tabla
          const header =
            'PRODUCTO'.padEnd(28) +
            'CANT'.padStart(6) +
            'PRECIO'.padStart(14) +
            'DESC'.padStart(8) +
            'SUBTOTAL'.padStart(14);

          const separador = '─'.repeat(header.length);

          mensaje += header + '\n';
          mensaje += separador + '\n';

          let totalGeneral = 0;

          detalle.forEach((item: any) => {
            // Cortamos la descripción si es muy larga para que no rompa la tabla
            const desc = (item.producto_descripcion ?? '')
              .toString()
              .slice(0, 27)
              .padEnd(28);

            const cant = String(item.cantidad).padStart(6);

            const precio = (
              '₡' +
              Number(item.producto_precio).toLocaleString('es-CR', {
                minimumFractionDigits: 2,
              })
            ).padStart(14);

            const descuento = (item.producto_descuento + '%').padStart(8);

            const subtotalNum =
              item.subtotal ??
              item.cantidad *
              item.producto_precio *
              (1 - (item.producto_descuento || 0) / 100);

            const subtotal = (
              '₡' +
              Number(subtotalNum).toLocaleString('es-CR', {
                minimumFractionDigits: 2,
              })
            ).padStart(14);

            totalGeneral += subtotalNum;

            mensaje += desc + cant + precio + descuento + subtotal + '\n';
          });

          mensaje += separador + '\n';
          mensaje +=
            'TOTAL'.padEnd(48) +
            (
              '₡' +
              totalGeneral.toLocaleString('es-CR', { minimumFractionDigits: 2 })
            ).padStart(22);
        }
        this.dialogService.informar(mensaje, 'Detalle de Factura').subscribe();

        // Si todo salió bien:          
        this.cartService.clear();
        this.paymentProcessing.set(false);
      },
      error: (err) => {
        console.error('Error al obtener detalle:', err);
        this.dialogService
          .error('Error al obtener el detalle de la factura: ' + err.error, 'Error')
          .subscribe();
      },
    });
  }

}
