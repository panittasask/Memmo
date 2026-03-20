import { Routes } from '@angular/router';
import { authGuard } from './shared/guard/auth.guard';

export const routes: Routes = [];

routes.push(
  {
    path: '',
    redirectTo: 'history',
    pathMatch: 'full',
  },
  {
    path: 'login',
    data: { animation: 'loginPage' },
    loadComponent: () =>
      import('../app/feature/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'register',
    data: { animation: 'registerPage' },
    loadComponent: () =>
      import('../app/feature/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: 'summary',
    loadComponent: () =>
      import('../app/feature/summary/summary.component').then(
        (m) => m.SummaryComponent,
      ),
  },
  {
    path: 'today-entry',
    loadComponent: () =>
      import('../app/feature/today-entry/today-entry.component').then(
        (m) => m.TodayEntryComponent,
      ),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('../app/feature/historys/history.component').then(
        (m) => m.HistoryComponent,
      ),
    canActivate:[authGuard]
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('../app/feature/analytics/analytics.component').then(
        (m) => m.AnalyticsComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'history',
  },
);
