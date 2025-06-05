import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormsModule } from '@angular/forms';
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
  selector: 'app-organizer-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './organizer-dashboard.html',
  styleUrls: ['./organizer-dashboard.scss'],
})
export class OrganizerDashboardComponent {
  showCreateForm = false;
  isEditMode = false;
  posterFile: File | null = null;          // For storing the selected file
  uploadedPosterUrl: string | null = null; // For storing the Cloudinary URL
  events: Event[] = [];
  currentEditEventId: string | null = null;
  organizerId: string | null = null;
  isLoading = false;  // For optional loading state

  createApiUrl = 'http://localhost:5000/api/events';
  baseApiUrl = 'http://localhost:5000/api/events';

  eventForm: FormGroup;

  // --- New properties for locations ---
  locations: any[] = [];
  filteredStates: string[] = [];
  filteredDistricts: string[] = [];
  filteredPlaceNames: string[] = [];

  selectedState: string = '';
  selectedDistrict: string = '';

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      date: ['', Validators.required],
      timeSlot: [''],
      duration: [''],
      location: [''],
      category: [''],
      price: [0, Validators.min(0)],
      maxRegistrations: [1, [Validators.required, Validators.min(1)]],
      artist: [''],
      organization: [''],
    });

    console.log("Hi");

    this.decodeToken();
    this.loadEvents();
    this.fetchLocations(); // fetch locations on component init
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
      const decodedPayload: { userId?: string } = JSON.parse(decodedJson);

      this.organizerId = decodedPayload.userId || null;

      console.log('Organizer ID:', this.organizerId);
    } catch (error) {
      console.error('Failed to decode token:', error);
      this.organizerId = null;
    }
  }

  loadEvents() {
    if (!this.organizerId) {
      console.warn('No organizerId found, skipping event load');
      this.events = [];
      return;
    }

    console.log(this.organizerId);

    this.isLoading = true;
    this.http.get<{ data: Event[] }>(`${this.baseApiUrl}/${this.organizerId}`).subscribe({
      next: (res) => {
        this.events = res.data;  // all events by this organizer returned from backend
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading events', err);
        this.isLoading = false;
        alert('Failed to load events. Please try again later.');
      }
    });
  }

  // --- New method to fetch all locations ---
  fetchLocations() {
    this.http.get<any[]>('http://localhost:5000/api/locations').subscribe({
      next: (data) => {
        this.locations = data;
        this.filteredStates = [...new Set(data.map(loc => loc.state))];
        console.log('Locations fetched:', this.locations);
        console.log('Filtered states:', this.filteredStates);

      },
      error: (err) => {
        console.error('Failed to fetch locations', err);
      }
    });
  }

  // --- New handlers for cascading dropdown ---
  onStateChange() {
    this.filteredDistricts = [...new Set(this.locations
      .filter(loc => loc.state === this.selectedState)
      .map(loc => loc.district))];

    this.selectedDistrict = '';
    this.filteredPlaceNames = [];
    this.eventForm.patchValue({ location: '' });
  }

  onDistrictChange() {
    this.filteredPlaceNames = [...new Set(this.locations
      .filter(loc =>
        loc.state === this.selectedState &&
        loc.district === this.selectedDistrict
      )
      .map(loc => loc.placeName))];

    this.eventForm.patchValue({ location: '' });
  }

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    this.isEditMode = false;
    this.eventForm.reset({ price: 0, maxRegistrations: 1 });
    this.currentEditEventId = null;
    this.selectedState = '';
    this.selectedDistrict = '';
    this.filteredDistricts = [];
    this.filteredPlaceNames = [];
  }

  onSubmit() {
    if (!this.organizerId) {
      alert('User not authenticated, please login again.');
      return;
    }

    if (this.eventForm.invalid) {
      alert('Please fill in all required fields correctly.');
      return;
    }
    console.table(this.eventForm.value);

    const eventData = { ...this.eventForm.value, createdBy: this.organizerId };

    this.isLoading = true;
    if (this.isEditMode && this.currentEditEventId) {
      this.http.put(`${this.baseApiUrl}/${this.currentEditEventId}`, eventData).subscribe({
        next: () => {
          alert('Event updated successfully!');
          this.resetForm();
          this.loadEvents();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error updating event', err);
          alert('Failed to update event. Please try again.');
          this.isLoading = false;
        }
      });
    } else {
      this.http.post(this.createApiUrl, eventData).subscribe({
        next: () => {
          alert('Event created successfully!');
          this.resetForm();
          this.loadEvents();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error creating event', err);
          alert('Failed to create event. Please try again.');
          this.isLoading = false;
        }
      });
    }
  }

  onEdit(event: Event) {
    this.eventForm.patchValue(event);
    this.currentEditEventId = event._id;
    this.isEditMode = true;
    this.showCreateForm = true;

    // Set selectedState and selectedDistrict based on event.location if possible
    const loc = this.locations.find(l => l.placeName === event.location);
    if (loc) {
      this.selectedState = loc.state;
      this.onStateChange();
      this.selectedDistrict = loc.district;
      this.onDistrictChange();
    }
  }

  onDelete(eventId: string) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    this.isLoading = true;
    this.http.delete(`${this.baseApiUrl}/${eventId}`).subscribe({
      next: () => {
        alert('Event deleted successfully!');
        this.loadEvents();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error deleting event', err);
        alert('Failed to delete event. Please try again.');
        this.isLoading = false;
      }
    });
  }

  resetForm() {
    this.eventForm.reset({ price: 0, maxRegistrations: 1 });
    this.showCreateForm = false;
    this.isEditMode = false;
    this.currentEditEventId = null;
    this.selectedState = '';
    this.selectedDistrict = '';
    this.filteredDistricts = [];
    this.filteredPlaceNames = [];
  }

  logout() {
    // Clear token/session and other relevant data
    localStorage.removeItem('token'); // If you stored JWT here
    localStorage.removeItem('user');    // Optional: if you stored userId separately

    sessionStorage.clear(); // Clear session storage if used

    // Redirect to login page
    alert('You have been logged out.');
    window.location.href = '/';
  }
}
