import { Injectable, computed, signal } from '@angular/core';

export type UserRole = 'user' | 'admin';

export interface CurrentUser {
  id: string;
  name: string;
  roles: UserRole[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly _token = signal<string | null>(
    sessionStorage.getItem('taskflow.auth.token') ?? 'demo-token'
  );

  private readonly _currentUser = signal<CurrentUser | null>({
    id: 'user-1',
    name: 'Demo User',
    roles: ['user']
  });

  readonly token = this._token.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticatedSignal = computed(() => this._token() !== null && this._currentUser() !== null);

  isAuthenticated(): boolean {
    return this.isAuthenticatedSignal();
  }

  hasRole(role: string): boolean {
    return this._currentUser()?.roles.includes(role as UserRole) ?? false;
  }

  getToken(): string | null {
    return this._token();
  }

  setToken(token: string | null): void {
    this._token.set(token);

    if (token) {
      sessionStorage.setItem('taskflow.auth.token', token);
    } else {
      sessionStorage.removeItem('taskflow.auth.token');
    }
  }

  loginAsUser(): void {
    this.setToken('demo-user-token');
    this._currentUser.set({
      id: 'user-1',
      name: 'Demo User',
      roles: ['user']
    });
  }

  loginAsAdmin(): void {
    this.setToken('demo-admin-token');
    this._currentUser.set({
      id: 'admin-1',
      name: 'Admin User',
      roles: ['user', 'admin']
    });
  }

  logout(): void {
    this.setToken(null);
    this._currentUser.set(null);
  }
}