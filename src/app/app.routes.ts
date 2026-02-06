import { Routes } from '@angular/router';

export const routes: Routes = [];

routes.push(
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
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('../app/feature/analytics/analytics.component').then(
        (m) => m.AnalyticsComponent,
      ),
  },
);
