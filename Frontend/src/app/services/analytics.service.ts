// services/analytics.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EventAnalytics, AdminAnalytics, UserAnalytics, ApiResponse } from '../interfaces/analytics.interface';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = 'http://localhost:5000/api'; // Update with your actual API URL

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('Analytics Service Error:', error);
    const errorMessage = error.error?.message || 'An error occurred while fetching analytics data';
    return throwError(() => new Error(errorMessage));
  }

  getOrganizerAnalytics(organizerId: string): Observable<EventAnalytics> {
    const headers = this.getHeaders();
    return this.http.get<ApiResponse<EventAnalytics>>(
      `${this.apiUrl}/analytics/organizer/${organizerId}`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  getAdminAnalytics(): Observable<AdminAnalytics> {
    const headers = this.getHeaders();
    return this.http.get<ApiResponse<AdminAnalytics>>(
      `${this.apiUrl}/analytics/admin`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  getUserAnalytics(userId: string): Observable<UserAnalytics> {
    const headers = this.getHeaders();
    return this.http.get<ApiResponse<UserAnalytics>>(
      `${this.apiUrl}/analytics/user/${userId}`,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  refreshAnalytics(type: 'organizer' | 'admin' | 'user', id?: string): Observable<any> {
    const headers = this.getHeaders();
    const endpoint = id ? `${this.apiUrl}/analytics/${type}/${id}/refresh` : `${this.apiUrl}/analytics/${type}/refresh`;

    return this.http.post<ApiResponse<any>>(endpoint, {}, { headers }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }
}
