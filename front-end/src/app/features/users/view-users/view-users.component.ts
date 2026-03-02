import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/models';
import { Observable } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-view-users',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container fade-in">
      <div class="user-grid" *ngIf="users$ | async as usersList">
        <div class="user-card glass-panel" *ngFor="let user of usersList" [class.inactive]="!user.active">
          <div class="card-header">
            <div class="user-info">
              <div class="avatar">{{ user.name.charAt(0) }}</div>
              <div>
                <div class="font-bold user-name">{{ user.name }}</div>
                <div class="text-small text-muted">{{ user.role }}</div>
              </div>
            </div>
            <div class="status-badge" [class.active]="user.active">
              {{ user.active ? 'Active' : 'Inactive' }}
            </div>
          </div>
          
          <div class="card-body">
            <div class="detail-row">
              <span class="label">Email</span>
              <span class="value">{{ user.email }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Last Login</span>
              <span class="value">{{ user.lastLogin || 'Never' }}</span>
            </div>
          </div>

          <div class="card-footer">
            <a [routerLink]="['/users/edit', user.id]" class="btn-icon" title="Edit User">✏️</a>
            <button class="btn-icon text-danger" (click)="deleteUser(user)" title="Delete User">🗑️</button>
          </div>
        </div>

        <div *ngIf="usersList.length === 0" class="no-users text-muted">
          No users found.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 1.5rem; }
    .user-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      padding: 1rem;
    }
    
    .user-card {
      padding: 1.5rem;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: transform 0.2s, box-shadow 0.2s;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid var(--border-color);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .user-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.05);
    }
    
    .user-card.inactive {
      border: 2px solid #ef4444;
      background: rgba(239, 68, 68, 0.15);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .user-info { display: flex; align-items: center; gap: 1rem; }
    .avatar { 
      width: 48px; height: 48px; 
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); 
      color: white; border-radius: 12px; 
      display: flex; align-items: center; justify-content: center; 
      font-weight: bold; font-size: 1.25rem;
      box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
    }
    .user-name { font-size: 1.1rem; color: var(--text-color); }
    
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #f1f5f9;
      color: #64748b;
    }
    .status-badge.active { background: #dcfce7; color: #166534; }
    
    .card-body {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem 0;
      border-top: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
    }
    
    .detail-row { display: flex; justify-content: space-between; font-size: 0.9rem; }
    .label { color: var(--text-muted); }
    .value { font-weight: 500; color: var(--text-color); }
    
    .card-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    
    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 8px;
      transition: background 0.2s;
      text-decoration: none;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-icon:hover { background: rgba(0,0,0,0.05); }
    .text-danger { color: var(--danger-color); }
    
    .no-users { grid-column: 1 / -1; text-align: center; padding: 3rem; }
    
    @media (max-width: 768px) {
      .user-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ViewUsersComponent implements OnInit {
  users$: Observable<User[]>;

  constructor(
    private userService: UserService,
    private spinner: NgxSpinnerService
  ) {
    this.users$ = this.userService.getUsers();
  }

  ngOnInit(): void { }

  deleteUser(user: User) {
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete user: ${user.name}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--danger-color)',
      cancelButtonColor: 'var(--border-color)',
      confirmButtonText: 'Yes, delete it!',
      background: 'var(--card-bg)',
      color: 'var(--text-color)'
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        this.userService.deleteUser(user.id);
        setTimeout(() => {
          this.spinner.hide();
          Swal.fire({
            title: 'Deleted!',
            text: 'User has been removed.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: 'var(--card-bg)',
            color: 'var(--text-color)'
          });
        }, 800);
      }
    });
  }
}
