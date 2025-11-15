import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { AboutUs } from './components/about-us/about-us';
import { Proyectos } from './components/proyectos/proyectos';
import { Servicios } from './components/servicios/servicios';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'login', component: Login },
  { path: 'about-us', component: AboutUs },
  { path: 'proyectos', component: Proyectos },
  { path: 'servicios', component: Servicios },
  { path: 'servicios/:tipo', component: Servicios }
];
