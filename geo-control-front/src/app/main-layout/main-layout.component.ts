import {
  Component,
  ChangeDetectionStrategy,
  HostListener,
  inject,
} from '@angular/core';


import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  Router,
} from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../services/auth.service';

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

@Component({
    selector: 'app-main-layout',
    imports: [
        RouterLink,
        RouterLinkActive,
        RouterOutlet,
        MatButtonModule,
        MatIconModule,
        MatMenuModule
    ],
    templateUrl: './main-layout.component.html',
    styleUrls: ['./main-layout.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {
  private authService = inject(AuthService);

  constructor(private router: Router) {}

  /** 🔹 Menú principal */
  navItems: NavItem[] = [
    { name: 'Trabajos', path: '/app/trabajos', icon: 'checklist' },
    { name: 'Mapa', path: '/app/mapa', icon: 'map' },
    { name: 'Perfil', path: '/app/perfil', icon: 'person' },
  ];

  /** 🔹 Estado responsivo */
  isTablet = false; // <= 900px
  isMobile = false; // <= 580px

  userEmail = 'usuario@geocontrol.com';

  logoUrl = 'assets/isologo.png'; // logo barra desktop
  isologoUrl = 'assets/isologo.png'; // logo compacto (puede ser el mismo)

  ngOnInit() {
    this.checkViewport();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkViewport();
  }

  get currentLogoUrl(): string {
    // Si querés mostrar otro en mobile, cambiás acá
    return this.isMobile ? this.isologoUrl : this.logoUrl;
  }

  private checkViewport() {
    const width = window.innerWidth;
    this.isTablet = width <= 900;
    this.isMobile = width <= 580;
  }

  handleLogout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  goToProfile() {
    this.router.navigateByUrl('/app/perfil');
  }
}
