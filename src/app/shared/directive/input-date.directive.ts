import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: 'input[type="date"]',
  standalone: true
})
export class DatePickerDirective {

  constructor(private el: ElementRef) {}

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    const input = this.el.nativeElement as HTMLInputElement;
    try {
      input.showPicker();
    } catch (e) {
      input.click();
    }
  }
}