import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
    selector: 'app-theme-toggle',
    standalone: true,
    imports: [CommonModule],
    template: `
    <input type="checkbox" class="theme-checkbox" [checked]="themeService.isDarkMode()" (change)="toggle()">
  `,
    styleUrls: ['./theme-toggle.component.css']
})
export class ThemeToggleComponent {
    constructor(public themeService: ThemeService) { }

    toggle() {
        this.themeService.toggleTheme();
    }
}
