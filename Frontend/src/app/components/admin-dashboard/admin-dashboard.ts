import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoadingService } from '../loading';
import { environment } from '../../../environment';

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
  eventsone : Event[]=[];
  filteredEvents: Event[] = [];
  filteredEventsone: Event[] = [];
  usersMap: { [eventId: string]: RegisteredUsersResponse } = {};

  // Event details modal properties
  selectedEvent: Event | null = null;
  showEventDetails: boolean = false;

  searchQuery = '';
  selectedCategory = '';
  selectedCity = '';
  dateFrom = '';
  dateTo = '';
  selectedPriceRange = '';
  sortBy = 'date';

  availableCategories: string[] = [];
  availableCities: string[] = [];

  baseEventUrl = environment.apiBaseUrl + environment.apis.getAllEvents;
  eventurlapproval = 'http://localhost:5000/api/approval/viewApproval';
  baseRegistrationUrl = environment.apiBaseUrl;
  removeUser = environment.apiBaseUrl;
  baseLocationUrl = environment.apiBaseUrl + environment.apis.fetchLocations;

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

  constructor(private http: HttpClient, private loadingService: LoadingService) {
    this.loadEvents();
    this.loadLocations();
    this.loadApprovals();
    this.setUserFromLocalStorageUser();
  }

  // Read user info from localStorage key 'user' and set email & isSuperAdmin flag
  setUserFromLocalStorageUser() {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        this.userEmail = user.email || '';
        this.isSuperAdmin = this.userEmail === 'superadmin@gmail.com';
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

  loadEvents() {
    this.loadingService.show();
    this.http.get<{ data: Event[] }>(this.baseEventUrl).subscribe({
      next: res => {
        this.events = res.data;
        this.filteredEvents = [...this.events];
        this.extractFilterOptions();
        this.applySorting();
        res.data.forEach(event => this.loadRegisteredUsers(event._id));
        this.loadingService.hide();
      },
      error: err => {
        console.error('Error loading events', err);
        this.loadingService.hide();
      }
    });
  }

  loadApprovals() {
    this.loadingService.show();
    this.http.get<{ data: Event[] }>(this.eventurlapproval).subscribe({
      next: res => {
        this.eventsone = res.data;
        this.filteredEventsone = [...this.eventsone];
        this.extractFilterOptions();
        this.applySorting();
        res.data.forEach(event => this.loadRegisteredUsers(event._id));
        this.loadingService.hide();
      },
      error: err => {
        console.error('Error loading events', err);
        this.loadingService.hide();
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
    this.http.get<{ data: RegisteredUsersResponse }>(`${this.baseRegistrationUrl}${environment.apis.getRegisteredUsers(eventId)}`).subscribe({
      next: res => this.usersMap[eventId] = res.data,
      error: err => console.error('Error loading users for event', err)
    });
  }

  deleteEvent(eventId: string) {
    if (confirm('Are you sure you want to delete this event?')) {
      this.http.delete(`${this.baseEventUrl}/${eventId}`).subscribe({
        next: () => this.loadEvents(),
        error: err => alert('Failed to delete event')
      });
    }
  }

  removeUserFromEvent(eventId: string, userId: string) {
    if (confirm('Remove user from event?')) {
      this.http.delete(`${this.removeUser}${environment.apis.removeUserFromEvent(eventId, userId)}`).subscribe({
        next: () => this.loadRegisteredUsers(eventId),
        error: err => alert('Failed to remove user')
      });
    }
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
    localStorage.clear();
    sessionStorage.clear();
    alert('You have been logged out.');
    window.location.href = '/login';
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

  addLocation(location: Location) {
    this.http.post<{ data: Location }>(`${environment.apiBaseUrl}${environment.apis.addLocation}`, location).subscribe({
      next: () => {
        alert('Location added successfully!');
        this.loadLocations();
        this.showLocationForm = false;
        this.resetForm();
      },
      error: err => alert('Failed to add location')
    });
  }

  loadLocations() {
    this.http.get<{ data: Location[] }>(this.baseLocationUrl).subscribe({
      next: res => this.locations = res.data,
      error: err => console.error('Error loading locations', err)
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
