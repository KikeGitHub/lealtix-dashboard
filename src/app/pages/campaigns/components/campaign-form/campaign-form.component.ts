import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
// Note: avoid adding module imports that may not be available in the workspace; keep used PrimeNG modules minimal.
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CreateCampaignRequest, UpdateCampaignRequest, CampaignResponse } from '@/models/campaign.model';
import { CampaignTemplate } from '@/models/campaign-template.model';
import { PromoType, CampaignStatus } from '@/models/enums';
import { CampaignService } from '../../services/campaign.service';
import { CampaignTemplateService } from '../../services/campaign-template.service';
import { DateRangeValidator } from '../../utils/date-range.validator';


@Component({
  selector: 'app-campaign-form',
  standalone: true,
  imports: [
  CommonModule,
  ReactiveFormsModule,
  FormsModule,
  ButtonModule,
  CardModule,
  InputTextModule,
  CheckboxModule,
  ChipModule,
  DividerModule,
  ToastModule
  ],
  providers: [MessageService],
  templateUrl: './campaign-form.component.html',
  styles: [`
    :host {
      display: block;
    }

    .border-primary {
      border: 2px solid var(--primary-color) !important;
    }

    .cursor-pointer {
      cursor: pointer;
    }

    .max-w-200 {
      max-width: 200px;
    }

    .max-h-150 {
      max-height: 150px;
    }
  `]
})
export class CampaignFormComponent implements OnInit {
  campaignForm: FormGroup;
  templates = signal<CampaignTemplate[]>([]);
  selectedTemplateId = signal<number | null>(null);
  isEditMode = signal<boolean>(false);
  saving = signal<boolean>(false);
  imagePreview = signal<string>('');

  minDate = new Date();

  campaignId?: number;

  promoTypeOptions = [
    { label: 'Descuento porcentual', value: PromoType.DISCOUNT },
    { label: 'Descuento por monto', value: PromoType.AMOUNT },
    { label: 'Compra uno lleva otro', value: PromoType.BOGO },
    { label: 'Artículo gratuito', value: PromoType.FREE_ITEM },
    { label: 'Promoción personalizada', value: PromoType.CUSTOM }
  ];

  statusOptions = [
    { label: 'Borrador', value: CampaignStatus.DRAFT },
    { label: 'Activa', value: CampaignStatus.ACTIVE },
    { label: 'Inactiva', value: CampaignStatus.INACTIVE },
    { label: 'Programada', value: CampaignStatus.SCHEDULED }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampaignService,
    private campaignTemplateService: CampaignTemplateService,
    private messageService: MessageService
  ) {
    this.campaignForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadTemplates();
    this.checkRouteParams();
    this.setupImagePreview();
  }

  // Helper para templates: checa si un campo del form es inválido y fue tocado
  isFieldInvalid(fieldName: string): boolean {
    const control = this.campaignForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      subtitle: [''],
      description: [''],
      promoType: [''],
      promoValue: [''],
      callToAction: [''],
      startDate: [''],
      endDate: [''],
      channels: [[]],
      segmentation: [''],
      imageUrl: [''],
      status: [CampaignStatus.DRAFT],
      isAutomatic: [false]
    }, {
      validators: [DateRangeValidator.dateRange, DateRangeValidator.promoValue]
    });
  }

  private loadTemplates(): void {
    this.campaignTemplateService.getAll()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (templates) => {
          this.templates.set(templates.filter(t => t.active !== false));
        },
        error: (error) => {
          console.error('Error loading templates:', error);
        }
      });
  }

  private checkRouteParams(): void {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe(params => {
      if (params['templateId']) {
        this.loadTemplate(+params['templateId']);
      }
      if (params['campaignId']) {
        this.loadCampaignForEdit(+params['campaignId']);
      }
    });
  }

  private loadTemplate(templateId: number): void {
    this.campaignTemplateService.get(templateId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (template) => {
          this.applyTemplate(template);
        },
        error: (error) => {
          console.error('Error loading template:', error);
        }
      });
  }

  private loadCampaignForEdit(campaignId: number): void {
    this.campaignId = campaignId;
    this.isEditMode.set(true);

    this.campaignService.get(campaignId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (campaign) => {
          this.populateFormWithCampaign(campaign);
        },
        error: (error) => {
          console.error('Error loading campaign:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar la campaña para editar'
          });
        }
      });
  }

  private populateFormWithCampaign(campaign: CampaignResponse): void {
    this.campaignForm.patchValue({
      title: campaign.title,
      subtitle: campaign.subtitle,
      description: campaign.description,
      promoType: campaign.promoType,
      promoValue: campaign.promoValue,
      callToAction: campaign.callToAction,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      channels: campaign.channels || [],
      segmentation: campaign.segmentation,
      imageUrl: campaign.imageUrl,
      status: campaign.status,
      isAutomatic: campaign.isAutomatic
    });
  }

  private setupImagePreview(): void {
    this.campaignForm.get('imageUrl')?.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(url => {
        this.imagePreview.set(url || '');
      });
  }

  selectTemplate(template: CampaignTemplate): void {
    this.selectedTemplateId.set(template.id!);
    this.applyTemplate(template);
  }

  private applyTemplate(template: CampaignTemplate): void {
    this.campaignForm.patchValue({
      title: template.defaultTitle || '',
      subtitle: template.defaultSubtitle || '',
      description: template.defaultDescription || '',
      promoType: template.defaultPromoType || '',
      imageUrl: template.defaultImageUrl || ''
    });
  }

  onPromoTypeChange(): void {
    const promoType = this.campaignForm.get('promoType')?.value;
    const promoValueControl = this.campaignForm.get('promoValue');

    // Reset promo value when type changes
    promoValueControl?.setValue('');

    // Add/remove validators based on type
    if (this.shouldShowPromoValue()) {
      promoValueControl?.setValidators([Validators.required]);
    } else {
      promoValueControl?.clearValidators();
    }

    promoValueControl?.updateValueAndValidity();
  }

  shouldShowPromoValue(): boolean {
    const promoType = this.campaignForm.get('promoType')?.value;
    return promoType === PromoType.DISCOUNT || promoType === PromoType.AMOUNT || promoType === PromoType.CUSTOM;
  }

  getPromoValueLabel(): string {
    const promoType = this.campaignForm.get('promoType')?.value;
    switch (promoType) {
      case PromoType.DISCOUNT: return 'Porcentaje de Descuento';
      case PromoType.AMOUNT: return 'Monto de Descuento';
      case PromoType.CUSTOM: return 'Descripción de la Promoción';
      default: return 'Valor';
    }
  }

  getPromoValuePrefix(): string {
    const promoType = this.campaignForm.get('promoType')?.value;
    return promoType === PromoType.AMOUNT ? '$' : '';
  }

  getPromoValueSuffix(): string {
    const promoType = this.campaignForm.get('promoType')?.value;
    return promoType === PromoType.DISCOUNT ? '%' : '';
  }

  getPromoValuePlaceholder(): string {
    const promoType = this.campaignForm.get('promoType')?.value;
    switch (promoType) {
      case PromoType.DISCOUNT: return '10';
      case PromoType.AMOUNT: return '1000';
      case PromoType.CUSTOM: return 'Descripción de la promoción';
      default: return '';
    }
  }

  getEndDateMinDate(): Date {
    const startDate = this.campaignForm.get('startDate')?.value;
    if (startDate) {
      const minEndDate = new Date(startDate);
      minEndDate.setDate(minEndDate.getDate() + 1);
      return minEndDate;
    }
    return this.minDate;
  }

  onImageError(): void {
    this.imagePreview.set('');
  }

  onChannelsChange(event: any): void {
    const value = event.target.value;
    if (value.trim()) {
      const channels = value.split(',').map((c: string) => c.trim()).filter((c: string) => c);
      this.campaignForm.patchValue({ channels });
      event.target.value = '';
    }
  }

  removeChannel(channelToRemove: string): void {
    const currentChannels = this.campaignForm.get('channels')?.value || [];
    const updatedChannels = currentChannels.filter((c: string) => c !== channelToRemove);
    this.campaignForm.patchValue({ channels: updatedChannels });
  }

  onSubmit(): void {
    if (this.campaignForm.invalid) {
      this.campaignForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    if (this.isEditMode()) {
      this.updateCampaign();
    } else {
      this.createCampaign();
    }
  }

  private createCampaign(): void {
    const formValue = this.campaignForm.value;

    const request: CreateCampaignRequest = {
      templateId: this.selectedTemplateId(),
      businessId: 1, // TODO: Get from auth service
      title: formValue.title,
      subtitle: formValue.subtitle,
      description: formValue.description,
      promoType: formValue.promoType,
      promoValue: formValue.promoValue,
      callToAction: formValue.callToAction,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      channels: formValue.channels,
      segmentation: formValue.segmentation,
      imageUrl: formValue.imageUrl,
      isAutomatic: formValue.isAutomatic
    };

    this.campaignService.create(request)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (campaign) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Campaña creada exitosamente'
          });
          this.router.navigate(['/dashboard/campaigns', campaign.id]);
        },
        error: (error) => {
          console.error('Error creating campaign:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la campaña'
          });
          this.saving.set(false);
        }
      });
  }

  private updateCampaign(): void {
    const formValue = this.campaignForm.value;

    const request: UpdateCampaignRequest = {
      title: formValue.title,
      subtitle: formValue.subtitle,
      description: formValue.description,
      promoType: formValue.promoType,
      promoValue: formValue.promoValue,
      callToAction: formValue.callToAction,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      status: formValue.status,
      channels: formValue.channels,
      segmentation: formValue.segmentation,
      imageUrl: formValue.imageUrl,
      isAutomatic: formValue.isAutomatic
    };

    this.campaignService.update(this.campaignId!, request)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (campaign) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Campaña actualizada exitosamente'
          });
          this.router.navigate(['/dashboard/campaigns', campaign.id]);
        },
        error: (error) => {
          console.error('Error updating campaign:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la campaña'
          });
          this.saving.set(false);
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/campaigns']);
  }
}
