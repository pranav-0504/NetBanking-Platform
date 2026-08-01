import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { loginRouteGuard } from './core/guards/login-route.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/login',
  },
  {
    path: 'auth/login',
    canActivate: [loginRouteGuard],
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'fund-transfer',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/fund-transfer/fund-transfer.component').then((m) => m.FundTransferComponent),
  },
  {
    path: 'beneficiaries',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/beneficiaries/beneficiaries.component').then((m) => m.BeneficiariesComponent),
  },
  {
    path: 'transactions',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/transactions/transactions.component').then((m) => m.TransactionsComponent),
  },
  {
    path: 'download-statement',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/download-statement/download-statement.component').then((m) => m.DownloadStatementComponent),
  },
  {
    path: 'view-account-statement',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/view-account-statement/view-account-statement.component').then((m) => m.ViewAccountStatementComponent),
  },
  {
    path: 'personalProfileDetails',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/personal-profile-details/personal-profile-details.component').then((m) => m.PersonalProfileDetailsComponent),
  },
  {
    path: 'changePassword',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/change-password/change-password.component').then((m) => m.ChangePasswordComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
