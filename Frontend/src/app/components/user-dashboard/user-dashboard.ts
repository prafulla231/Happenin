// user-dashboard.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import jsPDF from 'jspdf';
import { LoadingService } from '../loading';

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
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './user-dashboard.html',
  styleUrls: ['./user-dashboard.scss']
})
export class UserDashboardComponent {
  events: Event[] = [];
  filteredEvents: Event[] = [];
  userId: string | null = null;
  userName: string | null = null;
  registeredEvents: Event[] = [];
  selectedEvent: Event | null = null;
  showEventDetails: boolean = false;

  // Filter properties
  searchQuery: string = '';
  selectedCategory: string = '';
  selectedCity: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  selectedPriceRange: string = '';
  sortBy: string = 'date';

  // Available filter options
  availableCategories: string[] = [];
  availableCities: string[] = [];

  eventsApiUrl = 'http://localhost:5000/api/events';
  registerApiUrl = 'http://localhost:5000/api/events/register';

  constructor(
    private http: HttpClient,
    private loadingService: LoadingService
  ) {
    this.decodeToken();
    this.loadAllEvents();
    this.loadRegisteredEvents();
  }

  loadAllEvents() {
    this.decodeToken();
    this.loadingService.show();

    this.http.get<{ data: Event[] }>(this.eventsApiUrl).subscribe({
      next: (res) => {
        this.events = res.data;
        this.filteredEvents = [...this.events];
        this.extractFilterOptions();
        this.applySorting();
        this.loadingService.hide();
      },
      error: (err) => {
        console.error('Error loading events', err);
        this.loadingService.hide();
      }
    });
  }

  extractFilterOptions() {
    // Extract unique categories
    const categories = this.events
      .map(event => event.category)
      .filter(category => category && category.trim() !== '');
    this.availableCategories = [...new Set(categories)].sort();

    // Extract unique cities from locations
    const cities = this.events
      .map(event => this.extractCityFromLocation(event.location))
      .filter(city => city && city.trim() !== '');
    this.availableCities = [...new Set(cities)].sort();
    console.log("Location is : ",location);
  }

  extractCityFromLocation(location: string): string {
    if (!location) return '';

    // Try to extract city name from location string
    // This is a simple implementation - you might need to adjust based on your location format
    const parts = location.split(',');
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim(); // Assume city is second-to-last part
    }
    return parts[0].trim(); // If only one part, assume it's the city
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

      console.log('User ID:', this.userId);
      console.log('User Name:', this.userName);
    } catch (error) {
      console.error('Failed to decode token:', error);
      this.userId = null;
      this.userName = null;
    }
  }

  loadRegisteredEvents() {
    this.decodeToken();

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

  // Search and Filter Methods
  onSearchChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.events];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        (event.artist && event.artist.toLowerCase().includes(query)) ||
        (event.category && event.category.toLowerCase().includes(query)) ||
        event.description.toLowerCase().includes(query) ||
        (event.organization && event.organization.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(event => event.category === this.selectedCategory);
    }

    // Apply city filter
    if (this.selectedCity) {
      filtered = filtered.filter(event =>
        this.extractCityFromLocation(event.location) === this.selectedCity
      );
    }

    // Apply date range filter
    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      filtered = filtered.filter(event => new Date(event.date) >= fromDate);
    }

    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      filtered = filtered.filter(event => new Date(event.date) <= toDate);
    }

    // Apply price range filter
    if (this.selectedPriceRange) {
      filtered = this.applyPriceFilter(filtered);
    }

    this.filteredEvents = filtered;
    this.applySorting();
  }

  applyPriceFilter(events: Event[]): Event[] {
    switch (this.selectedPriceRange) {
      case '0-500':
        return events.filter(event => event.price >= 0 && event.price <= 500);
      case '500-1000':
        return events.filter(event => event.price > 500 && event.price <= 1000);
      case '1000-2000':
        return events.filter(event => event.price > 1000 && event.price <= 2000);
      case '2000+':
        return events.filter(event => event.price > 2000);
      default:
        return events;
    }
  }

  applySorting() {
    this.filteredEvents.sort((a, b) => {
      switch (this.sortBy) {
        case 'date':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'price':
          return a.price - b.price;
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        default:
          return 0;
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
    return !!(
      this.searchQuery ||
      this.selectedCategory ||
      this.selectedCity ||
      this.dateFrom ||
      this.dateTo ||
      this.selectedPriceRange
    );
  }

  formatDateRange(): string {
    if (this.dateFrom && this.dateTo) {
      return `${this.formatDate(this.dateFrom)} - ${this.formatDate(this.dateTo)}`;
    } else if (this.dateFrom) {
      return `From ${this.formatDate(this.dateFrom)}`;
    } else if (this.dateTo) {
      return `Until ${this.formatDate(this.dateTo)}`;
    }
    return '';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatPriceRange(): string {
    switch (this.selectedPriceRange) {
      case '0-500':
        return 'Free - ₹500';
      case '500-1000':
        return '₹500 - ₹1000';
      case '1000-2000':
        return '₹1000 - ₹2000';
      case '2000+':
        return '₹2000+';
      default:
        return '';
    }
  }

  // Existing methods (unchanged)
  registerForEvent(eventId: string) {
    const payload = {
      userId: this.userId,
      eventId: eventId,
    };

    this.http.post(this.registerApiUrl, payload).subscribe({
      next: () => {
        this.loadRegisteredEvents();
      },
      error: (err) => {
        console.error('Registration failed', err);
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
        this.loadRegisteredEvents();
      },
      error: (err) => {
        console.error('Deregistration failed', err);
      }
    });
  }

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

  downloadTicket(event: Event) {
    this.loadingService.show();

    try {
      const doc = new jsPDF();

      // Set up the PDF styling
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;

      // Header
      doc.setFillColor(102, 126, 234);
      doc.rect(0, 0, pageWidth, 60, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('EVENT TICKET', pageWidth / 2, 25, { align: 'center' });

      // Subtitle
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Official Entry Pass', pageWidth / 2, 35, { align: 'center' });

      // Event details section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Event Details', margin, 80);

      // Event information
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      let yPosition = 100;

      const details = [
        { label: 'Event Name:', value: event.title },
        { label: 'Description:', value: event.description },
        { label: 'Date:', value: event.date },
        { label: 'Time:', value: event.timeSlot },
        { label: 'Duration:', value: event.duration },
        { label: 'Location:', value: event.location },
        { label: 'Category:', value: event.category || 'General' },
        { label: 'Price:', value: `₹${event.price}` },
        { label: 'Ticket Holder:', value: this.userName || 'N/A' }
      ];

      details.forEach(detail => {
        doc.setFont('helvetica', 'bold');
        doc.text(detail.label, margin, yPosition);
        doc.setFont('helvetica', 'normal');

        const maxWidth = pageWidth - margin * 2 - 80;
        const splitText = doc.splitTextToSize(detail.value, maxWidth);
        doc.text(splitText, margin + 80, yPosition);

        yPosition += splitText.length * 7 + 5;
      });

      // Footer
      yPosition += 20;
      doc.setDrawColor(102, 126, 234);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);

      yPosition += 15;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('This is an official ticket. Please present this ticket at the event entrance.', pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 10;
      doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });

      // Download the PDF
      const fileName = `ticket-${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      doc.save(fileName);

      // Hide loading after PDF generation
      this.loadingService.hide();

    } catch (error) {
      console.error('Error generating PDF:', error);
      this.loadingService.hide();
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    window.location.href = '/';
  }
}
