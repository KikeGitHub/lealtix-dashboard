import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { RedemptionService } from '../../services/redemption.service';
import { CouponValidationResponse, CouponStatus } from '../../models/coupon-validation.model';
import { RedemptionRequest, RedemptionChannel } from '../../models/redemption-request.model';
import { RedemptionResponse } from '../../models/redemption-response.model';
import { AuthService } from '../../../auth/auth.service';
import { TenantService } from '../../../pages/admin-page/service/tenant.service';

type PageState = 'loading' | 'valid' | 'invalid' | 'redeemed' | 'expired' | 'not-found' | 'redeeming' | 'success' | 'error';

@Component({
  selector: 'app-redeem-page',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    MessageModule,
    ProgressSpinnerModule,
    DividerModule,
    ConfirmDialogModule,
    ToastModule
  ],
  templateUrl: './redeem-page.component.html',
  styleUrls: ['./redeem-page.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class RedeemPageComponent implements OnInit, OnDestroy {
  qrToken: string = '';
  pageState: PageState = 'loading';
  validationData: CouponValidationResponse | null = null;
  redemptionData: RedemptionResponse | null = null;
  errorMessage: string = '';
  isRedeeming: boolean = false;

  // Control de acceso
  email: string = '';
  isStaffView: boolean = false;
  hasValidSession: boolean = false;
  tenantId: number | null = null;

  private destroy$ = new Subject<void>();

  // Referencia al enum para usar en template
  CouponStatus = CouponStatus;

  constructor(
    private route: ActivatedRoute,
    private redemptionService: RedemptionService,
    private authService: AuthService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private tenantService: TenantService
  ) {}

  ngOnInit(): void {
    // Obtener token de la ruta
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.qrToken = params['qrToken'];
        if (this.qrToken) {
          // Detectar sesión y tenant, luego validar cupón
          this.checkStaffAccess();
        } else {
          this.pageState = 'not-found';
          this.errorMessage = 'No se proporcionó un código de cupón válido';
        }
      });
  }

  /**
   * Verifica si el usuario tiene sesión y tenantId válido (staff)
   */
  private checkStaffAccess(): void {
    debugger;
    // Obtener usuario usando el servicio de autenticación
    const currentUser = this.authService.getCurrentUser();

    if (currentUser && currentUser.email) {
      this.email = currentUser.email;

      // Obtener tenant por email
      this.tenantService.getTenantByEmail(this.email).subscribe({
        next: (tenant: any) => {
          if (tenant && tenant.object && tenant.object.id) {
            this.tenantId = tenant.object.id ?? 0;
            this.hasValidSession = true;

            // Si tiene tenantId válido, es vista de staff
            this.isStaffView = !!this.tenantId && this.tenantId > 0;
          } else {
            // No hay tenant válido, es cliente
            this.isStaffView = false;
            this.hasValidSession = false;
            this.tenantId = null;
          }
          // Validar cupón después de determinar el tipo de usuario
          this.validateCoupon();
        },
        error: (error) => {
          console.warn('No tenant found for email:', this.email);
          // Si hay error obteniendo tenant, es cliente
          this.isStaffView = false;
          this.hasValidSession = false;
          this.tenantId = null;
          // Validar cupón como cliente
          this.validateCoupon();
        }
      });
    } else {
      // No hay usuario en storage, es cliente
      this.isStaffView = false;
      this.hasValidSession = false;
      // Validar cupón como cliente
      this.validateCoupon();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Valida el cupón automáticamente al cargar
   * Usa endpoint diferente según si es staff o cliente
   */
  private validateCoupon(): void {
    this.pageState = 'loading';

    // Seleccionar el método de validación según el tipo de usuario
    const validationObservable = this.isStaffView && this.tenantId !== null
      ? this.redemptionService.validateCouponByQr(this.qrToken, this.tenantId)
      : this.redemptionService.validateCouponByCustomerQr(this.qrToken);

    validationObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.validationData = response;

          if (response.valid) {
            this.pageState = 'valid';
          } else if (response.alreadyRedeemed) {
            this.pageState = 'redeemed';
          } else if (response.isExpired) {
            this.pageState = 'expired';
          } else {
            this.pageState = 'not-found';
          }
        },
        error: (error) => {
          console.error('Error validating coupon:', error);
          this.pageState = 'error';
          this.errorMessage = error.message || 'Error al validar el cupón';
        }
      });
  }

  /**
   * Inicia el proceso de redención con confirmación
   */
  onRedeemCoupon(): void {
    this.confirmationService.confirm({
      header: '¿Confirmar redención?',
      message: '¿Está seguro que desea redimir este cupón? Esta acción no se puede deshacer.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, redimir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.redeemCoupon();
      }
    });
  }

  /**
   * Ejecuta la redención del cupón
   */
  private redeemCoupon(): void {
    this.isRedeeming = true;
    this.pageState = 'redeeming';
    debugger;
    // Obtener información del usuario actual usando el método genérico
    const currentUser = this.authService.getCurrentUser();

    const request: RedemptionRequest = {
      redeemedBy: currentUser?.email || currentUser?.userEmail || 'unknown',
      channel: RedemptionChannel.QR_WEB,
      location: 'Web Dashboard',
      metadata: JSON.stringify({
        device: this.getDeviceType(),
        browser: this.getBrowserName(),
        timestamp: new Date().toISOString(),
        userId: currentUser?.userId || null
      })
    };

    this.redemptionService.redeemCouponByQr(this.qrToken, request, this.tenantId ?? 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.redemptionData = response;
          this.isRedeeming = false;

          if (response.success) {
            this.pageState = 'success';
            this.messageService.add({
              severity: 'success',
              summary: '¡Cupón redimido!',
              detail: 'El cupón se ha redimido exitosamente',
              life: 5000
            });
          } else {
            this.pageState = 'error';
            this.errorMessage = response.message || 'No se pudo redimir el cupón';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: this.errorMessage,
              life: 5000
            });
          }
        },
        error: (error) => {
          console.error('Error redeeming coupon:', error);
          this.isRedeeming = false;
          this.pageState = 'error';
          this.errorMessage = error.message || 'Error al redimir el cupón';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.errorMessage,
            life: 5000
          });
        }
      });
  }

  /**
   * Recarga la página para validar otro cupón
   */
  onValidateAnother(): void {
    window.location.reload();
  }

  /**
   * Obtiene el tipo de dispositivo
   */
  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
      return 'Tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
      return 'Mobile';
    }
    return 'Desktop';
  }

  /**
   * Obtiene el nombre del navegador
   */
  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  /**
   * Formatea fecha para mostrar
   */
  formatDate(dateString?: string | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtiene la severidad del tag según el estado
   */
  getStatusSeverity(status?: string | null): 'success' | 'danger' | 'warning' | 'info' {
    if (!status) return 'info';
    switch (status) {
      case CouponStatus.ACTIVE:
        return 'success';
      case CouponStatus.REDEEMED:
        return 'danger';
      case CouponStatus.EXPIRED:
        return 'warning';
      case CouponStatus.CANCELLED:
        return 'danger';
      default:
        return 'info';
    }
  }

  /**
   * Obtiene el texto del estado
   */
  getStatusText(status?: string | null): string {
    if (!status) return 'DESCONOCIDO';
    switch (status) {
      case CouponStatus.ACTIVE:
        return 'ACTIVO';
      case CouponStatus.REDEEMED:
        return 'REDIMIDO';
      case CouponStatus.EXPIRED:
        return 'EXPIRADO';
      case CouponStatus.CANCELLED:
        return 'CANCELADO';
      case CouponStatus.CREATED:
        return 'CREADO';
      case CouponStatus.SENT:
        return 'ENVIADO';
      default:
        return 'DESCONOCIDO';
    }
  }
}
