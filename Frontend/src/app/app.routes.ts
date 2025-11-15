import { Routes } from '@angular/router';
import { AboutUs } from './components/about-us/about-us';
import { Proyectos } from './components/proyectos/proyectos';
import { Servicios } from './components/servicios/servicios';

export const routes: Routes = [
  { path: '', redirectTo: '/about-us', pathMatch: 'full' },
  { path: 'about-us', component: AboutUs },
  { path: 'proyectos', component: Proyectos },
  { path: 'servicios', component: Servicios },
  { path: 'servicios/:tipo', component: Servicios }
];
