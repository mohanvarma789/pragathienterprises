import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { filter, map, mergeMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, NgxSpinnerModule, ThemeToggleComponent],
  template: `
    <div class="layout-container">
      <ngx-spinner bdColor="rgba(0, 0, 0, 0.85)" size="medium" color="#2196f3" type="ball-spin-clockwise-fade-rotating" [fullScreen]="true">
        <p style="color: #2196f3; font-weight: 600; margin-top: 10px;"> Loading... </p>
      </ngx-spinner>
      
      <!-- Backdrop for mobile -->
      <div class="sidebar-overlay" *ngIf="isSidebarOpen" (click)="closeSidebar()"></div>

      <aside class="sidebar-area no-print" [class.open]="isSidebarOpen" [class.collapsed]="isSidebarCollapsed">
        <app-sidebar (linkClicked)="closeSidebar()" (toggleSidebar)="toggleSidebar()" [isCollapsed]="isSidebarCollapsed"></app-sidebar>
      </aside>
      
      <div class="main-wrapper">
        <header class="top-header no-print">
            <div class="header-left">
              <button class="mobile-toggle-btn" (click)="toggleSidebar()">☰</button>
              <h2 class="page-title">{{ currentPageTitle }}</h2>
            </div>
           
           <div class="header-right">
             <div class="theme-switch-container">
                 <app-theme-toggle></app-theme-toggle>
             </div>
             
             <div class="user-profile-container" *ngIf="authService.currentUserValue as user">
               <div class="user-badge" (click)="toggleUserDropdown($event)" [class.active]="isUserDropdownOpen">
                 <div class="avatar-small">{{ user.name.charAt(0) }}</div>
                 <div class="user-meta desktop-only">
                   <div class="user-name">{{ user.name }}</div>
                   <div class="user-role">{{ user.role }}</div>
                 </div>
                 <span class="dropdown-arrow">▼</span>
               </div>
               
               <div class="user-dropdown" *ngIf="isUserDropdownOpen">
                 <div class="dropdown-header">
                   <strong>{{ user.name }}</strong>
                   <span>{{ user.email }}</span>
                 </div>
                 <div class="dropdown-divider"></div>
                 <a class="dropdown-item" (click)="closeUserDropdown()" routerLink="/settings">
                   <span class="icon">⚙️</span> Settings
                 </a>
                 <div class="dropdown-divider"></div>
                 <button class="dropdown-item logout" (click)="logout(); closeUserDropdown()">
                   <span class="icon">🚪</span> Logout
                 </button>
               </div>
             </div>
           </div>
        </header>

        <main class="content-area">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      min-height: 100vh;
      position: relative; /* For overlay context */
    }
    
    .sidebar-area {
      width: 250px;
      flex-shrink: 0;
      height: 100vh;
      position: sticky;
      top: 0;
      transition: width 0.3s ease-in-out, transform 0.3s ease-in-out;
      z-index: 1001; /* Above overlay */
      background: var(--card-bg); /* Ensure opaque */
      overflow-x: hidden;
    }
    
    .sidebar-area.collapsed {
      width: 85px;
    }
    
    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    
    .content-area {
      flex: 1;
      padding: 1rem 2rem 2rem;
      overflow-y: auto;
    }
    
    .sidebar-overlay {
      display: none;
    }
    
    .top-header {
      position: sticky;
      top: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 2rem;
      background: var(--card-bg);
      border-bottom: 1px solid var(--border-color);
      z-index: 999;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    
    .header-left, .header-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .mobile-toggle-btn {
      display: none;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      color: var(--text-color);
      font-size: 1.5rem;
      padding: 0.4rem 0.6rem;
      border-radius: 8px;
      cursor: pointer;
      line-height: 1;
      transition: all 0.2s;
    }

    .mobile-toggle-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .page-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-color);
      letter-spacing: 0.5px;
    }
    
    .theme-switch-container {
      display: flex; 
      align-items: center;
    }
    
    .user-profile-container {
      position: relative;
    }
    
    .user-badge {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.4rem 0.75rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .user-badge:hover, .user-badge.active {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }
    
    .dropdown-arrow {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-left: 0.2rem;
    }
    
    .user-dropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      width: 200px;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      z-index: 1100;
      padding: 0.5rem 0;
      animation: fadeInDown 0.2s ease-out;
    }
    
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .dropdown-header {
      padding: 0.75rem 1rem;
      display: flex;
      flex-direction: column;
    }
    
    .dropdown-header strong {
      display: block;
      color: var(--text-color);
      font-size: 0.9rem;
    }
    
    .dropdown-header span {
      display: block;
      color: var(--text-muted);
      font-size: 0.75rem;
    }
    
    .dropdown-divider {
      height: 1px;
      background: var(--border-color);
      margin: 0.5rem 0;
    }
    
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 1rem;
      color: var(--text-color);
      text-decoration: none;
      font-size: 0.9rem;
      background: none;
      border: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .dropdown-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    
    .dropdown-item.logout {
      color: #ef4444;
    }
    
    .dropdown-item.logout:hover {
      background: rgba(239, 68, 68, 0.1);
    }
    
    .avatar-small {
      width: 32px; height: 32px;
      background: var(--primary-color); color: white;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: bold; font-size: 0.8rem;
    }
    
    .user-meta { display: flex; flex-direction: column; }
    .user-name { font-size: 0.85rem; font-weight: 600; line-height: 1.2; }
    .user-role { font-size: 0.7rem; color: var(--text-muted); }

    .btn-logout {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: 0.4rem 0.75rem;
      border-radius: 20px;
      display: flex; align-items: center; gap: 0.25rem;
      cursor: pointer; font-size: 0.8rem; font-weight: 600;
      transition: all 0.2s;
    }
    
    .btn-logout:hover { background: #ef4444; color: white; }
    .btn-logout .icon { margin: 0; font-size: 1rem; }

    @media (max-width: 768px) {
      .layout-container {
        flex-direction: column;
      }
      
      /* Mobile Sidebar Drawer Styles */
      .sidebar-area {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 280px;
        height: 100vh;
        height: 100dvh;
        overflow-y: auto;
        transform: translateX(-100%);
        display: block;
        box-shadow: 2px 0 8px rgba(0,0,0,0.2);
      }

      .sidebar-area.open {
        transform: translateX(0);
      }
      
      .sidebar-overlay {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        backdrop-filter: blur(2px);
        z-index: 1000;
      }
      
      .top-header {
        position: sticky;
        top: 0;
        padding: 0.75rem 1rem;
        justify-content: space-between;
        border-bottom: 1px solid var(--border-color);
      }

      .mobile-toggle-btn {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .header-right {
        gap: 0.5rem;
      }
      
      .desktop-only {
        display: none !important;
      }
      
      .user-badge {
        padding: 0.2rem;
        border-radius: 50%;
      }
      
      .btn-logout {
        padding: 0.4rem;
        border-radius: 50%;
      }

      .page-title {
        font-size: 1.1rem;
        color: #DAA520; /* Matching Logo Gold on mobile */
        text-transform: uppercase;
        font-family: 'Times New Roman', serif;
        display: none; /* Hide on mobile to save space */
      }
      
      .content-area {
        padding: 1rem;
      }
    }
    
    @media print {
      .sidebar-area, .top-header, .sidebar-overlay {
        display: none !important;
      }
      .content-area {
        padding: 0;
        margin: 0;
        overflow: visible;
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  isSidebarOpen = false;
  isDesktopSidebarCollapsed = false;
  isUserDropdownOpen = false;
  isMobile = window.innerWidth <= 768;
  currentPageTitle = 'Dashboard';
  private routerSubscription?: Subscription;
  private clickListener?: () => void;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public authService: AuthService
  ) {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    this.isMobile = window.innerWidth <= 768;
  }

  get isSidebarCollapsed(): boolean {
    return !this.isMobile && this.isDesktopSidebarCollapsed;
  }

  ngOnInit() {
    this.updateTitle();
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateTitle();
    });

    // Global click listener to close dropdown
    this.clickListener = () => this.closeUserDropdown();
    window.addEventListener('click', this.clickListener);
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
    if (this.clickListener) {
      window.removeEventListener('click', this.clickListener);
    }
    window.removeEventListener('resize', this.onResize);
    // Ensure body scroll is restored if component is destroyed while sidebar is open
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }

  private updateTitle() {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    // Fallback to searching the route config for title if not directly in snapshot
    const title = route.snapshot.title || 'Pragathi Enterprises';
    this.currentPageTitle = title.replace(' - Pragathi Enterprises', '').trim();
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.isSidebarOpen = !this.isSidebarOpen;
      this.updateBodyScroll();
    } else {
      this.isDesktopSidebarCollapsed = !this.isDesktopSidebarCollapsed;
    }
  }

  closeSidebar() {
    this.isSidebarOpen = false;
    this.updateBodyScroll();
  }

  toggleUserDropdown(event: Event) {
    event.stopPropagation();
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  closeUserDropdown() {
    this.isUserDropdownOpen = false;
  }

  private updateBodyScroll() {
    if (this.isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  logout() {
    Swal.fire({
      title: 'Logout',
      text: 'Are you sure you want to log out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2196f3',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, logout',
      background: 'var(--card-bg)',
      color: 'var(--text-color)',
      backdrop: `rgba(0,0,0,0.4)`
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
      }
    });
  }
}
