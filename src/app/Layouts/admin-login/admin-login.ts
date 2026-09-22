import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  imports: [FormsModule],
  selector: 'app-admin-login',
  templateUrl: './admin-login.html',
})
export class AdminLogin {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);
  readonly email = signal('');
  readonly password = signal('');
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  async submit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.email(), this.password());
      await this.router.navigateByUrl('/admin');
    } catch {
      this.error.set('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    } finally {
      this.loading.set(false);
    }
  }
}
