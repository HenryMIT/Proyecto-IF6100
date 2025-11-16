import { Component, HostListener, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TipoConsulta } from '../../shared/models/contactos.if';
import { AuthServices } from '../../shared/services/auth-services';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu'

@Component({
  selector: 'app-header',
  imports: [RouterModule, CommonModule, MatIconModule, MatMenuModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {

  srvAuth = inject(AuthServices);

  constructor(private router: Router) {}

  // Estado del dropdown de servicios
  isServiciosDropdownOpen = false;


  // Toggle para abrir/cerrar el dropdown
  toggleServiciosDropdown(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isServiciosDropdownOpen = !this.isServiciosDropdownOpen;
  }

  // Cerrar dropdown al hacer click fuera
  closeServiciosDropdown() {
    this.isServiciosDropdownOpen = false;
  }

  // Navegar al formulario de servicios con tipo preseleccionado
  navegarAServicios(tipo: TipoConsulta, event: Event) {
    event.preventDefault();
    this.closeServiciosDropdown();
    this.router.navigate(['/servicios', tipo]);
  }

  // Event listener para cerrar dropdown al hacer click fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.relative');
    if (!dropdown || !dropdown.querySelector('[data-dropdown="servicios"]')) {
      this.closeServiciosDropdown();
    }
  }

  signin(){
    this.router.navigate(['/login'])
  }

  cambiarContrasena(){

  }

  cerrarSesion(){
    this.srvAuth.loggOut();
  }
}
