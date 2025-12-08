export class CampaignFormatters {
  /**
   * Formatea un valor de promoción según su tipo
   */
  static formatPromoValue(promoType: string, promoValue: string): string {
    if (!promoType || !promoValue) return '';

    switch (promoType) {
      case 'DISCOUNT':
        return `${promoValue}% de descuento`;
      case 'AMOUNT':
        return `$${promoValue} de descuento`;
      case 'BOGO':
        return 'Compra uno y lleva otro gratis';
      case 'FREE_ITEM':
        return 'Artículo gratuito';
      case 'CUSTOM':
        return promoValue;
      default:
        return promoValue;
    }
  }

  /**
   * Formatea una lista de canales
   */
  static formatChannels(channels: string[]): string {
    if (!channels || channels.length === 0) return 'Sin canales';

    if (channels.length === 1) return channels[0];
    if (channels.length === 2) return channels.join(' y ');

    return `${channels.slice(0, -1).join(', ')} y ${channels[channels.length - 1]}`;
  }

  /**
   * Formatea un rango de fechas
   */
  static formatDateRange(startDate?: Date, endDate?: Date): string {
    if (!startDate && !endDate) return 'Sin fechas definidas';

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };

    if (startDate && endDate) {
      return `${startDate.toLocaleDateString('es-ES', options)} - ${endDate.toLocaleDateString('es-ES', options)}`;
    }

    if (startDate) {
      return `Desde ${startDate.toLocaleDateString('es-ES', options)}`;
    }

    return `Hasta ${endDate!.toLocaleDateString('es-ES', options)}`;
  }

  /**
   * Calcula los días restantes para una campaña
   */
  static getDaysRemaining(endDate: Date): number {
    const today = new Date();
    const timeDiff = endDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Obtiene el estado visual de una campaña basado en las fechas
   */
  static getCampaignStatusByDates(startDate?: Date, endDate?: Date): string {
    const now = new Date();

    if (!startDate) return 'DRAFT';

    if (startDate > now) return 'SCHEDULED';

    if (endDate && endDate < now) return 'INACTIVE';

    return 'ACTIVE';
  }
}
