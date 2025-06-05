import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { AuthGuard } from './components/auth.guard';

export const appConfig = [
  provideRouter(routes),
  provideHttpClient(),
  AuthGuard
];
