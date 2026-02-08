import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
})
export class SideBarComponent {
  public currentRoute = 'history';
  private readonly routes = inject(Router);
  ngOnInit() {
    this.routes.navigate([this.currentRoute]);
  }
  navigate(route: string) {
    this.currentRoute = route;
    this.routes.navigate([route]);
  }
}
