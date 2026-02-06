import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { Router, RouterOutlet } from '@angular/router';
import { routes } from '../../app.routes';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SideBarComponent, RouterOutlet, routes],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {}
