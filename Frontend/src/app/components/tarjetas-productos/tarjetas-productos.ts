import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { CartProducto } from '../../shared/models/producto.if';
import { CartService } from '../../shared/services/cart';

@Component({
  selector: 'app-tarjetas-productos',
  templateUrl: './tarjetas-productos.html',
  styleUrls: ['./tarjetas-productos.css'],
  standalone: true,
  imports: [CommonModule] 
})
export class TarjetasProductosComponent {
  @Input() product: CartProducto = {
    id_Producto: 0,
    imagen: '',    
    descripcion: 'Descripción del segundo producto',
    descuento: 5,
    precio: 10.99
  };

  private readonly cartService = inject(CartService);

  addToCart() {
    const id_prod = this.product.id_Producto;
    // agrega el producto al carrito (1 unidad)
    this.cartService.addProduct(this.product);
    console.log('Producto agregado al carrito:', id_prod);
  }
}