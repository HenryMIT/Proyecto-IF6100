import { Component, inject, signal } from '@angular/core';
import { AuthServices } from '../../shared/services/auth-services';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';


type MenuItem = {
  icon: string;
  label: string;
  route: string;
  rol: number[]
};

@Component({
  selector: 'app-side-nav',
  imports: [CommonModule,MatIconModule, MatListModule, RouterModule],
  templateUrl: './side-nav.html',
  styleUrl: './side-nav.css'
})
export class SideNav {


  svrAuth= inject(AuthServices);
  collapsed = signal(false);

  constructor(){
    // escuchar evento global para alternar el estado de colapso
    window.addEventListener('toggleSideNav', () => {
      this.collapsed.update(v => !v);
    });
  }
  menuItem = signal<MenuItem[]>([
    { icon: 'attach_money',
      label: 'Facturación',
      route: 'home',
      rol : [2]
    },
    {
      icon: 'work',
      label: 'Administradores',
      route: 'admin',
      rol: [2]
    },
    {
      icon: 'groups',
      label: 'Clientes',
      route: 'cliente',
      rol : [2]
    },
    {
      icon: 'account_balance',
      label: 'Inventario',
      route: 'tecnico',
      rol : [2]
    },
    {
      icon: 'chat',
      label: 'Contactos',
      route: 'contactos',
      rol : [2]
    }
  ]);
}
