import { Component , OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SignUpComponent } from '../../auth/sign-up/sign-up.component';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ RouterLink, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  isLoggedIn = false;
  username: string | null = '';
  router: any;
  constructor(private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe((status) => {
      this.isLoggedIn = status;  // ✅ Reactive UI updates
      this.username = localStorage.getItem('username'); // ✅ Ensure username is updated
    });
  }

  onLogoutClick(): void {
    this.authService.logout(); // ✅ Logout logic moved to AuthService
  }
  redirectToGoogle() {
    // This will redirect to the Google URL
    window.location.href = 'https://just4uindia.com/';
  }
}
