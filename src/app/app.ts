import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('gpi-tracker-ui');

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.authService.redirectByRole();
    }
  }
}