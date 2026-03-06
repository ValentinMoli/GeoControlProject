import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  Confirm2FARequest,
  AuthState,
} from '../../types/login.type';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'geoControl.accessToken';
  private readonly USER_ID_KEY = 'geoControl.userId';
  private readonly USERNAME_KEY = 'geoControl.username';
  private readonly ROLE_KEY = 'geoControl.role';
  private pending2FAUserId: number | null = null;
  private pending2FAEmail: string | null = null;

  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    token: null,
    userId: null,
    username: null,
    role: null,
  });

  authState$ = this.authStateSubject.asObservable();

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    const token = sessionStorage.getItem(this.TOKEN_KEY);
    const userId = sessionStorage.getItem(this.USER_ID_KEY);
    const username = sessionStorage.getItem(this.USERNAME_KEY);
    const role = sessionStorage.getItem(this.ROLE_KEY);

    if (token) {
      this.authStateSubject.next({
        isAuthenticated: true,
        token,
        userId: userId ? Number(userId) : null,
        username: username ?? null,
        role: role ? Number(role) : null,
      });
    }
  }

  login(email: string, password: string) {
    const body: LoginRequest = { email, password };

    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, body)
      .pipe(
        tap((response) => {
          if (response.success && !response.requires2FA && response.token) {
            this.setSession(response);
          } else {
            this.clearSession(false);
          }
        })
      );
  }

  confirmTwoFactor(userId: number, code: string) {
    const body: Confirm2FARequest = { userId, code };

    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/confirm-2fa`, body)
      .pipe(
        tap((response) => {
          if (response.success && response.token) {
            this.setSession(response);
          }
        })
      );
  }

  private setSession(response: LoginResponse) {
    if (!response.token || response.userId == null) {
      return;
    }

    // Decodificar el JWT para extraer el rol
    let role: number | null = null;
    let username: string | null = null;
    try {
      const payloadBase64 = response.token.split('.')[1];
      const decodedJson = atob(payloadBase64);
      const decodedToken = JSON.parse(decodedJson);
      
      role = decodedToken.role ? Number(decodedToken.role) : null;
      username = decodedToken.username ? String(decodedToken.username) : null;
    } catch (e) {
      console.error('Error decodificando el token:', e);
    }

    sessionStorage.setItem(this.TOKEN_KEY, response.token);
    sessionStorage.setItem(this.USER_ID_KEY, String(response.userId));
    if (username) sessionStorage.setItem(this.USERNAME_KEY, username);
    if (role !== null) sessionStorage.setItem(this.ROLE_KEY, String(role));

    this.authStateSubject.next({
      isAuthenticated: true,
      token: response.token,
      userId: response.userId,
      username: username,
      role: role,
    });
  }

  logout() {
    this.clearSession(true);
  }

  private clearSession(clearStorage: boolean = true) {
    if (clearStorage) {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.USER_ID_KEY);
      sessionStorage.removeItem(this.USERNAME_KEY);
      sessionStorage.removeItem(this.ROLE_KEY);
    }

    this.authStateSubject.next({
      isAuthenticated: false,
      token: null,
      userId: null,
      username: null,
      role: null,
    });
  }

  setPending2FA(userId: number, email?: string) {
    this.pending2FAUserId = userId;
    if (email) {
      this.pending2FAEmail = email;
    }
  }

  getPending2FA(): number | null {
    return this.pending2FAUserId;
  }

  getPending2FAEmail(): string | null {
    return this.pending2FAEmail;
  }

  clearPending2FA() {
    this.pending2FAUserId = null;
    this.pending2FAEmail = null;
  }

  getAccessToken(): string | null {
    return this.authStateSubject.value.token;
  }

  isLoggedIn(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  getCurrentUserId(): number | null {
    return this.authStateSubject.value.userId;
  }

  isAdmin(): boolean {
    console.log('authState', this.authStateSubject)
    return this.authStateSubject.value.role === 1;
  }
}
