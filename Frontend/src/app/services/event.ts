import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Event } from '../components/user-dashboard/user-dashboard';
import { RegisteredUser } from '../components/organizer-dashboard/organizer-dashboard';
import { RegisteredUsersResponse } from '../components/organizer-dashboard/organizer-dashboard';
import  { Location } from '../components/admin-dashboard/admin-dashboard';
import { map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class EventService {

  constructor(private http: HttpClient) {}

  createEvent(data: any) {
    return this.http.post(`${environment.apiBaseUrl}${environment.apis.createEvent}`, data);
  }

   getAllEvents(): Observable<Event[]> {
    const url = `${environment.apiBaseUrl}${environment.apis.getAllEvents}`;
    return this.http.get<{ data: Event[] }>(url).pipe(
      map(res => res.data)
    );
  }


  getEventById(organizerId: string): Observable<Event[]> {
    return this.http.get<{ data: Event[] }>(`${environment.apiBaseUrl}${environment.apis.getEventsByOrganizer(organizerId)}`).pipe(map(res => res.data));
  }

  updateEvent(eventId: string, data: any) {
    return this.http.put(`${environment.apiBaseUrl}${environment.apis.updateEvent(eventId)}`, data);
  }

  deleteEvent(eventId: string) {
    return this.http.delete(`${environment.apiBaseUrl}${environment.apis.deleteEvent(eventId)}`);
  }

  getRegisteredUsers(eventId: string): Observable<{ data: RegisteredUsersResponse }> {
    return this.http.get<{ data: RegisteredUsersResponse }>(`${environment.apiBaseUrl}${environment.apis.getRegisteredUsers(eventId)}`);
  }

  removeUserFromEvent(eventId: string, userId: string) {
    return this.http.delete(`${environment.apiBaseUrl}${environment.apis.removeUserFromEvent(eventId, userId)}`);
  }

  getRegisteredEvents(userId: string): Observable<Event[]> {
  return this.http
    .get<{ events: Event[] }>(`${environment.apiBaseUrl}${environment.apis.registeredEvents(userId)}`)
    .pipe(map(res => res.events));
}

registerForEvent(userId: string, eventId: string): Observable<any> {
  const payload = { userId, eventId };
  const url = `${environment.apiBaseUrl}${environment.apis.registerForEvent}`;
  return this.http.post(url, payload);
}

deregisterFromEvent(userId: string, eventId: string): Observable<any> {
  const url = `${environment.apiBaseUrl}${environment.apis.deregisterForEvent}`;
  const payload = { userId, eventId };

  return this.http.request('delete', url, { body: payload });
}


}
