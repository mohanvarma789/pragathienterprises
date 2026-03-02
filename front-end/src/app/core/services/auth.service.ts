import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, catchError, of } from 'rxjs';
import { User, UserRole } from '../models/models';
import { environment } from '../../../environments/environment';
import * as CryptoJS from 'crypto-js';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_URL = `${environment.apiUrl}/auth`;
    private readonly STORAGE_KEY = 'pragathi_user';
    private readonly TOKEN_KEY = 'pragathi_token';
    private currentUser$ = new BehaviorSubject<User | null>(this.loadFromStorage());

    constructor(private router: Router, private http: HttpClient) { }

    private loadFromStorage(): User | null {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }

    private saveToStorage(user: User | null, token?: string): void {
        if (user) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
            if (token) {
                localStorage.setItem(this.TOKEN_KEY, token);
            }
        } else {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.TOKEN_KEY);
        }
    }

    // Simple SHA-256 pre-hash for E2EE (raw password doesn't leave browser)
    private async preHash(password: string): Promise<string> {
        return CryptoJS.SHA256(password).toString();
    }

    login(username: string, pass: string): Observable<boolean> {
        // We use defer to wrap the async preHash into the observable stream
        const normalizedUsername = username.trim().toLowerCase();
        const normalizedPassword = pass.trim().toLowerCase();

        return new Observable<boolean>(observer => {
            this.preHash(normalizedPassword).then(hashedPass => {
                this.http.post<{ user: User, token: string }>(`${this.API_URL}/login`, {
                    username: normalizedUsername,
                    password: hashedPass
                }).subscribe({
                    next: (response) => {
                        this.currentUser$.next(response.user);
                        this.saveToStorage(response.user, response.token);
                        observer.next(true);
                        observer.complete();
                    },
                    error: () => {
                        observer.next(false);
                        observer.complete();
                    }
                });
            }).catch(() => {
                observer.next(false);
                observer.complete();
            });
        });
    }

    logout(): void {
        this.currentUser$.next(null);
        localStorage.clear();
        this.router.navigate(['/login']);
    }

    getCurrentUser(): Observable<User | null> {
        return this.currentUser$.asObservable();
    }

    get currentUserValue(): User | null {
        return this.currentUser$.value;
    }

    hasRole(role: UserRole | UserRole[]): boolean {
        const user = this.currentUserValue;
        if (!user) return false;
        if (Array.isArray(role)) {
            return role.includes(user.role);
        }
        return user.role === role;
    }

    isAuthenticated(): boolean {
        return !!this.currentUserValue;
    }

    extractRedirect() {
        return this.router.createUrlTree(['/login']);
    }
}
