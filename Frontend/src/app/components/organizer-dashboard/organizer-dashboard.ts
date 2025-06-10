import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LoadingService } from '../loading';
import { forkJoin } from 'rxjs';
import { LocationService } from '../../services/location';
import { ApprovalService } from '../../services/approval';
import { AuthService } from '../../services/auth';
import { EventService } from '../../services/event';
import { map } from 'rxjs/operators';

// Interfaces
export interface Event {
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

export interface RegisteredUser {
  userId: string;
  name: string;
  email: string;
  _id: string;
}

export interface RegisteredUsersResponse {
  users: RegisteredUser[];
  currentRegistration: number;
}

export interface PopupConfig {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  showConfirm?: boolean;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-organizer-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './organizer-dashboard.html',
  styleUrls: ['./organizer-dashboard.scss'],
})
export class OrganizerDashboardComponent implements OnInit {
  showCreateForm = false;
  isEditMode = false;
  posterFile: File | null = null;
  uploadedPosterUrl: string | null = null;
  events: Event[] = [];
  eventsone: Event[] = [];
  currentEditEventId: string | null = null;
  organizerId: string | null = null;
  isLoading = false;

  usersMap: { [eventId: string]: RegisteredUsersResponse } = {};
  eventForm: FormGroup;

  locations: any[] = [];
  filteredStates: string[] = [];
  filteredCities: string[] = [];
  filteredPlaceNames: string[] = [];
  places: any[] = [];

  selectedState = '';
  selectedCity = '';
  selectedVenue: any = null;

  showPopup = false;
  popupConfig: PopupConfig = { title: '', message: '', type: 'info' };
  popupResolve: ((value: boolean) => void) | null = null;

  selectedEventId: string | null = null;
  selectedEvent: Event | null = null;
  isEventDetailVisible: boolean = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private loadingService: LoadingService,
    private authService: AuthService,
    private eventService: EventService,
    private locationService: LocationService,
    private ApprovalService: ApprovalService,
  ) {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      duration: [''],
      location: [''],
      category: [''],
      price: [0, Validators.min(0)],
      maxRegistrations: [1, [Validators.required, Validators.min(1)]],
      artist: [''],
      organization: [''],
      state: ['', Validators.required],
      city: ['', Validators.required],
    });

    // Set minimum date
    const today = new Date();
    today.setDate(today.getDate() + 1);
    this.minDate = today.toISOString().split('T')[0];

    // Watch for end time changes to calculate duration
    this.eventForm.get('endTime')?.valueChanges.subscribe(() => {
      this.calculateDuration();
    });
  }

  categories: string[] = ['Music', 'Sports', 'Workshop', 'Dance', 'Theatre', 'Technical', 'Comedy','Arts','Exhibition','other'];
  minDate: string = '';

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.initializeComponent();
  }

  async initializeComponent() {
    try {
      this.isLoading = true;
      this.loadingService.show();

      // First decode token to get organizer ID
      await this.decodeToken();

      if (!this.organizerId) {
        console.error('No organizer ID found');
        await this.showAlert('Error', 'User authentication failed. Please login again.', 'error');
        this.logout();
        return;
      }

      // Load all data in parallel
      await Promise.all([
        this.fetchLocations(),
        this.loadEvents(),
        this.loadRequests()
      ]);

    } catch (error) {
      console.error('Error initializing component:', error);
      await this.showAlert('Error', 'Failed to initialize dashboard', 'error');
    } finally {
      this.isLoading = false;
      this.loadingService.hide();
    }
  }

  async decodeToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');

        if (!token) {
          console.error('No token found in storage');
          reject('No token found');
          return;
        }

        console.log('Token found:', !!token);

        const payload = JSON.parse(atob(token.split('.')[1]));
        this.organizerId = payload.userId || payload.id || null;

        console.log('Decoded organizer ID:', this.organizerId);

        if (!this.organizerId) {
          reject('No organizer ID in token');
          return;
        }

        resolve();
      } catch (error) {
        console.error('Error decoding token:', error);
        this.organizerId = null;
        reject(error);
      }
    });
  }

  async loadEvents(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.organizerId) {
        console.error('No organizer ID available for loading events');
        reject('No organizer ID');
        return;
      }

      console.log('Loading events for organizer:', this.organizerId);

      this.eventService.getEventById(this.organizerId).subscribe({
        next: (events) => {
          console.log('Events loaded successfully:', events);
          this.events = Array.isArray(events) ? events : [];
          resolve();
        },
        error: (error) => {
          console.error('Error loading events:', error);
          this.events = [];
          // Don't reject here, just log the error and continue
          resolve();
        }
      });
    });
  }

  async loadRequests(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.organizerId) {
        console.error('No organizer ID available for loading requests');
        reject('No organizer ID');
        return;
      }

      console.log('Loading approval requests for organizer:', this.organizerId);

      this.ApprovalService.viewApprovalRequestById(this.organizerId).subscribe({
        next: (events) => {
          console.log('Approval requests loaded successfully:', events);
          this.eventsone = Array.isArray(events) ? events : [];
          resolve();
        },
        error: (error) => {
          console.error('Error loading approval requests:', error);
          this.eventsone = [];
          // Don't reject here, just log the error and continue
          resolve();
        }
      });
    });
  }

  async fetchLocations(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.locationService.fetchLocations().subscribe({
        next: (data) => {
          console.log('Locations loaded successfully:', data.length);
          this.locations = Array.isArray(data) ? data : [];
          this.places = this.locations;
          this.filteredStates = [...new Set(this.locations.map(loc => loc.state?.trim()).filter(Boolean))];
          resolve();
        },
        error: (error) => {
          console.error('Error loading locations:', error);
          this.locations = [];
          this.places = [];
          resolve(); // Don't reject, allow component to continue
        }
      });
    });
  }

  calculateDuration() {
    const start = this.eventForm.get('startTime')?.value;
    const end = this.eventForm.get('endTime')?.value;

    if (start && end) {
      const [startHour, startMinute] = start.split(':').map(Number);
      const [endHour, endMinute] = end.split(':').map(Number);

      let startTotalMinutes = startHour * 60 + startMinute;
      let endTotalMinutes = endHour * 60 + endMinute;

      // Handle overnight duration (if endTime is next day)
      if (endTotalMinutes < startTotalMinutes) {
        endTotalMinutes += 24 * 60;
      }

      const durationMinutes = endTotalMinutes - startTotalMinutes;
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      const durationStr = `${hours} hour${hours !== 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} min${minutes !== 1 ? 's' : ''}` : ''}`;
      this.eventForm.get('duration')?.setValue(durationStr);
    }
  }

  // Updated venue change method
  onVenueChange(): void {
    const selectedPlace = this.eventForm.get('location')?.value;
    this.selectedVenue = this.places.find((place: any) => place.placeName === selectedPlace) || null;
    this.validateMaxRegistrations();
  }

  // Added validation method
  validateMaxRegistrations(): void {
    const maxRegistrationsControl = this.eventForm.get('maxRegistrations');
    const maxRegistrationsValue = maxRegistrationsControl?.value;

    if (this.selectedVenue && maxRegistrationsValue) {
      const venueCapacity = this.selectedVenue.maxSeatingCapacity;

      if (maxRegistrationsValue > venueCapacity) {
        maxRegistrationsControl?.setErrors({ 'overCapacity': true });
      } else {
        const errors = maxRegistrationsControl?.errors;
        if (errors && errors['overCapacity']) {
          delete errors['overCapacity'];
          maxRegistrationsControl?.setErrors(Object.keys(errors).length ? errors : null);
        }
      }
    }
  }

  // Added method for max registrations change
  onMaxRegistrationsChange(): void {
    this.validateMaxRegistrations();
  }

  // Event Submit/Create/Update
  async onSubmit() {
    if (this.eventForm.invalid) {
      await this.showAlert('Validation Error', 'Please fill required fields', 'warning');
      return;
    }

    this.isLoading = true;
    this.loadingService.show();

    try {
      const form = this.eventForm.value;
      const timeSlot = `${form.startTime} - ${form.endTime}`;
      const eventData = {
        ...form,
        createdBy: this.organizerId,
        timeSlot
      };

      const startDateTime = new Date(`${form.date}T${form.startTime}:00`).toISOString();
      const endDateTime = new Date(`${form.date}T${form.endTime}:00`).toISOString();

      const locationData = {
        startTime_one: startDateTime,
        endTime_one: endDateTime,
        state: form.state,
        city: form.city,
        placeName: form.location,
      };

      // First book the location
      this.locationService.bookLocation(locationData).subscribe({
        next: () => {
          const request = this.isEditMode && this.currentEditEventId
            ? this.eventService.updateEvent(this.currentEditEventId, eventData)
            : this.eventService.createEvent(eventData);

          request.subscribe({
            next: async () => {
              await this.showAlert('Success', `Event ${this.isEditMode ? 'updated' : 'created'} successfully!`, 'success');
              this.resetForm();
              await this.loadEvents();
              await this.loadRequests();
            },
            error: async (error) => {
              console.error('Event creation/update error:', error);
              await this.showAlert('Error', 'Event creation/updation failed', 'error');
            },
            complete: () => {
              this.isLoading = false;
              this.loadingService.hide();
            }
          });
        },
        error: async (error) => {
          console.error('Location booking error:', error);
          await this.showAlert('Error', 'Failed to book location', 'error');
          this.isLoading = false;
          this.loadingService.hide();
        }
      });
    } catch (error) {
      console.error('Submit error:', error);
      await this.showAlert('Error', 'An unexpected error occurred', 'error');
      this.isLoading = false;
      this.loadingService.hide();
    }
  }

  onEdit(event: Event) {
    const loc = this.locations.find(l => l.placeName === event.location);
    this.eventForm.patchValue({ ...event, state: loc?.state || '', city: loc?.city || '' });
    this.currentEditEventId = event._id;
    this.isEditMode = true;
    this.showCreateForm = true;
    if (loc) {
      this.selectedState = loc.state;
      this.onStateChange();
      this.selectedCity = loc.city;
      this.onCityChange();
      // Set selected venue after city change
      setTimeout(() => {
        this.selectedVenue = this.places.find((place: any) => place.placeName === event.location) || null;
      }, 100);
    }
  }

  async onDelete(eventId: string) {
    const confirm = await this.showConfirm('Delete Event', 'Are you sure?', 'Delete', 'Cancel');
    if (!confirm) return;

    this.isLoading = true;
    this.loadingService.show();

    this.eventService.deleteEvent(eventId).subscribe({
      next: async () => {
        await this.showAlert('Success', 'Event deleted!', 'success');
        await this.loadEvents();
      },
      error: async (error) => {
        console.error('Delete error:', error);
        await this.showAlert('Error', 'Failed to delete event', 'error');
      },
      complete: () => {
        this.isLoading = false;
        this.loadingService.hide();
      }
    });
  }

  loadRegisteredUsers(eventId: string, callback?: () => void) {
    this.eventService.getRegisteredUsers(eventId).subscribe({
      next: res => {
        this.usersMap[eventId] = res.data;
        if (callback) callback();
      },
      error: (error) => {
        console.error('Error loading registered users:', error);
        this.showAlert('Error', 'Failed to load registered users', 'error');
      }
    });
  }

  // State/City Filters
  onStateChange() {
    const state = this.selectedState.trim();
    const matches = this.locations.filter(loc => loc.state?.trim() === state);
    this.filteredCities = [...new Set(matches.map(loc => loc.city?.trim()).filter(Boolean))];
    this.filteredPlaceNames = [];
    this.selectedCity = '';
    this.selectedVenue = null;
    this.eventForm.patchValue({ city: '', location: '' });
  }

  onCityChange() {
    const state = this.selectedState.trim();
    const city = this.selectedCity.trim();
    const matches = this.locations.filter(loc => loc.state?.trim() === state && loc.city?.trim() === city);
    this.filteredPlaceNames = [...new Set(matches.map(loc => loc.placeName?.trim()).filter(Boolean))];
    this.selectedVenue = null;
    this.eventForm.patchValue({ location: '' });
  }

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    this.isEditMode = false;
    this.resetForm();
  }

  resetForm() {
    this.eventForm.reset({ price: 0, maxRegistrations: 1, state: '', city: '' });
    this.selectedState = '';
    this.selectedCity = '';
    this.selectedVenue = null;
    this.filteredCities = [];
    this.filteredPlaceNames = [];
    this.currentEditEventId = null;
  }

  async logout() {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      localStorage.clear();
      sessionStorage.clear();
      alert('You have been logged out');
      setTimeout(() => (window.location.href = '/'), 1000);
    }
  }

  // Popup logic
  showAlert(title: string, message: string, type: PopupConfig['type']): Promise<boolean> {
    return new Promise(resolve => {
      this.popupConfig = { title, message, type };
      this.showPopup = true;
      this.popupResolve = resolve;
    });
  }

  showConfirm(title: string, message: string, confirmText = 'Yes', cancelText = 'No'): Promise<boolean> {
    return new Promise(resolve => {
      this.popupConfig = { title, message, type: 'warning', showConfirm: true, confirmText, cancelText };
      this.showPopup = true;
      this.popupResolve = resolve;
    });
  }

  onPopupConfirm() {
    this.showPopup = false;
    this.popupResolve?.(true);
    this.popupResolve = null;
  }

  onPopupCancel() {
    this.showPopup = false;
    this.popupResolve?.(false);
    this.popupResolve = null;
  }

  openUserModal(eventId: string) {
    this.loadRegisteredUsers(eventId, () => (this.selectedEventId = eventId));
  }

  closeUserModal() {
    this.selectedEventId = null;
  }

  showEventDetail(event: Event) {
    this.selectedEvent = event;
    this.isEventDetailVisible = true;
    document.body.style.overflow = 'auto';
  }

  closeEventDetails() {
    this.isEventDetailVisible = false;
    this.selectedEvent = null;
    document.body.style.overflow = 'auto';
  }
}
