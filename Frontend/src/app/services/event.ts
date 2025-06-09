import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Event } from '../components/organizer-dashboard/organizer-dashboard';
import { RegisteredUser } from '../components/organizer-dashboard/organizer-dashboard';
import { RegisteredUsersResponse } from '../components/organizer-dashboard/organizer-dashboard';
import  { Location } from '../components/admin-dashboard/admin-dashboard';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  constructor(private http: HttpClient) {}

  createEvent(data: any) {
    return this.http.post(`${environment.apiBaseUrl}${environment.apis.createEvent}`, data);
  }

  getAllEvents() {
  return this.http.get(`${environment.apiBaseUrl}${environment.apis.getAllEvents}`);
}


  getEventById(organizerId: string) {
    return this.http.get(`${environment.apiBaseUrl}${environment.apis.getEventsByOrganizer(organizerId)}`);
  }

  updateEvent(eventId: string, data: any) {
    return this.http.put(`${environment.apiBaseUrl}${environment.apis.updateEvent(eventId)}`, data);
  }

  deleteEvent(eventId: string) {
    return this.http.delete(`${environment.apiBaseUrl}${environment.apis.deleteEvent(eventId)}`);
  }

  getRegisteredUsers(eventId: string) {
    return this.http.get(`${environment.apiBaseUrl}${environment.apis.getRegisteredUsers(eventId)}`);
  }

  removeUserFromEvent(eventId: string, userId: string) {
    return this.http.delete(`${environment.apiBaseUrl}${environment.apis.removeUserFromEvent(eventId, userId)}`);
  }
}
