import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, map, of, tap, throwError } from 'rxjs';

export type UserRole = 'user' | 'admin' | 'auditor';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSessionSnapshot {
  authenticated: boolean;
  authChecked: boolean;
  tokenStorage: 'memory-only';
  refreshTokenStorage: 'httpOnly-cookie-simulated';
  userProfileStorage: 'sessionStorage';
  currentUser: string | null;
  roles: UserRole[];
  accessTokenPresent: boolean;
  accessTokenPreview: string | null;
  localStorageTokenPresent: boolean;
  sessionStorageProfilePresent: boolean;
  lastAuthEvent: string;
}

const USER_PROFILE_KEY = 'taskflow.auth.user';
const DEMO_REFRESH_COOKIE_KEY = 'taskflow.demo.refresh-cookie-present';

const DEMO_USERS: Record<string, CurrentUser> = {
  'user@taskflow.local': {
    id: 'user-1',
    name: 'Demo User',
    email: 'user@taskflow.local',
    roles: ['user']
  },
  'admin@taskflow.local': {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@taskflow.local',
    roles: ['user', 'admin']
  },
  'auditor@taskflow.local': {
    id: 'auditor-1',
    name: 'Audit User',
    email: 'auditor@taskflow.local',
    roles: ['user', 'auditor']
  }
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly _accessToken = signal<string | null>(null);
  private readonly _currentUser = signal<CurrentUser | null>(null);
  private readonly _authChecked = signal(false);
  private readonly _lastAuthEvent = signal('Application started. Auth not checked yet.');

  private readonly channel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('taskflow-auth')
    : null;

  readonly accessToken = this._accessToken.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  readonly authChecked = this._authChecked.asReadonly();
  readonly lastAuthEvent = this._lastAuthEvent.asReadonly();

  readonly isAuthenticatedSignal = computed(() =>
    this._accessToken() !== null && this._currentUser() !== null
  );

  readonly primaryRole = computed(() =>
    this._currentUser()?.roles.includes('admin')
      ? 'admin'
      : this._currentUser()?.roles[0] ?? 'guest'
  );

  readonly securitySnapshot = computed<AuthSessionSnapshot>(() => {
    const token = this._accessToken();
    const user = this._currentUser();

    return {
      authenticated: this.isAuthenticatedSignal(),
      authChecked: this._authChecked(),
      tokenStorage: 'memory-only',
      refreshTokenStorage: 'httpOnly-cookie-simulated',
      userProfileStorage: 'sessionStorage',
      currentUser: user ? `${user.name} <${user.email}>` : null,
      roles: user?.roles ?? [],
      accessTokenPresent: token !== null,
      accessTokenPreview: token ? `${token.slice(0, 18)}...` : null,
      localStorageTokenPresent: localStorage.getItem('taskflow.auth.token') !== null,
      sessionStorageProfilePresent: sessionStorage.getItem(USER_PROFILE_KEY) !== null,
      lastAuthEvent: this._lastAuthEvent()
    };
  });

  constructor() {
    this.channel?.addEventListener('message', event => {
      if (event.data?.type === 'logout') {
        this.clearLocalState('Logout synchronized from another browser tab.');
      }

      if (event.data?.type === 'login') {
        this.initialize().subscribe();
      }
    });
  }

  initialize(): Observable<void> {
    const cachedProfile = this.readCachedUserProfile();

    if (cachedProfile) {
      this._currentUser.set(cachedProfile);
    }

    const hasRefreshCookie = sessionStorage.getItem(DEMO_REFRESH_COOKIE_KEY) === 'true';

    if (!hasRefreshCookie || !cachedProfile) {
      this._authChecked.set(true);
      this._lastAuthEvent.set('Silent refresh skipped. No refresh cookie simulation was present.');
      return of(void 0);
    }

    return this.refreshAccessToken().pipe(
      map(() => void 0),
      tap(() => {
        this._authChecked.set(true);
        this._lastAuthEvent.set('Silent refresh restored the in-memory access token.');
      })
    );
  }

  login(credentials: LoginRequest): Observable<void> {
    const normalizedEmail = credentials.email.trim().toLowerCase();
    const user = DEMO_USERS[normalizedEmail];

    if (!user || credentials.password.trim().length < 4) {
      return throwError(() => new Error('Invalid email or password. Use a demo account and any password with at least four characters.'));
    }

    return of(user).pipe(
      delay(350),
      tap(authenticatedUser => {
        const token = this.createDemoAccessToken(authenticatedUser);
        this._accessToken.set(token);
        this._currentUser.set(authenticatedUser);
        this._authChecked.set(true);
        this.persistNonSensitiveProfile(authenticatedUser);
        sessionStorage.setItem(DEMO_REFRESH_COOKIE_KEY, 'true');
        this._lastAuthEvent.set(`Login succeeded for ${authenticatedUser.email}. Access token stored in memory only.`);
        this.channel?.postMessage({ type: 'login' });
      }),
      map(() => void 0)
    );
  }

  loginAsUser(): void {
    this.login({ email: 'user@taskflow.local', password: 'demo' }).subscribe();
  }

  loginAsAdmin(): void {
    this.login({ email: 'admin@taskflow.local', password: 'demo' }).subscribe();
  }

  logout(): void {
    this.clearLocalState('Logout completed. Local state and simulated refresh cookie were cleared.');
    this.channel?.postMessage({ type: 'logout' });
  }

  refreshAccessToken(): Observable<string> {
    const cachedProfile = this.readCachedUserProfile();
    const hasRefreshCookie = sessionStorage.getItem(DEMO_REFRESH_COOKIE_KEY) === 'true';

    if (!cachedProfile || !hasRefreshCookie) {
      this.clearLocalState('Refresh failed. Session expired.');
      return throwError(() => new Error('Session expired. Please log in again.'));
    }

    return of(cachedProfile).pipe(
      delay(300),
      map(user => this.createDemoAccessToken(user)),
      tap(token => {
        this._accessToken.set(token);
        this._currentUser.set(cachedProfile);
        this._authChecked.set(true);
        this._lastAuthEvent.set('Access token refreshed and original request can be retried.');
      })
    );
  }

  simulateExpiredAccessToken(): void {
    this._accessToken.set('expired-demo-access-token');
    this._lastAuthEvent.set('Access token intentionally replaced with an expired demo token.');
  }

  clearAccessTokenOnly(): void {
    this._accessToken.set(null);
    this._lastAuthEvent.set('Access token cleared from memory. Refresh cookie simulation remains available.');
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSignal();
  }

  hasRole(role: string): boolean {
    return this._currentUser()?.roles.includes(role as UserRole) ?? false;
  }

  getToken(): string | null {
    return this._accessToken();
  }

  private persistNonSensitiveProfile(user: CurrentUser): void {
    sessionStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  }

  private readCachedUserProfile(): CurrentUser | null {
    const raw = sessionStorage.getItem(USER_PROFILE_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      sessionStorage.removeItem(USER_PROFILE_KEY);
      return null;
    }
  }

  private clearLocalState(message: string): void {
    this._accessToken.set(null);
    this._currentUser.set(null);
    this._authChecked.set(true);
    this._lastAuthEvent.set(message);
    sessionStorage.removeItem(USER_PROFILE_KEY);
    sessionStorage.removeItem(DEMO_REFRESH_COOKIE_KEY);
    localStorage.removeItem('taskflow.auth.token');
  }

  private createDemoAccessToken(user: CurrentUser): string {
    const timestamp = Date.now().toString(36);
    const rolePart = user.roles.join('-');
    return `demo-access.${user.id}.${rolePart}.${timestamp}`;
  }
}