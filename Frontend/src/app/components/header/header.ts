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

  // ===== ESTADOS DE DROPDOWN =====
  isServiciosDropdownOpen = false;
  isCategoriasDropdownOpen = false;

  // ====== SERVICIOS ======
  toggleServiciosDropdown(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isServiciosDropdownOpen = !this.isServiciosDropdownOpen;

    // opcional: cerrar categorías si abro servicios
    if (this.isServiciosDropdownOpen) {
      this.isCategoriasDropdownOpen = false;
    }
  }

  closeServiciosDropdown() {
    this.isServiciosDropdownOpen = false;
  }

  navegarAServicios(tipo: TipoConsulta, event: Event) {
    event.preventDefault();
    this.closeServiciosDropdown();
    this.router.navigate(['/servicios', tipo]);
  }

  // ====== CATEGORÍAS ======
  toggleCategoriasDropdown(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isCategoriasDropdownOpen = !this.isCategoriasDropdownOpen;

    // opcional: cerrar servicios si abro categorías
    if (this.isCategoriasDropdownOpen) {
      this.isServiciosDropdownOpen = false;
    }
  }

  closeCategoriasDropdown() {
    this.isCategoriasDropdownOpen = false;
  }

  navegarACatalogoCompleto(event: Event) {
    event.preventDefault();
    this.closeCategoriasDropdown();
    this.router.navigate(['/categorias']);  // ruta general
  }

  navegarACategoria(idCategoria: number, event: Event) {
    event.preventDefault();
    this.closeCategoriasDropdown();
    
    this.router.navigate(['/categorias', idCategoria]); // o la que definiste
  }

  // ====== CERRAR MENÚS AL HACER CLICK FUERA ======
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;

    const dentroServicios = target.closest('[data-dropdown-root="servicios"]');
    const dentroCategorias = target.closest('[data-dropdown-root="categorias"]');

    if (!dentroServicios) {
      this.closeServiciosDropdown();
    }
    if (!dentroCategorias) {
      this.closeCategoriasDropdown();
    }
  }

  // ====== LOGIN / USER ======
  signin() {
    this.router.navigate(['/login']);
  }

  cambiarContrasena() {}

  cerrarSesion() {
    this.srvAuth.loggOut();
  }
}
