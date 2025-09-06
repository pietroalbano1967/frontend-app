import { Injectable } from '@angular/core';
import { api } from '../api/axios';

export interface PredictIn { ticker: string; lookback?: number; step_minutes?: number; }
export interface PredictOut { ticker: string; ts: string; yhat: number; model: string; n_obs: number; lookback_used: number; }
export interface LatestOut { ticker: string; ts: string; yhat: number; model: string; created_at: string | null; }

@Injectable({ providedIn: 'root' })
export class PredictionsService {
  predict(body: PredictIn) {
    return api.post<PredictOut>('/predictions/predict', body).then(r => r.data);
  }
  latest(ticker: string) {
    return api.get<LatestOut>('/predictions/latest', { params: { ticker } }).then(r => r.data);
  }
  history(ticker: string, limit = 20) {
  return api.get<any[]>('/predictions/history', { params: { ticker, limit } }).then(r => r.data);
}

}
