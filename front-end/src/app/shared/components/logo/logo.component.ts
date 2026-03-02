import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConstantsService } from '../../../core/services/constants.service';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="logo-container" [style.width]="width" [style.height]="height">
      <svg width="100%" height="100%" [attr.viewBox]="stacked ? '0 0 350 110' : '0 0 500 60'" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Rich Gold Gradient -->
          <linearGradient id="textGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
            <stop offset="25%" style="stop-color:#FDB931;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#DAA520;stop-opacity:1" />
            <stop offset="75%" style="stop-color:#B8860B;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FFD700;stop-opacity:1" />
          </linearGradient>
        </defs>

        <ng-container *ngIf="!stacked">
          <!-- Single Line Text Centered -->
          <text x="50%" y="40" text-anchor="middle" font-family="'Times New Roman', serif" font-weight="900" font-size="42" fill="url(#textGold)" letter-spacing="1">{{ constants.COMPANY_NAME }}</text>
        </ng-container>

        <ng-container *ngIf="stacked">
          <!-- Two Line Text (Stacked) - Attempting to split by first space -->
          <text x="50%" y="45" text-anchor="middle" font-family="'Times New Roman', serif" font-weight="900" font-size="42" fill="url(#textGold)" letter-spacing="1">{{ constants.COMPANY_NAME.split(' ')[0] }}</text>
          <text x="50%" y="95" text-anchor="middle" font-family="'Times New Roman', serif" font-weight="900" font-size="36" fill="url(#textGold)" letter-spacing="1">{{ constants.COMPANY_NAME.split(' ').slice(1).join(' ') }}</text>
        </ng-container>
      </svg>
    </div>
  `,
  styles: [`
    .logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.03); /* Subtle backdrop */
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px; /* Rounded corners */
      padding: 0.5rem;
      box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.05);
      transition: all 0.3s ease;
    }
    .logo-container:hover {
      background: rgba(255, 255, 255, 0.05); /* Slight highlight on hover */
      border-color: rgba(218, 165, 32, 0.3); /* Catching the gold theme */
    }
    .logo-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  `]
})
export class LogoComponent {
  @Input() width: string = '200px';
  @Input() height: string = '50px';
  @Input() stacked: boolean = false;

  constructor(public constants: ConstantsService) { }
}
