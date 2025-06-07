import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LoadingService } from '../loading';
import { environment } from '../../../environment';
import { forkJoin } from 'rxjs';

// Interfaces
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
  _id: string;
}

interface RegisteredUsersResponse {
  users: RegisteredUser[];
  currentRegistration: number;
}

interface PopupConfig {
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
  eventForm: FormGroup;

  locations: any[] = [];
  filteredStates: string[] = [];
  filteredCities: string[] = [];
  filteredPlaceNames: string[] = [];

  selectedState = '';
  selectedCity = '';

  showPopup = false;
  popupConfig: PopupConfig = { title: '', message: '', type: 'info' };
  popupResolve: ((value: boolean) => void) | null = null;

  selectedEventId: string | null = null;

  constructor(private fb: FormBuilder, private http: HttpClient, private loadingService: LoadingService) {
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

    this.decodeToken();
    this.loadEvents();
    this.fetchLocations();
  }

  decodeToken() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.organizerId = payload.userId || null;
    } catch {
      this.organizerId = null;
    }
  }

  loadEvents() {
    if (!this.organizerId) return;
    this.loadingService.show();

    this.http.get<{ data: Event[] }>(
      `${environment.apiBaseUrl}${environment.apis.getEventsByOrganizer(this.organizerId)}`
    ).subscribe({
      next: res => {
        this.events = res.data;
        this.loadingService.hide();
      },
      error: () => {
        this.loadingService.hide();
        this.showAlert('Error', 'Failed to load events', 'error');
      }
    });
  }

  fetchLocations() {
    this.loadingService.show();
    this.http.get<any[]>(`${environment.apiBaseUrl}${environment.apis.fetchLocations}`).subscribe({
      next: data => {
        this.locations = data;
        this.filteredStates = [...new Set(data.map(loc => loc.state?.trim()).filter(Boolean))];
        this.loadingService.hide();
      },
      error: () => {
        this.loadingService.hide();
        this.showAlert('Error', 'Failed to fetch locations', 'error');
      }
    });
  }

  // Event Submit/Create/Update
  async onSubmit() {
    if (this.eventForm.invalid) {
      await this.showAlert('Validation Error', 'Please fill required fields', 'warning');
      return;
    }

    this.isLoading = true;
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

    this.http.post(`${environment.apiBaseUrl}/locations/book`, locationData).subscribe({
      next: () => {
        const request = this.isEditMode && this.currentEditEventId
          ? this.http.put(`${environment.apiBaseUrl}${environment.apis.updateEvent(this.currentEditEventId)}`, eventData)
          : this.http.post(`${environment.apiBaseUrl}${environment.apis.createEvent}`, eventData);

        request.subscribe({
          next: async () => {
            await this.showAlert('Success', `Event ${this.isEditMode ? 'updated' : 'created'} successfully!`, 'success');
            this.resetForm();
            this.loadEvents();
            this.isLoading = false;
          },
          error: async () => {
            await this.showAlert('Error', 'Event creation/updation failed', 'error');
            this.isLoading = false;
          }
        });
      },
      error: async () => {
        await this.showAlert('Error', 'Failed to book location', 'error');
        this.isLoading = false;
      }
    });
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
    }
  }

  async onDelete(eventId: string) {
    const confirm = await this.showConfirm('Delete Event', 'Are you sure?', 'Delete', 'Cancel');
    if (!confirm) return;

    this.isLoading = true;
    this.http.delete(`${environment.apiBaseUrl}${environment.apis.deleteEvent(eventId)}`).subscribe({
      next: async () => {
        await this.showAlert('Success', 'Event deleted!', 'success');
        this.loadEvents();
        this.isLoading = false;
      },
      error: async () => {
        await this.showAlert('Error', 'Failed to delete event', 'error');
        this.isLoading = false;
      }
    });
  }

  loadRegisteredUsers(eventId: string, callback?: () => void) {
    this.http.get<{ data: RegisteredUsersResponse }>(
      `${environment.apiBaseUrl}${environment.apis.getRegisteredUsers(eventId)}`
    ).subscribe({
      next: res => {
        this.usersMap[eventId] = res.data;
        if (callback) callback();
      },
      error: () => {
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
    this.eventForm.patchValue({ city: '', location: '' });
  }

  onCityChange() {
    const state = this.selectedState.trim();
    const city = this.selectedCity.trim();
    const matches = this.locations.filter(loc => loc.state?.trim() === state && loc.city?.trim() === city);
    this.filteredPlaceNames = [...new Set(matches.map(loc => loc.placeName?.trim()).filter(Boolean))];
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
    this.filteredCities = [];
    this.filteredPlaceNames = [];
    this.currentEditEventId = null;
  }

  async logout() {
    const confirm = await this.showConfirm('Logout', 'Are you sure you want to logout?', 'Logout', 'Cancel');
    if (confirm) {
      localStorage.clear();
      sessionStorage.clear();
      await this.showAlert('Logged out', 'You have been logged out', 'success');
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
}
