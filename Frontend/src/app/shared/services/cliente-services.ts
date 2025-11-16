import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

const _SERVER = 'http://localhost:8000'; 

@Injectable({
  providedIn: 'root'
})
export class ClienteServices {
  private http = inject(HttpClient);
  
  constructor(){

  }

  filtrarClientes(){
    
  }
}
