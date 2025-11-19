import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paypal-checkout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paypal-checkout.html',
  styleUrls: ['./paypal-checkout.css']
})
export class PaypalCheckout implements OnInit, OnDestroy {
  /**
   * Monto total (string o número). Si es número, se convertirá a string.
   */
  @Input() amount: string | number = '1000.00';
  /** Currency code, p.ej. 'USD', 'EUR' */
  @Input() currency = 'USD';
  /** Locale para la SDK de PayPal, p.ej. 'es_ES', 'es_MX', 'en_US' */
  @Input() locale = 'es_ES';
  /** client-id de PayPal; si no se provee, cae a 'sb' (sandbox) */
  @Input() clientId?: string;

  @Output() paymentSuccess = new EventEmitter<any>();
  @Output() paymentError = new EventEmitter<any>();

  loading = true;
  private scriptEl?: HTMLScriptElement;
  private rendered = false;

  ngOnInit(): void {
    // Inicializa el SDK y renderiza el botón al montar el componente
    this.initPayPal().catch(err => this.paymentError.emit(err));
  }

  ngOnDestroy(): void {
    // limpiar botón/render y script si es necesario
    try {
      const container = document.getElementById('paypal-button-container');
      if (container) container.innerHTML = '';
    } catch (_) {}

    if (this.scriptEl && this.scriptEl.parentNode) {
      // No eliminamos siempre el script para no romper otros componentes que dependan de él,
      // pero si quieres forzar la eliminación, descomenta la línea siguiente:
      // this.scriptEl.parentNode.removeChild(this.scriptEl);
    }
  }

  private async initPayPal() {
    const client = this.clientId || (window as any).__env?.paypalClientId || 'sb';
    // Cargamos el SDK especificando clientId, moneda y locale
    await this.loadPaypalSdk(client, this.currency, this.locale);

    const paypal = (window as any).paypal;
    if (!paypal || !paypal.Buttons) {
      this.loading = false;
      throw new Error('PayPal SDK no disponible');
    }

    // Evitar renderizado duplicado
    if (this.rendered) {
      this.loading = false;
      return;
    }

    paypal.Buttons({
      style: {
        layout: 'horizontal',
        color: 'gold',
        shape: 'rect',
        label: 'checkout'
      },
      createOrder: (data: any, actions: any) => {
        const value = typeof this.amount === 'number' ? this.amount.toFixed(2) : this.amount;
        return actions.order.create({
          purchase_units: [{
            amount: { value: value.toString(), currency_code: this.currency }
          }]
        });
      },
      onApprove: async (data: any, actions: any) => {
        try {
          const details = await actions.order.capture();
          this.paymentSuccess.emit(details);
        } catch (err) {
          this.paymentError.emit(err);
        }
      },
      onError: (err: any) => {
        this.paymentError.emit(err);
      }
    }).render('#paypal-button-container').then(() => {
      this.rendered = true;
      this.loading = false;
    }).catch((err: any) => {
      this.loading = false;
      this.paymentError.emit(err);
    });
  }
  /**
   * Carga el script del SDK de PayPal con clientId, currency y locale.
   * Si ya existe un script con el mismo clientId y locale esperará a que window.paypal esté listo.
   * Si existe un script con distinto locale o distinto clientId lo eliminará y forzará recarga
   * para evitar que aparezcan botones en otros idiomas (p. ej. japonés).
   */
  private loadPaypalSdk(clientId: string, currency: string, locale: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Si window.paypal ya existe y el script corresponde al mismo clientId+locale, ya está listo
      const existingScripts = Array.from(document.querySelectorAll('script[data-paypal-sdk]')) as HTMLScriptElement[];

      // Buscar un script exactamente igual (clientId + locale)
      const match = existingScripts.find(s => s.getAttribute('data-client-id') === clientId && s.getAttribute('data-locale') === locale);
      if (match && (window as any).paypal) {
        resolve();
        return;
      }

      // Si existe algún script con data-paypal-sdk pero diferente locale, lo removemos para recargar con el locale correcto
      const different = existingScripts.find(s => s.getAttribute('data-client-id') === clientId && s.getAttribute('data-locale') !== locale) ||
                        existingScripts.find(s => s.getAttribute('data-client-id') !== clientId);

      if (different) {
        try {
          different.remove();
        } catch (_) {}
        // borrar la referencia global para forzar inicialización limpia
        try { delete (window as any).paypal; } catch(_) { (window as any).paypal = undefined; }
      }

      // Si ya hay un script con los mismos atributos pero window.paypal aún no está, esperar a que cargue
      const exact = existingScripts.find(s => s.getAttribute('data-client-id') === clientId && s.getAttribute('data-locale') === locale);
      if (exact) {
        const waitFor = () => {
          if ((window as any).paypal) return resolve();
          setTimeout(waitFor, 50);
        };
        waitFor();
        return;
      }

      // Construir URL del SDK con locale
      const src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&locale=${locale}`;

      const script = document.createElement('script');
      script.setAttribute('src', src);
      script.setAttribute('data-paypal-sdk', 'true');
      script.setAttribute('data-client-id', clientId);
      script.setAttribute('data-locale', locale);
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (ev) => reject(new Error('No se pudo cargar PayPal SDK'));
      document.head.appendChild(script);
      this.scriptEl = script;
    });
  }
}
