import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CommonAlertComponent } from '../../pages/common-alert/common-alert.component';
@Component({
  selector: 'app-verify-user-otp',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonAlertComponent],
  templateUrl: './verify-user-otp.component.html',
  styleUrl: './verify-user-otp.component.css',
})
export class VerifyUserOtpComponent implements OnInit {
  otpForm: any = FormGroup;
  isResendDisabled = true;
  countdown = 30;
  email: string | null = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.email = localStorage.getItem('userEmail'); // Fetch email from localStorage
    this.startCountdown();
    this.otpForm = this.formBuilder.group({
      otp: ['', [Validators.required, Validators.minLength(4)]],
    });
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
      this.showAlert('User email not found!');
      return;
    }
  
    this.isResendDisabled = true;
    this.countdown = 30; 
    this.startCountdown();
  
    this.authService.resendOtp(this.email).subscribe({
      next: (res) => {
        const message = res?.message || 'OTP has been resent to your email.';
        this.showAlert(message);
      },
      error: (err) => {
        console.error('Resend OTP Error:', err);
        const errorMessage =
          err?.error?.message || err?.error?.errors?.[0] || 'An error occurred. Please try again.';
        this.showAlert(errorMessage);
      },
    });
  }   

  verifyOtp(): void {
    if (this.otpForm.valid) {
      const otpData = {
        email: this.email,
        companyCode: 'Bellblaze',
        otp: this.otpForm.value.otp,
      };
  
      this.authService.verifyOtp(otpData).subscribe({
        next: (res) => {
          if (res.success) {
            const storedUsername = localStorage.getItem('username');
            this.authService.saveToken(res.token, storedUsername || 'Unknown User');
            const message = res?.message || 'OTP Verified Successfully!';
            this.showAlert(message);
            this.router.navigate(['/']);
          } else {
            const failMessage = res?.message || 'Invalid OTP. Please try again.';
            this.showAlert(failMessage);
          }
        },
        error: (err) => {
          console.error('OTP Verification Error:', err);
          const errorMessage =
            err?.error?.message || err?.error?.errors?.[0] || 'An error occurred. Please try again later.';
          this.showAlert(errorMessage);
        },
      });
    } else {
      console.log('Form is invalid');
    }
  }  
}
