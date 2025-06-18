import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router  } from '@angular/router';
import { LoadingService } from '../loading';
import { forkJoin, Subject } from 'rxjs';
import { LocationService } from '../../services/location';
import { ApprovalService } from '../../services/approval';
import { AuthService } from '../../services/auth';
import { EventService } from '../../services/event';
import { map, takeUntil, finalize } from 'rxjs/operators';
import { HeaderComponent, HeaderButton } from '../header/header';
import { FooterComponent } from '../footer/footer';


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
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './organizer-dashboard.html',
  styleUrls: ['./organizer-dashboard.scss'],
})
export class OrganizerDashboardComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
userName: string | null = null;
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
private alertTimeout?: any;
  showPopup = false;
  popupConfig: PopupConfig = { title: '', message: '', type: 'info' };
  popupResolve: ((value: boolean) => void) | null = null;

  selectedEventId: string | null = null;
  selectedEvent: Event | null = null;
  isEventDetailVisible: boolean = false;

  categories: string[] = ['Music', 'Sports', 'Workshop', 'Dance', 'Theatre', 'Technical', 'Comedy', 'Arts', 'Exhibition', 'other'];
  minDate: string = '';

  get displayUserName(): string {
    return this.userName || 'Guest';
  }

   organizerButtons: HeaderButton[] = [
    { text: 'My Events', action: 'viewMyEvents' },
    { text: 'Create Event', action: 'createEvent', style: 'primary' },
    // { text: 'Analytics', action: 'viewAnalytics' },
    // { text: 'Settings', action: 'openSettings' },
    { text: 'Contact', action: 'openContact' },
    { text: 'Logout', action: 'logout' }
  ];

handleHeaderAction(action: string): void {
    switch (action) {
      case 'viewMyEvents':
        this.viewMyEvents();
        break;
      case 'createEvent':
        this.createEvent();
        break;
      case 'openContact':
        this.openContact();
        break;
      case 'logout':
        this.logout();
        break;
    }
  }


  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private loadingService: LoadingService,
    private authService: AuthService,
    private eventService: EventService,
    private locationService: LocationService,
    private ApprovalService: ApprovalService,
    private router: Router
  ) {
    // Initialize form
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
    this.eventForm.get('endTime')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.calculateDuration();
    });

    // Initialize component data
    this.initializeData();
  }

  ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
  this.isLoading = false;
  this.loadingService.hide();

  // Clear alert timeout if exists
  if (this.alertTimeout) {
    clearTimeout(this.alertTimeout);
  }
}
  private async initializeData() {
    // Decode token and get organizer ID
    this.decodeToken();

    if (!this.organizerId) {
      console.error('No organizer ID found');
      await this.showAlert('Alert', 'message', 'info')
      this.logout();
      return;
    }

    // Load all required data
    this.loadAllData();
  }

  private decodeToken(): void {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');

      if (!token) {
        console.error('No token found in storage');
        return;
      }

      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error('Invalid token format');
        return;
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      this.organizerId = payload.userId || payload.id || null;
      this.userName = payload.userName || payload.name || null;

      console.log('Decoded organizer ID:', this.organizerId);
    } catch (error) {
      console.error('Error decoding token:', error);
      this.organizerId = null;
    }
  }

  viewMyEvents() {
    const availableSection = document.querySelector('.events-section');
    if (availableSection) {
      availableSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  createEvent() {
    const availableSection = document.querySelector('.create-event-btn');
    if (availableSection) {
      availableSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  private loadAllData(): void {
    this.isLoading = true;
    this.loadingService.show();

    // Load locations
    this.locationService.fetchLocations().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.locations = Array.isArray(data) ? data : [];
        this.places = this.locations;
        this.filteredStates = [...new Set(this.locations.map(loc => loc.state?.trim()).filter(Boolean))];
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.locations = [];
        this.places = [];
      }
    });

    // Load events
    if (this.organizerId) {
      this.eventService.getEventById(this.organizerId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (events) => {
          this.events = Array.isArray(events) ? events : [];
        },
        error: (error) => {
          console.error('Error loading events:', error);
          this.events = [];
        }
      });

      // Load approval requests
      this.ApprovalService.viewApprovalRequestById(this.organizerId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (events) => {
          this.eventsone = Array.isArray(events) ? events : [];
        },
        error: (error) => {
          console.error('Error loading approval requests:', error);
          this.eventsone = [];
        },
        complete: () => {
          this.isLoading = false;
          this.loadingService.hide();
        }
      });
    } else {
      this.isLoading = false;
      this.loadingService.hide();
    }
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
      await this.showAlert('Validation Error', 'Please fill required fields', 'error')
      return;
    }

    // this.isLoading = true;
    // this.loadingService.show();

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

      console.log(eventData)

      // First book the location
      this.locationService.bookLocation(locationData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          const request = this.isEditMode && this.currentEditEventId
            ? this.eventService.updateEvent(this.currentEditEventId, eventData)
            : this.eventService.createEvent(eventData);

          request.pipe(
            takeUntil(this.destroy$)
          ).subscribe({
            next: async () => {
              // await alert(`Event ${this.isEditMode ? 'updated' : 'created'} successfully!`);
              await this.showAlert('Success', `Event ${this.isEditMode ? 'updated' : 'created'} successfully!`, 'success');
              // this.resetForm();
              // this.loadAllData(); // Reload data after successful operation
            },
            error: async (error) => {
              console.error('Event creation/update error:', error);
              await this.showAlert('Error', 'Event creation/updation failed', 'error')
            },
            complete: () => {
              this.isLoading = false;
              this.loadingService.hide();
            }
          });
        },
        error: async (error) => {
          console.error('Location booking error:', error);
          // await alert('Failed to book location');
          await this.showAlert('Error', 'Failed to book location', 'error')
          this.isLoading = false;
          this.loadingService.hide();
        }
      });
    } catch (error) {
      console.error('Submit error:', error);
      await alert('An unexpected error occurred');
      this.isLoading = false;
      this.loadingService.hide();
    }
  }

  onEdit(event: Event) {
    window.scrollTo(0, 0);
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
    const confirm = await this.showConfirm('Confirm', 'Are you sure you want to delete this event? This action cannot be undone.');

//     if (!confirm){
// console.log("Not deleted")
//       return;
//     }


    this.isLoading = true;
    this.loadingService.show();

    this.eventService.deleteEvent(eventId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: async () => {
        // await alert('Event deleted!');
        await this.showAlert('Success', 'Event deleted!', 'success')
        this.loadAllData();

      },
      error: async (error) => {
        console.error('Delete error:', error);
        // await alert( 'Failed to delete event');
await this.showAlert('Error', 'Failed to delete event', 'error')
      },
      complete: () => {
        this.isLoading = false;
        this.loadingService.hide();
      }
    });
  }

  loadRegisteredUsers(eventId: string, callback?: () => void) {
    this.eventService.getRegisteredUsers(eventId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: res => {
        this.usersMap[eventId] = res.data;
        if (callback) callback();
      },
      error: (error) => {
        console.error('Error loading registered users:', error);
        // alert('Failed to load registered users');
         this.showAlert('Alert', 'Failed to load registered users', 'info')
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

    openContact() {
  this.router.navigate(['/contact']);
}

  async logout() {
    const confirmed = await this.showConfirm('Confirm', 'Are you sure you want to logout?')
    if (confirmed) {
      localStorage.clear();
      sessionStorage.clear();
      // alert('You have been logged out');
      await this.showAlert('Success', 'You have been logged out', 'success')
      setTimeout(() => (window.location.href = '/login'), 500);
    }
  }

  // Popup logic
  showAlert(title: string, message: string, type: PopupConfig['type']): Promise<boolean> {
  return new Promise(resolve => {
    this.popupConfig = { title, message, type, showConfirm: false };
    this.showPopup = true;

    // Auto-close alert after 2 seconds
    this.alertTimeout = setTimeout(() => {
      this.showPopup = false;
      resolve(true);
    }, 2000);

    this.popupResolve = resolve;
  });
}

  showConfirm(title: string, message: string, confirmText = 'Yes', cancelText = 'No'): Promise<boolean> {
  return new Promise(resolve => {
    this.popupConfig = {
      title,
      message,
      type: 'warning',
      showConfirm: true,
      confirmText,
      cancelText
    };
    this.showPopup = true;
    this.popupResolve = resolve;
  });
}

  onPopupConfirm() {
  if (this.alertTimeout) {
    clearTimeout(this.alertTimeout);
    this.alertTimeout = undefined;
  }
  this.showPopup = false;
  this.popupResolve?.(true);
  this.popupResolve = null;
}

  onPopupCancel() {
  if (this.alertTimeout) {
    clearTimeout(this.alertTimeout);
    this.alertTimeout = undefined;
  }
  this.showPopup = false;
  this.popupResolve?.(false);
  this.popupResolve = null;
}

onPopupOverlayClick(event: MouseEvent) {
  if (event.target === event.currentTarget && !this.popupConfig.showConfirm) {
    this.onPopupCancel();
  }
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


