import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegisterComponent } from './auth/register/register.component';
import { VerifyOtpComponent } from './auth/verify-otp/verify-otp.component';
import { LoginComponent } from './auth/login/login.component';
import { ProfileViewComponent } from './user/profile-view/profile-view.component';
import { ProfileEditComponent } from './user/profile-edit/profile-edit.component';
import { AuthGuard } from './guards/auth.guard';
import { LandingComponent } from './landing/landing.component';
import { OtpSuccessComponent } from './otp-success/otp-success.component';

import { OtpVerifiedComponent } from './otp-verified/otp-verified.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify-otp', component: VerifyOtpComponent },
  { path: 'login', component: LoginComponent },

  { path: 'otp-success', component: OtpSuccessComponent },
  { path: 'otp-verified', component: OtpVerifiedComponent },
  { 
    path: 'profile', 
    component: ProfileViewComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'profile/edit', 
    component: ProfileEditComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
