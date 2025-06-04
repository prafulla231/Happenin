import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login';
import { RegisterComponent } from './components/auth/register/register';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/auth/login/login').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/auth/register/register').then(m => m.RegisterComponent) }
];
