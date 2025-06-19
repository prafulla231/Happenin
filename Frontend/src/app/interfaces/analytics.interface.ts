// interfaces/analytics.interface.ts
export interface EventAnalytics {
  totalEvents: number;
  upcomingEvents: number;
  expiredEvents: number;
  totalRegistrations: number;
  eventsByCategory: { [key: string]: number };
  eventsByMonth: { [key: string]: number };
  registrationsByEvent: { eventTitle: string; registrations: number }[];
  revenueByEvent: { eventTitle: string; revenue: number }[];
}

export interface AdminAnalytics {
  totalUsers: number;
  totalOrganizers: number;
  totalEvents: number;
  pendingApprovals: number;
  userRegistrationsByMonth: { [key: string]: number };
  eventsByCategory: { [key: string]: number };
  topEvents: { eventTitle: string; registrations: number }[];
  revenueStats: {
    totalRevenue: number;
    monthlyRevenue: { [key: string]: number };
  };
}

export interface UserAnalytics {
  totalRegistrations: number;
  upcomingEvents: number;
  pastEvents: number;
  favoriteCategories: { [key: string]: number };
  registrationsByMonth: { [key: string]: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
