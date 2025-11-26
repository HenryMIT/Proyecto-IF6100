import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { AboutUs } from './components/about-us/about-us';
import { Proyectos } from './components/proyectos/proyectos';
import { Servicios } from './components/servicios/servicios';
import { Contactos } from './components/contactos/contactos';
import { ProductosComponent } from './components/productos/productos';
import { Register } from './components/register/register';
import { AdministradoresComponent } from './components/administradores/administradores';
import { Clientes } from './components/clientes/clientes';
import { PaypalCheckout } from './components/paypal-checkout/paypal-checkout';
import { CarritoCompras } from './components/carrito-compras/carrito-compras';
import { Facturas } from './components/facturas/facturas';
import { Categorias } from './components/categorias/categorias/categorias';
import { AuthServices } from './shared/services/auth-services';
import { inject } from '@angular/core';
import { Usuario } from './shared/models/usuarios';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'about-us', component: AboutUs },
  { path: 'proyectos', component: Proyectos },
  { path: 'checkout', component: PaypalCheckout },
  { path: 'servicios', component: Servicios },
  { path: 'servicios/:tipo', component: Servicios },
  { path: 'contactos', component: Contactos },
  { path: 'productos', component: ProductosComponent },
  { path: 'administradores', component: AdministradoresComponent }, 
  { path: 'cliente', component: Clientes },
  { path: 'carrito', component: CarritoCompras},
  { path: 'administradores', component: AdministradoresComponent },
  { path: 'cliente', component: Clientes },
  { path: 'facturas', component: Facturas },
  { path: 'categorias', component: Categorias},
  { path: 'categorias/:id', component: Categorias },
];
