import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const _SERVER = environment.Servidor+'/clientes';

@Injectable({
  providedIn: 'root'
})
export class ClienteServices {
  private http = inject(HttpClient);

  constructor() {

  }


  // Listar Clientes con paginación y filtros
  filtrarClientes(pag: number, cant: number, parametros: any): Observable<any> {
    let params = new HttpParams();
    for (const prop in parametros) {
      params = params.append(prop, parametros[prop]);
    }
    return this.http.get<any>(`${_SERVER}/${pag}/${cant}`, { params: params });
  }

  // Obtener un Clientes por ID
  obtenerClientesPorId(id: number): Observable<any> {
    return this.http.get<any>(`${_SERVER}/${id}`);
  }

  // Crear un nuevo Clientes
  crearClientes(Clientes: any): Observable<number> {
    return this.http.post<number>(`${_SERVER}/`, Clientes);
  }

  // Actualizar un Clientes
  actualizarClientes(id: number, Clientes: any): Observable<void> {
    return this.http.put<void>(`${_SERVER}/${id}`, Clientes);
  }

  // Eliminar un Clientes
  eliminarClientes(id: number): Observable<void> {
    return this.http.delete<void>(`${_SERVER}/${id}`);
  }
}
