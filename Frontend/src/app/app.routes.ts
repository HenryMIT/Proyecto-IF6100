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
import { Role } from './shared/models/role';
import { authGuard } from './shared/helpers/guards/auth-guard';
import { loginGuard } from './shared/helpers/guards/login-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home, 
    canActivate: [authGuard],
        data: { roles: [Role.Administrador] }
  },
  { path: 'login', component: Login, 
    canActivate: [loginGuard] },
  { path: 'register', component: Register },
  { path: 'about-us', component: AboutUs },
  { path: 'proyectos', component: Proyectos },
  { path: 'checkout', component: PaypalCheckout },
  { path: 'servicios', component: Servicios },
  { path: 'servicios/:tipo', component: Servicios },  
  { path: 'carrito', component: CarritoCompras},      
  { path: 'categorias', component: Categorias},
  { path: 'categorias/:id', component: Categorias },
  // Panel de administracion 
  { path: 'contactos', component: Contactos,
    canActivate: [ authGuard],
        data: { roles: [Role.visitante, Role.Cliente] }
   },
  { path: 'productos', component: ProductosComponent,
    canActivate: [ authGuard],
        data: { roles: [Role.visitante, Role.Cliente] } },
  { path: 'administradores', component: AdministradoresComponent,
    canActivate: [ authGuard],
        data: { roles: [Role.visitante, Role.Cliente] } }, 
  { path: 'cliente', component: Clientes,
    canActivate: [ authGuard],
        data: { roles: [Role.visitante, Role.Cliente] } },
  { path: 'facturas', component: Facturas,
    canActivate: [ authGuard],
        data: { roles: [Role.visitante, Role.Cliente] } }
];
