import { Component, OnInit , ViewChild} from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { FormBuilder, FormsModule, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonAlertComponent } from '../../pages/common-alert/common-alert.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    CommonAlertComponent,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'], // Fixed typo
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  submitted = false; // Corrected type and initialization
  email: string | null = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router // Added Router for navigation
  ) {}

  ngOnInit(): void {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]], // Email validator added
      companyCode: ['Bellblaze', Validators.required],
    });
  }
  modalMessage: string = '';

  showAlert(message: string) {
    this.modalMessage = message;

    const modalEl = document.getElementById('commonAlertModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }
  @ViewChild(CommonAlertComponent) alertModal!: CommonAlertComponent;
  onSubmit(): void {
    this.submitted = true;
  
    if (this.forgotPasswordForm.valid) {
      const formData = new FormData();
      formData.append('email', this.forgotPasswordForm.value.email);
      formData.append('companyCode', this.forgotPasswordForm.value.companyCode);
  
      this.authService.forgotPassword(formData).subscribe(
        (response: any) => {
          const message = response?.message || 'OTP sent successfully';
          if (response && response.token) {
            const sub = this.alertModal.closed.subscribe(() => {
              this.router.navigate(['/reset-password'], {
                queryParams: {
                  token: response.token,
                  email: this.forgotPasswordForm.value.email
                }
              });
              sub.unsubscribe();
            });
  
            this.alertModal.show(message);
          } else {
            this.alertModal.show('Token not received. Please try again.');
          }
        },
        (error) => {
          console.error('Error:', error);
  
          // Show exact error message from API if available
          const apiError = error?.error?.message || error?.error?.errors?.[0];
          const errorMessage = apiError || 'Something went wrong. Please try again.';
          this.alertModal.show(errorMessage);
        }
      );
    }
  }       

  goBack(): void {
    this.router.navigate(['/login']);
  }
}
