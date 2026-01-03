import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app.component';
import { provideZonelessChangeDetection } from '@angular/core';
import { GEMINI_API_KEY } from './src/api.key';

// Polyfill process.env so the service can access the API Key securely
(window as any).process = {
  env: {
    API_KEY: GEMINI_API_KEY
  }
};

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection()
  ]
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
