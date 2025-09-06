import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PredictionsService } from '../../services/predictions.service';

@Component({
  selector: 'app-predict',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './predict.component.html',
  styleUrls: ['./predict.component.scss']
})
export class PredictComponent {
  tickers = ['AAPL', 'MSFT', 'NVDA'];
  ticker = this.tickers[0];
  lookback = 200;
  stepMinutes = 5;

  result: any;
  lastSaved: any;
  loading = false;

  constructor(private api: PredictionsService) {}

  async predict() {
    this.loading = true;
    try {
      this.result = await this.api.predict(this.ticker, this.lookback, this.stepMinutes);
      this.lastSaved = await this.api.latest(this.ticker);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }
}
