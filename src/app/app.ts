import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { UserRegistration } from './user-registration.model';

function dateOfBirthValidator(maxDate: string): ValidatorFn {
  return (control) => {
    const value = String(control.value ?? '');
    if (!value) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { dateFormat: true };

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return { calendarDate: true };
    }
    return value > maxDate ? { future: true } : null;
  };
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly maxBirthDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
  readonly users: UserRegistration[] = [
    new UserRegistration('daranporn@gmail.com', 'yjdf1716', 'Sira', 'Weerakittana', '0891234567', '2012-05-26'),
    new UserRegistration('boonpoj@gmail.com', 'mmjt9876', 'Rosanan', 'Suvanabhumiwong', '0641825563', '2011-10-17'),
    new UserRegistration('bodin_thai@gmail.com', 'mmyb4577', 'Tankwan', 'Srisuk', '0986345661', '2007-04-29'),
  ];

  readonly registrationForm = new FormGroup({
    userEmail: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    userPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(15), Validators.pattern(/^[a-zA-Z0-9]+$/)],
    }),
    userFirstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    userLastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    userTel: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d+$/)],
    }),
    dateOfBirth: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, dateOfBirthValidator(this.maxBirthDate)],
    }),
  });

  notice: { type: 'success' | 'danger'; status: number; message: string } | null = null;
  attempted = false;

  get form() {
    return this.registrationForm.controls;
  }

  get dateErrorMessage(): string {
    const errors = this.form.dateOfBirth.errors;
    if (errors?.['required']) return 'Date of birth is required.';
    if (errors?.['dateFormat']) return 'Use YYYY-MM-DD format, for example 2012-05-26.';
    if (errors?.['calendarDate']) return 'Enter a valid calendar date.';
    if (errors?.['future']) return 'Date of birth cannot be in the future.';
    return 'Enter a valid date of birth.';
  }

  hasError(name: keyof App['registrationForm']['controls']): boolean {
    const control = this.registrationForm.controls[name];
    return control.invalid && (control.touched || this.attempted);
  }

  register(): void {
    this.attempted = true;
    this.notice = null;
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      if (this.form.userTel.errors?.['pattern']) {
        this.notice = { type: 'danger', status: 400, message: 'Phone number must contain digits only.' };
      }
      return;
    }

    const value = this.registrationForm.getRawValue();
    if (this.users.some((user) => user.userEmail.toLowerCase() === value.userEmail.toLowerCase())) {
      this.notice = { type: 'danger', status: 422, message: 'This email address is already registered.' };
      return;
    }

    try {
      const user = new UserRegistration(
        value.userEmail.trim(),
        value.userPassword,
        value.userFirstName.trim(),
        value.userLastName.trim(),
        value.userTel,
        value.dateOfBirth,
      );
      user.getAge();
      this.users.unshift(user);
      this.notice = { type: 'success', status: 201, message: 'Your account has been registered successfully.' };
      this.registrationForm.reset();
      this.attempted = false;
    } catch {
      this.notice = { type: 'danger', status: 500, message: 'Something went wrong on the server. Please try again.' };
    }
  }

  dismissNotice(): void {
    this.notice = null;
  }
}
