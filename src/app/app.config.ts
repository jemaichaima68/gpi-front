import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import {
  provideKeycloak,
  withAutoRefreshToken,
  AutoRefreshTokenService,
  UserActivityService,
  includeBearerTokenInterceptor,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG
} from 'keycloak-angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { ConfirmationService, MessageService } from 'primeng/api';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [

    provideRouter(routes),

    provideHttpClient(
      withInterceptors([includeBearerTokenInterceptor])
    ),

    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: [
        {
          urlPattern:  /^(http:\/\/localhost:8081)(\/.*)?$/,
          httpMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        },
      ]
    },

    provideAnimations(),

    provideIonicAngular(),

    providePrimeNG({
      theme: {
        preset: Aura,
        options: { darkModeSelector: false }
      }
    }),

    provideKeycloak({
      config: {
        url:      environment.keycloakUrl,
        realm:    'gpi-tracker-realm',
        clientId: 'gpi-tracker-frontend'
      },
      initOptions: {
        // ❌ redirectUri supprimé — la redirection est gérée par rootRedirectGuard
        // selon le rôle Keycloak de l'utilisateur connecté
        onLoad:                 'login-required',
        checkLoginIframe:       false,
        pkceMethod:             'S256',
        responseMode:           'fragment',
        flow:                   'standard',
        silentCheckSsoFallback: false,
        enableLogging:          true,
      },
      features: [
        withAutoRefreshToken({
          onInactivityTimeout: 'logout',
          sessionTimeout:      300000
        })
      ]
    }),

    AutoRefreshTokenService,
    UserActivityService,
    MessageService,
    ConfirmationService,

    provideServiceWorker('ngsw-worker.js', {
      enabled:              !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};