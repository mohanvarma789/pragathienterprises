import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#1e293b', // matches card-bg (slate-800)
    color: '#f8fafc', // matches text-color (slate-50)
    width: '320px', // slightly more compact
    padding: '0.4rem',
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  success(message: string): void {
    this.Toast.fire({
      icon: 'success',
      title: message
    });
  }

  // Changed to toast for the login page and compact look
  error(message: string, title: string = 'Error'): void {
    this.Toast.fire({
      icon: 'error',
      title: title,
      text: message
    });
  }

  warn(message: string, title: string = 'Warning'): void {
    this.Toast.fire({
      icon: 'warning',
      title: title,
      text: message
    });
  }

  info(message: string, title: string = 'Info'): void {
    this.Toast.fire({
      icon: 'info',
      title: title,
      text: message
    });
  }

  // Specialized toast for connection errors
  connectionError(): void {
    this.Toast.fire({
      icon: 'error',
      title: 'Connection Error',
      text: 'Cannot reach the backend server.'
    });
  }
}
