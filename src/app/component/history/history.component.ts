import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PredictionsService } from '../../services/predictions.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

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
    plugins: { legend: { display: true } },
    scales: {
      x: { ticks: { autoSkip: true, maxRotation: 45 } },
      y: { beginAtZero: false }
    }
  };

  constructor(private api: PredictionsService) {}

  async ngOnInit() { await this.load(); }

  async load() {
    this.rows = await this.api.history(this.ticker, this.limit);
    this.lineChartData.labels = this.rows.map(r => new Date(r.ts).toLocaleDateString());
    this.lineChartData.datasets[0].data = this.rows.map(r => r.yhat);
  }
}
