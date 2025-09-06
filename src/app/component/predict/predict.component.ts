import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { PredictionsService as PredictService, StockData, PredictionResponse } from '../../services/prediction.service'; // <-- path conforme al tuo progetto
import { Ticker } from '../../services/tickers.service';
import { firstValueFrom } from 'rxjs';

// Registra il plugin
Chart.register(zoomPlugin);

@Component({
  selector: 'app-predict',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './predict.component.html',
  styleUrls: ['./predict.component.scss']
})
export class PredictComponent implements OnInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer!: ElementRef;

  selectedTicker = 'ENEL.MI';
  stockData: StockData[] = [];
  prediction: PredictionResponse | null = null;
  chart: Chart | null = null;
  tickers: Ticker[] = [];
  isLoading = false;

  // Variabili per lo zoom
  private zoomLevel = 1;
  private readonly maxZoom = 3;
  private readonly minZoom = 0.5;
  private readonly zoomStep = 0.2;

  constructor(private predictService: PredictService) {}

  ngOnInit(): void {
    this.loadTickers();
    this.loadStockData();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  // -----------------------
  //        ZOOM
  // -----------------------
  zoomIn(): void {
    if (this.zoomLevel < this.maxZoom) {
      this.zoomLevel += this.zoomStep;
      this.applyZoom();
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > this.minZoom) {
      this.zoomLevel -= this.zoomStep;
      this.applyZoom();
    }
  }

  resetZoom(): void {
    this.zoomLevel = 1;
    this.applyZoom();
  }

  private applyZoom(): void {
    if (this.chartContainer) {
      const container = this.chartContainer.nativeElement as HTMLElement;
      container.style.transform = `scale(${this.zoomLevel})`;
      container.style.transformOrigin = 'center center';
    }
  }

  // Zoom con wheel solo nell'area grafico
  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('.chart-zoom-container')) {
      event.preventDefault();
      if (event.deltaY < 0) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    }
  }

  // -----------------------
  //      DATI / TICKERS
  // -----------------------
  loadTickers(): void {
    this.predictService.getMibTickers().subscribe({
      next: (tickers: Ticker[]) => {
        this.tickers = tickers;
      },
      error: (err: any) => {
        console.error('Error loading tickers:', err);
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
    this.predictService.getStockData(this.selectedTicker).subscribe({
      next: (response: { data: StockData[] }) => {
        this.stockData = response.data ?? [];
        this.createChart();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading stock data:', err);
        this.isLoading = false;
      }
    });
  }

  // -----------------------
  //     TABELLA PREVISIONI
  // -----------------------
  getPredictionTableData(): any[] {
    if (!this.prediction) return [];

    return this.prediction.dates.map((date, index) => {
      const predicted = this.prediction!.predicted[index];
      const previousValue =
        index === 0
          ? this.stockData[this.stockData.length - 1]?.close
          : this.prediction!.predicted[index - 1];

      const change = previousValue ? ((predicted - previousValue) / previousValue) * 100 : 0;

      return {
        date: date,
        predicted: predicted,
        changePercentage: change.toFixed(2),
        changeClass: change >= 0 ? 'positive' : 'negative'
      };
    });
  }

  getBullishDays(): number {
    if (!this.prediction) return 0;
    return this.prediction.predicted.filter((value, index, array) => {
      return index === 0 || value > array[index - 1];
    }).length;
  }

  getBearishDays(): number {
    if (!this.prediction) return 0;
    return this.prediction.predicted.filter((value, index, array) => {
      return index > 0 && value < array[index - 1];
    }).length;
  }

  getAveragePrediction(): number {
    if (!this.prediction || this.prediction.predicted.length === 0) return 0;
    const sum = this.prediction.predicted.reduce((acc, val) => acc + val, 0);
    return sum / this.prediction.predicted.length;
  }

  // -----------------------
  //        GRAFICO
  // -----------------------
  createChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.stockData.map(d => d.date),
        datasets: [
          {
            label: 'Prezzo di Chiusura',
            data: this.stockData.map(d => d.close),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            fill: true,
            tension: 0.1,
            pointRadius: 3,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Andamento ${this.selectedTicker}`,
            font: { size: 16 }
          },
          legend: {
            display: true,
            position: 'top'
          },
          zoom: {
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: 'xy'
            }
          }
        },
        scales: {
          x: {
            ticks: { maxRotation: 45, minRotation: 45 }
          },
          y: {
            beginAtZero: false
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        }
      }
    };

    this.chart = new Chart('stock-chart', config);
  }

  updateChartWithPrediction(): void {
    if (!this.prediction || !this.chart) return;

    // (opzionale) prevedi allineamento sulle labels esistenti
    this.chart.data.datasets.push({
      label: 'Predicted', // <— stessa label usata nel reset
      data: [
        ...Array(Math.max(0, this.stockData.length - this.prediction.predicted.length)).fill(null),
        ...this.prediction.predicted
      ],
      borderColor: 'rgb(255, 99, 132)',
      borderDash: [5, 5],
      tension: 0.1
    });

    this.chart.update();
  }

  // -----------------------
  //       EVENTI UI
  // -----------------------
  onTickerChange(nextTicker: string): void {
    this.selectedTicker = nextTicker;
    this.resetPredictionView(); // azzera tabella + serie "Predicted"
    this.loadStockData();       // ricarica SOLO storici del nuovo ticker
  }

  private resetPredictionView(): void {
    // Azzera oggetto predizione (nasconde la tabella grazie a *ngIf="prediction")
    this.prediction = null;

    // Rimuove eventuale dataset "Predicted" dal grafico mantenendo gli storici
    if (!this.chart) return;

    const dsIndex = this.chart.data.datasets.findIndex((ds: any) => ds.label === 'Predicted');
    if (dsIndex !== -1) {
      this.chart.data.datasets.splice(dsIndex, 1);
      this.chart.update();
    }
  }

  async predict() {
    try {
      this.isLoading = true;

      const req = {
        ticker: this.selectedTicker,
        days_back: 365,   // opzionale
        forecast_days: 5  // opzionale
      };

      // Usa il service corretto e firstValueFrom (no toPromise)
      const res = await firstValueFrom(this.predictService.predictStock(req));
      this.prediction = res;

      // aggiorna/aggiungi dataset “Predicted” nel grafico
      if (this.chart) {
        const oldIdx = this.chart.data.datasets.findIndex((ds: any) => ds.label === 'Predicted');
        if (oldIdx !== -1) this.chart.data.datasets.splice(oldIdx, 1);

        this.chart.data.datasets.push({
          label: 'Predicted',
          data: this.prediction.predicted,
          borderWidth: 2,
          fill: false
        });

        this.chart.update();
      }
    } finally {
      this.isLoading = false;
    }
  }
}
