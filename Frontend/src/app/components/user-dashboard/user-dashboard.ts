import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import jsPDF from 'jspdf';
import { environment } from '../../../environment';
import { LoadingService } from '../loading';
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

  constructor(
    private http: HttpClient,
    private loadingService: LoadingService,
     private authService: AuthService,
    private eventService: EventService,
    private locationService: LocationService,
    private ApprovalService: ApprovalService,

  ) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.decodeToken();
    this.loadAllEvents();
    this.loadRegisteredEvents();
  }
showFilters: boolean = false;
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

  toggleFilters(): void {
  this.showFilters = !this.showFilters;
}

  loadAllEvents() {
    this.loadingService.show();
    this.eventService.getAllEvents().subscribe({
      next: (res) => {
        this.events = res;
        this.filteredEvents = [...this.events];
        this.extractFilterOptions();
        this.applySorting();
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

  loadRegisteredEvents() {
    if (!this.userId) return;
    this.eventService.getRegisteredEvents(this.userId).subscribe({
      next: (res) => {
        this.registeredEvents = res;
      },
      error: (err) => {
        console.error('Error loading registered events', err);
        this.showAlert('error', 'Loading Failed', 'Failed to load your registered events.');
      }
    });
  }

  registerForEvent(eventId: string) {
    const event = this.events.find(e => e._id === eventId);
    const eventTitle = event ? event.title : 'this event';

    this.showConfirmation(
      'Register for Event',
      `Are you sure you want to register for "${eventTitle}"?`,
      () => {
        const url = `${environment.apiBaseUrl}/events/register`;
        const payload = {
          userId: this.userId,
          eventId: eventId
        };

        this.loadingService.show();
        this.http.post(url, payload).subscribe({
          next: () => {
            this.loadRegisteredEvents();
            this.loadingService.hide();
            this.showAlert('success', 'Registration Successful', `You have successfully registered for "${eventTitle}"!`);
          },
          error: (err) => {
            console.error('Registration failed', err);
            this.loadingService.hide();
            this.showAlert('error', 'Registration Failed', 'Failed to register for the event. Please try again.');
          }
        });
      }
    );
  }


  deregister(userId: string, eventId: string) {
    const event = this.registeredEvents.find(e => e._id === eventId);
    const eventTitle = event ? event.title : 'this event';

    this.showConfirmation(
      'Confirm Deregistration',
      `Are you sure you want to deregister from "${eventTitle}"? This action cannot be undone.`,
      () => {
        const url = `${environment.apiBaseUrl}/events/deregister`;
        const payload = { userId, eventId };

        this.loadingService.show();
        this.http.request('delete', url, { body: payload }).subscribe({
          next: () => {
            this.loadRegisteredEvents();
            this.loadingService.hide();
            this.showAlert('success', 'Deregistration Successful', `You have been deregistered from "${eventTitle}".`);
          },
          error: (err) => {
            console.error('Deregistration failed', err);
            this.loadingService.hide();
            this.showAlert('error', 'Deregistration Failed', 'Failed to deregister from the event. Please try again.');
          }
        });
      },
      () => {
        this.showAlert('info', 'Deregistration Cancelled', 'You remain registered for the event.');
      }
    );
  }

  extractFilterOptions() {
    this.availableCategories = [...new Set(
      this.events.map(e => e.category).filter(Boolean)
    )].sort();

    this.availableCities = [...new Set(
      this.events.map(e => this.extractCityFromLocation(e.location)).filter(Boolean)
    )].sort();
  }

  extractCityFromLocation(location: string): string {
  if (!location) return '';
  const parts = location.split(',').map(part => part.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 1];
  } else {
    return parts[0];
  }
}

  decodeToken() {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
      const payloadBase64 = token.split('.')[1];
      const decoded = JSON.parse(atob(payloadBase64));
      this.userId = decoded.userId || null;
      this.userName = decoded.userName || null;
    } catch (err) {
      console.error('Token decode error:', err);
      this.userId = null;
      this.userName = null;
      this.showAlert('warning', 'Session Warning', 'There was an issue with your session. Please log in again if needed.');
    }
  }

  isRegistered(eventId: string): boolean {
    return this.registeredEvents.some(e => e._id === eventId);
  }

  // Filter logic
  onSearchChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.events];

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        (e.artist && e.artist.toLowerCase().includes(query)) ||
        (e.organization && e.organization.toLowerCase().includes(query)) ||
        (e.category && e.category.toLowerCase().includes(query)) ||
        e.location.toLowerCase().includes(query)
      );
    }

    if (this.selectedCategory) {
      filtered = filtered.filter(e => e.category === this.selectedCategory);
    }

    if (this.selectedCity) {
      filtered = filtered.filter(e => this.extractCityFromLocation(e.location) === this.selectedCity);
    }

    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      filtered = filtered.filter(e => new Date(e.date) >= fromDate);
    }

    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      filtered = filtered.filter(e => new Date(e.date) <= toDate);
    }

    if (this.selectedPriceRange) {
      filtered = this.applyPriceFilter(filtered);
    }

    this.filteredEvents = filtered;
    this.applySorting();
  }

  applyPriceFilter(events: Event[]): Event[] {
    switch (this.selectedPriceRange) {
      case '0-500':
        return events.filter(e => e.price <= 500);
      case '500-1000':
        return events.filter(e => e.price > 500 && e.price <= 1000);
      case '1000-2000':
        return events.filter(e => e.price > 1000 && e.price <= 2000);
      case '2000+':
        return events.filter(e => e.price > 2000);
      default:
        return events;
    }
  }

  applySorting() {
    this.filteredEvents.sort((a, b) => {
      switch (this.sortBy) {
        case 'date': return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'title': return a.title.localeCompare(b.title);
        case 'price': return a.price - b.price;
        case 'category': return (a.category || '').localeCompare(b.category || '');
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
    this.showAlert('info', 'Filters Cleared', 'All filters have been reset.');
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedCategory || this.selectedCity || this.dateFrom || this.dateTo || this.selectedPriceRange);
  }

  formatDateRange(): string {
    return this.dateFrom && this.dateTo
      ? `${this.formatDate(this.dateFrom)} - ${this.formatDate(this.dateTo)}`
      : this.dateFrom
        ? `From ${this.formatDate(this.dateFrom)}`
        : this.dateTo
          ? `Until ${this.formatDate(this.dateTo)}`
          : '';
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
    this.showConfirmation(
      'Download Ticket',
      `Generate and download ticket for "${event.title}"?`,
      () => {
        this.generateTicketPDF(event);
      }
    );
  }

  private generateTicketPDF(event: Event) {
  this.loadingService.show();
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Header Background
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, 60, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('EVENT TICKET', pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Entry Pass', pageWidth / 2, 45, { align: 'center' });

    // Reset text color for content
    doc.setTextColor(0, 0, 0);

    // Start content below header with more spacing
    let yPosition = 80;
    const lineHeight = 8;
    const sectionSpacing = 15;

    // Event details with better formatting
    const details = [
      { label: 'Event Name', value: event.title },
      { label: 'Description', value: event.description },
      { label: 'Date', value: this.formatDate(event.date) },
      { label: 'Time', value: event.timeSlot },
      { label: 'Duration', value: event.duration },
      { label: 'Location', value: event.location },
      { label: 'Category', value: event.category || 'General' },
      { label: 'Price', value: `${event.price}` },
      { label: 'Ticket Holder', value: this.userName || 'Guest' }
    ];

    details.forEach((detail, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 30;
      }

      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${detail.label}:`, margin, yPosition);

      // Value with text wrapping
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const labelWidth = 60;
      const valueX = margin + labelWidth;
      const maxValueWidth = contentWidth - labelWidth;

      // Handle long text with proper wrapping
      const splitText = doc.splitTextToSize(detail.value, maxValueWidth);
      doc.text(splitText, valueX, yPosition);

      // Calculate next position based on wrapped text
      const textHeight = Array.isArray(splitText) ? splitText.length * lineHeight : lineHeight;
      yPosition += Math.max(textHeight, lineHeight) + 5;
    });

    // Add some spacing before footer
    yPosition += sectionSpacing;

    // Separator line
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);

    // Footer
    yPosition += 15;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');

    const footerText1 = 'This is an official ticket. Please present this ticket at the event entrance.';
    doc.text(footerText1, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 10;
    const footerText2 = `Generated on: ${new Date().toLocaleString()}`;
    doc.text(footerText2, pageWidth / 2, yPosition, { align: 'center' });

    // Add ticket ID for authenticity
    yPosition += 10;
    const ticketId = `Ticket ID: ${Date.now()}-${event._id.slice(-6)}`;
    doc.text(ticketId, pageWidth / 2, yPosition, { align: 'center' });

    // Generate filename
    const fileName = `ticket-${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;

    // Save the PDF
    doc.save(fileName);

    this.loadingService.hide();
    this.showAlert('success', 'Ticket Downloaded', `Your ticket for "${event.title}" has been downloaded successfully!`);

  } catch (error) {
    console.error('Error generating ticket PDF:', error);
    this.loadingService.hide();
    this.showAlert('error', 'Download Failed', 'Failed to generate the ticket. Please try again.');
  }
}

scrollToRegisteredEvents() {
  const registeredSection = document.querySelector('.registered-section');
  if (registeredSection) {
    registeredSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

  logout() {
    this.showConfirmation(
      'Confirm Logout',
      'Are you sure you want to logout? You will need to login again to access your dashboard.',
      () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        window.location.href = '/';
      }
    );
  }
}
