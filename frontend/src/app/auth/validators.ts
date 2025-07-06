import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function mobileValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.toString();
    if (!value) {
      return null;
    }

    // Remove any whitespace
    const cleanedValue = value.replace(/\s/g, '');
    
    // Check if it's exactly 10 digits
    if (cleanedValue.length !== 10 || !/^[0-9]*$/.test(cleanedValue)) {
      return { mobileInvalid: true };
    }

    return null;
  };
}
