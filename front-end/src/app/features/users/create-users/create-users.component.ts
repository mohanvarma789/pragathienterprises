import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User, UserRole } from '../../../core/models/models';
import { take } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container fade-in">
      <div class="card glass-panel form-card">
        <h2 class="mb-6 text-center">{{ isEditing ? 'Edit User' : 'Add New User' }}</h2>
        <form [formGroup]="userForm" (ngSubmit)="saveUser()">
          <div class="form-group mb-4">
            <label>Full Name<span class="required-asterisk">*</span></label>
            <input type="text" formControlName="name" placeholder="Enter full name">
            <div *ngIf="userForm.get('name')?.touched && userForm.get('name')?.invalid" class="error-msg">
              Name is required
            </div>
          </div>
          
          <div class="form-group mb-4">
            <label>Username<span class="required-asterisk">*</span></label>
            <input type="text" formControlName="username" placeholder="Enter username">
            <div *ngIf="userForm.get('username')?.touched && userForm.get('username')?.invalid" class="error-msg">
              Username is required
            </div>
          </div>

          <div class="form-group mb-4">
            <label>Email Address<span class="required-asterisk">*</span></label>
            <input type="email" formControlName="email" placeholder="Enter email">
            <div *ngIf="userForm.get('email')?.touched && userForm.get('email')?.invalid" class="error-msg">
              <span *ngIf="userForm.get('email')?.errors?.['required']">Email is required</span>
              <span *ngIf="userForm.get('email')?.errors?.['email']">Invalid email format</span>
            </div>
          </div>

          <div class="grid grid-cols-2 mb-4">
            <div class="form-group">
              <label>User Role<span class="required-asterisk">*</span></label>
              <select formControlName="role">
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Staff">Staff</option>
              </select>
            </div>

            <div class="form-group checkbox-wrapper">
               <label>Status</label>
               <div class="checkbox-group">
                 <input type="checkbox" formControlName="active" id="user-active">
                 <label for="user-active" class="checkbox-label">Active Account</label>
               </div>
            </div>
          </div>

          <div class="actions mt-4">
            <button type="button" (click)="goBack()" class="btn btn-warning">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="userForm.invalid">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-card { max-width: 600px; margin: 0 auto; }
    .mb-4 { margin-bottom: 2rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-4 { margin-top: 2rem; }
    .text-center { text-align: center; }
    .actions { display: flex; gap: 1rem; justify-content: center; }
    .btn-warning { background: var(--secondary-color); color: white; }
    label { display: block; margin-bottom: 0.5rem; color: var(--text-muted); font-size: 0.9rem; }
    .grid { display: grid; gap: 1rem; }
    .grid-cols-2 { grid-template-columns: 1fr 1fr; }
    
    .checkbox-wrapper { display: flex; flex-direction: column; }
    .checkbox-group { display: flex; align-items: center; gap: 0.5rem; height: 100%; padding-top: 0.25rem; }
    .checkbox-group input { width: 18px; height: 18px; margin-bottom: 0; }
    .checkbox-label { margin-bottom: 0 !important; cursor: pointer; }

    @media (max-width: 600px) {
      .grid-cols-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class CreateUsersComponent implements OnInit {
  isEditing = false;
  userForm: FormGroup;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private spinner: NgxSpinnerService
  ) {
    this.userForm = this.fb.group({
      id: [''],
      username: ['', Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['Staff' as UserRole, Validators.required],
      active: [true],
      lastLogin: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.spinner.show();
      this.isEditing = true;
      this.userService.getUsers().pipe(take(1)).subscribe(users => {
        this.spinner.hide();
        const user = users.find(u => u.id === id);
        if (user) {
          this.userForm.patchValue(user);
        } else {
          this.goBack();
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/users/view']);
  }

  saveUser() {
    if (this.userForm.valid) {
      this.spinner.show();
      const userData = this.userForm.value;
      if (this.isEditing) {
        this.userService.updateUser(userData);
      } else {
        userData.id = Math.random().toString(36).substr(2, 9);
        this.userService.addUser(userData);
      }

      setTimeout(() => {
        this.spinner.hide();
        Swal.fire({
          title: 'Success!',
          text: `User ${this.isEditing ? 'updated' : 'created'} successfully.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: 'var(--card-bg)',
          color: 'var(--text-color)'
        }).then(() => {
          this.goBack();
        });
      }, 800);
    }
  }
}
