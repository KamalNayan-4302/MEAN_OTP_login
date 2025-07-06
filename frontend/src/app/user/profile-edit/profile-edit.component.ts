import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.scss']
})
export class ProfileEditComponent implements OnInit {
  // ...existing properties...

  selectedPhotoFile: File | null = null;

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedPhotoFile = input.files[0];
    } else {
      this.selectedPhotoFile = null;
    }
  }
  editForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  profile: any;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private userService: UserService
  ) {
    this.editForm = this.formBuilder.group({
      'name': ['', Validators.required],
      'email': ['', [Validators.required, Validators.email]]
    });
  }

  get formControls() {
    return this.editForm.controls;
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.userService.getProfile().subscribe(
      (response: any) => {
        this.profile = response;
        this.editForm.patchValue({
          name: response.name,
          email: response.email
        });
      },
      (error: any) => {
        this.error = error.message;
      }
    );
  }

  get f() { return this.editForm.controls; }

  onSubmit(): void {
    this.submitted = true;

    if (this.editForm.invalid) {
      return;
    }

    this.loading = true;
    const formData = new FormData();
    formData.append('name', this.editForm.get('name')?.value || '');
    formData.append('email', this.editForm.get('email')?.value || '');
    if (this.selectedPhotoFile) {
      formData.append('photo', this.selectedPhotoFile);
    }

    this.userService.updateProfile(
      this.editForm.get('name')?.value || '',
      this.editForm.get('email')?.value || '',
      this.selectedPhotoFile || undefined
    ).subscribe(
      (response: any) => {
        this.router.navigate(['/profile']);
      },
      (error: any) => {
        this.error = error.message;
        this.loading = false;
      }
    );
  }
}
