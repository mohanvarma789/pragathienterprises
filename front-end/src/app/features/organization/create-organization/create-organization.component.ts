import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrganizationService } from '../../../core/services/organization.service';
import { take } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container fade-in">
      <div class="card glass-panel form-card">
        <h2 class="mb-6 text-center">{{ isCreateMode ? 'Create New Organization' : 'Edit Organization Details' }}</h2>
        <form [formGroup]="orgForm" (ngSubmit)="saveOrganization()">
          <div class="form-group mb-4">
            <label>Company Name<span class="required-asterisk">*</span></label>
            <input type="text" formControlName="name" placeholder="Enter company name">
            <div *ngIf="orgForm.get('name')?.touched && orgForm.get('name')?.invalid" class="error-msg">
              Company name is required
            </div>
          </div>
          
          <div class="form-group mb-4">
            <label>GSTIN<span class="required-asterisk">*</span></label>
            <input type="text" formControlName="gstin" placeholder="Enter GSTIN">
            <div *ngIf="orgForm.get('gstin')?.touched && orgForm.get('gstin')?.invalid" class="error-msg">
              GSTIN is required
            </div>
          </div>

          <div class="grid grid-cols-2 mb-4">
            <div class="form-group">
              <label>Establishment Date<span class="required-asterisk">*</span></label>
              <input type="date" formControlName="establishedDate">
              <div *ngIf="orgForm.get('establishedDate')?.touched && orgForm.get('establishedDate')?.invalid" class="error-msg">
                Date is required
              </div>
            </div>

            <div class="form-group">
              <label>Mobile Number<span class="required-asterisk">*</span></label>
              <input type="text" formControlName="mobile" placeholder="Enter mobile number">
              <div *ngIf="orgForm.get('mobile')?.touched && orgForm.get('mobile')?.invalid" class="error-msg">
                Mobile is required
              </div>
            </div>
          </div>

          <div class="form-group mb-4">
            <label>Email Address<span class="required-asterisk">*</span></label>
            <input type="email" formControlName="email" placeholder="Enter email address">
            <div *ngIf="orgForm.get('email')?.touched && orgForm.get('email')?.invalid" class="error-msg">
              <span *ngIf="orgForm.get('email')?.errors?.['required']">Email is required</span>
              <span *ngIf="orgForm.get('email')?.errors?.['email']">Invalid email format</span>
            </div>
          </div>

          <div class="form-group mb-4">
            <label>Office Address<span class="required-asterisk">*</span></label>
            <textarea formControlName="address" rows="3" placeholder="Enter office address"></textarea>
            <div *ngIf="orgForm.get('address')?.touched && orgForm.get('address')?.invalid" class="error-msg">
              Address is required
            </div>
          </div>

          <div class="actions mt-4">
            <button type="button" (click)="goBack()" class="btn btn-warning">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="orgForm.invalid">Save</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-card { max-width: 600px; margin: 0 auto; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-4 { margin-top: 1.5rem; }
    .text-center { text-align: center; }
    .actions { display: flex; gap: 1rem; justify-content: center; }
    .btn-warning { background: var(--secondary-color); color: white; }
    label { display: block; margin-bottom: 0.3rem; color: var(--text-muted); font-size: 0.9rem; }
    .grid { display: grid; gap: 0.8rem; }
    .grid-cols-2 { grid-template-columns: 1fr 1fr; }
    
    @media (max-width: 600px) {
      .grid-cols-2 { grid-template-columns: 1fr; }
    }
`]
})
export class CreateOrganizationComponent implements OnInit {
  orgForm: FormGroup;
  isCreateMode = false;

  constructor(
    private orgService: OrganizationService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService
  ) {
    this.orgForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      gstin: ['', Validators.required],
      establishedDate: ['', Validators.required],
      mobile: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Check path directly from route config or url segments
    const path = this.router.url;
    this.isCreateMode = path.includes('/organization/create');

    if (this.isCreateMode) {
      // For creation, we start with a blank form
      this.orgForm.reset({
        id: 'org-' + Math.floor(Math.random() * 1000),
        name: '',
        gstin: '',
        establishedDate: '',
        mobile: '',
        email: '',
        address: ''
      });
    } else {
      this.spinner.show();
      // Only pre-fill when editing existing organization
      this.orgService.getOrganization().pipe(take(1)).subscribe(org => {
        this.spinner.hide();
        if (org) {
          this.orgForm.patchValue(org);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/organization/view']);
  }

  saveOrganization() {
    if (this.orgForm.valid) {
      this.spinner.show();
      this.orgService.updateOrganization(this.orgForm.value);

      setTimeout(() => {
        this.spinner.hide();
        Swal.fire({
          title: 'Success!',
          text: `Organization ${this.isCreateMode ? 'created' : 'details updated'}.`,
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
