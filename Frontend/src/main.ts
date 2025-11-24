import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

// Exponer variables de environment en window.__env para que componentes runtime las lean
(window as any).__env = (window as any).__env || {};
Object.assign((window as any).__env, environment);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
