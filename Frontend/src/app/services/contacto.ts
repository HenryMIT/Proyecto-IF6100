import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ContactoData, ContactoResponse, Contacto } from '../shared/models/contactos.if';

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

  // Método para obtener todos los contactos (si se necesita)
  obtenerContactos(): Observable<Contacto[]> {
    return this.http.get<Contacto[]>(`${this.serverUrl}/contactos/`);
  }

  // Método para obtener un contacto por ID (si se necesita)
  obtenerContactoPorId(id: number): Observable<Contacto> {
    return this.http.get<Contacto>(`${this.serverUrl}/contactos/${id}`);
  }
}
