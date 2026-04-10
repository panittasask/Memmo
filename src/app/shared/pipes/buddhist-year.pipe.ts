import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'buddhistYear',
  standalone: true,
  pure: true,
})
export class BuddhistYearPipe implements PipeTransform {
  private static readonly YEAR_OFFSET = 543;

  transform(year: number | string | null | undefined): string {
    if (year === null || year === undefined || year === '') {
      return '';
    }

    const numericYear = Number(year);
    if (!Number.isFinite(numericYear)) {
      return '';
    }

    return String(numericYear + BuddhistYearPipe.YEAR_OFFSET);
  }
}
