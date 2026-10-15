import { Routes } from '@angular/router';
import { authGuard, supervisorGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login.component').then(c => c.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/shell.component').then(c => c.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard.component').then(c => c.DashboardComponent) },
      { path: 'historial', loadComponent: () => import('./pages/historial.component').then(c => c.HistorialComponent) },
      { path: 'vias', canActivate: [supervisorGuard], loadComponent: () => import('./pages/vias.component').then(c => c.ViasComponent) },
      { path: 'usuarios', canActivate: [supervisorGuard], loadComponent: () => import('./pages/usuarios.component').then(c => c.UsuariosComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
