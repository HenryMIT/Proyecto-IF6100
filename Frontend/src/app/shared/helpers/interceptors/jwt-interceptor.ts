import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Token } from '../../services/token';
import { AuthServices } from '../../services/auth-services';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {

  const srvToken = inject(Token);
  const token = srvToken.Token

  if (inject(AuthServices).isLoggedIn()){
    const cloneReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
    return next(cloneReq);
  }
  return next(req);
};
