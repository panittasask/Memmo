import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true,
})
export class DateFormatPipe implements PipeTransform {
  transform(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const date = new Date(value as string | number | Date);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
}
