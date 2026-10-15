import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({standalone:true,imports:[CommonModule,RouterLink,RouterLinkActive,RouterOutlet],templateUrl:'./shell.component.html'})
export class ShellComponent {
  readonly auth=inject(AuthService);
  private readonly router=inject(Router);
  salir(){this.auth.logout();void this.router.navigateByUrl('/login');}
}
