import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  timeSlot: string;
  duration: string;
  location: string;
  category: string;
  price: number;
  maxRegistrations: number;
  createdBy: string;
  artist?: string;
  organization?: string;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-dashboard.html',
  styleUrls: ['./user-dashboard.scss']
})
export class UserDashboardComponent {
  events: Event[] = [];
 userId: string | null = null;
 userName: string | null = null;
  registeredEvents: Event[] = [];

  // userId = 'mock-user-id'; // Replace with actual user ID after login
  eventsApiUrl = 'http://localhost:5000/api/events';
  registerApiUrl = 'http://localhost:5000/api/events/register'; // Update when actual available

  constructor(private http: HttpClient) {
    this.decodeToken();
    this.loadAllEvents();
    this.loadRegisteredEvents();
  }

  loadAllEvents() {
    this.decodeToken();
    this.http.get<{ data: Event[] }>(this.eventsApiUrl).subscribe({
      next: (res) => {
        this.events = res.data;
      },
      error: (err) => {
        console.error('Error loading events', err);
      }
    });
  }

  decodeToken() {
  const token = localStorage.getItem('token');

  if (!token) {
    console.warn('No token found in localStorage.');
    return;
  }

  try {
    const payloadBase64: string = token.split('.')[1];
    const decodedJson: string = atob(payloadBase64);
    const decodedPayload: { userId?: string, userName?: string } = JSON.parse(decodedJson);

    this.userId = decodedPayload.userId || null;
    this.userName = decodedPayload.userName || null;

    console.log('Organizer ID:', this.userId);
    console.log('User Name:', this.userName);
  } catch (error) {
    console.error('Failed to decode token:', error);
    this.userId = null;
    this.userName = null;
  }
}


  loadRegisteredEvents() {
  this.decodeToken(); // sets this.userId

  if (!this.userId) {
    console.warn('User ID not available after decoding token.');
    return;
  }

  const myRegistrationsApiUrl = `http://localhost:5000/api/events/registered-events/${this.userId}`;

  this.http.get<{ events: Event[] }>(myRegistrationsApiUrl).subscribe({
    next: (res) => {
      this.registeredEvents = res.events;
      console.log('Registered events:', this.registeredEvents);
    },
    error: (err) => {
      console.error('Error loading registered events', err);
    }
  });
}


  registerForEvent(eventId: string) {


    const payload = {
      userId: this.userId,
      eventId: eventId,
    };

    this.http.post(this.registerApiUrl, payload).subscribe({
      next: () => {
        alert('Successfully registered!');
        this.loadRegisteredEvents(); // Refresh
      },
      error: (err) => {
        console.error('Registration failed', err);
        alert('Failed to register for the event.');
      }
    });
  }

  isRegistered(eventId: string): boolean {
    return this.registeredEvents.some(e => e._id === eventId);
  }


  deregister(userId: string, eventId: string) {
  const url = `http://localhost:5000/api/events/deregister`;

  const payload = { userId, eventId };

  this.http.request('delete', url, { body: payload }).subscribe({
    next: () => {
      alert('Successfully deregistered from event.');
      this.loadRegisteredEvents(); // Refresh list
    },
    error: (err) => {
      console.error('Deregistration failed', err);
      alert('Failed to deregister from event.');
    }
  });
}


  logout() {
  // Clear token/session and other relevant data
  localStorage.removeItem('token'); // If you stored JWT here
  localStorage.removeItem('user');    // Optional: if you stored userId separately

  sessionStorage.clear(); // Clear session storage if used

  // Redirect to login page
  alert('You have been logged out.');
  window.location.href = '/'; // Redirect to home or login page
}


}

