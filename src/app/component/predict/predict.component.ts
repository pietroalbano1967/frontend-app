import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { PredictionsService as PredictService, StockData, PredictionResponse } from '../../services/prediction.service';
import { Ticker } from '../../services/tickers.service';
import { firstValueFrom } from 'rxjs';
import 'chartjs-adapter-date-fns';

// Registra plugin
Chart.register(zoomPlugin);

// Tipo locale con date vere in memoria UI
type UIStock = {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

// Tipo per dataset XY numerico (timestamp, valore)
type XYPoint = { x: number; y: number };

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
  stockData: UIStock[] = [];
  prediction: PredictionResponse | null = null;
  chart: Chart<'line', XYPoint[], number> | null = null;
  tickers: Ticker[] = [];
  isLoading = false;

  // Mostriamo solo dal 2025 in poi
  private readonly fromDate2025 = new Date('2025-01-01');

  // Zoom UI
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
    if (this.chart) this.chart.destroy();
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

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('.chart-zoom-container')) {
      event.preventDefault();
      if (event.deltaY < 0) this.zoomIn();
      else this.zoomOut();
    }
  }

  // -----------------------
  //      DATI / TICKERS
  // -----------------------
  loadTickers(): void {
    this.predictService.getMibTickers().subscribe({
      next: (tickers: Ticker[]) => (this.tickers = tickers),
      error: () => {
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
        // Converti string -> Date e filtra solo 2025+
        const asDates: UIStock[] = response.data.map(d => ({
          ...d,
          date: new Date(d.date)
        }));
        this.stockData = asDates.filter(r => r.date >= this.fromDate2025);
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
        index === 0 ? this.stockData[this.stockData.length - 1]?.close : this.prediction!.predicted[index - 1];
      const change = previousValue ? ((predicted - previousValue) / previousValue) * 100 : 0;
      return {
        date,
        predicted,
        changePercentage: change.toFixed(2),
        changeClass: change >= 0 ? 'positive' : 'negative'
      };
    });
  }

  getBullishDays(): number {
    if (!this.prediction) return 0;
    return this.prediction.predicted.filter((v, i, a) => i === 0 || v > a[i - 1]).length;
  }

  getBearishDays(): number {
    if (!this.prediction) return 0;
    return this.prediction.predicted.filter((v, i, a) => i > 0 && v < a[i - 1]).length;
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
  if (this.chart) this.chart.destroy();

  const historicalXY = this.stockData.map(p => ({ x: p.date.getTime(), y: p.close }));

  const config: ChartConfiguration<'line', XYPoint[], number> = {
    type: 'line',
    data: {
      datasets: [{
        label: 'Prezzo',
        data: historicalXY,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.08)',
        borderWidth: 2,
        tension: 0.2,
        pointRadius: 2,
        pointHoverRadius: 5,
        fill: true
      } as any]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      normalized: true,
      animation: false,
      plugins: {
        legend: { display: true, position: 'top' },
        title: { display: true, text: `Andamento ${this.selectedTicker} (dal 2025 + 5 giorni previsione)` },
        zoom: { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' } },
        decimation: { enabled: true, algorithm: 'lttb', samples: 500 }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            tooltipFormat: 'dd/MM/yyyy',
            displayFormats: { day: 'dd/MM', month: 'MMM yyyy' }
          },
          min: this.fromDate2025.getTime()     // parte dal 2025
          // max lo imposteremo solo dopo la predizione
        },
        y: { beginAtZero: false, ticks: { precision: 2 } }
      },
      interaction: { mode: 'index', intersect: false }
    }
  };

  this.chart = new Chart<'line', XYPoint[], number>('stock-chart', config);
}


  // -----------------------
  //       EVENTI UI
  // -----------------------
  onTickerChange(nextTicker: string): void {
    this.selectedTicker = nextTicker;
    this.resetPredictionView(); // azzera tabella + serie "Predicted"
    this.loadStockData(); // ricarica SOLO storici del nuovo ticker
  }

  private resetPredictionView(): void {
  this.prediction = null;
  if (!this.chart) return;

  const histXY = this.stockData.map(p => ({ x: p.date.getTime(), y: p.close }));
  const ds0 = this.chart.data.datasets[0] as any;
  ds0.data = histXY;

  // rimuovi eventuali stilizzazioni segment/point scriptable
  ds0.segment = undefined;
  ds0.pointRadius = 2;
  ds0.pointHoverRadius = 5;

  (this.chart.options!.scales!['x'] as any).min = this.fromDate2025.getTime();
  (this.chart.options!.scales!['x'] as any).max = undefined;

  this.chart.update();
}


  async predict() {
  try {
    this.isLoading = true;

    const req = { ticker: this.selectedTicker, days_back: 365, forecast_days: 5 };
    const res = await firstValueFrom(this.predictService.predictStock(req));
    this.prediction = res;

    if (!this.chart) return;

    // Future dates come timestamp (forzate a mezzanotte locale per evitare slittamenti)
    const futureTs = this.prediction.dates.map(d => new Date(`${d}T00:00:00`).getTime());
    const futureXY: XYPoint[] = futureTs.map((t, i) => ({ x: t, y: this.prediction!.predicted[i] }));

    // Storico attuale (già presente nel dataset 0)
    const histXY = this.stockData.map(p => ({ x: p.date.getTime(), y: p.close }));

    // Merge in un unico dataset
    const merged = [...histXY, ...futureXY];
    const firstFutureX = futureTs[0];
    const lastFutureX  = futureTs[futureTs.length - 1];

    // Sostituisci il dataset 0 con quello unificato
    const ds0 = this.chart.data.datasets[0] as any;
    ds0.label = 'Prezzo';
    ds0.data  = merged;

    // Stile “dinamico” per la parte futura: tratteggio e niente marker
    ds0.segment = {
      borderDash: (ctx: any) => (ctx.p1.parsed.x >= firstFutureX ? [6, 4] : undefined)
    };
    ds0.pointRadius = (ctx: any) => (ctx.parsed.x >= firstFutureX ? 0 : 2);
    ds0.pointHoverRadius = (ctx: any) => (ctx.parsed.x >= firstFutureX ? 0 : 5);

    // Allarga l’asse X per includere TUTTI i giorni futuri (+ 1 giorno di margine visivo)
    const pad = 24 * 60 * 60 * 1000; // 1 giorno in ms
    (this.chart.options!.scales!['x'] as any).min = this.fromDate2025.getTime();
    (this.chart.options!.scales!['x'] as any).max = lastFutureX + pad;

    this.chart.update();
  } finally {
    this.isLoading = false;
  }
}

}
