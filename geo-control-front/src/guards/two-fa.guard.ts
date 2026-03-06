import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../app/services/auth.service';

export const twoFaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const pending = auth.getPending2FA();

  if (pending != null && !auth.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
