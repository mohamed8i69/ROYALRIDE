import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

interface LoginResponse {
  token: string;
  admin: { email: string; role: string };
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenKey = 'royalride-admin-token';
  readonly isAuthenticated = signal(this.hasToken());

  async login(email: string, password: string): Promise<void> {
    const result = await firstValueFrom(this.http.post<LoginResponse>('/api/auth/login', { email, password }));
    if (!result.token) {
      throw new Error('Authentication token was not returned.');
    }
    sessionStorage.setItem(this.tokenKey, result.token);
    this.isAuthenticated.set(true);
  }

  async validateSession(): Promise<boolean> {
    if (!this.token()) {
      this.isAuthenticated.set(false);
      return false;
    }

    try {
      await firstValueFrom(this.http.get('/api/auth/me'));
      this.isAuthenticated.set(true);
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  logout(): void {
    this.clearSession();
    void this.router.navigateByUrl('/admin/login');
  }

  private clearSession(): void {
    sessionStorage.removeItem(this.tokenKey);
    this.isAuthenticated.set(false);
  }

  token(): string | null {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(this.tokenKey);
  }

  private hasToken(): boolean {
    return typeof sessionStorage !== 'undefined' && Boolean(sessionStorage.getItem(this.tokenKey));
  }
}
