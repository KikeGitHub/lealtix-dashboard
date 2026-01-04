import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

// Services
import { RedemptionService } from '@/redeem/services/redemption.service';
import { AuthService } from '@/auth/auth.service';
import { MessageService, ConfirmationService } from 'primeng/api';

// Models
import { CouponValidationResponse } from '@/redeem/models/coupon-validation.model';
import { RedemptionRequest, RedemptionChannel } from '@/redeem/models/redemption-request.model';
import { RedemptionResponse } from '@/redeem/models/redemption-response.model';
import { ProductService } from '@/pages/products-menu/service/product.service';
import { CampaignService } from '@/pages/campaigns/services/campaign.service';
import { TenantService } from '@/pages/admin-page/service/tenant.service';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { signal } from '@angular/core';

type PageState = 'idle' | 'validating' | 'valid' | 'redeeming' | 'success' | 'error' | 'already-redeemed';

@Component({
  selector: 'app-manual-redemption',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    DividerModule,
    TagModule,
    MessageModule,
    ProgressSpinnerModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './manual-redemption.component.html',
  styleUrls: ['./manual-redemption.component.scss']
})
export class ManualRedemptionComponent implements OnInit {
  // UI State
  pageState: PageState = 'idle';
  couponCode: string = '';
  tenantId: number = 1;
  originalAmount: number = 0;
  minRedemptionAmount: number = 0;

  // Data
  validationData: CouponValidationResponse | null = null;
  redemptionData: RedemptionResponse | null = null;
  errorMessage: string = '';
  showWelcomeBanner = signal<boolean>(false);
  bannerMessage = signal<{ title: string; description: string; buttonText: string }>(
    { title: '', description: '', buttonText: '' }
  );

  constructor(
    private redemptionService: RedemptionService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private productService: ProductService,
    private campaignService: CampaignService,
    private tenantService: TenantService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUserWithTenant().subscribe(currentUser => {
        debugger;
      this.tenantId = currentUser?.tenantId || 1;
      if (this.tenantId > 0) {
        this.checkBannerConditions(this.tenantId);
      }
    });
  }

  /**
   * Valida el cupón ingresado
   */
  onValidateCoupon(): void {
    if (!this.couponCode || this.couponCode.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'Por favor ingrese un código de cupón',
        life: 3000
      });
      return;
    }

    this.pageState = 'validating';
    this.validationData = null;
    this.errorMessage = '';
    this.redemptionService.validateCouponByCode(this.couponCode.trim(), this.tenantId).subscribe({
      next: (response) => {
        this.validationData = response;

        // Verificar primero si ya fue redimido (prioridad más alta)
        if (response.alreadyRedeemed || response.status === 'REDEEMED' || response.redeemedAt) {
          this.pageState = 'already-redeemed';
          this.messageService.add({
            severity: 'warn',
            summary: 'Cupón ya redimido',
            detail: `Este cupón fue redimido el ${this.formatDate(response.redeemedAt)}`,
            life: 5000
          });
        } else if (response.valid) {
          this.pageState = 'valid';
          // Guardar el monto mínimo de redención
          this.minRedemptionAmount = response.minRedemptionAmount || 0;
          this.originalAmount = this.minRedemptionAmount;
          this.messageService.add({
            severity: 'success',
            summary: 'Cupón válido',
            detail: 'El cupón es válido y está listo para redimir',
            life: 3000
          });
        } else {
          this.pageState = 'error';
          this.errorMessage = response.message || 'El cupón no es válido';
          this.messageService.add({
            severity: 'error',
            summary: 'Cupón inválido',
            detail: this.errorMessage,
            life: 5000
          });
        }
      },
      error: (error) => {
        this.pageState = 'error';
        this.errorMessage = error.message || 'Error al validar el cupón';
        this.messageService.add({
          severity: 'error',
          summary: 'Error de validación',
          detail: this.errorMessage,
          life: 5000
        });
      }
    });
  }

  /**
   * Redime el cupón validado
   */
  onRedeemCoupon(): void {
    if (!this.validationData || !this.validationData.valid) {
      return;
    }

    // Validar que el monto sea mayor o igual al mínimo
    if (this.originalAmount < this.minRedemptionAmount) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Monto inválido',
        detail: `El monto debe ser al menos $${this.minRedemptionAmount.toFixed(2)}`,
        life: 3000
      });
      return;
    }

    this.confirmationService.confirm({
      message: `¿Confirma la redención del cupón para ${this.validationData.customerName} por un monto de $${this.originalAmount.toFixed(2)}?`,
      header: 'Confirmar Redención',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, redimir',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.performRedemption();
      }
    });
  }

  /**
   * Ejecuta la redención del cupón
   */
  private performRedemption(): void {
    this.pageState = 'redeeming';

    const currentUser = this.authService.getCurrentUser();
    const request: RedemptionRequest = {
      redeemedBy: currentUser?.userEmail || 'staff',
      channel: RedemptionChannel.MANUAL,
      originalAmount: this.originalAmount,
      location: 'Dashboard Admin',
      metadata: JSON.stringify({
        redeemedFrom: 'Manual Redemption Dashboard',
        timestamp: new Date().toISOString()
      })
    };
    debugger;
    this.redemptionService.redeemCouponByCode(this.couponCode.trim(), request, this.tenantId).subscribe({
      next: (response) => {
        this.redemptionData = response;

        if (response.success) {
          this.pageState = 'success';
          this.messageService.add({
            severity: 'success',
            summary: '¡Redención exitosa!',
            detail: response.message || 'El cupón ha sido redimido correctamente',
            life: 5000
          });
        } else {
          this.pageState = 'error';
          this.errorMessage = response.message || 'No se pudo redimir el cupón';
          this.messageService.add({
            severity: 'error',
            summary: 'Error al redimir',
            detail: this.errorMessage,
            life: 5000
          });
        }
      },
      error: (error) => {
        this.pageState = 'error';
        this.errorMessage = error.message || 'Error al redimir el cupón';
        this.messageService.add({
          severity: 'error',
          summary: 'Error de redención',
          detail: this.errorMessage,
          life: 5000
        });
      }
    });
  }

  /**
   * Reinicia el formulario para validar otro cupón
   */
  onValidateAnother(): void {
    this.pageState = 'idle';
    this.couponCode = '';
    this.validationData = null;
    this.redemptionData = null;
    this.errorMessage = '';
  }

  /**
   * Formatea una fecha para mostrarla
   */
  formatDate(dateString?: string | null): string {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Obtiene el texto del estado del cupón
   */
  getStatusText(status?: string | null): string {
    if (!status) return 'Desconocido';
    const statusMap: { [key: string]: string } = {
      'CREATED': 'Creado',
      'SENT': 'Enviado',
      'ACTIVE': 'Activo',
      'REDEEMED': 'Redimido',
      'EXPIRED': 'Expirado',
      'CANCELLED': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  /**
   * Obtiene la severidad para el tag del estado
   */
  getStatusSeverity(status?: string | null): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    if (!status) return 'secondary';
    const severityMap: { [key: string]: 'success' | 'secondary' | 'info' | 'warn' | 'danger' } = {
      'CREATED': 'info',
      'SENT': 'info',
      'ACTIVE': 'success',
      'REDEEMED': 'secondary',
      'EXPIRED': 'danger',
      'CANCELLED': 'warn'
    };
    return severityMap[status] || 'secondary';
  }

  /**
   * Verifica si el cupón puede ser redimido
   */
  canRedeem(): boolean {
    return this.pageState === 'valid' &&
           this.validationData !== null &&
           this.validationData.valid === true &&
           !this.validationData.alreadyRedeemed &&
           !this.validationData.isExpired;
  }

  private checkBannerConditions(tenantId: number): void {
    forkJoin({
      products: this.productService.getProductsByTenantId(tenantId),
      welcomeStatus: this.campaignService.getWelcomeCampaignStatus(tenantId)
    }).subscribe({
      next: ({ products, welcomeStatus }) => {
        const productCount = Array.isArray(products) ? products.length : (products?.object?.length ?? 0);
        const hasProducts = productCount > 0;
        const campaignExists = welcomeStatus?.exists ?? false;
        const campaignStatus = welcomeStatus?.status;

        console.debug('[Banner][manual-redemption] tenantId=', tenantId, 'productCount=', productCount, 'welcomeStatus=', welcomeStatus);

        if (!hasProducts || (campaignExists && campaignStatus === 'ACTIVE')) {
          this.showWelcomeBanner.set(false);
          return;
        }

        if (!campaignExists) {
          this.showWelcomeBanner.set(true);
          this.bannerMessage.set({
            title: 'Tu negocio ya está listo.',
            description: 'Ahora configura tu campaña de bienvenida para empezar a recibir clientes.',
            buttonText: 'Configurar campaña de bienvenida'
          });
        } else if (campaignStatus === 'DRAFT') {
          this.showWelcomeBanner.set(true);
          this.bannerMessage.set({
            title: '¡Ya casi está todo listo!',
            description: 'Tienes una campaña de bienvenida guardada como borrador. Actívala para comenzar a recibir clientes.',
            buttonText: 'Activar campaña de bienvenida'
          });
        }
      },
      error: (err) => {
        console.warn('[Banner][manual-redemption] welcome-status failed, falling back to campaigns list', err);
        this.productService.getProductsByTenantId(tenantId).subscribe({
          next: (productsResp) => {
            const productCount = Array.isArray(productsResp) ? productsResp.length : (productsResp?.object?.length ?? 0);
            const hasProducts = productCount > 0;

            this.campaignService.getByBusiness(tenantId).subscribe({
              next: (campaigns) => {
                const welcomeCampaigns = (campaigns || []).filter(c => c.template?.id === 1);
                const active = welcomeCampaigns.some(c => c.status === 'ACTIVE');
                const draft = !active && welcomeCampaigns.some(c => c.status === 'DRAFT');

                if (!hasProducts || active) { this.showWelcomeBanner.set(false); return; }

                if (welcomeCampaigns.length === 0) {
                  this.showWelcomeBanner.set(true);
                  this.bannerMessage.set({ title: 'Tu negocio ya está listo.', description: 'Ahora configura tu campaña de bienvenida para empezar a recibir clientes.', buttonText: 'Configurar campaña de bienvenida' });
                } else if (draft) {
                  this.showWelcomeBanner.set(true);
                  this.bannerMessage.set({ title: '¡Ya casi está todo listo!', description: 'Tienes una campaña de bienvenida guardada como borrador. Actívala para comenzar a recibir clientes.', buttonText: 'Activar campaña de bienvenida' });
                }
              },
              error: (e2) => { console.error('[Banner][manual-redemption] fallback getByBusiness failed', e2); this.showWelcomeBanner.set(false); }
            });
          },
          error: (e3) => { console.error('[Banner][manual-redemption] fallback getProducts failed', e3); this.showWelcomeBanner.set(false); }
        });
      }
    });
  }

  navigateToWelcomeCampaign(): void {
    this.campaignService.getByBusiness(this.tenantId).subscribe({
      next: (campaigns) => {
        const draftWelcome = (campaigns || []).find(c => c.template?.id === 1 && c.status === 'DRAFT');
        if (draftWelcome) {
          this.router.navigate(['/dashboard/campaigns/create'], { queryParams: { id: draftWelcome.id, focusStatus: 'true' } });
        } else {
          this.router.navigate(['/dashboard/campaigns/create'], { queryParams: { templateId: 1 } });
        }
      },
      error: () => { this.router.navigate(['/dashboard/campaigns/create'], { queryParams: { templateId: 1 } }); }
    });
  }
}
