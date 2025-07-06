import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-otp-verified',
  templateUrl: './otp-verified.component.html',
  styleUrls: ['./otp-verified.component.scss']
})
export class OtpVerifiedComponent {
  error: string = '';
  constructor(public authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToProfile() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('currentUser');
    if (!token || !user) {
      this.error = 'Session invalid or expired. Please log in again.';
      return;
    }
    this.error = '';
    this.router.navigate(['/profile']);
  }
}

