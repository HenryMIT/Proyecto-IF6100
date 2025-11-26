import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Factura, FacturaUpdate, FacturaProducto, CreateFactura } from '../models/Factura';

const _SERVER = environment.Servidor+'/facturas';

@Injectable({
  providedIn: 'root'
})
export class FacturaServices {
  private http = inject(HttpClient);

  constructor() {}


  createFactura(factura: CreateFactura): Observable<{"id":number, "message":string}> {    
    return this.http.post<{"id":number, "message":string}>(`${_SERVER}/`, factura);
  }

  creatFacturaProducto(datos: FacturaProducto): Observable<FacturaProducto> {
    
    return this.http.post<FacturaProducto>(`${environment.Servidor}/factura_productos/`, datos);
  }

  obtenerFacturas(): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${_SERVER}/resumen`);
  }

  filtarFacturas(estado: string): Observable<Factura[]> {
    let params = new HttpParams();  
    if (estado) params = params.set('estado', estado); 
    return this.http.get<Factura[]>(`${_SERVER}/`, { params: params });
  }


  obtenerFacturaPorId(id: number): Observable<Factura> {
    return this.http.get<Factura>(`${_SERVER}/${id}`);
  } 

  obtenerFacturaPorUsuario(id_usuario: number): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${_SERVER}/usuario/${id_usuario}`);
  }

  actualizarFactura(datos: FacturaUpdate, id: number): Observable<void>  {
    return this.http.put<void>(`${_SERVER}/${id}`, datos);
  }

  actualizarEstadoFactura(id: number, estado: string): Observable<void> {
    return this.http.put<void>(`${_SERVER}/${id}/estado`, { estado });
  }

  buscarFacturasAvanzado(parametros: string, campos: string): Observable<any[]> {
    let params = new HttpParams();
    params = params.set('parametros', parametros);
    params = params.set('campos', campos);
    return this.http.get<any[]>(`${_SERVER}/buscar/avanzado`, { params });
  }

  eliminarFactura(id: number): Observable<void> {
    return this.http.delete<void>(`${_SERVER}/${id}`);
  }

  obtenerDetalleFactura(id_factura: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.Servidor}/factura_productos/factura/${id_factura}`);
  }
}
