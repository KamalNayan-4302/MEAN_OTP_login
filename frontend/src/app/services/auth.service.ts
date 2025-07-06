import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(
    private http: HttpClient
  ) {
    this.currentUserSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('currentUser') || '{}'));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  login(payload: any) {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, payload, {
      headers: { 'Content-Type': 'application/json' }
    })
      .pipe(
        map(response => {
          if (response.success && response.token) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
          }
          return response;
        }),
        catchError((error: any) => {
          return throwError(error);
        })
      );
  }

  loginWithMobile(mobile: string, password: string) {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, { mobile, password })
      .pipe(
        map(response => {
          if (response.success && response.token) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
          }
          return response;
        }),
        catchError((error: any) => {
          return throwError(error);
        })
      );
  }

  loginOtp(email: string) {
    return this.http.post<any>(`${environment.apiUrl}/auth/login-otp`, { email })
      .pipe(
        map(response => response),
        catchError((error: any) => throwError(error))
      );
  }

  loginOtpMobile(mobile: string) {
    return this.http.post<any>(`${environment.apiUrl}/auth/login-otp`, { mobile })
      .pipe(
        map(response => response),
        catchError((error: any) => throwError(error))
      );
  }

  // Combined OTP verification for login
  verifyEmailOtp(email: string, otp: string) {
    return this.http.post<any>(`${environment.apiUrl}/auth/verify-otp`, { email, otp })
      .pipe(
        map(response => response),
        catchError((error: any) => throwError(error))
      );
  }

  verifyMobileOtp(mobile: string, otp: string) {
    return this.http.post<any>(`${environment.apiUrl}/auth/verify-otp`, { mobile, otp })
      .pipe(
        map(response => response),
        catchError((error: any) => throwError(error))
      );
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next({});
  }

  get userProfilePhoto(): string | null {
    return this.currentUserValue && this.currentUserValue.profilePhoto ? this.currentUserValue.profilePhoto : null;
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('currentUser');
    return !!token && !!user;
  }

  register(formData: FormData) {
    return this.http.post<any>(`${environment.apiUrl}/user/register`, formData, {
      reportProgress: true,
      observe: 'events'
    })
      .pipe(
        map(response => response),
        catchError((error: any) => throwError(error))
      );
  }

  completeRegistration(mobile: string, otp: string) {
    return this.http.post<any>(`${environment.apiUrl}/auth/complete-registration`, { mobile, otp })
      .pipe(
        map(response => {
          if (response.success) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
            return response;
          }
          return throwError(new Error(response.message || 'Registration completion failed'));
        }),
        catchError(error => {
          console.error('Registration completion error:', error);
          return throwError(error.error?.message || 'An error occurred during registration completion');
        })
      );
  }



  resendEmailOtp(email: string) {
    return this.http.post<any>(`${environment.apiUrl}/auth/login-otp`, { email })
      .pipe(
        map(response => response),
        catchError((error: any) => throwError(error))
      );
  }
}
