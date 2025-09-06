import { Routes } from '@angular/router';
import { PredictComponent } from './component/predict/predict.component';

export const routes: Routes = [
  { path: '', component: PredictComponent },
  { path: 'predict', component: PredictComponent }
];