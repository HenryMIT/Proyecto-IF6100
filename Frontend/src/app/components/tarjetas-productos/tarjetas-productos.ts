import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartProducto } from '../../shared/models/producto.if';
import { CartService } from '../../shared/services/cart';
import { Productos } from '../../shared/services/productos';
import { DialogService } from '../forms/dialogo-generico/dialog.service';
import { take } from 'rxjs/operators';

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
  private readonly svrProducto = inject(Productos);
  private readonly dialogService = inject(DialogService);


  addToCart() {
    if (!this.product.id_Producto) return;

    // Cantidad que tendría si sumamos 1
    const items = this.cartService.getItems();
    const enCarrito = items.find(i => i.id_Producto === this.product.id_Producto);
    const nuevaCantidad = (enCarrito?.cantidad || 0) + 1;

    this.svrProducto.getProducto(this.product.id_Producto).pipe(take(1)).subscribe({
      next: (producto) => {
        const stock = producto.cantidad ?? 0;

        if (nuevaCantidad > stock) {
          this.dialogService
            .informar(
              `No hay stock suficiente. Solo hay ${stock} unidades disponibles.`,
              'Stock insuficiente'
            )
            .subscribe();
          return;
        }

        this.cartService.addProduct(this.product);
      },
      error: (err) => {
        console.error('Error consultando stock al agregar al carrito:', err);
        this.dialogService
          .error('No se pudo validar el stock del producto. Inténtalo de nuevo.', 'Error de stock')
          .subscribe();
      }
    });
  }
}