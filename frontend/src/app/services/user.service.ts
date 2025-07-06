import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    const token = localStorage.getItem('token');
    return this.http.get(`${environment.apiUrl}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  updateProfile(name: string, email: string, photo?: File): Observable<any> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    if (photo) {
      formData.append('photo', photo);
    }
    return this.http.put(`${environment.apiUrl}/user/profile`, formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}
