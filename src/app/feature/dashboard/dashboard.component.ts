import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { routes } from '../../app.routes';
import {
  animate,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { filter } from 'rxjs/operators';

function isAuthPath(path: string): boolean {
  return path.startsWith('/login') || path.startsWith('/register');
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SideBarComponent, RouterOutlet, routes],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  animations: [
    trigger('routeAnimations', [
      transition('loginPage <=> registerPage', [
        style({ position: 'relative' }),
        query(
          ':enter, :leave',
          [
            style({
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }),
          ],
          { optional: true },
        ),
        query(
          ':enter',
          [style({ opacity: 0, transform: 'translateX(18px)' })],
          { optional: true },
        ),
        query(
          ':leave',
          [animate('220ms ease', style({ opacity: 0, transform: 'translateX(-18px)' }))],
          { optional: true },
        ),
        query(
          ':enter',
          [
            animate(
              '260ms 40ms cubic-bezier(0.22, 1, 0.36, 1)',
              style({ opacity: 1, transform: 'translateX(0)' }),
            ),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
})
export class DashboardComponent {
  private readonly router = inject(Router);

  readonly isLoginRoute = signal(isAuthPath(window.location.pathname));

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.isLoginRoute.set(isAuthPath(e.urlAfterRedirects));
      });
  }

  prepareRoute(outlet: RouterOutlet): string {
    return outlet.activatedRouteData['animation'] ?? '';
  }
}
