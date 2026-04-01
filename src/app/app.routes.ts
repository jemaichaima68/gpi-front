import { canActivateAuthRole } from './core/guards/auth.guard';
import { Routes } from '@angular/router';

export const routes: Routes = [
 { path: '', redirectTo: 'admin/dashboard', pathMatch: 'full' },

  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin-layout/admin-layout.component')
        .then(m => m.AdminLayoutComponent),
    canActivate: [canActivateAuthRole('Admin')],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component')
            .then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/user-list.component')
            .then(m => m.UserListComponent)
      },
      {
        path: 'logs',
        loadComponent: () =>
          import('./features/admin/logs/admin-logs.component')
            .then(c => c.AdminLogsComponent)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/admin/admin-profile/admin-profile.component')
            .then(m => m.AdminProfileComponent)
      }
    ]
  },

  {
    path: 'access-denied',
    loadComponent: () =>
      import('./features/access-denied/access-denied.component')
        .then(m => m.AccessDeniedComponent)
  },

  {
    path: 'profile',
    loadComponent: () =>
      import('./features/admin/admin-profile/admin-profile.component')
        .then(m => m.AdminProfileComponent)
  },

{ path: '**', redirectTo: 'admin/dashboard' }
];