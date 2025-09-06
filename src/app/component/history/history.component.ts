import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PredictionsService } from '../../services/predictions.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, Chart } from 'chart.js';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  tickers = ['AAPL', 'MSFT', 'NVDA'];
  ticker = this.tickers[0];
  limit = 10;
  rows: any[] = [];

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'yhat',
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.1)',
      fill: true,
      tension: 0.2,
      pointRadius: 3
    }]
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        display: true,
        position: 'top'
      } 
    },
    scales: {
      x: { 
        ticks: { 
          autoSkip: true, 
          maxRotation: 45,
          font: {
            size: 11
          }
        } 
      },
      y: { 
        beginAtZero: false,
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  constructor(private api: PredictionsService) {}

  async ngOnInit() { 
    await this.load(); 
  }

  async load() {
    try {
      this.rows = await this.api.history(this.ticker, this.limit);
      
      // Crea nuovi array per forzare l'aggiornamento
      const newLabels = this.rows.map(r => new Date(r.ts).toLocaleDateString('it-IT'));
      const newData = this.rows.map(r => r.yhat);
      
      // Aggiorna i dati mantenendo la reference dell'oggetto
      this.lineChartData = {
        ...this.lineChartData,
        labels: newLabels,
        datasets: [{
          ...this.lineChartData.datasets[0],
          data: newData
        }]
      };

    } catch (error) {
      console.error('Errore nel caricamento dati:', error);
    }
  }
}