import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
          import('./pages/layout/layout.component').then((c) => c.LayoutComponent),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/landing/landing.component').then(
                (c) => c.LandingComponent
              ),
          },
          {
            path: 'sign-up',
            loadComponent: () =>
              import('./auth/sign-up/sign-up.component').then(
                (c) => c.SignUpComponent
              ),
          },
          {
            path: 'verify-user-otp',
            loadComponent: () =>
              import('./auth/verify-user-otp/verify-user-otp.component').then(
                (c) => c.VerifyUserOtpComponent
              ),
          },
          {
            path: 'forgot-password',
            loadComponent: () =>
              import('./auth/forgot-password/forgot-password.component').then(
                (c) => c.ForgotPasswordComponent
              ),
          },
          {
            path: 'reset-password',
            loadComponent: () =>
              import('./auth/reset-password/reset-password.component').then(
                (c) => c.ResetPasswordComponent
              ),
          },
          {
            path: 'login',
            loadComponent: () =>
              import('./auth/login/login.component').then((c) => c.LoginComponent),
          },
          {
            path: 'search-form',
            loadComponent: () =>
              import('./feature/search-form/search-form.component').then(
                (c) => c.SearchFormComponent
              ),
          },
          {
            path: 'flight-search',
            loadComponent: () =>
              import('./feature/flight-search/flight-search.component').then(
                (c) => c.FlightSearchComponent
              ),
          },
          {
            path: 'flight-details',
            loadComponent: () =>
              import('./feature/flight-details/flight-details.component').then(
                (c) => c.FlightDetailsComponent
              ),
          },
          {
            path: 'flight-confirm',
            loadComponent: () =>
              import('./feature/flight-confirm/flight-confirm.component').then(
                (c) => c.FlightConfirmComponent
              ),
          },
        ],
    },
];
