import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    isDarkMode = signal<boolean>(true);

    constructor() {
        this.initTheme();
        // Check every minute, but only if no manual override
        setInterval(() => this.checkTime(), 60000);
    }

    initTheme() {
        // Check local storage first
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            if (storedTheme === 'dark') {
                this.setDarkTheme(false); // false = don't save to storage again (optional optimization)
            } else {
                this.setLightTheme(false);
            }
        } else {
            // No preference, use time-based default
            this.checkTime();
        }
    }

    private checkTime() {
        // If user has set a preference, do not override with time
        if (localStorage.getItem('theme')) return;

        const hour = new Date().getHours();
        // Day time is between 6 AM (inclusive) and 6 PM (exclusive)
        const isDayTime = hour >= 6 && hour < 18;

        if (isDayTime) {
            this.setLightTheme(false); // Don't save to storage for auto-switching
        } else {
            this.setDarkTheme(false);
        }
    }

    // Compatibility for SidebarComponent
    get isDarkTheme$() {
        return toObservable(this.isDarkMode);
    }

    toggleTheme() {
        if (this.isDarkMode()) {
            this.setLightTheme(true);
        } else {
            this.setDarkTheme(true);
        }
    }

    private setLightTheme(save: boolean) {
        document.documentElement.setAttribute('data-theme', 'light');
        this.isDarkMode.set(false);
        if (save) localStorage.setItem('theme', 'light');
    }

    private setDarkTheme(save: boolean) {
        document.documentElement.removeAttribute('data-theme');
        this.isDarkMode.set(true);
        if (save) localStorage.setItem('theme', 'dark');
    }
}
