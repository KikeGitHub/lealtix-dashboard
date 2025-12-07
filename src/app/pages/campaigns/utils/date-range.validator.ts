import { AbstractControl, ValidationErrors } from '@angular/forms';

export class DateRangeValidator {
  /**
   * Valida que la fecha de fin sea posterior a la fecha de inicio
   */
  static dateRange(control: AbstractControl): ValidationErrors | null {
    const startDate = control.get('startDate')?.value;
    const endDate = control.get('endDate')?.value;

    if (!startDate || !endDate) {
      return null; // No validar si faltan fechas
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return { dateRange: { message: 'La fecha de fin debe ser posterior a la fecha de inicio' } };
    }

    return null;
  }

  /**
   * Valida que la fecha de inicio sea futura (para nuevas campañas)
   */
  static futureDate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) {
      return null;
    }

    const inputDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare only dates

    if (inputDate < today) {
      return { futureDate: { message: 'La fecha debe ser futura' } };
    }

    return null;
  }

  /**
   * Valida que el valor de la promoción sea apropiado según el tipo
   */
  static promoValue(control: AbstractControl): ValidationErrors | null {
    const promoType = control.get('promoType')?.value;
    const promoValue = control.get('promoValue')?.value;

    if (!promoType || !promoValue) {
      return null;
    }

    const numValue = parseFloat(promoValue);

    switch (promoType) {
      case 'DISCOUNT':
        if (numValue <= 0 || numValue > 100) {
          return { promoValue: { message: 'El descuento debe estar entre 1 y 100%' } };
        }
        break;
      case 'AMOUNT':
        if (numValue <= 0) {
          return { promoValue: { message: 'El monto debe ser mayor a 0' } };
        }
        break;
    }

    return null;
  }
}
