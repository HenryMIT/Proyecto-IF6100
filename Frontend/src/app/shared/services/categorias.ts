import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CategoriaIf } from '../models/categoria.if';

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {

  private categorias: CategoriaIf[] = [
    { id_Categoria: 1, nombre_Categoria: 'Cocinas' },
    { id_Categoria: 2, nombre_Categoria: 'Refrigeración' },
    { id_Categoria: 3, nombre_Categoria: 'Pilas' },
    { id_Categoria: 4, nombre_Categoria: 'Fregaderos' },
    { id_Categoria: 5, nombre_Categoria: 'Campanas' },
    { id_Categoria: 6, nombre_Categoria: 'Mesas' },
    { id_Categoria: 7, nombre_Categoria: 'Lavadoras' },
    { id_Categoria: 8, nombre_Categoria: 'Lavavajillas' },
    { id_Categoria: 9, nombre_Categoria: 'Hornos' }
  ];

  getCategorias(): Observable<CategoriaIf[]> {
    return of(this.categorias);
  }

  getCategoriaById(id: number): CategoriaIf | undefined {
    return this.categorias.find(cat => cat.id_Categoria === id);
  }
}
