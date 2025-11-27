import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthServices } from '../../services/auth-services';

export const loginGuard: CanActivateFn = (route, state) => {
  const authSrv = inject(AuthServices);
  const router = inject(Router);
  return !authSrv.isLoggedIn();
};
