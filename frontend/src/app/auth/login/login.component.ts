import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { mobileValidator } from '../validators';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';
  loginType: 'email' | 'mobile' = 'email';
  otpMode = false;
  otpSent = false;

  setLoginType(type: 'email' | 'mobile') {
    this.loginType = type;
    this.error = '';
    this.submitted = false;
    this.otpSent = false;
    this.loginForm.reset({ password: '', otp: '' });
  }

  toggleOtpMode(event: Event) {
    this.otpMode = (event.target as HTMLInputElement).checked;
    this.otpSent = false;
    this.error = '';
    this.loginForm.reset({ password: '', otp: '' });
  }

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', []],
      password: ['', [Validators.required, Validators.minLength(6)]],
      otp: ['']
    });
  }

  ngOnInit() {
    // Redirect to profile if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/profile']);
    }
  }

  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted = true;

    // Validate according to login type
    if (this.loginType === 'email') {
      this.f['email'].setValidators([Validators.required, Validators.email]);
      this.f['mobile'].setValidators([]);
      this.f['email'].updateValueAndValidity();
      this.f['mobile'].updateValueAndValidity();
      if (this.f['email'].invalid || this.f['password'].invalid) {
        return;
      }
    } else {
      this.f['mobile'].setValidators([Validators.required, mobileValidator()]);
      this.f['email'].setValidators([]);
      this.f['mobile'].updateValueAndValidity();
      this.f['email'].updateValueAndValidity();
      if (this.f['mobile'].invalid || this.f['password'].invalid) {
        return;
      }
    }

    this.loading = true;

    let payload: any = {};
    if (this.loginType === 'email') {
      payload = {
        email: this.f['email'].value,
        password: this.f['password'].value
      };
    } else {
      payload = {
        mobile: this.f['mobile'].value,
        password: this.f['password'].value
      };
    }
    this.authService.login(payload).toPromise()
      .then((response: any) => {
        if (response && response.user && response.token) {
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          localStorage.setItem('token', response.token);
        }
        this.error = '';
        this.success = '';
        this.loginForm.reset();
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 400);
      })
      .catch((error: any) => {
        this.error = error?.error?.message || 'Login failed.';
        this.loading = false;
      });
  }

  loginWithOtp(type: 'email' | 'mobile') {
    this.error = '';
    if (type === 'email') {
      const email = (this.f['email'].value || '').trim();
      if (!email || this.f['email'].invalid) {
        this.error = 'Please enter a valid email address to receive OTP.';
        return;
      }
      this.loading = true;
      this.authService.loginOtp(email)
        .subscribe(
          (response: any) => {
            this.otpSent = true;
            this.loading = false;
          },
          (error: any) => {
            this.error = error.error?.message || 'Failed to send OTP.';
            this.loading = false;
          }
        );
    } else {
      const mobile = (this.f['mobile'].value || '').trim();
      if (!mobile || this.f['mobile'].invalid) {
        this.error = 'Please enter a valid mobile number to receive OTP.';
        return;
      }
      this.loading = true;
      this.authService.loginOtpMobile(mobile)
        .subscribe(
          (response: any) => {
            this.otpSent = true;
            this.loading = false;
          },
          (error: any) => {
            this.error = error.error?.message || 'Failed to send OTP.';
            this.loading = false;
          }
        );
    }
  }

  verifyOtp() {
    this.error = '';
    const otp = (this.f['otp'].value || '').trim();
    if (!otp) {
      this.error = 'Please enter the OTP.';
      return;
    }
    this.loading = true;
    if (this.loginType === 'email') {
      const email = (this.f['email'].value || '').trim();
      (async () => {
        try {
          const response = await this.authService.verifyEmailOtp(email, otp).toPromise();
          this.error = '';
          this.success = 'Login successful!';
          this.loginForm.reset();
          this.loading = false;
          setTimeout(() => { this.router.navigate(['/']); }, 1200);
        } catch (error) {
          this.error = (error as any)?.error?.message || 'Invalid OTP.';
          this.loading = false;
        }
      })();
    } else {
      const mobile = (this.f['mobile'].value || '').trim();
      (async () => {
        try {
          const response = await this.authService.verifyMobileOtp(mobile, otp).toPromise();
          this.error = '';
          this.success = 'Login successful!';
          this.loginForm.reset();
          this.loading = false;
          setTimeout(() => { this.router.navigate(['/']); }, 1200);
        } catch (error) {
          this.error = (error as any)?.error?.message || 'Invalid OTP.';
          this.loading = false;
        }
      })();
    }
  }
}
