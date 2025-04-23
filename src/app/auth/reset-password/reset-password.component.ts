import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterOutlet} from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth/auth.service';
import { CommonAlertComponent } from '../../pages/common-alert/common-alert.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule , RouterLink , CommonModule, CommonAlertComponent ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  token!: string;
  isResendDisabled = true;
  countdown = 5;
  email: string | null = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || null;
    });
  
    this.resetPasswordForm = this.formBuilder.group(
      {
        otp: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  
    this.startCountdown();
  }  

  startCountdown() {
    const interval = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        this.isResendDisabled = false;
        clearInterval(interval);
      }
    }, 1000);
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
  resendOtp() {
    if (!this.email) {
      this.alertModal.show('User email not found!');
      return;
    }
  
    this.isResendDisabled = true;
    this.countdown = 10; 
    this.startCountdown();
  
    this.authService.resendOtp(this.email).subscribe({
      next: (res) => {
        if (res.success) {
          this.alertModal.show('OTP has been resent to your email.');
        } else {
          this.alertModal.show('Failed to resend OTP. Please try again.');
        }
      },
      error: (err) => {
        console.error('Resend OTP Error:', err);
        this.alertModal.show('An error occurred. Please try again.');
      },
    });
  }
  // Corrected password match validator
  passwordMatchValidator(formGroup: FormGroup) {
    const newPassword = formGroup.get('newPassword');
    const confirmPassword = formGroup.get('confirmPassword');
  
    if (confirmPassword?.errors && !confirmPassword.errors['mismatch']) {
      return null; // Return if another validator has already flagged an error
    }
  
    if (newPassword?.value !== confirmPassword?.value) {
      confirmPassword?.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      confirmPassword?.setErrors(null);
      return null;
    }
  }  
  @ViewChild(CommonAlertComponent) alertModal!: CommonAlertComponent;
  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched(); // ✅ Highlights errors
      return;
    }
  
    const { otp, newPassword } = this.resetPasswordForm.value;
  
    const queryParams = {
      token: this.token,
      password: newPassword,
      otp: otp
    };
  
    this.authService.resetPassword(queryParams).subscribe(
      (response: any) => {
        if (response.success) {
          this.alertModal.show(response.message || 'Password reset successfully!');
        
          const modalEl = document.getElementById('commonAlertModal');
          if (modalEl) {
            modalEl.addEventListener('hidden.bs.modal', () => {
              this.authService.saveToken(this.token, response.data);
              this.router.navigate(['/']);
            }, { once: true });
          }
        }
        else {
          this.alertModal.show(response.message);
          if (response.message.includes('Invalid OTP') || response.message.includes('Invalid token')) {
            this.router.navigate(['/forgot-password']);
          }
        }
      },
      (error) => {
        console.error('Error:', error);
        this.alertModal.show('Failed to reset password. Please try again.');
      }
    );
  }    
}
