import { Routes } from '@angular/router';
import { OrganizerDashboardComponent } from './components/organizer-dashboard/organizer-dashboard';
import { UserDashboardComponent } from './components/user-dashboard/user-dashboard';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { AuthGuard } from './components/auth.guard'; // Create this file as above

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/home/home').then(m => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./components/auth/login/login').then(m => m.LoginComponent) },

  {
    path: 'organizer-dashboard',
    component: OrganizerDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'organizer' }
  },
  {
    path: 'user-dashboard',
    component: UserDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'user' }
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'admin' }
  }
];
