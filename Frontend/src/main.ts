// main.ts
import './polyfills';  // Must be first
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';
import { LoadingInterceptor } from './app/components/loading.interceptor';
import { LoadingService } from './app/components/loading';

bootstrapApplication(AppComponent, {
  providers: [
    appConfig,
    importProvidersFrom(HttpClientModule),
    LoadingService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    }
  ]
});
