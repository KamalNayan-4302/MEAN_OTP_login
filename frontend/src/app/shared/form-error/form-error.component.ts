import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-form-error',
  template: `
    <div *ngIf="control?.touched && control?.invalid" class="error">
      <ng-container *ngIf="control?.errors">
        <div *ngIf="control?.errors?.['required']">This field is required</div>
        <div *ngIf="control?.errors?.['email']">Please enter a valid email</div>
        <div *ngIf="control?.errors?.['mobileInvalid']">Please enter a valid 10-digit mobile number</div>
      </ng-container>
    </div>
  `
})
export class FormErrorComponent {
  @Input() control: AbstractControl | null = null;
}
