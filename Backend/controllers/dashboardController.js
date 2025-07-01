import { apiResponse } from '../utils/apiResponse.js';
import { apiError } from '../utils/apiError.js';

export const dashboardRedirect = (req, res) => {
  const role = req.userRole;

  switch (role) {
    case 'admin':
      return apiResponse(res, 200, 'Redirecting to admin', { redirectTo: '/admin-dashboard' });
    case 'organizer':
      return apiResponse(res, 200, 'Redirecting to organizer', { redirectTo: '/organizer-dashboard' });
    case 'user':
      return apiResponse(res, 200, 'Redirecting to user', { redirectTo: '/user-dashboard' });
    default:
      return apiError(res, 403, 'Unknown role');
  }
};
