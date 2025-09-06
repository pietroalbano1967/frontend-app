import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { api } from '../../api/axios';

type PredictOut = {
  ticker: string; ts: string; yhat: number; model: string; n_obs: number; lookback_used: number;
};
type LatestOut = {
  ticker: string; ts: string; yhat: number; model: string; created_at: string | null;
};

@Component({
  selector: 'app-predict',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './predict.component.html',
  styleUrls: ['./predict.component.scss']
})
export class PredictComponent {
  ticker = 'AAPL';
  lookback = 200;
  stepMinutes = 5;

  loading = false;
  pred?: PredictOut;
  latest?: LatestOut;
  error?: string;

  async doPredict() {
    this.error = undefined; this.loading = true;
    try {
      const { data } = await api.post<PredictOut>('/predictions/predict', {
        ticker: this.ticker, lookback: this.lookback, step_minutes: this.stepMinutes
      });
      this.pred = data;
    } catch (e: any) {
      this.error = typeof e === 'string' ? e : JSON.stringify(e);
    } finally { this.loading = false; }
  }

  async loadLatest() {
    this.error = undefined; this.loading = true;
    try {
      const { data } = await api.get<LatestOut>('/predictions/latest', { params: { ticker: this.ticker } });
      this.latest = data;
    } catch (e: any) {
      this.error = typeof e === 'string' ? e : JSON.stringify(e);
    } finally { this.loading = false; }
  }
}
