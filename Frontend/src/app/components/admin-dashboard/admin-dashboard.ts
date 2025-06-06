import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Event {
  _id: string;
  title: string;
  createdBy: string;
  date: string;
  location: string;
}

interface RegisteredUser {
  userId: string;
  name: string;
  email: string;
  _id : string;
}

interface Location {
  _id?: string;
  state: string;
  city: string;
  placeName: string;
  address: string;
  maxSeatingCapacity: number;
  amenities: string[];
  createdBy?: string;
}
interface RegisteredUsersResponse {
  users: RegisteredUser[];
  currentRegistration: number;
}




@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss']
})
export class AdminDashboardComponent {
  events: Event[] = [];
  usersMap: { [eventId: string]: RegisteredUsersResponse } = {};

  baseEventUrl = 'http://localhost:5000/api/events';
  baseRegistrationUrl = 'http://localhost:5000/api/events/registered-users';
  removeUser = 'http://localhost:5000/api/events/removeuser';
  baseLocationUrl = 'http://localhost:5000/api/locations';


  showLocationForm = false;
  locations: Location[] = [];

  newLocation: Location = {
    state: '',
    city: '',
    placeName: '',
    address: '',
    maxSeatingCapacity: 0,
    amenities: []
  };

  statesAndcitys: { [key: string]: string[] } = {
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belagavi"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
    "Rajasthan": ["Jaipur", "Udaipur", "Jodhpur", "Ajmer", "Kota"],
    "Delhi": ["New Delhi", "Central Delhi", "North Delhi", "South Delhi"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Noida"]
  };

  availablecitys: string[] = [];

  amenities: string[] = ['Wi-Fi', 'AC', 'Parking', 'Projector', 'Water Supply' , 'Microphone' , 'Speaker'];

  constructor(private http: HttpClient) {
    this.loadEvents();
    this.loadLocations();
  }

  loadEvents() {
    this.http.get<{ data: Event[] }>(this.baseEventUrl).subscribe({
      next: res => {
        this.events = res.data;
        res.data.forEach(event => this.loadRegisteredUsers(event._id));
      },
      error: err => console.error('Error loading events', err)
    });
  }

  loadRegisteredUsers(eventId: string) {
  this.http.get<{ data: RegisteredUsersResponse }>(`${this.baseRegistrationUrl}/${eventId}`).subscribe({
    next: res => {
      this.usersMap[eventId] = res.data;
      console.log(`Loaded users for event ${eventId}`, res.data);
    },
    error: err => console.error('Error loading users for event', err)
  });
}


  deleteEvent(eventId: string) {
    if (confirm('Are you sure you want to delete this event?')) {
      this.http.delete(`${this.baseEventUrl}/${eventId}`).subscribe({
        next: () => {
          alert('Event deleted successfully');
          this.loadEvents();
        },
        error: err => {
          console.error('Error deleting event', err);
          alert('Failed to delete event');
        }
      });
    }
  }

  removeUserFromEvent(eventId: string, _id: string) {
    if (confirm('Remove user from event?')) {
      this.http.delete(`${this.removeUser}/${eventId}/users/${_id}`).subscribe({
        next: () => {
          alert('User removed successfully');
          this.loadRegisteredUsers(eventId);
        },
        error: err => {
          console.error('Error removing user', err);
          alert('Failed to remove user');
        }
      });
    }
  }

  showUsersDropdown: Record<string, boolean> = {};

toggleUsersDropdown(eventId: string) {
  this.showUsersDropdown[eventId] = !this.showUsersDropdown[eventId];
}


  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    alert('You have been logged out.');
    window.location.href = '/login';
  }

  // ========= Location Section Methods =========

  toggleLocationForm() {
    this.showLocationForm = !this.showLocationForm;
  }

  onStateChange() {
    this.availablecitys = this.statesAndcitys[this.newLocation.state] || [];
  }
  getStates(): string[] {
  return this.statesAndcitys ? Object.keys(this.statesAndcitys) : [];
}


  toggleAmenity(amenity: string, event: any) {
  const target = event.target as HTMLInputElement;  // cast event.target properly
  if (target.checked) {
    if (!this.newLocation.amenities.includes(amenity)) {
      this.newLocation.amenities.push(amenity);
    }
  } else {
    this.newLocation.amenities = this.newLocation.amenities.filter(a => a !== amenity);
  }
}


  addLocation(locationData: Location) {
    this.http.post<{ data: Location }>(this.baseLocationUrl, locationData).subscribe({
      next: res => {
        alert('Location added successfully!');
        this.loadLocations();
        this.showLocationForm = false;
        this.resetForm();
      },
      error: err => {
        console.error('Error adding location', err);
        alert('Failed to add location');
      }
    });
  }

  loadLocations() {
    this.http.get<{ data: Location[] }>(this.baseLocationUrl).subscribe({
      next: res => {
        this.locations = res.data;
      },
      error: err => {
        console.error('Error loading locations', err);
      }
    });
  }

  resetForm() {
    this.newLocation = {
      state: '',
      city: '',
      placeName: '',
      address: '',
      maxSeatingCapacity: 0,
      amenities: []
    };
    this.availablecitys = [];
  }
}


