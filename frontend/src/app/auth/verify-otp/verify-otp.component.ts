import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.scss']
})
export class VerifyOtpComponent implements OnInit {
  showOtpForm: boolean = true;
  verifyForm: FormGroup;
  loading = false;
  error = '';
  successMessage = '';
  email: string = '';
  mobile: string = '';
  submitted = false;
  otpError = '';
  private navigationState: any;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.verifyForm = this.formBuilder.group({
      'otp': ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params: Params) => {
      if (params['email']) {
        this.email = params['email'];
        localStorage.setItem('pendingEmail', this.email);
      } else {
        this.email = localStorage.getItem('pendingEmail') || '';
      }
      if (params['mobile']) {
        this.mobile = params['mobile'];
        localStorage.setItem('pendingMobile', this.mobile);
      } else {
        this.mobile = localStorage.getItem('pendingMobile') || '';
      }
      console.log('VerifyOtpComponent ngOnInit - email:', this.email, 'mobile:', this.mobile);
      if (!this.email && !this.mobile) {
        this.error = 'Your session has expired or is invalid. Please register again.';
        this.showOtpForm = false;
      } else {
        this.showOtpForm = true;
      }
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.verifyForm.controls || {};
  }

  onSubmit(): void {
    this.submitted = true;
    this.otpError = '';

    const otpValue = this.f['otp']?.value || '';
    
    // Custom validation
    if (!otpValue) {
      this.otpError = 'Please enter the OTP';
      return;
    }

    if (otpValue.length !== 6) {
      this.otpError = 'Please enter exactly 6 digits';
      return;
    }

    if (isNaN(parseInt(otpValue))) {
      this.otpError = 'Please enter only numbers';
      return;
    }

    this.loading = true;
    if (this.email) {
      this.authService.verifyEmailOtp(this.email, otpValue)
        .subscribe(
        (response: any) => {
          if (response.success) {
            localStorage.removeItem('pendingEmail');
            localStorage.removeItem('pendingMobile');
            // Store user and token if present
            if (response.user && response.token) {
              localStorage.setItem('currentUser', JSON.stringify(response.user));
              localStorage.setItem('token', response.token);
            } else {
              // fallback: clear session if missing
              localStorage.removeItem('currentUser');
              localStorage.removeItem('token');
            }
            this.successMessage = 'OTP verified successfully! Redirecting to profile...';
            setTimeout(() => {
              this.router.navigate(['/otp-verified']);
            }, 2000);
          } else {
            this.successMessage = 'OTP verification failed. Please try again.';
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          }
        },
        (error: any) => {
          this.error = error.message || 'Failed to verify OTP';
          this.loading = false;
        }
      );
    } else if (this.mobile) {
      this.authService.verifyMobileOtp(this.mobile, otpValue)
        .subscribe(
          (response: any) => {
            if (response.success) {
              localStorage.removeItem('pendingEmail');
              localStorage.removeItem('pendingMobile');
              // Store user and token if present
              if (response.user && response.token) {
                localStorage.setItem('currentUser', JSON.stringify(response.user));
                localStorage.setItem('token', response.token);
              } else {
                // fallback: clear session if missing
                localStorage.removeItem('currentUser');
                localStorage.removeItem('token');
              }
              this.successMessage = 'OTP verified successfully! Redirecting to profile...';
              setTimeout(() => {
                this.router.navigate(['/otp-verified']);
              }, 2000);
            } else {
              this.successMessage = 'OTP verification failed. Please try again.';
              setTimeout(() => {
                this.successMessage = '';
              }, 3000);
            }
          },
          (error: any) => {
            this.error = error.message || 'Failed to verify OTP';
            this.loading = false;
          }
        );
    } else {
      this.error = 'No email or mobile found for OTP verification.';
      this.loading = false;
    }
  }

  resendOTP(): void {
    if (!this.email) {
      this.error = 'Email not found. Please go back to login.';
      return;
    }

    this.loading = true;
    this.error = '';
    
    this.authService.resendEmailOtp(this.email)
      .subscribe(
        (response: any) => {
          if (response.success) {
            this.successMessage = 'OTP resent successfully!';
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          }
          this.loading = false;
        },
        (error: any) => {
          this.error = error.message || 'Failed to resend OTP';
          this.loading = false;
        }
      );
  }
}
