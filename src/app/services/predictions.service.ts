import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class PredictionsService {
  private baseUrl = 'http://localhost:3000/api';

  async predict(ticker: string, lookback: number, stepMinutes: number) {
    const res = await axios.post(`${this.baseUrl}/predictions/predict`, {
      ticker,
      lookback,
      step_minutes: stepMinutes
    });
    return res.data;
  }

  async latest(ticker: string) {
    const res = await axios.get(`${this.baseUrl}/predictions/latest?ticker=${ticker}`);
    return res.data;
  }

  async history(ticker: string, limit: number) {
    const res = await axios.get(`${this.baseUrl}/predictions/history?ticker=${ticker}&limit=${limit}`);
    return res.data;
  }
}
