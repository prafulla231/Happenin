import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient } from '@angular/common/http';
import { Event } from '../components/organizer-dashboard/organizer-dashboard';
import { RegisteredUser } from '../components/organizer-dashboard/organizer-dashboard';
import { RegisteredUsersResponse } from '../components/organizer-dashboard/organizer-dashboard';
import  { Location } from '../components/admin-dashboard/admin-dashboard';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {}

  registerUser(data: any) {
    return this.http.post(`${environment.apiBaseUrl}${environment.apis.registerUser}`, data);
  }

  loginUser(data: any) {
    return this.http.post(`${environment.apiBaseUrl}${environment.apis.loginUser}`, data);
  }

  getProtected() {
    return this.http.get(`${environment.apiBaseUrl}/users/protected`);
  }
}
