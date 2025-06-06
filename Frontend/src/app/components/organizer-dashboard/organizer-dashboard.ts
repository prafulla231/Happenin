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

interface RegisteredUser {
  userId: string;
  name: string;
  email: string;
  _id : string;
}


interface RegisteredUsersResponse {
  users: RegisteredUser[];
  currentRegistration: number;
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
  posterFile: File | null = null;
  uploadedPosterUrl: string | null = null;
  events: Event[] = [];
  currentEditEventId: string | null = null;
  organizerId: string | null = null;
  isLoading = false;

  usersMap: { [eventId: string]: RegisteredUsersResponse } = {};
  createApiUrl = 'http://localhost:5000/api/events';
  baseApiUrl = 'http://localhost:5000/api/events';
  baseRegistrationUrl = 'http://localhost:5000/api/events/registered-users';

  eventForm: FormGroup;

  // Location dropdown data and selections
  locations: any[] = [];
  filteredStates: string[] = [];
  filteredCities: string[] = [];
  filteredPlaceNames: string[] = [];

  selectedState: string = '';
  selectedCity: string = '';

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
      state: ['', Validators.required],
      city: ['', Validators.required],  // Changed from 'district' to 'city'
    });

    this.decodeToken();
    this.loadEvents();
    this.fetchLocations();
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

    this.isLoading = true;
    this.http.get<{ data: Event[] }>(`${this.baseApiUrl}/${this.organizerId}`).subscribe({
      next: (res) => {
        this.events = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading events', err);
        this.isLoading = false;
        alert('Failed to load events. Please try again later.');
      },
    });
  }

  fetchLocations() {
  console.log('📡 Fetching locations from API...');
  this.http.get<any[]>('http://localhost:5000/api/locations').subscribe({
    next: (data) => {
      console.log('✅ Raw location data:', data);
      this.locations = data;

      // Extract and trim unique states safely
      this.filteredStates = [
        ...new Set(
          data
            .filter((loc) => loc.state)
            .map((loc) => loc.state.trim())
        )
      ];

      console.log('📍 All Locations:', this.locations);
      console.log('🌍 Filtered States:', this.filteredStates);
    },
    error: (err) => {
      console.error('❌ Failed to fetch locations', err);
    },
  });
}


selectedEventId: string | null = null;

openUserModal(eventId: string) {
  this.loadRegisteredUsers(eventId, () => {
    this.selectedEventId = eventId;
  });
}


closeUserModal() {
  this.selectedEventId = null;
}


onStateChange() {
  console.log('🟢 State changed!');
  console.log('Selected State:', this.selectedState);

  if (!this.selectedState) {
    console.log('⚠️ No state selected. Resetting cities and location...');
    this.filteredCities = [];
    this.filteredPlaceNames = [];
    this.eventForm.patchValue({ city: '', location: '' });
    return;
  }

  const state = this.selectedState.trim();
  console.log('✅ Trimmed Selected State:', state);

  const matchingLocations = this.locations.filter(
    (loc) => loc.state?.trim() === state
  );

  console.log('🔍 Matching Locations for State:', matchingLocations);

  // Extract and trim city values only if they exist
  this.filteredCities = [
    ...new Set(
      matchingLocations
        .filter((loc) => loc.city)
        .map((loc) => loc.city.trim())
    )
  ];

  console.log('🏙️ Filtered Cities:', this.filteredCities);

  // Reset further selections
  this.selectedCity = '';
  this.filteredPlaceNames = [];
  this.eventForm.patchValue({ city: '', location: '' });
}

onCityChange() {
  console.log('🟢 City changed!');
  console.log('Selected State:', this.selectedState);
  console.log('Selected City:', this.selectedCity);

  if (!this.selectedCity || !this.selectedState) {
    console.log('⚠️ Either city or state not selected. Skipping logic.');
    return;
  }

  const state = this.selectedState.trim();
  const city = this.selectedCity.trim();
  console.log('✅ Trimmed State and City:', state, city);

  const matchingPlaces = this.locations.filter(
    (loc) =>
      loc.state?.trim() === state &&
      loc.city?.trim() === city
  );

  console.log('📌 Matching Places:', matchingPlaces);

  this.filteredPlaceNames = [
    ...new Set(
      matchingPlaces
        .filter((loc) => loc.placeName)
        .map((loc) => loc.placeName.trim())
    )
  ];

  console.log('🏛️ Filtered Place Names:', this.filteredPlaceNames);

  this.eventForm.patchValue({ location: '' });
}

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    this.isEditMode = false;
    this.eventForm.reset({ price: 0, maxRegistrations: 1, state: '', city: '' });
    this.currentEditEventId = null;
    this.selectedState = '';
    this.selectedCity = '';
    this.filteredCities = [];
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
        },
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
        },
      });
    }
  }

  onEdit(event: Event) {
    // Find location info to set state and city
    const loc = this.locations.find((l) => l.placeName === event.location);

    // Patch form values including state & city explicitly
    this.eventForm.patchValue({
      ...event,
      state: loc ? loc.state : '',
      city: loc ? loc.city : '',  // Changed from 'district' to 'city'
    });

    this.currentEditEventId = event._id;
    this.isEditMode = true;
    this.showCreateForm = true;

    if (loc) {
      this.selectedState = loc.state;
      this.onStateChange();
      this.selectedCity = loc.city;  // Changed from 'district' to 'city'
      this.onCityChange();  // Changed method name
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
      },
    });
  }


  loadRegisteredUsers(eventId: string, callback?: () => void) {
  this.http.get<{ data: RegisteredUsersResponse }>(`${this.baseRegistrationUrl}/${eventId}`).subscribe({
    next: res => {
      this.usersMap[eventId] = res.data;
      console.log(`Loaded users for event ${eventId}`, res.data);
      if (callback) callback();
    },
    error: err => {
      console.error('Error loading users for event', err);
      alert('Failed to load users');
    }
  });
}


  resetForm() {
    this.eventForm.reset({ price: 0, maxRegistrations: 1, state: '', city: '' });
    this.showCreateForm = false;
    this.isEditMode = false;
    this.currentEditEventId = null;
    this.selectedState = '';
    this.selectedCity = '';
    this.filteredCities = [];
    this.filteredPlaceNames = [];
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();

    alert('You have been logged out.');
    window.location.href = '/';
  }
}
