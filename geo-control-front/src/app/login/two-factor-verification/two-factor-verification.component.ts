import { Component, OnInit } from '@angular/core';


import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-two-factor-verification',
    imports: [ReactiveFormsModule],
    templateUrl: './two-factor-verification.component.html',
    styleUrls: ['./two-factor-verification.component.scss']
})
export class TwoFactorVerificationComponent implements OnInit {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  infoMessage = 'Ingresá el código que te enviamos.';
  userId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      code: [
        '',
        [Validators.required, Validators.minLength(4), Validators.maxLength(8)],
      ],
    });
  }

  get codeCtrl() {
    return this.form.get('code');
  }

  ngOnInit(): void {
    this.userId = this.authService.getPending2FA();
    const email = this.authService.getPending2FAEmail();

    if (email) {
      this.infoMessage = `Ingresá el código que te enviamos a ${email}`;
    }

    if (this.userId == null) {
      // Por seguridad: si no hay 2FA pendiente, volvemos al login
      this.router.navigate(['/login']);
    }
  }

  onSubmit() {
    this.errorMessage = '';

    if (this.form.invalid || this.loading || this.userId == null) {
      this.form.markAllAsTouched();
      return;
    }

    const code = this.form.value.code;

    this.loading = true;

    this.authService.confirmTwoFactor(this.userId, code).subscribe({
      next: (res) => {
        this.loading = false;

        if (res.success && res.token) {
          this.authService.clearPending2FA();
          this.router.navigate(['/app']);
          return;
        }

        this.errorMessage = res.message ?? 'Código incorrecto o expirado.';
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Error de conexión con el servidor.';
      },
    });
  }

  onBackToLogin() {
    this.authService.clearPending2FA();
    this.router.navigate(['/login']);
  }
}
