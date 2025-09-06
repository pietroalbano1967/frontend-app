import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, Scale } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { PredictionsService as PredictService, StockData, PredictionResponse } from '../../services/prediction.service'; // Assicurati che il percorso sia corretto
import { Ticker } from '../../services/tickers.service';
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

  // Metodi per lo zoom
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
      const container = this.chartContainer.nativeElement;
      container.style.transform = `scale(${this.zoomLevel})`;
      container.style.transformOrigin = 'center center';
    }
  }

  // Gestione zoom con mouse wheel solo sul grafico
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

  // Metodi esistenti
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
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          fill: true,
          tension: 0.1,
          pointRadius: 3,
          pointHoverRadius: 6
        }]
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
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true
              },
              mode: 'xy'
            }
          }
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
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

  onTickerChange(newTicker: string): void {
    this.selectedTicker = newTicker;
    this.loadStockData();
  }

  predict(): void {
    this.isLoading = true;
    this.predictService.predictStock({
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
}