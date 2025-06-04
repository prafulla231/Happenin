import './polyfills';  // Must be first
import { HttpClientModule } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';  // <-- import this
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, {
  providers: [
    appConfig,
    importProvidersFrom(HttpClientModule)  // <-- add HttpClientModule here
  ]
});
