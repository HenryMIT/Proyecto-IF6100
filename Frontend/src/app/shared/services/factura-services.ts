import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Factura, FacturaUpdate } from '../models/Factura';

const _SERVER = environment.Servidor+'/facturas';

@Injectable({
  providedIn: 'root'
})
export class FacturaServices {
  private http = inject(HttpClient);

  constructor() {}


  createFactura(factura: Factura): Observable<number> {    
    return this.http.post<number>(`${_SERVER}/`, factura);
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

  eliminarFactura(id: number): Observable<void> {
    return this.http.delete<void>(`${_SERVER}/${id}`);
  }
}
