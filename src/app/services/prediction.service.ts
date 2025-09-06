import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Ticker } from '../services/tickers.service';
export interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PredictionRequest {
  ticker: string;
  days_back?: number;
  forecast_days?: number;
}

export interface PredictionResponse {
  actual: number[];
  predicted: number[];
  dates: string[];
  confidence: number;
}
// Aggiungi questa interfaccia per i dati storici
export interface PredictionHistory {
  ts: string;
  ticker: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
  created_at: string;
}
@Injectable({
  providedIn: 'root'
})
export class PredictionsService {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) { }

  getStockData(ticker: string, days: number = 365): Observable<{data: StockData[]}> {
    return this.http.get<{data: StockData[]}>(`${this.apiUrl}/api/stocks/${ticker}?days=${days}`);
  }

  predictStock(request: PredictionRequest): Observable<PredictionResponse> {
    return this.http.post<PredictionResponse>(`${this.apiUrl}/api/predict`, request);
  }

  // AGGIUNGI QUESTO METODO MANCANTE
  history(ticker: string, limit: number = 10): Observable<PredictionHistory[]> {
    return this.http.get<PredictionHistory[]>(
      `${this.apiUrl}/api/history/${ticker}?limit=${limit}`
    );
  }

  // Metodo alternativo se preferisci un endpoint diverso
  getPredictionHistory(ticker: string, limit: number = 10): Observable<PredictionHistory[]> {
    return this.http.get<PredictionHistory[]>(
      `${this.apiUrl}/api/predictions/history?ticker=${ticker}&limit=${limit}`
    );
  }
  // ASSICURATI CHE QUESTO METODO ESISTA
  getMibTickers(): Observable<Ticker[]> {
    const fallbackTickers: Ticker[] = [
      { symbol: 'ENEL.MI', name: 'Enel' },
      { symbol: 'ENI.MI', name: 'Eni' },
      { symbol: 'G.MI', name: 'Generali' },
      { symbol: 'ISP.MI', name: 'Intesa Sanpaolo' },
      { symbol: 'UCG.MI', name: 'UniCredit' }
    ];

    try {
      return this.http.get<Ticker[]>(`${this.apiUrl}/api/mib-tickers`);
    } catch (error) {
      return of(fallbackTickers);
    }
  }
}