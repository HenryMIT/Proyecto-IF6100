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
import { EmailServices } from '../../shared/services/email-services';
import { Correo_Electronico } from '../../shared/models/email_class';

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
  private readonly emailService = inject(EmailServices)
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

      
        await this.facturaService.creatFacturaProducto(facturaProducto).toPromise();
      }

      this.imprimirFacturaPDF(id, decoded);
      this.notificarCorreo(id, decoded.correo);
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

  notificarCorreo(id: number, correo_usr: string) {
    this.facturaService.obtenerDetalleFactura(id).subscribe({
      next: (detalle: any[]) => {
        let totalGeneral = 0;
        let filasHtml = '';

        detalle.forEach((item: any) => {
          const desc = (item.producto_descripcion ?? '').toString().slice(0, 60);

          const precioNum = Number(item.producto_precio) || 0;
          const descNum = Number(item.producto_descuento) || 0;

          const subtotalNum =
            item.subtotal ??
            item.cantidad * precioNum * (1 - (descNum || 0) / 100);

          totalGeneral += subtotalNum;

          const precio = '₡' + precioNum.toLocaleString('es-CR', {
            minimumFractionDigits: 2,
          });

          const subtotal = '₡' + Number(subtotalNum).toLocaleString('es-CR', {
            minimumFractionDigits: 2,
          });

          filasHtml += `
    <tr>
      <td style="padding:8px; border-bottom:1px solid #eee;">${desc}</td>
      <td style="padding:8px; border-bottom:1px solid #eee; text-align:center;">
        ${item.cantidad}
      </td>
      <td style="padding:8px; border-bottom:1px solid #eee; text-align:right;">
        ${precio}
      </td>
      <td style="padding:8px; border-bottom:1px solid #eee; text-align:center;">
        ${descNum}%
      </td>
      <td style="padding:8px; border-bottom:1px solid #eee; text-align:right;">
        ${subtotal}
      </td>
    </tr>
  `;
        });

        const totalFormato =
          '₡' + totalGeneral.toLocaleString('es-CR', { minimumFractionDigits: 2 });

        const mensajeHtml = `
  <div style="max-width:600px; margin:0 auto; font-family:Arial, sans-serif; font-size:14px; color:#333;">
    <h2 style="text-align:center; margin-bottom:16px;">
      DETALLE DE FACTURA #${id}
    </h2>

    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr style="background-color:#f5f5f5;">
          <th style="padding:8px; text-align:left; border-bottom:2px solid #ddd;">Producto</th>
          <th style="padding:8px; text-align:center; border-bottom:2px solid #ddd;">Cant</th>
          <th style="padding:8px; text-align:right; border-bottom:2px solid #ddd;">Precio</th>
          <th style="padding:8px; text-align:center; border-bottom:2px solid #ddd;">Desc</th>
          <th style="padding:8px; text-align:right; border-bottom:2px solid #ddd;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${filasHtml || `
          <tr>
            <td colspan="5" style="padding:12px; text-align:center; color:#777;">
              Esta factura no tiene productos.
            </td>
          </tr>
        `}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="padding:10px; text-align:right; font-weight:bold; border-top:2px solid #ddd;">
            TOTAL
          </td>
          <td style="padding:10px; text-align:right; font-weight:bold; border-top:2px solid #ddd;">
            ${totalFormato}
          </td>
        </tr>
      </tfoot>
    </table>

    <p style="margin-top:16px; font-size:12px; color:#777; text-align:center;">
      Gracias por su compra en <strong>Equipos Rummi</strong>.
    </p>
  </div>
`;
        const correo: Correo_Electronico = {
          destinatario: correo_usr,
          asunto: 'Factura - Equipos Rummi',
          cuerpo: mensajeHtml   // ahora va HTML
        };
        const noti = this.emailService.enviarCorreo(correo).subscribe({
          next: () => { console.log("Se realizo con exito") },
          error: (error) => {
            console.error(error);
          }
        });

      }
    });

  }

  dialogoPago(id: number) {
    this.facturaService.obtenerDetalleFactura(id).subscribe({
      next: (detalle: any[]) => {


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
