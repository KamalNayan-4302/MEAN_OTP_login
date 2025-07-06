import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegisterComponent } from './auth/register/register.component';
import { VerifyOtpComponent } from './auth/verify-otp/verify-otp.component';
import { LoginComponent } from './auth/login/login.component';
import { ProfileViewComponent } from './user/profile-view/profile-view.component';
import { ProfileEditComponent } from './user/profile-edit/profile-edit.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { SharedModule } from './shared/shared.module';
import { LandingComponent } from './landing/landing.component';
import { OtpSuccessComponent } from './otp-success/otp-success.component';

import { OtpVerifiedComponent } from './otp-verified/otp-verified.component';
import { LoginSuccessModule } from './login-success.module';

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    VerifyOtpComponent,
    LoginComponent,
    ProfileViewComponent,
    ProfileEditComponent,
    LandingComponent,
    OtpSuccessComponent,

    OtpVerifiedComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    SharedModule,
    LoginSuccessModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
