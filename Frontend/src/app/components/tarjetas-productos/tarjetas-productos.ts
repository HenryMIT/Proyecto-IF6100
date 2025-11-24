import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-tarjetas-productos',
  templateUrl: './tarjetas-productos.html',
  styleUrls: ['./tarjetas-productos.css'],
  standalone: true,
  imports: [CommonModule] 
})
export class TarjetasProductosComponent {
  @Input() product: any = {
    image: '',
    name: 'Fregadero Caliente',
    description: 'Descripción del segundo producto',
    price: 10.99
  };

  addToCart() {
    console.log('Producto agregado:', this.product.name);
  }
}