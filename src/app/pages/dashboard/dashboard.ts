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
                                <div class="font-semibold text-xl mb-2" style="color: #92400E;">Tu negocio ya está listo.</div>
                                <div class="line-height-3" style="color: #78350F;">Ahora configura tu campaña de bienvenida para empezar a recibir clientes.</div>
                            </div>
                        </div>
                        <p-button
                            label="Configurar campaña de bienvenida"
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
            welcomeCampaign: this.campaignService.hasActiveWelcomeCampaign(this.tenantId)
        }).subscribe({
            next: ({ products, welcomeCampaign }) => {
                const hasProducts = (products?.object?.length ?? 0) > 0;
                const hasWelcome = welcomeCampaign?.hasActiveWelcomeCampaign ?? false;

                // Mostrar banner si:
                // 1. Tiene al menos 1 producto
                // 2. NO tiene campaña de bienvenida activa
                this.showWelcomeBanner.set(hasProducts && !hasWelcome);
            },
            error: (err) => {
                console.error('Error checking banner conditions:', err);
                this.showWelcomeBanner.set(false);
            }
        });
    }

    navigateToWelcomeCampaign(): void {
        // Navegar a la ruta de creación de campaña con plantilla de bienvenida
        this.router.navigate(['/dashboard/campaigns/create'], {
            queryParams: { templateId: 1 }
        });
    }
}

