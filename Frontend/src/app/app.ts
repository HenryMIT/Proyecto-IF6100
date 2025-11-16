import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { AuthServices } from './shared/services/auth-services';
import { SideNav } from './components/side-nav/side-nav';
import { AdminHeader } from './components/admin-header/admin-header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, AdminHeader,Footer, SideNav],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Equipos Rummi');
  svrAuth = inject(AuthServices)

  ngOnInit(): void {
      initFlowbite();
  }

}
