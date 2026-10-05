import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { adminAuthInterceptor } from './interceptors/admin-auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(), // bind route params/data directly to @Input()
      withViewTransitions(),        // enable the View Transitions API for route navigation
    ),
    // Angular 19+: provideClientHydration must include withEventReplay()
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withInterceptors([adminAuthInterceptor]),
    ),
  ],
};
