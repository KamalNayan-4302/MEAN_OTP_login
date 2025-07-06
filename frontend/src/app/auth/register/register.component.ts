import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { mobileValidator } from '../validators';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  error = '';
  success = '';
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.registerForm = this.formBuilder.group({
      'name': ['', Validators.required],
      'email': ['', [Validators.required, Validators.email]],
      'mobile': ['', [Validators.required, mobileValidator()]],
      'password': ['', [Validators.required, Validators.minLength(6)]],
      'confirmPassword': ['', Validators.required],
      'photo': [''] // profile photo is optional
    }, { validators: this.passwordsMatchValidator });
    // Listen for file input changes to convert to base64
    this.registerForm.get('photo')?.valueChanges.subscribe(file => {
      if (file && file instanceof File) {
        this.convertFileToBase64(file);
      }
    });

    this.registerForm.valueChanges.subscribe(() => {
      this.error = '';
      this.submitted = false;
    });
  }

  ngOnInit() {}

  get f(): { [key: string]: AbstractControl } {
    return this.registerForm.controls || {};
  }

  passwordsMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      form.get('confirmPassword')?.setErrors(null);
    }
    return null;
  }

  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.status === 500) {
      return 'Server error occurred. Please try again later.';
    }
    if (error.status === 400) {
      return 'Invalid request. Please check your email.';
    }
    return 'An unexpected error occurred. Please try again.';
  }

  profilePhotoBase64: string = '';                            

  convertFileToBase64(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.profilePhotoBase64 = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.convertFileToBase64(file);
      this.registerForm.patchValue({ photo: file });
    }
  }

  onSubmit() {
    this.submitted = true;

    if (this.registerForm.invalid) {
      this.error = 'Please fill in all required fields correctly.';
      return;
    }

    // Send FormData to match backend expectations
    const formData = new FormData();
    formData.append('name', this.f['name'].value);
    formData.append('email', this.f['email'].value);
    formData.append('mobile', this.f['mobile'].value);
    formData.append('password', this.f['password'].value);
    const fileInput = this.registerForm.get('photo')?.value;
    if (fileInput && fileInput instanceof File) {
      formData.append('photo', fileInput);
    }
    this.loading = true;
    (async () => {
      try {
        const response = await this.authService.register(formData).toPromise();
        console.log('Registration response:', response);
        this.error = '';
        this.success = 'Registration successful! Please verify your email.';
        localStorage.setItem('pendingEmail', this.f['email'].value);
        localStorage.setItem('pendingMobile', this.f['mobile'].value);
        this.registerForm.reset();
        setTimeout(() => {
          this.router.navigate(['/verify-otp']);
        }, 1200);
      } catch (error) {
        console.error('Registration error:', error);
        this.success = '';
        this.error = this.getErrorMessage(error);
        this.loading = false;
      }
    })();
  }
}
