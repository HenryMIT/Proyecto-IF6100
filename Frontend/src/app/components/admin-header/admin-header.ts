import { Component, inject } from '@angular/core';
import { AuthServices } from '../../shared/services/auth-services';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-admin-header',
  imports: [MatIcon, MatMenuModule],
  templateUrl: './admin-header.html',
  styleUrl: './admin-header.css'
})
export class AdminHeader {
  srvAuth = inject(AuthServices);

   constructor(private router: Router) {}

  toggleMenu(){
    window.dispatchEvent(new CustomEvent('toggleSideNav'));
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
