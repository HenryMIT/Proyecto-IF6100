import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Correo_Electronico } from '../models/email_class';


const _SERVER = environment.Servidor;
@Injectable({
  providedIn: 'root'
})
export class EmailServices {

  private readonly http = inject(HttpClient);

  constructor(){}

  enviarCorreo(correo: Correo_Electronico): Observable<Correo_Electronico> {
    return this.http.post<Correo_Electronico>(`${_SERVER}/correo/enviar_correo`, correo);
  }


}
