import { Component } from '@angular/core';


import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, MatIconModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';

  // 👇 para mostrar/ocultar la contraseña
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  get emailCtrl() {
    return this.form.get('email');
  }

  get passwordCtrl() {
    return this.form.get('password');
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.errorMessage = '';

    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.value as {
      email: string;
      password: string;
    };

    this.loading = true;

    this.authService.login(email, password).subscribe({
      next: (res) => {
        console.log('Login Response:', res); // DEBUG
        this.loading = false;

        // Caso: requiere 2FA (admin)
        // Check for PascalCase just in case or string "true"
        const requires2FA = res.requires2FA || (res as any).Requires2FA;
        const userId = res.userId ?? (res as any).UserId;

        if (res.success && requires2FA && userId != null) {
          this.authService.setPending2FA(userId, email);
          this.router.navigateByUrl('/2fa');
          return;
        }

        // Caso: login directo con token (operario)
        if (res.success && res.token) {
          this.authService.clearPending2FA();
          this.router.navigateByUrl('/app');
          return;
        }

        // Cualquier otro caso
        this.errorMessage = res.message ?? 'Error al iniciar sesión.';
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Error de conexión con el servidor.';
      },
    });
  }
}
