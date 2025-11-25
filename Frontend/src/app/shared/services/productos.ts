import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductoIf, ProductoCreadoResponse, MensajeResponse } from '../models/producto.if';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Productos {
  private apiUrl = environment.Servidor+'/productos';

  constructor(private http: HttpClient) {}

  // Obtener todos los productos (con filtros opcionales)
  getProductos(categoria?: number, busqueda?: string): Observable<ProductoIf[]> {
    let params = new HttpParams();
    if (categoria) params = params.set('categoria', categoria);
    if (busqueda) params = params.set('busqueda', busqueda);
    return this.http.get<ProductoIf[]>(this.apiUrl + '/', { params });
  }

  // Obtener un producto por ID
  getProducto(id: number): Observable<ProductoIf> {
    return this.http.get<ProductoIf>(`${this.apiUrl}/${id}`);
  }

  // Crear producto con imagen (FormData)
  crearProductoConImagen(formData: FormData): Observable<ProductoCreadoResponse> {
    return this.http.post<ProductoCreadoResponse>(`${this.apiUrl}/crear-con-imagen`, formData);
  }

  // Actualizar producto (sin imagen)
  actualizarProducto(id: number, data: Partial<ProductoIf>): Observable<MensajeResponse> {
    return this.http.put<MensajeResponse>(`${this.apiUrl}/${id}`, data);
  }

  // Actualizar solo la imagen de un producto
  actualizarImagenProducto(id: number, imagen: File): Observable<any> {
    const formData = new FormData();
    formData.append('imagen', imagen);
    return this.http.put(`${this.apiUrl}/${id}/imagen`, formData);
  }

  // Eliminar producto
  eliminarProducto(id: number): Observable<MensajeResponse> {
    return this.http.delete<MensajeResponse>(`${this.apiUrl}/${id}`);
  }
}
