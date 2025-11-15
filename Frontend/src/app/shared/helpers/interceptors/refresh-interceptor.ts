import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthServices } from '../../services/auth-services';
import { finalize } from 'rxjs';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const svrAuth = inject(AuthServices);
  return next(req)
    .pipe(
      finalize(() => { 
        if (svrAuth.isLoggedIn()) {
          svrAuth.verificarRefresh();
        }
      })
    );
};
