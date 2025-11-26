import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdministradorService {
  private readonly http = inject(HttpClient);
  private readonly serverUrl = environment.Servidor+'/administradores';

  constructor() { }

  // Listar administradores con paginación y filtros
  filtrarAdministradores(pag: number, cant: number, nombre?: string, primer_apellido?: string, segundo_apellido?: string): Observable<any> {
    let params = new HttpParams();
    if (nombre) params = params.set('nombre', nombre);
    if (primer_apellido) params = params.set('primer_apellido', primer_apellido);
    if (segundo_apellido) params = params.set('segundo_apellido', segundo_apellido);
    return this.http.get<any>(`${this.serverUrl}/${pag}/${cant}`, { params });
  }

  // Obtener un administrador por ID
  obtenerAdministradorPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.serverUrl}/${id}`);
  }

  // Crear un nuevo administrador
  crearAdministrador(administrador: any): Observable<number> {
    return this.http.post<number>(`${this.serverUrl}/`, administrador);
  }

  // Actualizar un administrador
  actualizarAdministrador(id: number, administrador: any): Observable<void> {
    return this.http.put<void>(`${this.serverUrl}/${id}`, administrador);
  }

  // Eliminar un administrador
  eliminarAdministrador(id: number): Observable<void> {
    return this.http.delete<void>(`${this.serverUrl}/${id}`);
  }
}