import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './shared/helpers/interceptors/jwt-interceptor';
import { refreshInterceptor } from './shared/helpers/interceptors/refresh-interceptor';
import localeEsCR from '@angular/common/locales/es-CR';
import { registerLocaleData } from '@angular/common';
import { LOCALE_ID } from '@angular/core';

registerLocaleData(localeEsCR);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor, refreshInterceptor])),

    { provide: LOCALE_ID, useValue: 'es-CR' }
  ]
};
