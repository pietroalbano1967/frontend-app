import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <header class="topbar">
      <a routerLink="/predict">Predict</a>
    </header>
    <main class="container">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .topbar{padding:10px;border-bottom:1px solid #eee}
    .container{padding:16px;max-width:960px;margin:0 auto}
    a{margin-right:12px}
  `]
})
export class App {}
