import { Routes } from '@angular/router';

export const routes: Routes = [];

routes.push({
  path: 'summary',
  loadComponent: () =>
    import('../app/feature/summary/summary.component').then(
      (m) => m.SummaryComponent,
    ),
});
