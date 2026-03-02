import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrganizationService } from '../../../core/services/organization.service';
import { Organization } from '../../../core/models/models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-view-organization',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container fade-in" *ngIf="organization$ | async as org">
      <div class="header-section mb-6">
        <div class="header-info">
          <h1>Organization Profile</h1>
          <p class="text-muted">View and manage your core business details</p>
        </div>
      </div>

      <div class="card glass-panel main-profile-card">
        <!-- Identity Header -->
        <div class="profile-brand-header">
          <div class="brand-text">
            <h2>{{ org.name }}</h2>
          </div>
        </div>

        <div class="profile-details-grid">
          <!-- Business Section -->
          <div class="detail-section">
            <h3>Business Details</h3>
            <div class="info-row">
              <div class="info-item">
                <label>GSTIN Number</label>
                <div class="value highlight">{{ org.gstin }}</div>
              </div>
              <div class="info-item">
                <label>Established Since</label>
                <div class="value">{{ org.establishedDate | date:'longDate' }}</div>
              </div>
            </div>
          </div>

          <!-- Contact Section -->
          <div class="detail-section">
            <h3>Contact Information</h3>
            <div class="info-row">
              <div class="info-item">
                <label>Primary Mobile</label>
                <div class="value highlight">{{ org.mobile }}</div>
              </div>
              <div class="info-item">
                <label>Email Address</label>
                <div class="value">{{ org.email }}</div>
              </div>
            </div>
          </div>

          <!-- Address Section -->
          <div class="detail-section full-width">
            <h3>Registered Office</h3>
            <div class="info-item">
              <label>Full Address</label>
              <div class="value address-block">{{ org.address }}</div>
            </div>
          </div>
        </div>
        
        <div class="card-footer">
          <a routerLink="/organization/edit" class="btn btn-primary">
            <span>✏️ Edit</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mb-6 { margin-bottom: 1.5rem; }
    .header-section { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    .header-info h1 { margin: 0; font-size: 1.5rem; color: var(--text-color); }
    .header-info p { margin: 0.15rem 0 0 0; font-size: 0.9rem; }

    .main-profile-card {
      padding: 1.5rem;
      border-radius: 16px;
      max-width: 800px;
      margin: 1.5rem auto;
      border: 1px solid var(--border-color);
    }

    .profile-brand-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 1.5rem;
    }

    .brand-text h2 { margin: 0; color: var(--primary-color); font-size: 1.6rem; }
    .tagline { margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.95rem; font-weight: 500; }

    .profile-details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .detail-section h3 {
      font-size: 0.85rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
    }

    .info-row {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .info-item label {
      display: block;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
      font-weight: 500;
    }

    .info-item .value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .value.highlight { color: var(--primary-color); }
    .address-block { line-height: 1.5; font-size: 0.95rem !important; }

    .full-width { grid-column: span 2; }
    
    .card-footer {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
    }

    .btn { 
      display: inline-flex; 
      align-items: center; 
      gap: 0.5rem; 
      padding: 0.5rem 1.5rem; 
      border-radius: 10px; 
      font-weight: 600; 
      font-size: 0.9rem;
      cursor: pointer; 
      transition: all 0.2s; 
      border: none; 
      text-decoration: none; 
    }
    .btn-primary { background: var(--primary-color); color: white; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2); }
    .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }

    @media (max-width: 768px) {
      .main-profile-card { padding: 1.25rem; margin: 1rem auto; }
      .profile-brand-header { gap: 1rem; padding-bottom: 1.25rem; margin-bottom: 1.25rem; }
      .brand-text h2 { font-size: 1.4rem; }
      .profile-details-grid { grid-template-columns: 1fr; gap: 1.5rem; }
      .full-width { grid-column: auto; }
      .header-section { flex-direction: column; gap: 0.75rem; text-align: center; align-items: stretch; margin-bottom: 1rem; }
      .header-info { display: none; }
      .btn { justify-content: center; width: 100%; }
      .card-footer { margin-top: 1.5rem; padding-top: 1rem; }
    }
  `]
})
export class ViewOrganizationComponent implements OnInit {
  organization$!: Observable<Organization>;

  constructor(private orgService: OrganizationService) { }

  ngOnInit(): void {
    this.organization$ = this.orgService.getOrganization();
  }
}
