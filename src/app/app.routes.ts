import { Routes } from '@angular/router';
import { authGuard, supervisorGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(c => c.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then(c => c.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(c => c.DashboardComponent) },
      { path: 'historial', loadComponent: () => import('./features/historial/historial.component').then(c => c.HistorialComponent) },
      { path: 'vias', canActivate: [supervisorGuard], loadComponent: () => import('./features/vias/vias.component').then(c => c.ViasComponent) },
      { path: 'usuarios', canActivate: [supervisorGuard], loadComponent: () => import('./features/usuarios/usuarios.component').then(c => c.UsuariosComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
