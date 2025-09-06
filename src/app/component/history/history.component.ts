import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { PredictionsService, PredictionHistory } from '../../services/prediction.service'; // Assicurati che il percorso sia corretto

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  // Cambia i ticker con quelli italiani
  tickers = ['ENEL.MI', 'ENI.MI', 'G.MI', 'ISP.MI', 'UCG.MI'];
  ticker = this.tickers[0];
  limit = 10;
  rows: PredictionHistory[] = []; // Usa l'interfaccia corretta

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Previsione (yhat)',
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

  constructor(private predictionsService: PredictionsService) {} // Nome corretto del servizio

  async ngOnInit() { 
    await this.load(); 
  }

  async load() {
    try {
      // Usa il metodo history() che ora esiste
      this.rows = await this.predictionsService.history(this.ticker, this.limit).toPromise() || [];
      
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