import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-email-sent',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './email-sent.component.html',
  styleUrl: './email-sent.component.scss',
})
export class EmailSentComponent {}
