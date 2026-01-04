import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { forkJoin } from 'rxjs';
import { NotificationsWidget } from './components/notificationswidget';
import { StatsWidget } from './components/statswidget';
import { BestSellingWidget } from './components/bestsellingwidget';
import { RevenueStreamWidget } from './components/revenuestreamwidget';
import { ProductService } from '@/pages/products-menu/service/product.service';
import { CampaignService } from '@/pages/campaigns/services/campaign.service';
import { TenantService } from '@/pages/admin-page/service/tenant.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        MessageModule,
        ButtonModule,
        StatsWidget,
        BestSellingWidget,
        RevenueStreamWidget,
        NotificationsWidget
    ],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <!-- Banner persistente de bienvenida -->
            <div class="col-span-12" *ngIf="showWelcomeBanner()">
                <div class="border-round p-4 shadow-2" style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-left: 4px solid #F59E0B;">
                    <div class="flex align-items-center justify-content-between flex-wrap gap-3">
                        <div class="flex align-items-start gap-3 flex-1">
                            <span class="text-4xl" style="line-height: 1;">🚀</span>
                            <div>
                                <div class="font-semibold text-xl mb-2" style="color: #92400E;">{{ bannerMessage().title }}</div>
                                <div class="line-height-3" style="color: #78350F;">{{ bannerMessage().description }}</div>
                            </div>
                        </div>
                        <p-button
                            [label]="bannerMessage().buttonText"
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            severity="warn"
                            (onClick)="navigateToWelcomeCampaign()"
                            styleClass="white-space-nowrap">
                        </p-button>
                    </div>
                </div>
            </div>

            <app-stats-widget class="contents" />
            <div class="col-span-12 xl:col-span-6">
                <app-best-selling-widget />
            </div>
            <div class="col-span-12 xl:col-span-6">
                <app-revenue-stream-widget />
                <app-notifications-widget />
            </div>
        </div>
    `
})
export class Dashboard implements OnInit {
    showWelcomeBanner = signal<boolean>(false);
    bannerMessage = signal<{ title: string; description: string; buttonText: string }>(
        { title: '', description: '', buttonText: '' }
    );
    private tenantId: number = 0;

    constructor(
        private productService: ProductService,
        private campaignService: CampaignService,
        private tenantService: TenantService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.loadTenantAndCheckBanner();
    }

    private loadTenantAndCheckBanner(): void {
        const userStr = sessionStorage.getItem('usuario') ?? localStorage.getItem('usuario');

        if (!userStr) {
            return;
        }

        try {
            const userObj = JSON.parse(userStr);
            if (!userObj?.userEmail) {
                return;
            }

            this.tenantService.getTenantByEmail(String(userObj.userEmail).trim()).subscribe({
                next: (resp) => {
                    const tenant = resp?.object;
                    this.tenantId = tenant?.id ?? 0;

                    if (this.tenantId > 0) {
                        this.checkBannerConditions();
                    }
                },
                error: (err) => {
                    console.error('Error fetching tenant:', err);
                }
            });
        } catch (e) {
            console.warn('Failed to parse stored usuario:', e);
        }
    }

    private checkBannerConditions(): void {
        forkJoin({
            products: this.productService.getProductsByTenantId(this.tenantId),
            welcomeStatus: this.campaignService.getWelcomeCampaignStatus(this.tenantId)
        }).subscribe({
            next: ({ products, welcomeStatus }) => {
                const productCount = Array.isArray(products) ? products.length : (products?.object?.length ?? 0);
                const hasProducts = productCount > 0;
                const campaignExists = welcomeStatus?.exists ?? false;
                const campaignStatus = welcomeStatus?.status;

                console.debug('[Banner][dashboard] tenantId=', this.tenantId, 'productCount=', productCount, 'welcomeStatus=', welcomeStatus);

                // No mostrar banner si:
                // - No tiene productos
                // - Ya tiene campaña de bienvenida ACTIVA
                if (!hasProducts || (campaignExists && campaignStatus === 'ACTIVE')) {
                    this.showWelcomeBanner.set(false);
                    return;
                }

                // Si tiene productos pero no campaña, mostrar mensaje de crear
                if (!campaignExists) {
                    this.showWelcomeBanner.set(true);
                    this.bannerMessage.set({
                        title: 'Tu negocio ya está listo.',
                        description: 'Ahora configura tu campaña de bienvenida para empezar a recibir clientes.',
                        buttonText: 'Configurar campaña de bienvenida'
                    });
                }
                // Si tiene campaña en DRAFT, mostrar mensaje de activar
                else if (campaignStatus === 'DRAFT') {
                    this.showWelcomeBanner.set(true);
                    this.bannerMessage.set({
                        title: '¡Ya casi está todo listo!',
                        description: 'Tienes una campaña de bienvenida guardada como borrador. Actívala para comenzar a recibir clientes.',
                        buttonText: 'Activar campaña de bienvenida'
                    });
                }
            },
            error: (err) => {
                console.warn('[Banner][dashboard] welcome-status failed, falling back to campaigns list', err);
                // Fallback: obtener productos y campañas directamente
                this.productService.getProductsByTenantId(this.tenantId).subscribe({
                    next: (productsResp) => {
                        const productCount = Array.isArray(productsResp) ? productsResp.length : (productsResp?.object?.length ?? 0);
                        const hasProducts = productCount > 0;

                        this.campaignService.getByBusiness(this.tenantId).subscribe({
                            next: (campaigns) => {
                                const welcomeCampaigns = (campaigns || []).filter(c => c.template?.id === 1);
                                const active = welcomeCampaigns.some(c => c.status === 'ACTIVE');
                                const draft = !active && welcomeCampaigns.some(c => c.status === 'DRAFT');

                                if (!hasProducts || active) {
                                    this.showWelcomeBanner.set(false);
                                    return;
                                }

                                if (welcomeCampaigns.length === 0) {
                                    this.showWelcomeBanner.set(true);
                                    this.bannerMessage.set({
                                        title: 'Tu negocio ya está listo.',
                                        description: 'Ahora configura tu campaña de bienvenida para empezar a recibir clientes.',
                                        buttonText: 'Configurar campaña de bienvenida'
                                    });
                                } else if (draft) {
                                    this.showWelcomeBanner.set(true);
                                    this.bannerMessage.set({
                                        title: '¡Ya casi está todo listo!',
                                        description: 'Tienes una campaña de bienvenida guardada como borrador. Actívala para comenzar a recibir clientes.',
                                        buttonText: 'Activar campaña de bienvenida'
                                    });
                                }
                            },
                            error: (e2) => {
                                console.error('[Banner][dashboard] fallback getByBusiness failed', e2);
                                this.showWelcomeBanner.set(false);
                            }
                        });
                    },
                    error: (e3) => {
                        console.error('[Banner][dashboard] fallback getProducts failed', e3);
                        this.showWelcomeBanner.set(false);
                    }
                });
            }
        });
    }

    navigateToWelcomeCampaign(): void {
        // Buscar si existe una campaña de bienvenida en DRAFT
        this.campaignService.getByBusiness(this.tenantId).subscribe({
            next: (campaigns) => {
                const draftWelcome = (campaigns || []).find(c => c.template?.id === 1 && c.status === 'DRAFT');

                if (draftWelcome) {
                    // Navegar a editar la campaña existente con foco en estado
                    this.router.navigate(['/dashboard/campaigns/create'], {
                        queryParams: { id: draftWelcome.id, focusStatus: 'true' }
                    });
                } else {
                    // Crear nueva campaña de bienvenida
                    this.router.navigate(['/dashboard/campaigns/create'], {
                        queryParams: { templateId: 1 }
                    });
                }
            },
            error: () => {
                // Fallback: crear nueva
                this.router.navigate(['/dashboard/campaigns/create'], {
                    queryParams: { templateId: 1 }
                });
            }
        });
    }
}

