import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
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

  // Data
  validationData: CouponValidationResponse | null = null;
  redemptionData: RedemptionResponse | null = null;
  errorMessage: string = '';
  showWelcomeBanner = signal<boolean>(false);

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

    this.confirmationService.confirm({
      message: `¿Confirma la redención del cupón para ${this.validationData.customerName}?`,
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
  getStatusSeverity(status?: string | null): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    if (!status) return 'secondary';
    const severityMap: { [key: string]: 'success' | 'secondary' | 'info' | 'warning' | 'danger' } = {
      'CREATED': 'info',
      'SENT': 'info',
      'ACTIVE': 'success',
      'REDEEMED': 'secondary',
      'EXPIRED': 'danger',
      'CANCELLED': 'warning'
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
      welcomeCampaign: this.campaignService.hasActiveWelcomeCampaign(tenantId)
    }).subscribe({
      next: ({ products, welcomeCampaign }) => {
        const hasProducts = (products?.object?.length ?? 0) > 0;
        const hasWelcome = welcomeCampaign?.hasActiveWelcomeCampaign ?? false;
        this.showWelcomeBanner.set(hasProducts && !hasWelcome);
      },
      error: (err) => {
        console.error('Error checking banner conditions:', err);
        this.showWelcomeBanner.set(false);
      }
    });
  }

  navigateToWelcomeCampaign(): void {
    this.router.navigate(['/dashboard/campaigns/create'], {
      queryParams: { templateId: 1 }
    });
  }
}
