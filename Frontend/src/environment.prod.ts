export const environment = {
  production: true,
  apiBaseUrl: 'https://happenin-byma.onrender.com/api',

  apis: {
    // Events
    getAllEvents: '/events',
    createEvent: '/events',
    getEventsByOrganizer: (organizerId: string) => `/events/${organizerId}`,
    updateEvent: (eventId: string) => `/events/${eventId}`,
    deleteEvent: (eventId: string) => `/events/${eventId}`,

    // Registrations
    getRegisteredUsers: (eventId: string) => `/events/registered-users/${eventId}`,
    removeUserFromEvent: (eventId: string, userId: string) => `/events/removeuser/${eventId}/users/${userId}`,

    // Locations
    fetchLocations: '/locations',
    addLocation: '/locations' ,


    //Approvals
    approveEvent:  `/approval/approve`,
    denyEvent: (eventId: string) => `/approval/deny/${eventId}`,
    viewApprovalRequests: '/approval/viewApproval',
    viewApprovalRequestById: (requestId: string) => `/approval/viewrequests/${requestId}`,

    //users
    registerUser: '/users/register',
    loginUser: '/users/login',
  }
};
