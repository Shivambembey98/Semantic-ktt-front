import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router , RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { CountryISO, SearchCountryField } from 'ngx-intl-tel-input';
import { CommonAlertComponent } from '../../pages/common-alert/common-alert.component';
@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    RouterLink,
    NgxIntlTelInputModule,
    BsDropdownModule,
    CommonAlertComponent,
  ],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
})
export class SignUpComponent implements OnInit {
  showPassword: boolean = false;

  signUpForm: any = FormGroup;

  name: string = '';
  title: string = '';
  email: string = '';
  login: string = '';
  password: string = '';
  identification: string = '';
  number: string = '';
  emailPattern: any = '[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,}$'; 
  passwordPattern: any =
    '^(?=.*[a-z])(?=.*[A-Z])(?=.*d)(?=.*[@$!%*?&])[A-Za-zd@$!%*?&]{8,}$';
    CountryISO = CountryISO;
    SearchCountryField = SearchCountryField;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  togglePassword() {
    console.log('clicked');

    this.showPassword = !this.showPassword;
  }

  // login() {
  //   // Handle login logic here
  //   console.log('Login form submitted');
  // }

  modalMessage: string = '';

  showAlert(message: string) {
    this.modalMessage = message;

    const modalEl = document.getElementById('commonAlertModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  signup() {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      console.log('Form is invalid');
      this.showAlert('Please fill in all required fields.');
      return;
    }
  
    const formData = { ...this.signUpForm.value };
  
    if (formData.mobileNo && formData.mobileNo.dialCode && formData.mobileNo.number) {
      formData.mobileNo = `${formData.mobileNo.dialCode} ${formData.mobileNo.number}`;
    }
  
    localStorage.setItem('userEmail', formData.emailId);
    console.log('Signup Form submitted:', formData);
  
    this.authService.signUp(formData).subscribe(
      (res) => {
        console.log('Signup Response:', res);
        localStorage.setItem('username', res.username);
        this.router.navigate(['/verify-user-otp']);
      },
      (error) => {
        console.error('Signup Error:', error);
        
        // ✅ Show the first error from the API response if available
        const errorMessage = error?.error?.errors?.[0] || 'Signup failed. Please try again later.';
        this.showAlert(errorMessage);
      }
    );
  }
     

  ngOnInit(): void {
    this.signUpForm = this.formBuilder.group({
      title: ['', Validators.required],
      firstName: ['', Validators.required],
      login: ['', Validators.required],
      emailId: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      mobileNo: [null, Validators.required], // Keep as an object initially
      identification: ['', Validators.required],
      companyCode: ['Bellblaze', Validators.required],
    });
  }  
}
