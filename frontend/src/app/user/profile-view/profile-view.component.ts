import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile-view',
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.scss']
})
export class ProfileViewComponent implements OnInit {
  profile: any;
  loading = true;
  error = '';

  constructor(private userService: UserService, private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.loadProfile();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadProfile() {
    this.userService.getProfile()
      .subscribe(
        (response) => {
          // Patch profilePhoto to be absolute if needed
          if (response.user && response.user.profilePhoto) {
            if (response.user.profilePhoto.startsWith('/uploads')) {
              // Only prepend if it's a relative path
              const baseApiUrl = environment.apiUrl.replace(/\/api$/, '');
              response.user.profilePhoto = baseApiUrl + response.user.profilePhoto;
            }
            // If already absolute (starts with http), do nothing
          }
          this.profile = response.user;
          console.log('Loaded profile:', this.profile);
          this.loading = false;
        },
        (error) => {
          this.error = error.message;
          this.loading = false;
        }
      );
  }
}
