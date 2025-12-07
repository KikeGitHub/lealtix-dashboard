import { Component, OnInit, signal, computed, inject, DestroyRef, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { FileUploadModule } from 'primeng/fileupload';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

// Models and Services
import { CampaignTemplate } from '@/models/campaign-template.model';
import { CreateCampaignRequest } from '@/models/campaign.model';
import { PromoType } from '@/models/enums';
import { CampaignFormModel, TemplateField, CampaignPreviewData } from '../../models/create-campaign.models';
import { CampaignService } from '../../services/campaign.service';
import { CampaignTemplateService } from '../../services/campaign-template.service';
import { CampaignPreviewDialogComponent } from './campaign-dialog/campaign-preview-dialog.component';
import { TenantService } from '@/pages/admin-page/service/tenant.service';

@Component({
  selector: 'app-create-campaign',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    MultiSelectModule,
    DatePickerModule,
    FileUploadModule,
    CheckboxModule,
    ToggleButtonModule,
    DividerModule,
    ChipModule,
    DialogModule,
    TooltipModule,
    ToastModule,
    CampaignPreviewDialogComponent
  ],
  providers: [MessageService],
  templateUrl: './create-campaign.component.html',
  styleUrls: ['./create-campaign.component.scss']
})
export class CreateCampaignComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private campaignService = inject(CampaignService);
  private templateService = inject(CampaignTemplateService);
  private messageService = inject(MessageService);
  private tenantService = inject(TenantService);

  // Signals
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  template = signal<CampaignTemplate | null>(null);
  previewDialogVisible = model<boolean>(false);
  campaignSaved = model<boolean>(false);
  uploadedImageUrl = signal<string>('');
  clientName = signal<string | null>(null);
  clientLogo = signal<string | null>(null);
  clientSlug = signal<string | null>(null);
  // Trigger to make preview computed reactive to form changes
  private formTrigger = signal<number>(0);

  email: string | null = null;
  userId: string | null = null;
  tenantId: number | null = null;

  // Form
  campaignForm!: FormGroup;

  // Computed values
  previewData = computed<CampaignPreviewData>(() => {
    // depend on this trigger so computed re-evaluates when form changes
    this.formTrigger();

    if (!this.campaignForm) {
      return this.getEmptyPreview();
    }

    const formValue = this.campaignForm.value;
    return {
      title: formValue.title || 'Título de la campaña',
      subtitle: formValue.subtitle,
      description: formValue.description || 'Descripción de la campaña',
      imageUrl: this.uploadedImageUrl() || formValue.imageUrl || this.template()?.defaultImageUrl,
      promoType: formValue.promoType,
      promoValue: formValue.promoValue,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      buttonText: formValue.buttonText || formValue.callToAction || 'Obtener promoción'
    };
  });

  // Options
  promoTypeOptions = [
    { label: 'Descuento', value: PromoType.DISCOUNT },
    { label: 'Monto Fijo', value: PromoType.AMOUNT },
    { label: 'Compra uno lleva otro', value: PromoType.BOGO },
    { label: 'Producto Gratis', value: PromoType.FREE_ITEM },
    { label: 'Otro', value: PromoType.CUSTOM }
  ];

  // Distribution channels: Email enabled by default, others shown but disabled
  channelOptions = [
    { label: 'Email', value: 'email', disabled: false },
    { label: 'Facebook', value: 'facebook', disabled: true },
    { label: 'Instagram', value: 'instagram', disabled: true },
    { label: 'Tiktok', value: 'tiktok', disabled: true },
    { label: 'X', value: 'x', disabled: true }
  ];

  // Common segmentation options for quick targeting
  segmentationOptions = [
    { label: 'Todos los clientes', value: 'all' },
    { label: 'Hombres', value: 'male' },
    { label: 'Mujeres', value: 'female' },
    { label: 'Próximo cumpleaños (7 días)', value: 'upcoming_birthday_7d' },
    { label: 'Activos últimos 30 días', value: 'active_30d' },
    { label: 'Usuarios nuevos (últimos 30 días)', value: 'new_30d' },
    { label: 'Alto valor (LTV alto)', value: 'high_ltv' },
    { label: 'Sin compras 60 días', value: 'no_purchase_60d' },
    { label: 'Clientes VIP', value: 'vip' }
  ];  // Dynamic fields from template (for future extensibility)
  dynamicFields: TemplateField[] = [];

  ngOnInit(): void {
    this.initForm();
    this.loadTemplateIfProvided();
    this.loadTenantData();
  }

  private initForm(): void {
    this.campaignForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      subtitle: [''],
      description: ['', Validators.required],
      imageUrl: [''],
      promoType: [''],
      promoValue: [''],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      showButton: [false], // Toggle for Call to Action button
      callToAction: [''],
      buttonText: ['Obtener promoción'],
  channelsText: [''],
  channels: [['email']],
  segmentation: [[]],
      isAutomatic: [false]
    });

    // Subscribe to form changes for live preview
    this.campaignForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Increment trigger so previewData recomputes immediately
        this.formTrigger.update(n => n + 1);
      });
  }

  private loadTemplateIfProvided(): void {
    const templateId = this.route.snapshot.queryParamMap.get('templateId');

    if (templateId) {
      this.loading.set(true);
      this.templateService.get(+templateId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (template: CampaignTemplate) => {
            this.template.set(template);
            this.applyTemplate(template);
            this.loading.set(false);
          },
          error: (error: any) => {
            console.error('Error loading template:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo cargar la plantilla'
            });
            this.loading.set(false);
          }
        });
    }
  }

  private applyTemplate(template: CampaignTemplate): void {
    this.campaignForm.patchValue({
      title: template.defaultTitle || '',
      subtitle: template.defaultSubtitle || '',
      description: template.defaultDescription || '',
      imageUrl: template.defaultImageUrl || '',
      promoType: template.defaultPromoType || ''
    });

    // Set channelsText if channels array exists
    const channels = this.campaignForm.get('channels')?.value;
    if (channels && channels.length > 0) {
      this.campaignForm.patchValue({ channelsText: channels.join(', ') });
    }
  }

  private loadTenantData(): void {
    const userStr = sessionStorage.getItem('usuario') ?? localStorage.getItem('usuario');
        if (userStr) {
            try {
                const userObj = JSON.parse(userStr);
                if (userObj && userObj.userEmail) {
                    this.tenantService.getTenantByEmail(String(userObj.userEmail || '').trim()).subscribe({
                        next: (resp) => {
                            const tenant = resp?.object;
                            this.tenantId = tenant?.id ?? 0;
                            this.clientName.set(tenant.nombreNegocio || 'Negocio');
                            this.clientLogo.set(tenant.logoUrl || null);
                            this.clientSlug.set(tenant.slug || null);
                        },
                        error: (err) => {
                            console.error('Error fetching tenant:', err);
                        }
                    });
                }
            } catch (e) {
                console.warn('Failed to parse stored usuario:', e);
            }
        }
    const businessId = this.tenantId || 1;

  }

  onImageUpload(event: any): void {
    const file = event.files[0];
    if (file) {
      // TODO: Upload to Cloudinary or your image service
      // For now, create a local preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.uploadedImageUrl.set(e.target.result);
        this.campaignForm.patchValue({ imageUrl: e.target.result });
      };
      reader.readAsDataURL(file);

      this.messageService.add({
        severity: 'success',
        summary: 'Imagen cargada',
        detail: 'La imagen se ha cargado correctamente'
      });
    }
  }

  save(): void {
    if (this.campaignForm.invalid) {
      this.campaignForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario inválido',
        detail: 'Por favor, completa todos los campos requeridos'
      });
      return;
    }

    this.saveCampaign(false);
  }

  saveDraft(): void {
    this.saveCampaign(true);
  }

  private saveCampaign(isDraft: boolean): void {
    this.saving.set(true);

    const formValue = this.campaignForm.value;
    const businessId = 1; // TODO: Get from auth/tenant service

    const request: CreateCampaignRequest = {
      templateId: this.template()?.id || null,
      businessId: businessId,
      title: formValue.title,
      subtitle: formValue.subtitle,
      description: formValue.description,
      imageUrl: this.uploadedImageUrl() || formValue.imageUrl,
      promoType: formValue.promoType,
      promoValue: formValue.promoValue,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      callToAction: formValue.buttonText || formValue.callToAction,
      channels: formValue.channels,
      segmentation: formValue.segmentation,
      isAutomatic: formValue.isAutomatic
    };

    this.campaignService.create(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: isDraft ? 'Borrador guardado correctamente' : 'Campaña creada correctamente'
          });
          this.saving.set(false);
          this.campaignSaved.set(true); // Marcar campaña como guardada
          this.router.navigate(['/dashboard/campaigns']);
        },
        error: (error) => {
          console.error('Error saving campaign:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'No se pudo guardar la campaña'
          });
          this.saving.set(false);
        }
      });
  }

  openPreview(): void {
    this.previewDialogVisible.set(true);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/campaigns']);
  }

  private getEmptyPreview(): CampaignPreviewData {
    return {
      title: 'Título de la campaña',
      description: 'Descripción de la campaña',
      buttonText: 'Obtener promoción'
    };
  }

  // Utility methods for template
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

  onChannelsChange(event: any): void {
    const value = event.target.value;
    if (value) {
      const channels = value.split(',').map((c: string) => c.trim()).filter((c: string) => c);
      this.campaignForm.patchValue({ channels }, { emitEvent: false });
    }
  }
}
