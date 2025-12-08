import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { SkeletonModule } from 'primeng/skeleton';
import { CampaignResponse } from '@/models/campaign.model';
import { CampaignResult } from '@/models/campaign-result.model';
import { CampaignService } from '../../services/campaign.service';
import { CampaignResultService } from '../../services/campaign-result.service';
import { CampaignFormatters } from '../../utils/formatters';

@Component({
  selector: 'app-campaign-details',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    ChipModule,
    SkeletonModule
  ],
  template: `
    <div class="grid">
      <!-- Header -->
      <div class="col-12">
        <div class="flex align-items-center mb-4">
          <p-button
            icon="pi pi-arrow-left"
            severity="secondary"
            text
            (onClick)="goBack()"
            aria-label="Volver">
          </p-button>
          <h2 class="ml-3 mb-0">Detalles de Campaña</h2>
        </div>
      </div>

      <!-- Loading state -->
      <div class="col-12" *ngIf="loading()">
        <div class="grid">
          <div class="col-12 lg:col-8">
            <p-card>
              <p-skeleton height="2rem" class="mb-3"></p-skeleton>
              <p-skeleton height="1.5rem" width="70%" class="mb-3"></p-skeleton>
              <p-skeleton height="8rem" class="mb-3"></p-skeleton>
              <p-skeleton height="3rem" width="50%"></p-skeleton>
            </p-card>
          </div>
          <div class="col-12 lg:col-4">
            <p-card>
              <p-skeleton height="2rem" class="mb-3"></p-skeleton>
              <p-skeleton height="4rem" class="mb-3"></p-skeleton>
              <p-skeleton height="2rem" width="80%"></p-skeleton>
            </p-card>
          </div>
        </div>
      </div>

      <!-- Campaign content -->
      <div class="col-12" *ngIf="!loading() && campaign()">
        <div class="grid">
          <!-- Main campaign info -->
          <div class="col-12 lg:col-8">
            <p-card>
              <ng-template pTemplate="header">
                <div class="p-4" *ngIf="campaign()?.imageUrl">
                  <img
                    [src]="campaign()?.imageUrl"
                    [alt]="campaign()?.title"
                    class="w-full h-300 object-cover border-round"
                    style="height: 300px; object-fit: cover;">
                </div>
              </ng-template>

              <div class="flex align-items-start justify-content-between mb-4">
                <div class="flex-1">
                  <div class="flex align-items-center gap-3 mb-2">
                    <h1 class="text-3xl font-bold mb-0">{{ campaign()?.title }}</h1>
                    <p-chip
                      [label]="getStatusLabel(campaign()?.status)"
                      [style]="getStatusStyle(campaign()?.status)">
                    </p-chip>
                  </div>
                  <h2 class="text-xl text-500 font-normal mb-0" *ngIf="campaign()?.subtitle">
                    {{ campaign()?.subtitle }}
                  </h2>
                </div>

                <div class="flex gap-2">
                  <p-button
                    icon="pi pi-pencil"
                    label="Editar"
                    severity="secondary"
                    (onClick)="editCampaign()">
                  </p-button>
                  <p-button
                    icon="pi pi-refresh"
                    severity="secondary"
                    (onClick)="refreshMetrics()"
                    [loading]="refreshingMetrics()"
                    aria-label="Refrescar métricas">
                  </p-button>
                </div>
              </div>

              <div class="grid mb-4">
                <div class="col-12 md:col-6" *ngIf="campaign()?.description">
                  <h3>Descripción</h3>
                  <p class="line-height-3">{{ campaign()?.description }}</p>
                </div>

                <div class="col-12 md:col-6">
                  <h3>Detalles de la Promoción</h3>
                  <div class="flex flex-column gap-2">
                    <div class="flex align-items-center gap-2" *ngIf="campaign()?.promoType">
                      <i class="pi pi-tag text-primary"></i>
                      <span>{{ formatPromoValue(campaign()?.promoType, campaign()?.promoValue) }}</span>
                    </div>
                    <div class="flex align-items-center gap-2" *ngIf="campaign()?.callToAction">
                      <i class="pi pi-megaphone text-primary"></i>
                      <span>{{ campaign()?.callToAction }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="grid">
                <div class="col-12 md:col-6">
                  <h3>Programación</h3>
                  <div class="flex flex-column gap-2">
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-calendar text-primary"></i>
                      <span>{{ formatDateRange(campaign()?.startDate, campaign()?.endDate) }}</span>
                    </div>
                    <div class="flex align-items-center gap-2" *ngIf="getDaysRemaining() !== null">
                      <i class="pi pi-clock text-primary"></i>
                      <span>{{ getDaysRemainingText() }}</span>
                    </div>
                  </div>
                </div>

                <div class="col-12 md:col-6" *ngIf="campaign()?.channels?.length">
                  <h3>Canales de Distribución</h3>
                  <div class="flex flex-wrap gap-2">
                    <p-chip
                      *ngFor="let channel of campaign()?.channels"
                      [label]="channel"
                      styleClass="p-chip-outlined">
                    </p-chip>
                  </div>
                </div>

                <div class="col-12" *ngIf="campaign()?.segmentation">
                  <h3>Segmentación</h3>
                  <p class="text-500">{{ campaign()?.segmentation }}</p>
                </div>
              </div>
            </p-card>
          </div>

          <!-- Metrics sidebar -->
          <div class="col-12 lg:col-4">
            <p-card>
              <ng-template pTemplate="header">
                <div class="px-4 pt-4">
                  <h3 class="mb-0">Métricas de Rendimiento</h3>
                </div>
              </ng-template>

              <div class="flex flex-column gap-4">
                <!-- Views -->
                <div class="text-center p-3 border-1 border-200 border-round">
                  <div class="text-4xl font-bold text-primary mb-2">
                    {{ metrics()?.views || 0 | number }}
                  </div>
                  <div class="text-500 text-sm">Visualizaciones</div>
                  <div class="text-xs text-400 mt-1" *ngIf="metrics()?.lastViewAt">
                    Última: {{ metrics()?.lastViewAt | date:'dd/MM/yy HH:mm' }}
                  </div>
                </div>

                <!-- Clicks -->
                <div class="text-center p-3 border-1 border-200 border-round">
                  <div class="text-4xl font-bold text-blue-500 mb-2">
                    {{ metrics()?.clicks || 0 | number }}
                  </div>
                  <div class="text-500 text-sm">Clics</div>
                  <div class="text-xs text-400 mt-1" *ngIf="metrics()?.views && metrics()?.clicks">
                    CTR: {{ getClickThroughRate() }}%
                  </div>
                </div>

                <!-- Redemptions -->
                <div class="text-center p-3 border-1 border-200 border-round">
                  <div class="text-4xl font-bold text-green-500 mb-2">
                    {{ metrics()?.redemptions || 0 | number }}
                  </div>
                  <div class="text-500 text-sm">Redenciones</div>
                  <div class="text-xs text-400 mt-1" *ngIf="metrics()?.lastRedemptionAt">
                    Última: {{ metrics()?.lastRedemptionAt | date:'dd/MM/yy HH:mm' }}
                  </div>
                </div>

                <!-- Conversion rate -->
                <div class="text-center p-3 border-1 border-200 border-round" *ngIf="getConversionRate()">
                  <div class="text-2xl font-bold text-orange-500 mb-2">
                    {{ getConversionRate() }}%
                  </div>
                  <div class="text-500 text-sm">Tasa de Conversión</div>
                  <div class="text-xs text-400">Redenciones / Clics</div>
                </div>
              </div>

              <ng-template pTemplate="footer">
                <div class="flex gap-2">
                  <p-button
                    label="Simular Vista"
                    icon="pi pi-eye"
                    size="small"
                    severity="secondary"
                    class="flex-1"
                    (onClick)="simulateView()">
                  </p-button>
                  <p-button
                    label="Simular Clic"
                    icon="pi pi-mouse-pointer"
                    size="small"
                    severity="secondary"
                    class="flex-1"
                    (onClick)="simulateClick()">
                  </p-button>
                </div>
              </ng-template>
            </p-card>
          </div>
        </div>
      </div>

      <!-- Error state -->
      <div class="col-12 text-center py-8" *ngIf="!loading() && !campaign()">
        <i class="pi pi-exclamation-triangle text-6xl text-400 mb-3"></i>
        <h3 class="text-xl font-medium mb-2">Campaña no encontrada</h3>
        <p class="text-500 mb-4">La campaña solicitada no existe o no tienes permisos para verla.</p>
        <p-button
          label="Volver a Campañas"
          icon="pi pi-arrow-left"
          (onClick)="goBack()">
        </p-button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .object-cover {
      object-fit: cover;
    }

    .h-300 {
      height: 300px;
    }
  `]
})
export class CampaignDetailsComponent implements OnInit {
  campaign = signal<CampaignResponse | null>(null);
  metrics = signal<CampaignResult | null>(null);
  loading = signal<boolean>(true);
  refreshingMetrics = signal<boolean>(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampaignService,
    private campaignResultService: CampaignResultService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed()).subscribe(params => {
      const campaignId = +params['id'];
      if (campaignId) {
        this.loadCampaign(campaignId);
        this.loadMetrics(campaignId);
      }
    });
  }

  private loadCampaign(id: number): void {
    this.loading.set(true);

    this.campaignService.get(id)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (campaign) => {
          this.campaign.set(campaign);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading campaign:', error);
          this.campaign.set(null);
          this.loading.set(false);
        }
      });
  }

  private loadMetrics(campaignId: number): void {
    this.campaignResultService.getByCampaign(campaignId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (metrics) => {
          this.metrics.set(metrics);
        },
        error: (error) => {
          console.error('Error loading metrics:', error);
          this.metrics.set(null);
        }
      });
  }

  refreshMetrics(): void {
    const campaign = this.campaign();
    if (!campaign) return;

    this.refreshingMetrics.set(true);
    this.loadMetrics(campaign.id);

    // Reset loading state after a delay
    setTimeout(() => {
      this.refreshingMetrics.set(false);
    }, 1000);
  }

  simulateView(): void {
    const campaign = this.campaign();
    if (!campaign) return;

    this.campaignResultService.incrementViews(campaign.id)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.refreshMetrics();
        },
        error: (error) => {
          console.error('Error incrementing views:', error);
        }
      });
  }

  simulateClick(): void {
    const campaign = this.campaign();
    if (!campaign) return;

    this.campaignResultService.incrementClicks(campaign.id)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.refreshMetrics();
        },
        error: (error) => {
          console.error('Error incrementing clicks:', error);
        }
      });
  }

  editCampaign(): void {
    const campaign = this.campaign();
    if (campaign) {
      this.router.navigate(['/dashboard/campaigns/new'], {
        queryParams: { campaignId: campaign.id }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/campaigns']);
  }

  // Formatting methods
  formatPromoValue(promoType?: string, promoValue?: string): string {
    return CampaignFormatters.formatPromoValue(promoType || '', promoValue || '');
  }

  formatDateRange(startDate?: Date, endDate?: Date): string {
    return CampaignFormatters.formatDateRange(startDate, endDate);
  }

  getDaysRemaining(): number | null {
    const campaign = this.campaign();
    if (!campaign?.endDate) return null;
    return CampaignFormatters.getDaysRemaining(campaign.endDate);
  }

  getDaysRemainingText(): string {
    const days = this.getDaysRemaining();
    if (days === null) return '';

    if (days < 0) return 'Campaña finalizada';
    if (days === 0) return 'Última día';
    if (days === 1) return '1 día restante';
    return `${days} días restantes`;
  }

  getClickThroughRate(): string {
    const metrics = this.metrics();
    if (!metrics?.views || !metrics?.clicks) return '0.0';

    const rate = (metrics.clicks / metrics.views) * 100;
    return rate.toFixed(1);
  }

  getConversionRate(): string | null {
    const metrics = this.metrics();
    if (!metrics?.clicks || !metrics?.redemptions) return null;

    const rate = (metrics.redemptions / metrics.clicks) * 100;
    return rate.toFixed(1);
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'DRAFT': return 'Borrador';
      case 'ACTIVE': return 'Activa';
      case 'INACTIVE': return 'Inactiva';
      case 'SCHEDULED': return 'Programada';
      default: return status || '';
    }
  }

  getStatusStyle(status?: string): any {
    switch (status) {
      case 'ACTIVE':
        return { 'background-color': '#10b981', 'color': 'white' };
      case 'INACTIVE':
        return { 'background-color': '#ef4444', 'color': 'white' };
      case 'SCHEDULED':
        return { 'background-color': '#3b82f6', 'color': 'white' };
      case 'DRAFT':
      default:
        return { 'background-color': '#6b7280', 'color': 'white' };
    }
  }
}
