import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LogoComponent],
  template: `
    <div class="sidebar" [class.collapsed]="isCollapsed">
      <button class="hamburger-btn" (click)="onToggleClick()">
        ☰
      </button>
      <button class="close-sidebar-btn" (click)="onToggleClick()">
        ✕
      </button>
      
      <div class="brand">
        <app-logo width="180px" height="80px" [stacked]="true"></app-logo>
      </div>
      <nav class="nav-links">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" (click)="onNavLinkClick()" [title]="isCollapsed ? 'Dashboard' : ''">
          <span class="icon">🏠</span> <span class="nav-text">Dashboard</span>
        </a>
        <a routerLink="/inventory/add" routerLinkActive="active" class="nav-item" (click)="onNavLinkClick()" [title]="isCollapsed ? 'Create Product' : ''">
          <span class="icon">➕</span> <span class="nav-text">Create Product</span>
        </a>
        <a routerLink="/inventory" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item" (click)="onNavLinkClick()" [title]="isCollapsed ? 'View Products' : ''">
          <span class="icon">📦</span> <span class="nav-text">View Products</span>
        </a>
        <a routerLink="/shops/add" routerLinkActive="active" class="nav-item" (click)="onNavLinkClick()" [title]="isCollapsed ? 'Create Shop' : ''">
          <span class="icon">➕</span> <span class="nav-text">Create Shop</span>
        </a>
        <a routerLink="/shops" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item" (click)="onNavLinkClick()" [title]="isCollapsed ? 'View Shops' : ''">
          <span class="icon">🏪</span> <span class="nav-text">View Shops</span>
        </a>
        <a routerLink="/orders/create" routerLinkActive="active" class="nav-item" (click)="onNavLinkClick()" [title]="isCollapsed ? 'Create Orders' : ''">
          <span class="icon">➕</span> <span class="nav-text">Create Orders</span>
        </a>
        <a routerLink="/orders" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item" (click)="onNavLinkClick()" [title]="isCollapsed ? 'Pending Orders' : ''">
          <span class="icon">📝</span> <span class="nav-text">Pending Orders</span>
        </a>
        <a routerLink="/orders/completed" routerLinkActive="active" class="nav-item" (click)="onNavLinkClick()" [title]="isCollapsed ? 'Completed Orders' : ''">
          <span class="icon">✅</span> <span class="nav-text">Completed Orders</span>
        </a>
        <a routerLink="/orders/urgent" routerLinkActive="active" class="nav-item" (click)="onNavLinkClick()" [title]="isCollapsed ? 'Urgent Orders' : ''">
          <span class="icon">🚀</span> <span class="nav-text">Urgent Orders</span>
        </a>
        <a routerLink="/orders/request" routerLinkActive="active" class="nav-item" (click)="onNavLinkClick()" [title]="isCollapsed ? 'Out of Stock' : ''">
          <span class="icon">🛍️</span> <span class="nav-text">Out of Stock</span>
        </a>
        <a routerLink="/orders/edit-invoice" routerLinkActive="active" class="nav-item" (click)="onNavLinkClick()" [title]="isCollapsed ? 'Edit Invoice' : ''">
          <span class="icon">✏️</span> <span class="nav-text">Edit Invoice</span>
        </a>
        <a routerLink="/orders/upload-file" routerLinkActive="active" class="nav-item" (click)="onNavLinkClick()" [title]="isCollapsed ? 'Upload File' : ''">
          <span class="icon">📂</span> <span class="nav-text">Upload File</span>
        </a>
        <a *ngIf="authService.hasRole(['Admin'])" routerLink="/organization/create" routerLinkActive="active" class="nav-item" (click)="onNavLinkClick()" [title]="isCollapsed ? 'Add Org' : ''">
          <span class="icon">➕</span> <span class="nav-text">Add Org</span>
        </a>
        <a *ngIf="authService.hasRole(['Admin'])" routerLink="/organization/view" routerLinkActive="active" class="nav-item" (click)="onNavLinkClick()" [title]="isCollapsed ? 'View Org' : ''">
          <span class="icon">🏢</span> <span class="nav-text">View Org</span>
        </a>
        <a *ngIf="authService.hasRole(['Admin', 'Manager'])" routerLink="/users/add" routerLinkActive="active" class="nav-item" (click)="onNavLinkClick()" [title]="isCollapsed ? 'Create Users' : ''">
          <span class="icon">➕</span> <span class="nav-text">Create Users</span>
        </a>
        <a *ngIf="authService.hasRole(['Admin', 'Manager'])" routerLink="/users/view" routerLinkActive="active" class="nav-item" (click)="onNavLinkClick()" [title]="isCollapsed ? 'View Users' : ''">
          <span class="icon">👥</span> <span class="nav-text">View Users</span>
        </a>
      </nav>
    </div>
  `,
  styles: [`
    .sidebar {
      height: 100%;
      width: var(--sidebar-width);
      background: var(--glass-bg);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-right: 1px solid var(--glass-border);
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      box-sizing: border-box;
      box-shadow: 10px 0 30px rgba(0, 0, 0, 0.2);
      position: relative; /* Anchor absolute positioning */
    }
    
    .sidebar.collapsed {
      width: 100%; /* controlled by parent container width */
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }
    
    .sidebar.collapsed .brand app-logo {
      display: none;
    }
    
    .sidebar.collapsed .nav-text {
      display: none;
    }
    
    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 0.75rem 0;
      margin: 0.25rem 0;
      width: 45px;
      height: 45px;
      margin-left: auto;
      margin-right: auto;
      padding: 0;
    }
    
    .sidebar.collapsed .nav-item:hover {
      background: rgba(59, 130, 246, 0.1);
      transform: none; /* Remove horizontal shift in collapsed view */
    }

    .sidebar.collapsed .nav-item.active {
      background: rgba(59, 130, 246, 0.15);
      border-left: none; /* Remove the left stripe for collapsed view to look cleaner */
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
    }
    
    .sidebar.collapsed .icon {
      margin-right: 0;
      margin-left: 0.25rem; /* Center visually to offset native icon gaps */
      font-size: 1.25rem;
    }
    
    .brand {
      margin-top: 3rem; /* Increased gap from top-positioned balance toggle */
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .hamburger-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.8rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: var(--text-color);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.4rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      z-index: 100;
    }
    
    .hamburger-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: scale(1.05);
    }
    
    .sidebar.collapsed .brand {
      display: none;
    }
    
    .sidebar.collapsed .hamburger-btn {
      position: relative;
      top: auto;
      right: auto;
      margin-bottom: 1rem;
    }

    .close-sidebar-btn {
      display: none;
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--text-color);
      cursor: pointer;
      padding: 0.5rem;
      line-height: 1;
      position: absolute;
      top: 0.5rem;
      right: 0.8rem;
      z-index: 101;
    }
    
    .nav-links {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0.25rem 0.5rem; /* Reduced to avoid clipping while maintaining some spacing */
      margin: 0 -0.5rem; /* Allow items to stretch slightly wider than content box */
      /* Hide scrollbar for Chrome, Safari and Opera */
      &::-webkit-scrollbar {
        display: none;
      }
      /* Hide scrollbar for IE, Edge and Firefox */
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      color: var(--text-muted);
      text-decoration: none;
      transition: all 0.2s;
    }
    
    .nav-item:hover {
      background: rgba(255, 255, 255, 0.03);
      color: var(--text-color);
      transform: translateX(4px);
    }

    .nav-item.active {
      background: linear-gradient(90deg, rgba(59, 130, 246, 0.15), transparent);
      color: var(--primary-color);
      border-left: 3px solid var(--primary-color);
      box-shadow: -10px 0 20px -10px var(--primary-glow);
    }
    
    .icon { margin-right: 0.75rem; font-size: 1.1rem; }

    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        width: 280px; /* Slightly wider for better reach */
        height: 100dvh; /* Dynamic viewport height */
        z-index: 1100;
        border-right: 1px solid var(--border-color);
        box-shadow: 10px 0 30px rgba(0,0,0,0.3);
      }
      .hamburger-btn {
        display: none;
      }
      .close-sidebar-btn {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  `]
})
export class SidebarComponent {
  @Input() isCollapsed = false;
  isMobile = window.innerWidth <= 768;
  @Output() linkClicked = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();

  constructor(
    public authService: AuthService
  ) {
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
  }

  onNavLinkClick() {
    if (this.isMobile) {
      this.linkClicked.emit();
    }
  }

  onToggleClick() {
    this.toggleSidebar.emit();
  }
}
