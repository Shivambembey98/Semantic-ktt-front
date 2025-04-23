import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { development_environment } from '../../../environments/environment';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private url = development_environment.authUrl;
  private tokenKey = 'auth-token'; // Token storage key
  private isLoggedInSubject = new BehaviorSubject<boolean>(
    !!localStorage.getItem('token')
  );
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private httpClient: HttpClient, private router: Router) {}

  // SignUp method
  signUp(data: any): Observable<any> {
    return this.httpClient.post(`${this.url}/api/v1/auth/signup`, data);
  }

  verifyOtp(params: any): Observable<any> {
    const queryString = new HttpParams({ fromObject: params }).toString();

    return this.httpClient.post(
      `${this.url}/api/v1/auth/validate-otp?${queryString}`,
      null // No body and no headers needed here
    );
  }

  // Login method
  login(credentials: any): Observable<any> {
    return this.httpClient
      .post(`${this.url}/api/v1/auth/signin`, credentials)
      .pipe(
        tap((response: any) => {
          const token = response.token; // Assuming the backend response contains token
          if (token) {
            this.saveToken(response.token, response.username); // ✅ Corrected to 'response'
            this.isLoggedInSubject.next(true); // ✅ Corrected placement for clarity
          }
        })
      );
  }

  saveToken(token: string, username: string): void {
    localStorage.setItem('token', token); // ✅ Save token
    localStorage.setItem('username', username); // ✅ Save username
    this.isLoggedInSubject.next(true);
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    this.isLoggedInSubject.next(false); // ✅ Update state on logout
  }

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Check if user is logged in by token presence
  private hasToken(): boolean {
    return !!this.getToken(); // Check if token exists in localStorage
  }

  // Make an authenticated GET request
  getWithAuth(endpoint: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.httpClient.get<any>(`${this.url}${endpoint}`, { headers });
  }

  // Forgot password method
  forgotPassword(formData: FormData): Observable<any> {
    return this.httpClient.post<any>(
      `${this.url}/api/v1/auth/forgot-password`,
      formData
    );
  }

  resendOtp(email: string): Observable<any> {
    return this.httpClient.post<any>(
      `${this.url}/api/v1/auth/resend-otp?email=${encodeURIComponent(email)}`,
      {} // Sending an empty object since POST usually expects a body
    );
  }  

  resetPassword(params: any): Observable<any> {
    const queryParams = new HttpParams({ fromObject: params });
  
    return this.httpClient.put(`${this.url}/api/v1/auth/reset-password`, null, {
      params: queryParams,
      observe: 'response', // ✅ Ensures we get the full HTTP response
    }).pipe(
      map((response: HttpResponse<any>) => response.body) // ✅ Extract response body
    );
  }    
}
