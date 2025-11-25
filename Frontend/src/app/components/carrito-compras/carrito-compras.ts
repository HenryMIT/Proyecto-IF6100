import { Component, inject } from '@angular/core';
import { Observable, firstValueFrom, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartService, CartItem } from '../../shared/services/cart';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { PaypalCheckout } from '../paypal-checkout/paypal-checkout';
import { FacturaServices } from '../../shared/services/factura-services';
import { Token } from '../../shared/services/token';
import { Factura } from '../../shared/models/Factura';
import { environment } from '../../../environments/environment';
import { ExchangeRateService } from '../../shared/services/exchange-rate';

@Component({
  selector: 'app-carrito-compras',
  imports: [CommonModule, CurrencyPipe, PaypalCheckout],
  templateUrl: './carrito-compras.html',
  styleUrls: ['./carrito-compras.css']
})
export class CarritoCompras {
  private readonly cartService = inject(CartService);
  private readonly facturaService = inject(FacturaServices);
  private readonly token = inject(Token);
  private readonly exchange = inject(ExchangeRateService);

  // client id tomado del environment (usa sandbox si no está configurado)
  paypalClientId = environment.paypalClientId;

  cart$: Observable<CartItem[]> = this.cartService.cart$;
  total$: Observable<number> = this.cartService.total$;

  // total en USD para pasar a PayPal (pedimos la tasa fresca al montar para usar el tipo de cambio del día)
  totalUsd$: Observable<number> = combineLatest([this.total$, this.exchange.getRate('CRC','USD', true)]).pipe(
    map(([total, rate]) => {
      const r = Number(rate) || 0;
      const val = (total || 0) * r;
      // asegurar dos decimales (string aceptable por PayPal pero dejamos number)
      return Number(val.toFixed(2));
    })
  );

  remove(id: number | undefined) {
    this.cartService.removeProduct(id);
  }

  updateQuantity(id: number | undefined, value: string | number) {
    const cantidad = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(cantidad) || cantidad < 0) return;
    this.cartService.updateQuantity(id, Math.floor(cantidad));
  }

  onPayError(err: any) {
    console.error('Error en pago PayPal:', err);
    // aquí podrías mostrar un toast o notificación al usuario
  }

  // Maneja el pago exitoso
  async onPaySuccess(details: any) {
    try {
      // calcular total y obtener usuario
      const items = this.cartService.getItems();
      const total = items.reduce((acc, it) => acc + (it.precio || 0) * (it.cantidad || 0), 0);
      const decoded = this.token.decodeToken ? this.token.decodeToken() : null;
      const userId = decoded && decoded.sub ? Number(decoded.sub) : 0;

      console.log('Pago exitoso:', total);

      const factura: Factura = {
        id_usuario: userId,
        fecha: new Date().toISOString(),
        comentario: `Pago PayPal - ${details?.id || details?.orderID || ''}`,
        estado: 'PAGADA',
        total: total
      };

      // Llamar al servicio para crear la factura
      this.facturaService.createFactura(factura).subscribe({
        next: (id) => {
          console.log('Factura creada con id:', id);
          // limpiar carrito
          this.cartService.clear();
          // redirigir o mostrar confirmación según UX
        },
        error: (err) => {
          console.error('Error creando factura:', err);
        }
      });
    } catch (err) {
      console.error('Error en onPaySuccess:', err);
    }
  }
}
