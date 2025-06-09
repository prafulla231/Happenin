import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient } from '@angular/common/http';
import { Event } from '../components/organizer-dashboard/organizer-dashboard';
import { RegisteredUser } from '../components/organizer-dashboard/organizer-dashboard';
import { RegisteredUsersResponse } from '../components/organizer-dashboard/organizer-dashboard';
import  { Location } from '../components/admin-dashboard/admin-dashboard';
import  { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ApprovalService {

  constructor(private http: HttpClient) {}

  approveEvent(data: any) {
    return this.http.post(`${environment.apiBaseUrl}${environment.apis.approveEvent}`, data);
  }

  denyEvent(eventId: string) {
    return this.http.delete(`${environment.apiBaseUrl}${environment.apis.denyEvent(eventId)}`);
  }

  viewApprovalRequests(): Observable<{ data: Event[] }> {
    const url = `${environment.apiBaseUrl}${environment.apis.viewApprovalRequests}`;
    return this.http.get<{ data: Event[] }>(url);
  }


  viewApprovalRequestById(requestId: string) {
    return this.http.get(`${environment.apiBaseUrl}${environment.apis.viewApprovalRequestById(requestId)}`);
  }
}
