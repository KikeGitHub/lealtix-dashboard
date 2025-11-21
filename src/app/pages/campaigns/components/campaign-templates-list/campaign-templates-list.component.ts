import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { SkeletonModule } from 'primeng/skeleton';
import { CampaignTemplate } from '@/models/campaign-template.model';
import { CampaignTemplateService } from '../../services/campaign-template.service';

@Component({
  selector: 'app-campaign-templates-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    ChipModule,
    SkeletonModule
  ],
  templateUrl: './campaign-templates-list.component.html',
  styleUrls: ['./campaign-templates-list.component.scss']
})
export class CampaignTemplatesListComponent implements OnInit {
  templates = signal<CampaignTemplate[]>([]);
  loading = signal<boolean>(true);
  // DestroyRef for takeUntilDestroyed
  private destroyRef = inject(DestroyRef);

  constructor(
    private campaignTemplateService: CampaignTemplateService,
    private router: Router
  ) {}

  // Fallback handler for template images
  onImageError(event: Event) {
    const img = event?.target as HTMLImageElement | null;
    if (img) {
      img.src = 'https://via.placeholder.com/600x300?text=Sin+imagen';
    }
  }

  // Optimize Cloudinary images by adding transformations
  getOptimizedImageUrl(url: string | undefined): string {
    if (!url) {
      return 'https://via.placeholder.com/600x300?text=Sin+imagen';
    }

    // If it's a Cloudinary URL, add transformation parameters
    if (url.includes('cloudinary.com')) {
      // Insert transformation after /upload/
      const transformedUrl = url.replace(
        '/upload/',
        '/upload/w_600,h_300,c_fill,f_auto,q_auto/'
      );
      return transformedUrl;
    }

    return url;
  }

  ngOnInit(): void {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    this.loading.set(true);

    this.campaignTemplateService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (templates) => {
          this.templates.set(templates);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading templates:', error);
          this.loading.set(false);
        }
      });
  }

  useTemplate(template: CampaignTemplate): void {
    // Navegar al formulario de campaña con el ID de la plantilla
    this.router.navigate(['/dashboard/campaigns/new'], {
      queryParams: { templateId: template.id }
    });
  }

  editTemplate(template: CampaignTemplate): void {
    // TODO: Implementar edición de plantilla
    console.log('Edit template:', template);
  }

  createNewTemplate(): void {
    // TODO: Implementar creación de plantilla
    console.log('Create new template');
  }

  // Traducir tipos de promoción a español
  getPromoTypeLabel(promoType: string | undefined): string {
    if (!promoType) return '';

    const translations: { [key: string]: string } = {
      'PERCENTAGE': 'Porcentaje',
      'FIXED_AMOUNT': 'Monto Fijo',
      'BUY_X_GET_Y': 'Compra X Lleva Y',
      'FREE_SHIPPING': 'Envío Gratis',
      'COMBO': 'Combo',
      'CASHBACK': 'Reembolso'
    };

    return translations[promoType] || promoType;
  }

  // Asignar color de fondo según tipo de promoción
  getPromoTypeColor(promoType: string | undefined): string {
    if (!promoType) return 'var(--primary-color)';

    const colors: { [key: string]: string } = {
      'PERCENTAGE': '#10b981',      // Verde
      'FIXED_AMOUNT': '#3b82f6',    // Azul
      'BUY_X_GET_Y': '#f59e0b',     // Naranja
      'FREE_SHIPPING': '#8b5cf6',   // Púrpura
      'COMBO': '#ec4899',           // Rosa
      'CASHBACK': '#06b6d4'         // Cyan
    };

    return colors[promoType] || 'var(--primary-color)';
  }
}
