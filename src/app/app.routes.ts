import { Routes } from '@angular/router';
import { canActivateAuthRole, rootRedirectGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  // ── Racine : redirection intelligente selon le rôle ──────────────────────
  {
    path: '',
    canActivate: [rootRedirectGuard],
    loadComponent: () =>
      import('./features/access-denied/access-denied.component')
        .then(m => m.AccessDeniedComponent)
  },

  // ── ADMIN ─────────────────────────────────────────────────────────────────
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
        path: 'profile',
        loadComponent: () =>
          import('./features/admin/admin-profile/admin-profile.component')
            .then(m => m.AdminProfileComponent)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/admin/settings/admin-settings.component')
            .then(m => m.AdminSettingsComponent)
      }
    ]
  },

  // ── AGENT BACK-OFFICE ─────────────────────────────────────────────────────
  {
    path: 'agent',
    loadComponent: () =>
      import('./features/agent/agent-layout/agent-layout.component')
        .then(m => m.AgentLayoutComponent),
    canActivate: [canActivateAuthRole('BACK_OFFICE')],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/agent/dashboard/agent-dashboard.component')
            .then(m => m.AgentDashboardComponent)
      },
      {
        path: 'transactions/recus',
        loadComponent: () =>
          import('./features/agent/transactions/agent-transactions.component')
            .then(m => m.AgentTransactionsComponent)
      },
      {
        path: 'transactions/emis',
        loadComponent: () =>
          import('./features/agent/transactions/agent-transactions.component')
            .then(m => m.AgentTransactionsComponent)
      },
      {
        path: 'transactions/traitees',
        loadComponent: () =>
          import('./features/agent/transactions/agent-transactions.component')
            .then(m => m.AgentTransactionsComponent)
      },
      {
        path: 'transactions/:id',
        loadComponent: () =>
          import('./features/agent/transaction-detail/transaction-detail.component')
            .then(m => m.TransactionDetailComponent)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/agent/agent-profile/agent-profile.component')
            .then(m => m.AgentProfileComponent)
      },
      {
        path: 'logs',
        loadComponent: () =>
          import('./features/agent/logs/agent-logs.component')
            .then(m => m.AgentLogsComponent)
      }
    ]
  },

  // ── CLIENT ────────────────────────────────────────────────────────────────
  {
    path: 'client',
    canActivate: [canActivateAuthRole('CLIENT')],
    loadComponent: () =>
      import('./features/client/client-layout/client-layout.component')
        .then(m => m.ClientLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/client/pages/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
      {
        path: 'tracking',
        loadComponent: () =>
          import('./features/client/pages/tracking/tracking.component')
            .then(m => m.TrackingComponent)
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/client/pages/history/history.component')
            .then(m => m.HistoryComponent)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/client/pages/profile/profile.component')
            .then(m => m.ProfileComponent)
      },
      // ⭐⭐⭐ ROUTES SUPPRIMÉES ⭐⭐⭐
      // Les routes transaction/:id et transaction/uetr/:uetr sont supprimées
      // Le client utilise uniquement /tracking pour voir les détails
      {
        path: '**',
        redirectTo: 'dashboard'
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
    path: '**',
    redirectTo: 'access-denied'
  }
];