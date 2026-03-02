import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly STORAGE_KEY = 'roller_users';
    private users$ = new BehaviorSubject<User[]>(this.loadFromStorage());

    constructor() { }

    private loadFromStorage(): User[] {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        // Default users
        return [
            { id: '1', username: 'admin', name: 'Admin User', email: 'admin@pragathient.com', role: 'Admin', active: true, lastLogin: 'Today, 10:45 AM' },
            { id: '2', username: 'manager', name: 'Store Manager', email: 'manager@pragathient.com', role: 'Manager', active: true, lastLogin: 'Yesterday, 04:30 PM' },
            { id: '3', username: 'clerk', name: 'Billing Clerk', email: 'billing@pragathient.com', role: 'Staff', active: false, lastLogin: 'Feb 4, 2026' }
        ];
    }

    getUsers(): Observable<User[]> {
        return this.users$.asObservable();
    }

    addUser(user: User): void {
        const current = this.users$.value;
        const updated = [...current, user];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
        this.users$.next(updated);
    }

    updateUser(updatedUser: User): void {
        const current = this.users$.value;
        const index = current.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
            current[index] = updatedUser;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(current));
            this.users$.next([...current]);
        }
    }

    deleteUser(id: string): void {
        const current = this.users$.value;
        const filtered = current.filter(u => u.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
        this.users$.next(filtered);
    }
}
