import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { 
  ContactoData, 
  ContactoResponse, 
  Contacto, 
  ContactosPorEstadoResponse,
  ContactosPorCorreoResponse,
  ActualizarEstadoResponse,
  EliminarContactoResponse
} from '../models/contactos.if';

@Injectable({
  providedIn: 'root'
})
export class ContactoService {
  
  private readonly http = inject(HttpClient);
  private readonly serverUrl = 'http://localhost:8000'; // URL base del backend

  constructor() { }

  // Método para crear un nuevo contacto
  crearContacto(contacto: ContactoData): Observable<ContactoResponse> {
    return this.http.post<ContactoResponse>(`${this.serverUrl}/contactos/`, contacto);
  }

  // Método para listar contactos con paginación
  listarContactos(limite: number = 0, offset: number = 0): Observable<Contacto[]> {
    let params = new HttpParams();
    if (limite > 0) params = params.set('limite', limite.toString());
    if (offset > 0) params = params.set('offset', offset.toString());
    
    return this.http.get<Contacto[]>(`${this.serverUrl}/contactos/listar`, { params });
  }

  // Método para buscar contactos por estado
  buscarContactosPorEstado(estado: boolean): Observable<ContactosPorEstadoResponse> {
    return this.http.get<ContactosPorEstadoResponse>(`${this.serverUrl}/contactos/estado/${estado}`);
  }

  // Método para buscar contactos por correo
  buscarContactosPorCorreo(filtroCorreo: string): Observable<ContactosPorCorreoResponse> {
    const params = new HttpParams().set('filtro_correo', filtroCorreo);
    return this.http.get<ContactosPorCorreoResponse>(`${this.serverUrl}/contactos/buscar/correo`, { params });
  }

  // Método para obtener un contacto específico por ID
  obtenerContactoPorId(idMensaje: number): Observable<Contacto> {
    return this.http.get<Contacto>(`${this.serverUrl}/contactos/${idMensaje}`);
  }

  // Método para actualizar el estado de un contacto
  actualizarEstadoContacto(idMensaje: number, estado: boolean): Observable<ActualizarEstadoResponse> {
    const params = new HttpParams().set('estado', estado.toString());
    return this.http.put<ActualizarEstadoResponse>(`${this.serverUrl}/contactos/${idMensaje}/estado`, null, { params });
  }

  // Método para eliminar un contacto
  eliminarContacto(idMensaje: number): Observable<EliminarContactoResponse> {
    return this.http.delete<EliminarContactoResponse>(`${this.serverUrl}/contactos/${idMensaje}`);
  }
}
