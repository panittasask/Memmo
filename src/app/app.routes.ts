import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard } from './shared/guard/auth.guard';
import { AuthService } from './shared/services/auth.service';

export const routes: Routes = [];

routes.push(
  {
    path: '',
    redirectTo: () => {
      const authService = inject(AuthService);
      return authService.isTokenValid() ? 'history' : 'login';
    },
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
    path: 'settings',
    loadComponent: () =>
      import('../app/feature/settings/settings.component').then(
        (m) => m.SettingsComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'workflow',
    loadComponent: () =>
      import('../app/feature/workflow/workflow.component').then(
        (m) => m.WorkflowComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
);
