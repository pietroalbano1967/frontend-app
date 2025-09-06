import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface Ticker {
  symbol: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class TickersService {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) { }

  getMibTickers(): Observable<Ticker[]> {
    const fallbackTickers: Ticker[] = [
      { symbol: 'ENEL.MI', name: 'Enel' },
      { symbol: 'ENI.MI', name: 'Eni' },
      { symbol: 'G.MI', name: 'Generali' },
      { symbol: 'ISP.MI', name: 'Intesa Sanpaolo' },
      { symbol: 'UCG.MI', name: 'UniCredit' },
      { symbol: 'STM.MI', name: 'STMicroelectronics' },
      { symbol: 'SRG.MI', name: 'Snam' },
      { symbol: 'STLAM.MI', name: 'Stellantis' },
      { symbol: 'TIT.MI', name: 'Telecom Italia' },
      { symbol: 'AZM.MI', name: 'Azimut' }
    ];

    try {
      return this.http.get<Ticker[]>(`${this.apiUrl}/api/mib-tickers`);
    } catch (error) {
      return of(fallbackTickers);
    }
  }
}