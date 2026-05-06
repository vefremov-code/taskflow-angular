import { Injectable, signal } from '@angular/core';

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
  private readonly _currentUser = signal<CurrentUser | null>({
    id: 'user-1',
    name: 'Demo User',
    roles: ['user']
  });

  readonly currentUser = this._currentUser.asReadonly();

  isAuthenticated(): boolean {
    return this._currentUser() !== null;
  }

  hasRole(role: string): boolean {
    return this._currentUser()?.roles.includes(role as UserRole) ?? false;
  }

  loginAsUser(): void {
    this._currentUser.set({
      id: 'user-1',
      name: 'Demo User',
      roles: ['user']
    });
  }

  loginAsAdmin(): void {
    this._currentUser.set({
      id: 'admin-1',
      name: 'Admin User',
      roles: ['user', 'admin']
    });
  }

  logout(): void {
    this._currentUser.set(null);
  }
}