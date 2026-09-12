import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import { AuthService } from '@/auth/auth.service';
import { MermaRecord, MermaService, TIPOS_MERMA } from '@/pages/comandix/services/merma.service';
import { OrderService } from '@/pages/comandix/services/order.service';
import { PendingOrder } from '@/pages/comandix/models/order.model';

@Component({
  selector: 'app-mermas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ProgressSpinnerModule,
    ToastModule,
    IconFieldModule,
    InputIconModule,
    CheckboxModule,
    SelectModule,
    DividerModule,
    DialogModule
  ],
  templateUrl: './mermas.component.html',
  styleUrls: ['./mermas.component.scss'],
  providers: [MessageService]
})
export class MermasComponent implements OnInit {
  loading = signal<boolean>(false);
  tenantId = 1;
  records = signal<MermaRecord[]>([]);
  filteredRecords = signal<MermaRecord[]>([]);
  globalFilter = '';

  readonly tiposMerma = TIPOS_MERMA;
  tipoMermaSeleccionado = 'OPERATIVA';

  activeOrders = signal<PendingOrder[]>([]);
  loadingOrders = signal<boolean>(false);
  mermaDialogVisible = false;
  mermaOrderId = signal<string | null>(null);
  orderIngredients = signal<any[]>([]);
  loadingIngredients = signal<boolean>(false);
  seleccionados: Record<number, boolean> = {};
  cantidades: Record<number, number> = {};
  registeringMerma = signal<boolean>(false);

  constructor(
    private mermaService: MermaService,
    private authService: AuthService,
    private messageService: MessageService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.tenantId = this.authService.getTenantId() || 1;
    this.loadMermas();
    this.loadActiveOrders();
  }

  loadMermas(): void {
    this.loading.set(true);
    this.mermaService.listarPorTenant(this.tenantId).subscribe({
      next: (res) => {
        this.records.set(res?.object ?? []);
        this.applyFilter();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando mermas:', err);
        this.records.set([]);
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudieron cargar las mermas',
          life: 4000
        });
      }
    });
  }

  loadActiveOrders(): void {
    this.loadingOrders.set(true);
    const size = 50;
    const loadOne = (status: string) =>
      this.orderService.getOrdersByTenant(this.tenantId, status, 0, size);

    const orders: PendingOrder[] = [];
    let completed = 0;

    const done = () => {
      completed++;
      if (completed === 2) {
        this.activeOrders.set(orders);
        this.loadingOrders.set(false);
      }
    };

    loadOne('EN_PREPARACION').subscribe({
      next: (res) => { orders.push(...(res?.object?.content ?? [])); done(); },
      error: () => done()
    });

    loadOne('LISTO').subscribe({
      next: (res) => { orders.push(...(res?.object?.content ?? [])); done(); },
      error: () => done()
    });
  }

  getTicket(orderId?: string): string {
    return orderId ? '#' + orderId.slice(0, 8).toUpperCase() : '—';
  }

  getCustomerName(order: PendingOrder): string {
    return (order as any).customerName ?? order.nombre ?? 'Cliente General';
  }

  getOrderItemsCount(order: PendingOrder): number {
    return (order.items ?? []).length;
  }

  trackByOrderId(_index: number, order: PendingOrder): string {
    return order.id;
  }

  openMermaModal(order: PendingOrder): void {
    this.mermaOrderId.set(order.id);
    this.mermaDialogVisible = true;
    this.loadingIngredients.set(true);
    this.seleccionados = {};
    this.cantidades = {};

    this.mermaService.resolverInsumosUsados(order.id).subscribe({
      next: (res) => {
        const insumos = res?.object ?? [];
        insumos.forEach((insumo: any, i: number) => {
          this.seleccionados[i] = false;
          this.cantidades[i] = insumo.cantidad ?? 0;
        });
        this.orderIngredients.set(insumos);
        this.loadingIngredients.set(false);
      },
      error: (err) => {
        console.error('Error cargando insumos:', err);
        this.orderIngredients.set([]);
        this.loadingIngredients.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudieron cargar los insumos',
          life: 4000
        });
      }
    });
  }

  closeMermaModal(): void {
    this.mermaDialogVisible = false;
    this.mermaOrderId.set(null);
    this.orderIngredients.set([]);
    this.seleccionados = {};
    this.cantidades = {};
  }

  isNewOrder(order: PendingOrder): boolean {
    if (!order.fechaCreacion) return false;
    const diffMs = Date.now() - new Date(order.fechaCreacion).getTime();
    return diffMs < 2 * 60 * 1000;
  }

  getStatusClass(estado: string | undefined): string {
    const normalized = (estado ?? '').toUpperCase();
    if (normalized === 'PENDIENTE') return 'status-comanda';
    if (normalized === 'CONFIRMADA') return 'status-confirmada';
    if (normalized === 'EN_PREPARACION' || normalized === 'IN_PROGRESS') return 'status-en_preparacion';
    if (normalized === 'LISTO' || normalized === 'READY') return 'status-listo';
    if (normalized === 'PAGADA' || normalized === 'PAID') return 'status-pagada';
    if (normalized === 'CANCELADA' || normalized === 'CANCELLED') return 'status-cancelada';
    return 'status-comanda';
  }

  getEstadoLabel(estado?: string): string {
    switch (estado?.toUpperCase()) {
      case 'PENDIENTE': return 'PENDIENTE';
      case 'CONFIRMADA': return 'CONFIRMADA';
      case 'EN_PREPARACION':
      case 'IN_PROGRESS': return 'EN PREPARACIÓN';
      case 'LISTO':
      case 'READY': return 'LISTO';
      case 'PAGADA':
      case 'PAID': return 'PAGADA';
      case 'CANCELADA':
      case 'CANCELLED': return 'CANCELADA';
      default: return estado ?? '—';
    }
  }

  getSeleccionTotal(): number {
    return this.orderIngredients().filter((_, i) => this.seleccionados[i]).length;
  }

  getPerdidaTotal(): number {
    let total = 0;
    for (const [indexStr, checked] of Object.entries(this.seleccionados)) {
      if (!checked) continue;
      const index = Number(indexStr);
      const insumo = this.orderIngredients()[index];
      if (!insumo) continue;
      const cantidad = this.cantidades[index] ?? insumo.cantidad ?? 0;
      total += cantidad * (insumo.costoUnitario ?? 0);
    }
    return total;
  }

  onCantidadInput(index: number, event: Event): void {
    this.seleccionados[index] = true;
    this.cantidades[index] = Number((event.target as HTMLInputElement).value);
  }

  onInsumoCheck(index: number, checked: boolean): void {
    this.seleccionados[index] = checked;
  }

  getInsumoName(insumo: any): string {
    return insumo.insumoNombre ?? insumo.productoNombre ?? 'Producto';
  }

  registerMerma(): void {
    const currentId = this.mermaOrderId();
    if (!currentId || this.registeringMerma()) return;

    const items: any[] = [];
    for (const [indexStr, checked] of Object.entries(this.seleccionados)) {
      if (!checked) continue;
      const index = Number(indexStr);
      const insumo = this.orderIngredients()[index];
      if (!insumo) continue;
      const cantidad = this.cantidades[index] ?? 0;
      if (cantidad <= 0) continue;
      items.push({
        insumoId: insumo.insumoId ?? null,
        insumoNombre: insumo.insumoNombre ?? null,
        productoId: insumo.productoId ?? null,
        productoNombre: insumo.productoNombre ?? null,
        cantidad,
        unidad: insumo.unidad ?? 'pieza'
      });
    }

    if (items.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin selección',
        detail: 'Selecciona al menos un insumo con cantidad mayor a 0',
        life: 3000
      });
      return;
    }

    this.registeringMerma.set(true);
    this.mermaService.registrarMerma({
      tenantId: this.tenantId,
      orderId: currentId,
      tipoMerma: this.tipoMermaSeleccionado,
      items
    }).subscribe({
      next: (res) => {
        if (res?.code !== 200) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: res?.message || 'No se pudo registrar la merma',
            life: 4000
          });
          return;
        }
        const ticket = this.getTicket(currentId);
        this.messageService.add({
          severity: 'success',
          summary: 'Merma registrada',
          detail: `${items.length} registro(s) de merma salvados para ${ticket}`,
          life: 4000
        });
        this.closeMermaModal();
        this.loadMermas();
        this.registeringMerma.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo registrar la merma',
          life: 4000
        });
        this.registeringMerma.set(false);
      }
    });
  }

  onGlobalFilter(event: Event): void {
    this.globalFilter = (event.target as HTMLInputElement).value ?? '';
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.globalFilter.trim().toLowerCase();
    const all = this.records();
    if (!term) {
      this.filteredRecords.set(all);
      return;
    }
    this.filteredRecords.set(
      all.filter((r) => {
        const ticket = String(r.ticket ?? '').toLowerCase();
        const insumo = (r.insumoNombre ?? '').toLowerCase();
        const producto = (r.productoNombre ?? '').toLowerCase();
        return ticket.includes(term) || insumo.includes(term) || producto.includes(term);
      })
    );
  }

  getTotalPerdida(): number {
    return this.records().reduce((sum, r) => sum + (r.costoTotal ?? 0), 0);
  }

  getTipoColor(tipo?: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (tipo) {
      case 'ROTURA': return 'danger';
      case 'CADUCIDAD': return 'warn';
      case 'SOBRANTE': return 'info';
      case 'CONTROL_CALIDAD': return 'info';
      default: return 'secondary';
    }
  }

  getTipoLabel(tipo?: string): string {
    return this.tiposMerma.find((t) => t.codigo === tipo)?.label ?? tipo ?? '—';
  }

  getName(r: MermaRecord): string {
    return r.insumoNombre ?? r.productoNombre ?? '—';
  }

  formatFecha(fecha?: string): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    const iso = Number.isNaN(d.getTime()) ? new Date(fecha.replace(' ', 'T')) : d;
    if (Number.isNaN(iso.getTime())) return fecha;
    return iso.toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
}
