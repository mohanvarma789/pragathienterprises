import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(
        private authService: AuthService,
        private notificationService: NotificationService
    ) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(catchError(err => {
            const backendError = err.error?.error || err.error?.message || err.statusText || 'An unknown error occurred';

            if (err.status === 0) {
                // Backend not connected or unreachable
                this.notificationService.connectionError();
            } else if ([401, 403].includes(err.status)) {
                // auto logout if 401 or 403 response returned from api
                this.authService.logout();
                this.notificationService.error(backendError, 'Authentication Failed');
            } else if (err.status >= 500) {
                // Server-side error
                this.notificationService.error('A server-side error occurred. Please try again later.', 'Server Error');
            }

            console.error('HTTP Error:', err);
            return throwError(() => backendError);
        }));
    }
}
