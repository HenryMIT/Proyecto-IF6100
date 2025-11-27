import {Component, inject, OnInit} from '@angular/core';
import { TarjetasProductosComponent } from '../tarjetas-productos/tarjetas-productos';
import { CommonModule } from '@angular/common';
import { combineLatest, BehaviorSubject, map, Observable, startWith } from 'rxjs';
import { Productos } from '../../shared/services/productos';
import { CartProducto } from '../../shared/models/producto.if';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TarjetasProductosComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  
  private readonly svrProducto = inject(Productos);   
  private search$ = new BehaviorSubject<string>('');
  listaProductos$!: Observable<CartProducto[]>;  

  constructor() {    
  }
  ngOnInit(): void {
     const productos$ = this.svrProducto.getProductos().pipe(
      map(data => data.map(dbProducto => ({
        id_Producto: dbProducto.id_Producto,
        imagen: dbProducto.imagen_producto || "",
        descripcion: dbProducto.descripcion,
        descuento: dbProducto.descuento,
        precio: dbProducto.precio
      })))
    );

    // combinar productos + término de búsqueda y filtrar
    this.listaProductos$ = combineLatest([productos$, this.search$.pipe(startWith(''))]).pipe(
      map(([lista, term]) => {
        const t = (term || '').trim().toLowerCase();
        if (!t) return lista;
        return lista.filter(p =>
          (p.descripcion || '').toLowerCase().includes(t) ||
          String(p.precio).toLowerCase().includes(t)
        );
      })
    );
  }

  onSearch(term:string){
    this.search$.next(term);
  }
  
}
