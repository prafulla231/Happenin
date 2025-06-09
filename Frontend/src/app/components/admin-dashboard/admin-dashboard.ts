import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoadingService } from '../loading';
import { environment } from '../../../environment';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LocationService } from '../../services/location';
import { ApprovalService } from '../../services/approval';
import { AuthService } from '../../services/auth';
import { EventService } from '../../services/event';


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

export interface Location {
  _id?: string;
  state: string;
  city: string;
  placeName: string;
  address: string;
  maxSeatingCapacity: number;
  amenities: string[];
  createdBy?: string;
}

export interface RegisteredUsersResponse {
  users: RegisteredUser[];
  currentRegistration: number;
}

export interface CustomAlert {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  title: string;
  message: string;
  confirmAction?: () => void;
  cancelAction?: () => void;
  showCancel?: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss']
})
export class AdminDashboardComponent {
  events: Event[] = [];
  eventsone: Event[] = [];
  filteredEvents: Event[] = [];
  filteredEventsone: Event[] = [];
  usersMap: { [eventId: string]: RegisteredUsersResponse } = {};

  // Event details modal properties
  selectedEvent: Event | null = null;
  showEventDetails: boolean = false;

   showFilters: boolean = false;



  // Custom Alert System
  customAlert: CustomAlert = {
    show: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false
  };

  // Filters
  searchQuery = '';
  selectedCategory = '';
  selectedCity = '';
  dateFrom = '';
  dateTo = '';
  selectedPriceRange = '';
  sortBy = 'date';

  availableCategories: string[] = [];
  availableCities: string[] = [];


  registerForm: FormGroup;
  showRegisterForm = false;


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
    Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'],
    Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
    Karnataka: ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'],
    Rajasthan: ['Jaipur', 'Udaipur', 'Jodhpur', 'Ajmer', 'Kota'],
    Delhi: ['New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Noida']
  };

  availablecitys: string[] = [];
  amenities: string[] = ['Wi-Fi', 'AC', 'Parking', 'Projector', 'Water Supply', 'Microphone', 'Speaker'];
  showUsersDropdown: Record<string, boolean> = {};

  // New properties for user info from localStorage
  userEmail: string = '';
  isSuperAdmin: boolean = false;

  constructor(
    private http: HttpClient,
    private loadingService: LoadingService,
    private fb: FormBuilder,
    private authService: AuthService,
    private eventService: EventService,
    private locationService: LocationService,
    private ApprovalService: ApprovalService,

  ) {
    this.loadEvents();
    this.loadLocations();
    this.loadApprovals();
    this.setUserFromLocalStorageUser();

    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      role: ['admin']  // Fixed value
    });
  }

   toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.searchQuery && this.searchQuery.trim()) count++;
    if (this.selectedCategory) count++;
    if (this.selectedCity) count++;
    if (this.selectedPriceRange) count++;
    if (this.dateFrom) count++;
    if (this.dateTo) count++;
    return count;
  }

  // Custom Alert Methods
  showAlert(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) {
    this.customAlert = {
      show: true,
      type,
      title,
      message,
      showCancel: false
    };
  }

  showConfirmation(title: string, message: string, confirmAction: () => void, cancelAction?: () => void) {
    this.customAlert = {
      show: true,
      type: 'confirm',
      title,
      message,
      confirmAction,
      cancelAction,
      showCancel: true
    };
  }

  handleAlertConfirm() {
    if (this.customAlert.confirmAction) {
      this.customAlert.confirmAction();
    }
    this.closeAlert();
  }

  handleAlertCancel() {
    if (this.customAlert.cancelAction) {
      this.customAlert.cancelAction();
    }
    this.closeAlert();
  }

  closeAlert() {
    this.customAlert.show = false;
    this.customAlert.confirmAction = undefined;
    this.customAlert.cancelAction = undefined;
  }

  // Updated confirmation methods
  confirmDeleteEvent(eventId: string, eventTitle: string) {
    this.showConfirmation(
      'Delete Event',
      `Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`,
      () => this.deleteEvent(eventId)
    );
  }

  confirmRemoveUser(eventId: string, userId: string, userName: string) {
    this.showConfirmation(
      'Remove User',
      `Are you sure you want to remove "${userName}" from this event?`,
      () => this.removeUserFromEvent(eventId, userId)
    );
  }

  confirmApproveEvent(eventId: string, eventTitle: string) {
    this.showConfirmation(
      'Approve Event',
      `Are you sure you want to approve "${eventTitle}"?`,
      () => this.approveEvent(eventId)
    );
  }

  confirmDenyEvent(eventId: string, eventTitle: string) {
    this.showConfirmation(
      'Deny Event',
      `Are you sure you want to deny "${eventTitle}"? This action cannot be undone.`,
      () => this.denyEvent(eventId)
    );
  }

  // Read user info from localStorage key 'user' and set email & isSuperAdmin flag
  setUserFromLocalStorageUser() {
    try {
      const userString = localStorage.getItem('user');
      console.log('User string from localStorage:', userString);
      if (userString) {
        const user = JSON.parse(userString);
        this.userEmail = user.email || '';
        this.isSuperAdmin = this.userEmail === 'superadmin@gmail.com';
        console.log('Parsed user:', user);
        console.log('User email:', this.userEmail);
      } else {
        this.userEmail = '';
        this.isSuperAdmin = false;
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      this.userEmail = '';
      this.isSuperAdmin = false;
    }
  }

  toggleRegisterForm(): void {
    this.showRegisterForm = !this.showRegisterForm;
  }

  onRegisterSubmit(): void {
    if (this.registerForm.valid) {
      const data = this.registerForm.value;
      console.log('Registering admin with data:', data);

      this.authService.registerUser(data).subscribe({
        next: () => {
          this.showAlert('success', 'Registration Successful', 'Admin registered successfully!');
          this.registerForm.reset({ role: 'admin' });
          this.showRegisterForm = false;
        },
        error: (error) => {
          console.error('Registration failed', error);
          this.showAlert('error', 'Registration Failed', 'Registration failed. Please try again.');
        }
      });
    }
  }

  // loadEvents() {
  //   this.loadingService.show();
  //   this.http.get<{ data: Event[] }>(this.baseEventUrl).subscribe({
  //     next: res => {
  //       this.events = res.data;
  //       this.filteredEvents = [...this.events];
  //       this.extractFilterOptions();
  //       this.applySorting();
  //       res.data.forEach(event => this.loadRegisteredUsers(event._id));
  //       this.loadingService.hide();
  //       this.showAlert('success', 'Events Loaded', 'Successfully loaded all approved events!');
  //     },
  //     error: err => {
  //       console.error('Error loading events', err);
  //       this.loadingService.hide();
  //       this.showAlert('error', 'Loading Failed', 'Failed to load events. Please try again later.');
  //     }
  //   });
  // }

  loadEvents(): void {
  this.loadingService.show();

  this.eventService.getAllEvents().subscribe({
    next: (events) => {
      this.events = events;
      this.filteredEvents = [...events];
      this.extractFilterOptions();
      this.applySorting();
        this.events.forEach(event => {
        this.loadRegisteredUsers(event._id);  // keep your existing method call
      });
      this.loadingService.hide();
      this.showAlert('success', 'Events Loaded', 'Successfully loaded all available events!');
    },
    error: (err) => {
      console.error('Error loading events', err);
      this.loadingService.hide();
      this.showAlert('error', 'Loading Failed', 'Failed to load events. Please try again later.');
    }
  });
}


  loadApprovals(): void {
  this.loadingService.show();

  this.ApprovalService.viewApprovalRequests().subscribe({
    next: (res: { data: Event[] }) => {
      this.eventsone = res.data;
      this.filteredEventsone = [...this.eventsone];
      this.extractFilterOptions();
      this.applySorting();

      res.data.forEach((event: Event) => this.loadRegisteredUsers(event._id));

      this.loadingService.hide();

      if (res.data.length > 0) {
        this.showAlert('info', 'Pending Approvals', `${res.data.length} events are waiting for approval.`);
      }
    },
    error: (err: any) => {
      console.error('Error loading events', err);
      this.loadingService.hide();
      this.showAlert('error', 'Loading Failed', 'Failed to load pending events. Please try again later.');
    }
  });
}



  approveEvent(eventId: string) {
    const eventToApprove = this.eventsone.find(e => e._id === eventId);

    if (!eventToApprove) {
      this.showAlert('error', 'Event Not Found', 'The event could not be found.');
      return;
    }

    return this.http.post(
      `${environment.apiBaseUrl}${environment.apis.approveEvent}`,
      eventToApprove
    ).subscribe({
      next: (res) => {
        this.loadApprovals();
        this.loadEvents();
        this.showAlert('success', 'Event Approved', `Event "${eventToApprove.title}" has been approved successfully!`);
        console.log('Approved:', res);
      },
      error: (err) => {
        console.error('Approval failed:', err);
        this.showAlert('error', 'Approval Failed', 'Failed to approve the event. Please try again.');
      }
    });
  }

  denyEvent(eventId: string) {
    const eventToDeny = this.eventsone.find(e => e._id === eventId);
    const eventTitle = eventToDeny ? eventToDeny.title : 'Unknown Event';

    this.http.delete(`${environment.apiBaseUrl}${environment.apis.denyEvent(eventId)}`).subscribe({
      next: (res) => {
        console.log('Delete successful:', res);
        this.loadApprovals();
        this.showAlert('success', 'Event Denied', `Event "${eventTitle}" has been denied and removed.`);
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.showAlert('error', 'Deny Failed', 'Failed to deny the event. Please try again.');
      }
    });
  }

  extractFilterOptions() {
    this.availableCategories = [...new Set(this.events.map(e => e.category).filter(Boolean))].sort();
    this.availableCities = [...new Set(this.events.map(e => this.extractCityFromLocation(e.location)).filter(Boolean))].sort();
  }

  extractCityFromLocation(location: string): string {
    if (!location) return '';
    const parts = location.split(',');
    return parts.length >= 2 ? parts[parts.length - 2].trim() : parts[0].trim();
  }

  onSearchChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.events];
    const query = this.searchQuery.toLowerCase().trim();

    if (query) {
      filtered = filtered.filter(event => {
        const eventMatch = event.title.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          (event.artist && event.artist.toLowerCase().includes(query)) ||
          (event.organization && event.organization.toLowerCase().includes(query)) ||
          (event.category && event.category.toLowerCase().includes(query));

        const userMatch = this.usersMap[event._id]?.users.some(user =>
          user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
        );

        return eventMatch || userMatch;
      });
    }

    if (this.selectedCategory) {
      filtered = filtered.filter(event => event.category === this.selectedCategory);
    }

    if (this.selectedCity) {
      filtered = filtered.filter(event => this.extractCityFromLocation(event.location) === this.selectedCity);
    }

    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      filtered = filtered.filter(event => new Date(event.date) >= fromDate);
    }

    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      filtered = filtered.filter(event => new Date(event.date) <= toDate);
    }

    if (this.selectedPriceRange) {
      filtered = this.applyPriceFilter(filtered);
    }

    this.filteredEvents = filtered;
    this.applySorting();
  }

  applyPriceFilter(events: Event[]): Event[] {
    switch (this.selectedPriceRange) {
      case '0-500': return events.filter(e => e.price <= 500);
      case '500-1000': return events.filter(e => e.price > 500 && e.price <= 1000);
      case '1000-2000': return events.filter(e => e.price > 1000 && e.price <= 2000);
      case '2000+': return events.filter(e => e.price > 2000);
      default: return events;
    }
  }

  applySorting() {
    this.filteredEvents.sort((a, b) => {
      switch (this.sortBy) {
        case 'date': return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'title': return a.title.localeCompare(b.title);
        case 'price': return a.price - b.price;
        case 'category': return (a.category || '').localeCompare(b.category || '');
        case 'registrations':
          const aCount = this.usersMap[a._id]?.currentRegistration || 0;
          const bCount = this.usersMap[b._id]?.currentRegistration || 0;
          return bCount - aCount;
        default: return 0;
      }
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedCity = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.selectedPriceRange = '';
    this.sortBy = 'date';
    this.applyFilters();
    this.showAlert('info', 'Filters Cleared', 'All filters have been cleared.');
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedCategory || this.selectedCity || this.dateFrom || this.dateTo || this.selectedPriceRange);
  }

  formatDateRange(): string {
    if (this.dateFrom && this.dateTo) return `${this.formatDate(this.dateFrom)} - ${this.formatDate(this.dateTo)}`;
    if (this.dateFrom) return `From ${this.formatDate(this.dateFrom)}`;
    if (this.dateTo) return `Until ${this.formatDate(this.dateTo)}`;
    return '';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatPriceRange(): string {
    switch (this.selectedPriceRange) {
      case '0-500': return 'Free - ₹500';
      case '500-1000': return '₹500 - ₹1000';
      case '1000-2000': return '₹1000 - ₹2000';
      case '2000+': return '₹2000+';
      default: return '';
    }
  }

  loadRegisteredUsers(eventId: string) {
    this.eventService.getRegisteredUsers(eventId).subscribe({
      next: res => this.usersMap[eventId] = res.data,
      error: err => console.error('Error loading users for event', err)
    });
  }

  deleteEvent(eventId: string) {
    this.eventService.deleteEvent(eventId).subscribe({
      next: () => {
        this.loadEvents();
        this.showAlert('success', 'Event Deleted', 'The event has been deleted successfully.');
      },
      error: err => {
        console.error('Failed to delete event', err);
        this.showAlert('error', 'Delete Failed', 'Failed to delete event. Please try again.');
      }
    });
  }

  removeUserFromEvent(eventId: string, userId: string) {
    this.eventService.removeUserFromEvent(eventId,userId).subscribe({
      next: () => {
        this.loadRegisteredUsers(eventId);
        this.showAlert('success', 'User Removed', 'User has been successfully removed from the event.');
      },
      error: err => {
        console.error('Failed to remove user', err);
        this.showAlert('error', 'Remove Failed', 'Failed to remove user. Please try again.');
      }
    });
  }

  toggleUsersDropdown(eventId: string) {
    this.showUsersDropdown[eventId] = !this.showUsersDropdown[eventId];
  }

  // Event details modal methods
  showEventDetail(event: Event) {
    this.selectedEvent = event;
    this.showEventDetails = true;
    document.body.style.overflow = 'hidden';
  }

  closeEventDetails() {
    this.showEventDetails = false;
    this.selectedEvent = null;
    document.body.style.overflow = 'auto';
  }

  logout() {
    this.showConfirmation(
      'Logout Confirmation',
      'Are you sure you want to logout?',
      () => {
        localStorage.clear();
        sessionStorage.clear();
        this.showAlert('success', 'Logged Out', 'You have been logged out successfully.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    );
  }

  toggleLocationForm() {
    this.showLocationForm = !this.showLocationForm;
  }

  onStateChange() {
    this.availablecitys = this.statesAndcitys[this.newLocation.state] || [];
  }

  getStates(): string[] {
    return Object.keys(this.statesAndcitys);
  }

  toggleAmenity(amenity: string, event: any) {
    const checked = event.target.checked;
    if (checked) this.newLocation.amenities.push(amenity);
    else this.newLocation.amenities = this.newLocation.amenities.filter(a => a !== amenity);
  }

  addLocation(location: Location): void {
  this.locationService.addLocation(location).subscribe({
    next: () => {
      this.showAlert('success', 'Location Added', 'Location has been added successfully!');
      this.loadLocations();
      this.showLocationForm = false;
      this.resetForm();
    },
    error: (err) => {
      console.error('Failed to add location', err);
      this.showAlert('error', 'Add Location Failed', 'Failed to add location. Please try again.');
    }
  });
}


  loadLocations(): void {
  this.locationService.fetchLocations().subscribe({
    next: (response) => {
      this.locations = response.data;
    },
    error: (err) => {
      console.error('Error loading locations', err);
      this.showAlert('error', 'Loading Failed', 'Failed to load locations.');
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
