import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="navbar">
      <nav>
        <a routerLink="/predict" routerLinkActive="active">Predict</a>
        <a routerLink="/history" routerLinkActive="active">History</a>
      </nav>
    </header>
    <main class="container">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .navbar {
      background: #1f2937;
      padding: 10px 20px;
    }
    nav a {
      color: #f9fafb;
      margin-right: 16px;
      text-decoration: none;
      font-weight: 500;
    }
    nav a.active {
      text-decoration: underline;
    }
    .container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class App {}
