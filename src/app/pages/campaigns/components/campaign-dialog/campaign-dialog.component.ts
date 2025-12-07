import { Component, EventEmitter, Input, Output, OnInit, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MessageService } from 'primeng/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CreateCampaignRequest, UpdateCampaignRequest, CampaignResponse } from '@/models/campaign.model';
import { CampaignTemplate } from '@/models/campaign-template.model';
import { PromoType, CampaignStatus } from '@/models/enums';
import { CampaignService } from '../../services/campaign.service';
import { CampaignTemplateService } from '../../services/campaign-template.service';
import { DateRangeValidator } from '../../utils/date-range.validator';

@Component({
  selector: 'app-campaign-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    MessageModule,
    CheckboxModule,
    SelectModule,
    CardModule,
    ChipModule,
    DividerModule,
    InputGroupModule,
    InputGroupAddonModule
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [style]="{ width: '600px' }"
      [contentStyle]="{ 'max-height': 'calc(90vh - 120px)', 'overflow': 'auto' }"
      [header]="isEditMode ? 'Editar Campaña' : 'Nueva Campaña'"
      [modal]="true"
      [maximizable]="true"
      [resizable]="true"
      styleClass="campaign-dialog"
      (onHide)="onHide()">

      <ng-template #content>
  <div class="p-4">

          <!-- Template selector (only for new campaigns) -->
          <div class="mb-4" *ngIf="!isEditMode && showTemplateSelector && templates().length > 0">
            <h4 class="text-lg font-semibold mb-3">Seleccionar Plantilla (Opcional)</h4>
            <div class="grid gap-3">
              <div class="col-12" *ngFor="let template of templates()">
                <p-card
                  class="cursor-pointer h-full"
                  [class.border-primary]="selectedTemplateId() === template.id"
                  (click)="selectTemplate(template)">
                  <div class="flex justify-content-between align-items-center">
                    <div>
                      <h5 class="mt-0 mb-1">{{ template.name }}</h5>
                      <p class="text-sm text-500 mb-0">{{ template.defaultTitle }}</p>
                    </div>
                    <div class="flex align-items-center gap-2">
                      <p-chip
                        [label]="template.defaultPromoType || 'Custom'"
                        size="small"
                        styleClass="p-chip-outlined">
                      </p-chip>
                      <i class="pi pi-check text-primary"
                         *ngIf="selectedTemplateId() === template.id">
                      </i>
                    </div>
                  </div>
                </p-card>
              </div>
            </div>
            <p-divider></p-divider>
          </div>

          <!-- Campaign form -->
          <form [formGroup]="campaignForm" class="space-y-4">

            <!-- Información básica -->
            <div>
              <h4 class="text-lg font-semibold mb-3">Información Básica</h4>

              <div class="space-y-4">
                <div>
                  <label for="title" class="block font-medium mb-2">
                    Título <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    pInputText
                    formControlName="title"
                    placeholder="Escribe el título"
                    class="w-full"
                    [class.p-invalid]="isFieldInvalid('title')"
                    autofocus
                  />
                  <p-message
                    *ngIf="campaignForm.get('title')?.errors?.['required'] && campaignForm.get('title')?.touched"
                    severity="error"
                    variant="text"
                    size="small">
                    El título es requerido
                  </p-message>
                  <p-message
                    *ngIf="campaignForm.get('title')?.errors?.['minlength'] && campaignForm.get('title')?.touched"
                    severity="error"
                    variant="text"
                    size="small">
                    El título debe tener al menos 3 caracteres
                  </p-message>
                </div>

                <div>
                  <label for="subtitle" class="block font-medium mb-2">Subtítulo</label>
                  <input
                    id="subtitle"
                    type="text"
                    pInputText
                    formControlName="subtitle"
                    placeholder="Subtítulo (opcional)"
                    class="w-full"
                  />
                </div>

                <div>
                  <label for="description" class="block font-medium mb-2">Descripción</label>
                  <textarea
                    id="description"
                    pTextarea
                    formControlName="description"
                    rows="3"
                    placeholder="Describe la campaña"
                    class="w-full"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Promoción -->
            <div>
              <h4 class="text-lg font-semibold mb-3">Configuración de Promoción</h4>

              <div class="space-y-4">
                <div>
                  <label for="promoType" class="block font-medium mb-2">Tipo de Promoción</label>
                  <p-select
                    id="promoType"
                    formControlName="promoType"
                    [options]="promoTypeOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar tipo"
                    styleClass="w-full"
                    (onChange)="onPromoTypeChange()"
                  ></p-select>
                </div>

                <div *ngIf="shouldShowPromoValue()">
                  <label for="promoValue" class="block font-medium mb-2">
                    {{ getPromoValueLabel() }}
                  </label>
                  <div class="p-inputgroup">
                    <span class="p-inputgroup-addon" *ngIf="getPromoValuePrefix()">
                      {{ getPromoValuePrefix() }}
                    </span>
                    <input
                      id="promoValue"
                      type="text"
                      pInputText
                      formControlName="promoValue"
                      class="w-full"
                      [placeholder]="getPromoValuePlaceholder()"
                    />
                    <span class="p-inputgroup-addon" *ngIf="getPromoValueSuffix()">
                      {{ getPromoValueSuffix() }}
                    </span>
                  </div>
                  <p-message
                    *ngIf="campaignForm.get('promoValue')?.errors?.['promoValue']"
                    severity="error"
                    variant="text"
                    size="small">
                    {{ campaignForm.get('promoValue')?.errors?.['promoValue']?.message }}
                  </p-message>
                </div>

                <div>
                  <label for="callToAction" class="block font-medium mb-2">Call to Action</label>
                  <input
                    id="callToAction"
                    type="text"
                    pInputText
                    formControlName="callToAction"
                    placeholder="Ej: ¡Aprovecha ahora!"
                    class="w-full"
                  />
                </div>
              </div>
            </div>

            <!-- Programación -->
            <div>
              <h4 class="text-lg font-semibold mb-3">Programación</h4>

              <div class="space-y-4">
                <div>
                  <label for="startDate" class="block font-medium mb-2">
                    Fecha de inicio <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    pInputText
                    formControlName="startDate"
                    class="w-full"
                    [class.p-invalid]="isFieldInvalid('startDate')"
                  />
                  <p-message
                    *ngIf="isFieldInvalid('startDate')"
                    severity="error"
                    variant="text"
                    size="small">
                    {{ campaignForm.get('startDate')?.errors?.['futureDate']?.message || 'La fecha de inicio es inválida' }}
                  </p-message>
                </div>

                <div>
                  <label for="endDate" class="block font-medium mb-2">Fecha de fin</label>
                  <input
                    id="endDate"
                    type="date"
                    pInputText
                    formControlName="endDate"
                    class="w-full"
                    [class.p-invalid]="isFieldInvalid('endDate') || (campaignForm.errors && campaignForm.errors['dateRange'])"
                  />
                  <p-message
                    *ngIf="isFieldInvalid('endDate')"
                    severity="error"
                    variant="text"
                    size="small">
                    La fecha de fin es inválida
                  </p-message>
                  <p-message
                    *ngIf="campaignForm.errors?.['dateRange']"
                    severity="error"
                    variant="text"
                    size="small">
                    {{ campaignForm.errors?.['dateRange']?.message }}
                  </p-message>
                </div>
              </div>
            </div>

            <!-- Distribución -->
            <div>
              <h4 class="text-lg font-semibold mb-3">Distribución</h4>

              <div class="space-y-4">
                <div>
                  <label for="channels" class="block font-medium mb-2">Canales</label>
                  <input
                    id="channels"
                    type="text"
                    pInputText
                    placeholder="Email, SMS, App"
                    (blur)="onChannelsChange($event)"
                    class="w-full"
                  />
                  <p-message
                    *ngIf="campaignForm.get('channels')?.invalid && campaignForm.get('channels')?.touched"
                    severity="error"
                    variant="text"
                    size="small">
                    Agrega al menos un canal
                  </p-message>
                  <small class="text-500">Escribe los canales separados por coma</small>
                </div>

                <div>
                  <label for="segmentation" class="block font-medium mb-2">Segmentación</label>
                  <input
                    id="segmentation"
                    type="text"
                    pInputText
                    formControlName="segmentation"
                    placeholder="Ej: Clientes premium"
                    class="w-full"
                  />
                </div>
              </div>
            </div>

            <!-- Imagen -->
            <div>
              <h4 class="text-lg font-semibold mb-3">Imagen</h4>

              <div>
                <label for="imageUrl" class="block font-medium mb-2">URL de Imagen</label>
                <input
                  id="imageUrl"
                  type="text"
                  pInputText
                  formControlName="imageUrl"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  class="w-full"
                />
                <!-- Preview de imagen -->
                <div class="mt-3" *ngIf="imagePreview()">
                  <img
                    [src]="imagePreview()"
                    alt="Preview"
                    class="border-round border-1 border-gray-200"
                    (error)="onImageError()"
                    style="max-width:200px; max-height:150px; object-fit: contain;"
                  />
                </div>
              </div>
            </div>

            <!-- Estado (solo en modo edición) -->
            <div *ngIf="isEditMode">
              <h4 class="text-lg font-semibold mb-3">Estado</h4>

              <div class="space-y-4">
                <div>
                  <label for="status" class="block font-medium mb-2">Estado de la Campaña</label>
                  <p-select
                    id="status"
                    formControlName="status"
                    [options]="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar estado"
                    styleClass="w-full"
                  ></p-select>
                </div>
              </div>
            </div>

            <!-- Configuración automática -->
            <div>
              <div class="flex align-items-center gap-3">
                <p-checkbox
                  formControlName="isAutomatic"
                  binary="true"
                  inputId="isAutomatic">
                </p-checkbox>
                <label for="isAutomatic" class="mb-0">Campaña automática</label>
              </div>
              <small class="block text-500 mt-1">
                La campaña se ejecutará automáticamente según las reglas definidas
              </small>
            </div>

          </form>
        </div>
      </ng-template>

      <ng-template #footer>
        <div class="flex justify-content-end gap-3 p-3">
          <p-button
            label="Cancelar"
            icon="pi pi-times"
            text
            (click)="hide.emit()"
          />
          <p-button
            [label]="isEditMode ? 'Actualizar' : 'Guardar'"
            icon="pi pi-check"
            [loading]="saving()"
            [disabled]="campaignForm.invalid"
            (click)="save.emit()"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host ::ng-deep .campaign-dialog .p-dialog-content {
      padding: 0 !important;
    }

    .border-primary {
      border: 2px solid var(--primary-color) !important;
    }

    .cursor-pointer {
      cursor: pointer;
    }

    .space-y-4 > :not([hidden]) ~ :not([hidden]) {
      margin-top: 1rem;
    }
  `]
})
export class CampaignDialogComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() campaign: CampaignResponse | null = null;
  @Input() submitted: boolean = false;
  @Input() isEditMode: boolean = false;
  @Input() initialTemplateId?: number;
  @Input() showTemplateSelector = true;

  @Output() save = new EventEmitter<void>();
  @Output() hide = new EventEmitter<void>();

  campaignForm: FormGroup;
  templates = signal<CampaignTemplate[]>([]);
  selectedTemplateId = signal<number | null>(null);
  saving = signal<boolean>(false);
  imagePreview = signal<string>('');

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
    private campaignTemplateService: CampaignTemplateService,
    private messageService: MessageService
  ) {
    this.campaignForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadTemplates();
    this.setupImagePreview();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['campaign'] && this.campaign) {
      this.populateFormWithCampaign(this.campaign);
    }

    // Auto-apply template if initialTemplateId is provided
    if (changes['initialTemplateId'] && this.initialTemplateId && this.templates().length > 0) {
      const template = this.templates().find(t => t.id === this.initialTemplateId);
      if (template) {
        this.selectTemplate(template);
      }
    }

    // If templates loaded after initialTemplateId was set, apply it
    if (changes['templates'] && this.initialTemplateId && this.templates().length > 0) {
      const template = this.templates().find(t => t.id === this.initialTemplateId);
      if (template) {
        this.selectTemplate(template);
      }
    }
  }

  onHide(): void {
    this.visibleChange.emit(false);
    this.hide.emit();
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

          // Apply initial template if provided
          if (this.initialTemplateId) {
            const template = templates.find(t => t.id === this.initialTemplateId);
            if (template) {
              this.selectTemplate(template);
            }
          }
        },
        error: (error) => {
          console.error('Error loading templates:', error);
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

  getFormValue() {
    return this.campaignForm.value;
  }

  getSelectedTemplateId() {
    return this.selectedTemplateId();
  }

  setSaving(value: boolean) {
    this.saving.set(value);
  }
}
