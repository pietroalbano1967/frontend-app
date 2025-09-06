import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { PredictComponent } from './component/predict/predict.component';
import { HistoryComponent } from './component/history/history.component';

const routes: Routes = [
  { path: '', redirectTo: 'predict', pathMatch: 'full' },
  { path: 'predict', component: PredictComponent },
  { path: 'history', component: HistoryComponent },
  { path: '**', redirectTo: 'predict' }
];

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)]
};
