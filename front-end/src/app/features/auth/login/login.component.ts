import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LogoComponent],
  template: `
    <div class="login-container">
      <div class="mesh-background">
        <div class="mesh-circle circle-1"></div>
        <div class="mesh-circle circle-2"></div>
        <div class="mesh-circle circle-3"></div>
      </div>
      <div class="card login-card premium-glass">
        <div class="logo-wrapper mb-6">
          <app-logo [width]="isMobile ? '180px' : '220px'" [height]="isMobile ? '55px' : '65px'" [stacked]="true"></app-logo>
        </div>

        
        <form #loginForm="ngForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group mb-4">
            <label>Username<span class="required-asterisk">*</span></label>
            <div class="input-with-icon">
              <span class="field-icon glow-icon">👤</span>
              <input type="text" [(ngModel)]="username" name="username" placeholder="Username" #userModel="ngModel" required autocomplete="username">
            </div>
            <div *ngIf="userModel.touched && userModel.invalid" class="error-msg" style="margin-top: 0.5rem; margin-bottom: 0;">
              Username is required
            </div>
          </div>
          <div class="form-group mb-4">
            <label>Password<span class="required-asterisk">*</span></label>
            <div class="input-with-icon">
              <span class="field-icon glow-icon">🔒</span>
              <input type="password" [(ngModel)]="password" name="password" placeholder="Password" #passModel="ngModel" required autocomplete="current-password">
            </div>
            <div *ngIf="passModel.touched && passModel.invalid" class="error-msg" style="margin-top: 0.5rem; margin-bottom: 0;">
              Password is required
            </div>
          </div>
          
          <div class="flex items-center justify-between mb-5" style="width: 100%;">
            <label class="remember-me-row">
              <input type="checkbox" name="remember" checked class="native-checkbox">
              <span class="checkbox-text">Remember me</span>
            </label>
            <a href="#" class="forgot-link">Forgot?</a>
          </div>

          <button type="submit" class="btn btn-premium w-full" [disabled]="loginForm.invalid">
            <span>Login to Portal</span>
            <span class="btn-shine"></span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      overflow: hidden;
      padding: 1rem;
    }
    
    .w-full { width: 100%; }

    /* Mesh Background */
    .mesh-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      filter: blur(100px);
      opacity: 0.6;
    }

    .mesh-circle {
      position: absolute;
      border-radius: 50%;
      animation: move 20s infinite alternate;
    }

    .circle-1 {
      width: 600px;
      height: 600px;
      background: rgba(37, 99, 235, 0.4);
      top: -100px;
      right: -100px;
    }

    .circle-2 {
      width: 500px;
      height: 500px;
      background: rgba(139, 92, 246, 0.3);
      bottom: -150px;
      left: -100px;
      animation-delay: -5s;
    }

    .circle-3 {
      width: 400px;
      height: 400px;
      background: rgba(236, 72, 153, 0.2);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation-delay: -10s;
    }

    @keyframes move {
      0% { transform: translate(0, 0); }
      100% { transform: translate(100px, 100px); }
    }

    /* Premium Glassmorphism - Compact */
    .premium-glass {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 380px;
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(25px);
      -webkit-backdrop-filter: blur(25px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 2.25rem;
      box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.6),
        inset 0 1px 1px rgba(255, 255, 255, 0.1);
      animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .logo-wrapper {
      display: flex;
      justify-content: center;
      width: 100%;
    }

    /* Forms */
    .login-form {
      display: flex;
      flex-direction: column;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .mb-4 { margin-bottom: 1.15rem !important; }
    .mb-5 { margin-bottom: 1.25rem !important; }
    .mb-6 { margin-bottom: 1.5rem !important; }

    label {
      font-size: 0.85rem;
      font-weight: 500;
      color: #94a3b8;
      display: block;
      margin-bottom: 0.5rem;
      margin-left: 0.25rem;
    }

    .input-with-icon {
      position: relative;
    }

    .field-icon {
      position: absolute;
      left: 1.1rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.95rem;
      color: #FFD700; /* Bright Gold */
      z-index: 2;
      pointer-events: none;
      transition: all 0.4s ease;
      /* Intense Neon Gold Glow */
      text-shadow: 
        0 0 5px rgba(255, 215, 0, 0.8),
        0 0 10px rgba(255, 215, 0, 0.5),
        0 0 15px rgba(255, 215, 0, 0.3);
    }

    input[type="text"],
    input[type="password"] {
      width: 100%;
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 0.85rem 1rem 0.85rem 3.2rem;
      color: white;
      font-size: 0.95rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    input:focus {
      outline: none;
      border-color: #3b82f6;
      background: rgba(15, 23, 42, 0.6);
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
    }

    input:focus + .field-icon {
      color: #3b82f6;
      text-shadow: 
        0 0 10px rgba(59, 130, 246, 1),
        0 0 20px rgba(59, 130, 246, 0.8),
        0 0 30px rgba(59, 130, 246, 0.5);
      transform: translateY(-50%) scale(1.1);
    }

    /* Checkbox & Link - Perfect Alignment */
    .remember-me-row {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      margin: 0 !important;
      cursor: pointer;
      white-space: nowrap !important;
    }

    .native-checkbox {
      margin: 0 !important;
      width: 15px !important;
      height: 15px !important;
      cursor: pointer;
      flex-shrink: 0;
    }

    .checkbox-text {
      font-size: 0.85rem;
      color: #94a3b8;
      line-height: 1;
      font-weight: 500;
    }

    .forgot-link {
      font-size: 0.85rem;
      color: #3b82f6;
      font-weight: 500;
      transition: color 0.2s;
      white-space: nowrap;
    }

    .forgot-link:hover {
      color: #60a5fa;
    }

    /* Premium Button */
    .btn-premium {
      position: relative;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: white;
      padding: 0.875rem;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
    }

    .btn-premium:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);
    }

    .btn-premium:active:not(:disabled) {
      transform: translateY(0);
    }
    
    .btn-premium:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      filter: grayscale(0.5);
    }

    .btn-shine {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: 0.5s;
    }

    .btn-premium:hover .btn-shine {
      left: 100%;
    }

    .error-msg {
      margin-top: 1.5rem;
      padding: 0.75rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
      color: #f87171;
      font-size: 0.875rem;
    }

    .fade-in { animation: fadeIn 0.3s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .mb-8 { margin-bottom: 2rem; }
    .mb-6 { margin-bottom: 1.5rem; }

    @media (max-width: 480px) {
      .premium-glass {
        padding: 2rem 1.5rem;
        border-radius: 20px;
      }
      .welcome-text { font-size: 1.5rem; }
    }
  `]
})
export class LoginComponent implements OnDestroy {
  username = '';
  password = '';
  isMobile = window.innerWidth <= 480;
  private resizeListener = () => {
    this.isMobile = window.innerWidth <= 480;
  };

  constructor(private auth: AuthService, private router: Router) {
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener);
  }

  onSubmit() {
    this.auth.login(this.username, this.password).subscribe(success => {
      if (success) {
        this.router.navigate(['/dashboard']);
      }
    });
  }
}
