import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true,
})
export class DateFormatPipe implements PipeTransform {
  transform(value: any) {
    return new Date(value).toLocaleDateString('th-TH');
  }
}
