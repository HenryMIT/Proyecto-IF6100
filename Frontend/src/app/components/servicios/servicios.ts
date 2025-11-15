import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormContacto } from '../forms/form-contacto/form-contacto';
import { TipoConsulta } from '../../shared/models/contactos.if';

@Component({
  selector: 'app-servicios',
  imports: [FormContacto],
  templateUrl: './servicios.html',
  styleUrl: './servicios.css'
})
export class Servicios implements OnInit {
  
  tipoPreseleccionado?: number;
  
  constructor(private route: ActivatedRoute) {}
  
  ngOnInit() {
    // Obtener el parámetro de tipo de la URL
    this.route.params.subscribe(params => {
      if (params['tipo']) {
        this.tipoPreseleccionado = parseInt(params['tipo']);
      }
    });
  }

}
