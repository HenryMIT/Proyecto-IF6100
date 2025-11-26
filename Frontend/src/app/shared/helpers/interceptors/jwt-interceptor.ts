import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Token } from '../../services/token';
import { AuthServices } from '../../services/auth-services';
import { environment } from '../../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {

  const srvToken = inject(Token);
  const token = srvToken.Token;

  // Solo agregar Authorization a peticiones dirigidas al servidor de la app
  // (evita añadir headers a terceros como exchangerate.host o paypal)
  const targetServer = environment.Servidor;
  const isToAppServer = req.url.startsWith(targetServer);

  if (inject(AuthServices).isLoggedIn() && isToAppServer) {
    const cloneReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloneReq);
  }
  return next(req);
};
