import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';

import { OrderItem, PendingOrder } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { AuthService } from '@/auth/auth.service';

interface SplitItem {
  productId: number;
  productName: string;
  cantidad: number;
  precioUnitario: number;
  comentarios?: string;
  excludedIngredientIds?: number[];
  additionalIngredientIds?: number[];
  seleccionado: boolean;
}

@Component({
  selector: 'app-split-order-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    DialogModule,
    DividerModule,
    MessageModule,
    ProgressSpinnerModule,
    TagModule
  ],
  templateUrl: './split-order-modal.component.html',
  styleUrls: ['./split-order-modal.component.scss']
})
export class SplitOrderModalComponent implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Input() order: PendingOrder | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() cuentaCreada = new EventEmitter<{ originalOrderId: string; newOrderId: string }>();

  items: SplitItem[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private orderService: OrderService,
    private authService: AuthService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.order) {
      this.resetState();
      this.buildItems();
    }
  }

  ngOnDestroy(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  get ticket(): string {
    if (!this.order) {
      return '';
    }
    return '#' + this.order.id.slice(0, 8).toUpperCase();
  }

  get clienteLabel(): string {
    return this.order?.customerName ?? this.order?.nombre ?? 'Cliente General';
  }

  get seleccionTotal(): number {
    return this.items.filter((item) => item.seleccionado).length;
  }

  get seleccionCantidad(): number {
    return this.items.filter((item) => item.seleccionado).reduce((sum, item) => sum + item.cantidad, 0);
  }

  get seleccionMonto(): number {
    return this.items
      .filter((item) => item.seleccionado)
      .reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0);
  }

  get tieneSeleccion(): boolean {
    return this.items.some((item) => item.seleccionado);
  }

  onClose(): void {
    if (this.loading) {
      return;
    }
    this.visible = false;
    this.visibleChange.emit(false);
  }

  async onCrearCuenta(): Promise<void> {
    if (!this.order || this.loading) {
      return;
    }

    const items: OrderItem[] = this.items
      .filter((item) => item.seleccionado)
      .map((item) => ({
        productId: item.productId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        comentarios: item.comentarios || undefined,
        excludedIngredientIds: item.excludedIngredientIds,
        additionalIngredientIds: item.additionalIngredientIds
      }));

    if (items.length === 0) {
      this.errorMessage = 'Selecciona al menos un artículo para crear la nueva cuenta.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const response = await firstValueFrom(
        this.orderService.splitOrder(this.order.id, {
          tenantId: this.authService.getTenantId() || this.order.tenantId || 1,
          customerId: this.order.customerId ?? null,
          items,
          source: 'POS'
        })
      );

      const newOrderId = response?.object?.newOrder?.id ? String(response.object.newOrder.id) : '';
      if (!newOrderId) {
        throw new Error(response?.message || 'No se pudo crear la nueva cuenta.');
      }

      this.successMessage = 'Nueva cuenta creada exitosamente, cada comanda se salvó por separado.';
      this.cuentaCreada.emit({ originalOrderId: this.order.id, newOrderId });

      this.closeTimer = setTimeout(() => {
        this.onClose();
      }, 1400);
    } catch (error: any) {
      this.errorMessage =
        error?.error?.message ||
        error?.message ||
        'No se pudo dividir la cuenta. Intenta nuevamente.';
    } finally {
      this.loading = false;
    }
  }

  trackByItem(index: number): number {
    return index;
  }

  getComentarios(item: SplitItem): string {
    return item.comentarios ?? '';
  }

  private buildItems(): void {
    if (!this.order?.items) {
      this.items = [];
      return;
    }
    this.items = this.order.items.map((item) => ({
      productId: item.productId ?? 0,
      productName: item.productName ?? item.prod ?? `Producto #${item.productId ?? ''}`,
      cantidad: item.cantidad ?? 1,
      precioUnitario: item.precioUnitario ?? item.precio ?? 0,
      comentarios: item.comentarios,
      excludedIngredientIds: item.excludedIngredientIds,
      additionalIngredientIds: item.additionalIngredientIds,
      seleccionado: false
    }));
  }

  private resetState(): void {
    this.items = [];
    this.errorMessage = '';
    this.successMessage = '';
    this.loading = false;
  }
}