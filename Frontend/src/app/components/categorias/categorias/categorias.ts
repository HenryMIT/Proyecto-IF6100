import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { TarjetasProductosComponent } from '../../tarjetas-productos/tarjetas-productos';
import { Productos } from '../../../shared/services/productos';
import { CartProducto } from '../../../shared/models/producto.if';


@Component({
  selector: 'app-categoria',
  standalone: true,
  imports: [CommonModule, TarjetasProductosComponent],
  templateUrl: './categorias.html',
  styleUrl: './categorias.css'
})
export class Categorias implements OnInit {

  private readonly svrProducto = inject(Productos);

  private search$ = new BehaviorSubject<string>('');
  listaProductos$!: Observable<CartProducto[]>;

  // (opcional) para mostrar el id de categoría en el título si querés
  categoriaId?: number;

  constructor(private route: ActivatedRoute){

  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      // leer el id de la categoría desde la URL
      this.categoriaId = parseInt(params['id'], 10);

      // cargar productos de esa categoría
      const productos$ = this.svrProducto.getProductos(this.categoriaId).pipe(
        map(data =>
          data.map(dbProducto => ({
            id_Producto: dbProducto.id_Producto,
            imagen: dbProducto.imagen_producto || '',
            descripcion: dbProducto.descripcion,
            descuento: dbProducto.descuento,
            precio: dbProducto.precio
          }))
        )
      );

      // combinar con la búsqueda (igual que en Home)
      this.listaProductos$ = combineLatest([
        productos$,
        this.search$.pipe(startWith(''))
      ]).pipe(
        map(([lista, term]) => {
          const t = (term || '').trim().toLowerCase();
          if (!t) return lista;
          return lista.filter(p =>
            (p.descripcion || '').toLowerCase().includes(t) ||
            String(p.precio).toLowerCase().includes(t)
          );
        })
      );

      // (Opcional) hacer scroll a la sección de productos:
      const grid = document.getElementById('grid-categoria');
      grid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  onSearch(term: string) {
    this.search$.next(term);
  }
}
