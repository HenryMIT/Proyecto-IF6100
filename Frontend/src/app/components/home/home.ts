import { Component } from '@angular/core';
import { PaypalCheckout } from '../paypal-checkout/paypal-checkout';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [PaypalCheckout],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {}
