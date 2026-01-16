import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';

// PrimeNG imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { MessageService } from 'primeng/api';

// Models
import { CampaignPreviewData } from '../../../models/create-campaign.models';
import { PromoType } from '@/models/enums';
import { CampaignService } from '../../../services/campaign.service';
import { environment } from '@/pages/commons/environment';

@Component({
  selector: 'app-campaign-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    ChipModule
  ],
  templateUrl: './campaign-preview-dialog.component.html',
  styleUrls: ['./campaign-preview-dialog.component.scss']
})
export class CampaignPreviewDialogComponent {
  @Input() visible: boolean = false;
  @Input() previewData!: CampaignPreviewData;
  @Input() showButton: boolean = false;
  @Input() promoTypeOptions: { label: string; value: PromoType }[] = [];
  @Input() clientName: string | null = null;
  @Input() clientLogo: string | null = null;
  @Input() clientSlug: string | null = null;
  @Input() rewardDescription?: string | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('captureArea', { static: false }) captureArea!: ElementRef<HTMLDivElement>;

  private campaignService = inject(CampaignService);
  private messageService = inject(MessageService);

  readonly lealtixLogo = 'https://res.cloudinary.com/lealtix-media/image/upload/v1759897289/lealtix_logo_transp_qcp5h9.png';
  readonly lealtixUrl = 'https://lealtix.com.mx/';

  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(this.visible);
    this.close.emit();
  }

  formatDate(date: Date | null | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getPromoTypeLabel(promoType: string | undefined): string {
    if (!promoType) return '';
    const option = this.promoTypeOptions.find(opt => opt.value === promoType);
    return option?.label || promoType;
  }

  getClientInitials(): string {
    if (!this.clientName) return 'NE';
    const words = this.clientName.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  getLandingUrl(): string {
    if (!this.clientSlug) return this.lealtixUrl;
    const baseUrl = environment.production
      ? 'https://lealtix.com.mx/landing-page'
      : 'http://localhost:4200/landing-page';
    return `${baseUrl}/${this.clientSlug}`;
  }

  /**
   * Retorna la URL de la imagen sin modificaciones
   * Para usar la imagen tal como viene de la BD
   */
  getOptimizedImageUrl(imageUrl: string | undefined): string {
    //console.log('getOptimizedImageUrl - Input:', imageUrl);

    if (!imageUrl) {
      //console.warn('getOptimizedImageUrl - No imageUrl provided');
      return '';
    }

    // Retornar la URL original sin modificaciones
    //console.log('getOptimizedImageUrl - Returning original URL:', imageUrl);
    return imageUrl;
  }

  /**
   * Maneja errores al cargar la imagen
   */
  onImageError(event: Event): void {
    console.error('Error loading image:', event);
    const imgElement = event.target as HTMLImageElement;
    console.error('Failed image src:', imgElement?.src);

    this.messageService.add({
      severity: 'warn',
      summary: 'Imagen no disponible',
      detail: 'No se pudo cargar la imagen de la promoción'
    });
  }

  async downloadImage(): Promise<void> {
    if (!this.captureArea) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'El área de captura no está disponible'
      });
      return;
    }

    try {
      const canvas = await html2canvas(this.captureArea.nativeElement, {
        scale: 3, // Aumentado para mejor calidad (antes era 2)
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: false,
        imageTimeout: 0
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `promocion-${this.previewData?.title?.replace(/\s+/g, '-').toLowerCase() || 'preview'}.png`;
      link.click();

      this.messageService.add({
        severity: 'success',
        summary: 'Descarga exitosa',
        detail: 'La imagen se ha descargado correctamente'
      });
    } catch (error) {
      console.error('Error capturing image:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo generar la imagen. Verifica que todas las imágenes se hayan cargado correctamente.'
      });
    }
  }

  async sendByEmail(): Promise<void> {
    if (!this.captureArea) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'El área de captura no está disponible'
      });
      return;
    }

    try {
      const canvas = await html2canvas(this.captureArea.nativeElement, {
        scale: 3, // Aumentado para mejor calidad
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: false,
        imageTimeout: 0
      });

      const imageBase64 = canvas.toDataURL('image/png', 1.0);

      // Preferir la descripción del reward si está disponible
      const previewToSend = {
        ...this.previewData,
        description: this.rewardDescription ?? this.previewData.description
      };

      // TODO: Implement backend endpoint
      // await this.campaignService.sendPreviewEmail({
      //   imageBase64,
      //   previewData: previewToSend
      // }).toPromise();

      this.messageService.add({
        severity: 'info',
        summary: 'Función en desarrollo',
        detail: 'El envío por email estará disponible próximamente'
      });

      console.log('Image ready to send (using reward description if available):', imageBase64.substring(0, 100) + '...');
    } catch (error) {
      console.error('Error sending email:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo enviar el email'
      });
    }
  }
}

