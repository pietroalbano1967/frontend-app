import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration } from 'chart.js/auto';

// Importa CORRETTAMENTE i servizi - verifica il percorso!
import { PredictionsService, StockData, PredictionResponse } from '../../services/prediction.service';
import { TickersService, Ticker } from '../../services/tickers.service';

@Component({
  selector: 'app-predict',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './predict.component.html',
  styleUrls: ['./predict.component.scss']
})
export class PredictComponent implements OnInit {
  selectedTicker = 'ENEL.MI';
  stockData: StockData[] = [];
  prediction: PredictionResponse | null = null;
  chart: Chart | null = null;
  tickers: Ticker[] = [];
  isLoading = false;

  constructor(
    private predictionsService: PredictionsService,
    private tickersService: TickersService
  ) {}

  ngOnInit(): void {
    this.loadTickers();
    this.loadStockData();
  }

  loadTickers(): void {
    this.tickersService.getMibTickers().subscribe({
      next: (tickers: Ticker[]) => {
        this.tickers = tickers;
      },
      error: (err: any) => {
        console.error('Error loading tickers:', err);
        // Fallback manuale
        this.tickers = [
          { symbol: 'ENEL.MI', name: 'Enel' },
          { symbol: 'ENI.MI', name: 'Eni' },
          { symbol: 'G.MI', name: 'Generali' }
        ];
      }
    });
  }

  loadStockData(): void {
    this.isLoading = true;
    this.predictionsService.getStockData(this.selectedTicker).subscribe({
      next: (response: {data: StockData[]}) => {
        this.stockData = response.data;
        this.createChart();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading stock data:', err);
        this.isLoading = false;
      }
    });
  }

  predict(): void {
    this.isLoading = true;
    this.predictionsService.predictStock({
      ticker: this.selectedTicker,
      forecast_days: 10
    }).subscribe({
      next: (prediction: PredictionResponse) => {
        this.prediction = prediction;
        this.updateChartWithPrediction();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Prediction error:', err);
        this.isLoading = false;
      }
    });
  }

  createChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.stockData.map(d => d.date),
        datasets: [{
          label: 'Prezzo di Chiusura',
          data: this.stockData.map(d => d.close),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Andamento ${this.selectedTicker}`
          }
        }
      }
    };

    this.chart = new Chart('stock-chart', config);
  }

  updateChartWithPrediction(): void {
    if (!this.prediction || !this.chart) return;

    this.chart.data.datasets.push({
      label: 'Predizioni',
      data: [...Array(this.stockData.length - this.prediction.predicted.length).fill(null), ...this.prediction.predicted],
      borderColor: 'rgb(255, 99, 132)',
      borderDash: [5, 5],
      tension: 0.1
    });

    this.chart.update();
  }

  onTickerChange(newTicker: string): void {
    this.selectedTicker = newTicker;
    this.loadStockData();
  }
}