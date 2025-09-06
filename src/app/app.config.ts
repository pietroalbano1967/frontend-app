import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes, withInMemoryScrolling } from '@angular/router';
import { PredictComponent } from './component/predict/predict.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'predict' },
  { path: 'predict', component: PredictComponent },
  { path: '**', redirectTo: 'predict' }
];

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled' }))]
};
