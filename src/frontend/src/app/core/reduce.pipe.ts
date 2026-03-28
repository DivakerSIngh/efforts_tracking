import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'reduce',
  standalone: true,
})
export class ReducePipe implements PipeTransform {
  transform(array: any[], key: string, initialValue: number = 0): number {
    if (!array || !key) return initialValue;
    return array.reduce((sum, item) => sum + (parseFloat(item[key]) || 0), initialValue);
  }
}
