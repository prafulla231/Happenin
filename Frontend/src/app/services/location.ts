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
export class LocationService {

   constructor(private http: HttpClient) {}

  fetchLocations() {
    return this.http.get(`${environment.apiBaseUrl}${environment.apis.fetchLocations}`);
  }

  addLocation(data: any) {
    return this.http.post(`${environment.apiBaseUrl}${environment.apis.addLocation}`, data);
  }

  bookLocation(data: any) {
    return this.http.post(`${environment.apiBaseUrl}/${environment.apis.bookLocation}`, data); // not defined in environment — consider adding
  }

  cancelBooking(data: any) {
    return this.http.post(`${environment.apiBaseUrl}/${environment.apis.cancelBooking}`, data); // not defined in environment
  }
}
