import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { MapComponent } from './map/map.component';
import { ProfileComponent } from './profile/profile.component';
import { ControlListComponent } from './control-list/control-list.component';
import { TwoFactorVerificationComponent } from './login/two-factor-verification/two-factor-verification.component';
import { authGuard } from '../guards/auth.guard';
import { noAuthGuard } from '../guards/no-auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [noAuthGuard] },
  { path: '2fa', component: TwoFactorVerificationComponent },
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'mapa', component: MapComponent },
      { path: 'perfil', component: ProfileComponent },
      { path: 'trabajos', component: ControlListComponent },
      { path: '', redirectTo: 'mapa', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
