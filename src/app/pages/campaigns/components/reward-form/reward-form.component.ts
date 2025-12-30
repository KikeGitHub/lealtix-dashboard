import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { Textarea } from 'primeng/textarea';
import { RewardType } from '@/models/enums';
import { CreateRewardRequest, RewardResponse } from '../../models/reward.model';
import { CampaignService } from '../../services/campaign.service';

@Component({
  selector: 'app-reward-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Button,
    Select,
    InputNumber,
    Textarea
  ],
  templateUrl: './reward-form.component.html',
  styleUrls: ['./reward-form.component.scss']
})
export class RewardFormComponent implements OnInit, OnChanges {
  @Input() campaignId?: number;
  @Input() existingReward?: RewardResponse;
  @Output() saved = new EventEmitter<RewardResponse>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private campaignService = inject(CampaignService);
  private messageService = inject(MessageService);

  rewardForm!: FormGroup;
  rewardTypes = [
    { label: 'Descuento porcentual', value: RewardType.PERCENT_DISCOUNT },
    { label: 'Monto fijo', value: RewardType.FIXED_AMOUNT },
    { label: 'Producto gratis', value: RewardType.FREE_PRODUCT },
    { label: 'Compra X lleva Y', value: RewardType.BUY_X_GET_Y },
    { label: 'Personalizado', value: RewardType.CUSTOM }
  ];

  isSubmitting = false;
  isEditMode = false;

  ngOnInit(): void {
    this.initForm();
    this.setupFormListeners();
    if (this.existingReward) {
      this.loadExistingReward(this.existingReward);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['existingReward'] && this.rewardForm) {
      if (this.existingReward) {
        this.loadExistingReward(this.existingReward);
      } else {
        // Si existingReward se vuelve null/undefined, resetear el formulario
        this.isEditMode = false;
        this.rewardForm.reset();
      }
    }
  }

  private loadExistingReward(reward: RewardResponse): void {
    this.isEditMode = true;
    this.rewardForm.patchValue({
      rewardType: reward.rewardType,
      numericValue: reward.numericValue,
      productId: reward.productId,
      buyQuantity: reward.buyQuantity,
      freeQuantity: reward.freeQuantity,
      description: reward.description,
      minPurchaseAmount: reward.minPurchaseAmount,
      usageLimit: reward.usageLimit
    });
  }

  private initForm(): void {
    this.rewardForm = this.fb.group({
      rewardType: [null, Validators.required],
      numericValue: [null],
      productId: [null],
      buyQuantity: [null],
      freeQuantity: [null],
      description: [''],
      minPurchaseAmount: [null],
      usageLimit: [null]
    });
  }

  private setupFormListeners(): void {
    this.rewardForm.get('rewardType')?.valueChanges.subscribe((type: RewardType) => {
      this.updateValidators(type);
    });
  }

  private updateValidators(rewardType: RewardType): void {
    // Limpiar todos los validadores
    Object.keys(this.rewardForm.controls).forEach(key => {
      if (key !== 'rewardType') {
        this.rewardForm.get(key)?.clearValidators();
        this.rewardForm.get(key)?.setValue(null);
      }
    });

    // Aplicar validadores según el tipo de reward
    switch (rewardType) {
      case RewardType.PERCENT_DISCOUNT:
        this.rewardForm.get('numericValue')?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
        break;
      case RewardType.FIXED_AMOUNT:
        this.rewardForm.get('numericValue')?.setValidators([Validators.required, Validators.min(0)]);
        break;
      case RewardType.FREE_PRODUCT:
        this.rewardForm.get('productId')?.setValidators([Validators.required]);
        break;
      case RewardType.BUY_X_GET_Y:
        this.rewardForm.get('buyQuantity')?.setValidators([Validators.required, Validators.min(1)]);
        this.rewardForm.get('freeQuantity')?.setValidators([Validators.required, Validators.min(1)]);
        break;
      case RewardType.CUSTOM:
        this.rewardForm.get('description')?.setValidators([Validators.required]);
        break;
    }

    // Actualizar el estado de validación
    Object.keys(this.rewardForm.controls).forEach(key => {
      this.rewardForm.get(key)?.updateValueAndValidity();
    });
  }

  get selectedRewardType(): RewardType | null {
    return this.rewardForm.get('rewardType')?.value;
  }

  get showNumericValue(): boolean {
    return this.selectedRewardType === RewardType.PERCENT_DISCOUNT ||
           this.selectedRewardType === RewardType.FIXED_AMOUNT;
  }

  get showProductId(): boolean {
    return this.selectedRewardType === RewardType.FREE_PRODUCT;
  }

  get showBuyGetQuantities(): boolean {
    return this.selectedRewardType === RewardType.BUY_X_GET_Y;
  }

  get showDescription(): boolean {
    return this.selectedRewardType === RewardType.CUSTOM;
  }

  get numericValueLabel(): string {
    if (this.selectedRewardType === RewardType.PERCENT_DISCOUNT) {
      return 'Porcentaje de descuento (%)';
    }
    if (this.selectedRewardType === RewardType.FIXED_AMOUNT) {
      return 'Monto fijo ($)';
    }
    return 'Valor';
  }

  onSubmit(): void {
    if (this.rewardForm.invalid) {
      this.rewardForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor complete todos los campos requeridos'
      });
      return;
    }
this.isSubmitting = true;
    const request: CreateRewardRequest = this.buildRequest();

    // Si es modo edición y existe un reward, actualizar
    if (this.isEditMode && this.existingReward?.id) {
      this.updateReward(this.existingReward.id, request);
    } else if (this.campaignId) {
      // Si no es edición pero hay campaignId, crear nuevo reward
      this.createReward(this.campaignId, request);
    } else {
      this.isSubmitting = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'ID de campaña no proporcionado'
      });
    }
  }

  private createReward(campaignId: number, request: CreateRewardRequest): void {
    this.campaignService.createReward(campaignId, request).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Beneficio creado correctamente'
        });
        this.saved.emit(response);
        this.rewardForm.reset();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Error al crear el beneficio'
        });
      }
    });
  }

  private updateReward(rewardId: number, request: CreateRewardRequest): void {
    this.campaignService.updateReward(rewardId, request).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Beneficio actualizado correctamente'
        });
        this.saved.emit(response);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Error al actualizar el beneficio'
        });
      }
    });
  }

  private buildRequest(): CreateRewardRequest {
    const formValue = this.rewardForm.value;
    const request: CreateRewardRequest = {
      rewardType: formValue.rewardType
    };

    // Agregar campos opcionales solo si tienen valor
    if (formValue.numericValue !== null && formValue.numericValue !== undefined) {
      request.numericValue = formValue.numericValue;
    }
    if (formValue.productId) {
      request.productId = formValue.productId;
    }
    if (formValue.buyQuantity) {
      request.buyQuantity = formValue.buyQuantity;
    }
    if (formValue.freeQuantity) {
      request.freeQuantity = formValue.freeQuantity;
    }
    if (formValue.customConfig) {
      request.customConfig = formValue.customConfig;
    }
    if (formValue.description) {
      request.description = formValue.description;
    }
    if (formValue.minPurchaseAmount) {
      request.minPurchaseAmount = formValue.minPurchaseAmount;
    }
    if (formValue.usageLimit) {
      request.usageLimit = formValue.usageLimit;
    }

    return request;
  }

  onCancel(): void {
    this.rewardForm.reset();
    this.cancelled.emit();
  }
}
