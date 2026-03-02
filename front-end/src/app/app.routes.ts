import { Routes, Router } from '@angular/router';
import { MainLayoutComponent } from './features/layout/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ViewShopsComponent } from './features/shops/view-shops/view-shops.component';
import { CreateShopComponent } from './features/shops/create-shop/create-shop.component';
import { EditShopComponent } from './features/shops/edit-shop/edit-shop.component';
import { ViewProductsComponent } from './features/inventory/view-products/view-products.component';
import { CreateProductComponent } from './features/inventory/create-product/create-product.component';
import { EditProductComponent } from './features/inventory/edit-product/edit-product.component';
import { ViewPendingOrdersComponent } from './features/orders/view-pending-orders/view-pending-orders.component';
import { CreateOrdersComponent } from './features/orders/create-orders/create-orders.component';
import { InvoiceTemplateComponent } from './features/orders/invoice-template/invoice-template.component';
import { AuthService } from './core/services/auth.service';
import { inject } from '@angular/core';
import { OrderRequestComponent } from './features/orders/order-request/order-request.component';

import { UploadFileComponent } from './features/orders/upload-file/upload-file.component';
import { EditInvoiceComponent } from './features/orders/edit-invoice/edit-invoice.component';
import { UserRole, Shop } from './core/models/models';
import { CompletedOrdersComponent } from './features/orders/completed-orders/completed-orders.component';
import { UrgentOrdersComponent } from './features/orders/urgent-orders/urgent-orders.component';

const authGuard = (roles?: UserRole[]) => {
    return () => {
        const auth = inject(AuthService);
        const router = inject(Router);

        if (!auth.isAuthenticated()) {
            return auth.extractRedirect();
        }

        if (roles && !auth.hasRole(roles)) {
            return router.createUrlTree(['/dashboard']);
        }

        return true;
    };
};

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent, title: 'Login - Pragathi Enterprises' },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard()],
        children: [
            { path: 'dashboard', component: DashboardComponent, title: 'Dashboard - Pragathi Enterprises' },
            { path: 'orders', component: ViewPendingOrdersComponent, title: 'Pending Orders - Pragathi Enterprises' },
            { path: 'orders/create', component: CreateOrdersComponent, title: 'Create Orders - Pragathi Enterprises' },
            { path: 'orders/edit/:id', component: CreateOrdersComponent, title: 'Edit Orders - Pragathi Enterprises' },
            { path: 'orders/request', component: OrderRequestComponent, title: 'View Out of Stock Orders - Pragathi Enterprises' },
            { path: 'orders/upload-file', component: UploadFileComponent, title: 'Upload Order - Pragathi Enterprises' },
            { path: 'orders/edit-invoice', component: EditInvoiceComponent, title: 'Edit Invoice - Pragathi Enterprises' },
            { path: 'orders/edit-invoice/:id', component: EditInvoiceComponent, title: 'Edit Invoice - Pragathi Enterprises' },
            { path: 'orders/completed', component: CompletedOrdersComponent, title: 'Completed Orders - Pragathi Enterprises' },
            { path: 'orders/urgent', component: UrgentOrdersComponent, title: 'Urgent Orders - Pragathi Enterprises' },

            { path: 'inventory', component: ViewProductsComponent, title: 'View Products - Pragathi Enterprises' },

            { path: 'inventory/add', component: CreateProductComponent, title: 'Create Product - Pragathi Enterprises' },
            { path: 'inventory/add-stock/:id', loadComponent: () => import('./features/inventory/add-stock/add-stock.component').then(m => m.AddStockComponent), title: 'Add Product Stock - Pragathi Enterprises' },
            { path: 'inventory/edit/:id', component: EditProductComponent, title: 'Edit Product - Pragathi Enterprises' },

            { path: 'shops', component: ViewShopsComponent, title: 'View Shops - Pragathi Enterprises' },
            { path: 'shops/add', component: CreateShopComponent, title: 'Create Shop - Pragathi Enterprises' },
            { path: 'shops/edit/:id', component: EditShopComponent, title: 'Edit Shop - Pragathi Enterprises' },
            {
                path: 'organization',
                canActivate: [authGuard(['Admin'])],
                children: [
                    { path: '', redirectTo: 'view', pathMatch: 'full' },
                    {
                        path: 'view',
                        loadComponent: () => import('./features/organization/view-organization/view-organization.component').then(m => m.ViewOrganizationComponent),
                        title: 'View Organization - Pragathi Enterprises'
                    },
                    {
                        path: 'create',
                        loadComponent: () => import('./features/organization/create-organization/create-organization.component').then(m => m.CreateOrganizationComponent),
                        title: 'Create Organization - Pragathi Enterprises'
                    },
                    {
                        path: 'edit',
                        loadComponent: () => import('./features/organization/create-organization/create-organization.component').then(m => m.CreateOrganizationComponent),
                        title: 'Edit Organization - Pragathi Enterprises'
                    }
                ]
            },
            {
                path: 'users',
                canActivate: [authGuard(['Admin', 'Manager'])],
                children: [
                    { path: '', redirectTo: 'view', pathMatch: 'full' },
                    {
                        path: 'view',
                        loadComponent: () => import('./features/users/view-users/view-users.component').then(m => m.ViewUsersComponent),
                        title: 'Users - Pragathi Enterprises'
                    },
                    {
                        path: 'add',
                        loadComponent: () => import('./features/users/create-users/create-users.component').then(m => m.CreateUsersComponent),
                        title: 'Add User - Pragathi Enterprises'
                    },
                    {
                        path: 'edit/:id',
                        loadComponent: () => import('./features/users/create-users/create-users.component').then(m => m.CreateUsersComponent),
                        title: 'Edit User - Pragathi Enterprises'
                    }
                ]
            },
        ]
    },
    {
        path: 'orders/invoice/:id',
        component: InvoiceTemplateComponent,
        canActivate: [authGuard()],
        title: 'Invoice - Pragathi Enterprises'
    },
    { path: '**', redirectTo: 'login' }
];
