import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { BadgeModule } from 'primeng/badge';
import { PaginatorModule } from 'primeng/paginator';
import { MessageModule } from 'primeng/message';
import { forkJoin } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { TenantService } from '@/pages/admin-page/service/tenant.service';
import {
  TimeSeriesCountDTO,
  CouponStatsDTO,
  SalesSummaryDTO,
  CampaignPerformanceDTO
} from './dashboard.models';

interface Insight {
  type: 'success' | 'warn' | 'info' | 'error';
  icon: string;
  message: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ChartModule,
    TableModule,
    SkeletonModule,
    BadgeModule,
    PaginatorModule,
    MessageModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);

  // Client info signals
  clientName = signal<string>('Negocio');
  clientLogo = signal<string | null>(null);
  clientSlug = signal<string | null>(null);

  // Insights
  insights = signal<Insight[]>([]);

  // Data signals
  totalClientes = signal<number | null>(null);
  clientesNuevos = signal<TimeSeriesCountDTO[]>([]);
  cuponesStats = signal<CouponStatsDTO[]>([]);
  ventasResumen = signal<SalesSummaryDTO | null>(null);
  campanasPerformance = signal<CampaignPerformanceDTO[]>([]);

  // Chart data signals
  lineChartData = signal<any>(null);
  lineChartOptions = signal<any>(null);
  barChartData = signal<any>(null);
  barChartOptions = signal<any>(null);
  doughnutData = signal<any>(null);
  doughnutOptions = signal<any>(null);

  private tenantId = 0;

  constructor(
    private dashboardService: DashboardService,
    private tenantService: TenantService
  ) {}

  ngOnInit(): void {
    this.setupChartOptions();
    this.readTenantId();
  }

  private readTenantId(): void {
    const userStr = sessionStorage.getItem('usuario') ?? localStorage.getItem('usuario');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        if (userObj && userObj.userEmail) {
          this.tenantService.getTenantByEmail(String(userObj.userEmail || '').trim()).subscribe({
            next: (resp) => {

              const tenant = resp?.object;
              this.tenantId = tenant?.id ?? 0;
              this.clientName.set(tenant?.nombreNegocio || 'Negocio');
              this.clientLogo.set(tenant?.logoUrl || null);
              this.clientSlug.set(tenant?.slug || null);

              // Cargar datos una vez obtenido el tenantId
              if (this.tenantId > 0) {
                this.cargarDatos();
              } else {
                this.error.set('No se pudo obtener el tenant');
                this.loading.set(false);
              }
            },
            error: (err) => {
              console.error('Error fetching tenant:', err);
              this.error.set('Error al obtener información del negocio');
              this.loading.set(false);
            }
          });
        } else {
          this.error.set('No se encontró información de usuario');
          this.loading.set(false);
        }
      } catch (e) {
        console.warn('Failed to parse stored usuario:', e);
        this.error.set('Error al procesar información de usuario');
        this.loading.set(false);
      }
    } else {
      this.error.set('No hay sesión de usuario activa');
      this.loading.set(false);
    }
  }

  private setupChartOptions(): void {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 12, weight: '500' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          displayColors: true
        }
      }
    };

    this.lineChartOptions.set({
      ...baseOptions,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: { font: { size: 11 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      },
      elements: {
        line: { tension: 0.4 },
        point: { radius: 3, hoverRadius: 6 }
      }
    });

    this.barChartOptions.set({
      ...baseOptions,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: { font: { size: 11 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      },
      plugins: {
        ...baseOptions.plugins,
        legend: {
          ...baseOptions.plugins.legend,
          position: 'bottom'
        }
      }
    });

    this.doughnutOptions.set({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 11 },
            generateLabels: (chart: any) => {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label: string, i: number) => {
                  const value = data.datasets[0].data[i];
                  return {
                    text: `${label}: ${value}%`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    hidden: false,
                    index: i
                  };
                });
              }
              return [];
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          callbacks: {
            label: (context: any) => {
              return ` ${context.parsed}%`;
            }
          }
        }
      }
    });
  }

  private cargarDatos(): void {
    this.loading.set(true);
    this.error.set(null);

    const today = new Date();
    // Desde el primer día del mes anterior hasta hoy
    const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const to = new Date(); // Hoy
    const fromIso = from.toISOString();
    const toIso = to.toISOString();

    forkJoin({
      total: this.dashboardService.totalClientes(this.tenantId, fromIso, toIso),
      nuevos: this.dashboardService.clientesNuevosPorPeriodo(this.tenantId, fromIso, toIso),
      cupones: this.dashboardService.statsCupones(this.tenantId, fromIso, toIso),
      ventas: this.dashboardService.resumenVentas(this.tenantId, fromIso, toIso),
      performance: this.dashboardService.rendimientoCampanas(this.tenantId, fromIso, toIso)
    }).subscribe({
      next: (res) => {
        // Normalizar respuestas que pueden venir envueltas
        const total = this.extractValue(res.total) ?? 0;
        const nuevos = this.extractArray(res.nuevos);
        const cupones = this.extractArray(res.cupones);
        const ventas = this.extractValue(res.ventas);
        const performance = this.extractArray(res.performance);

        this.totalClientes.set(total);
        this.clientesNuevos.set(nuevos);
        this.cuponesStats.set(cupones);
        this.ventasResumen.set(ventas);
        this.campanasPerformance.set(performance);

        this.buildLineChart(nuevos);
        this.buildBarChart(cupones);
        this.buildDoughnut(cupones);

        this.generateInsights();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Dashboard load error', err);
        this.error.set('Error cargando datos del dashboard');
        this.loading.set(false);
      }
    });
  }

  private buildLineChart(series: TimeSeriesCountDTO[]): void {
    const labels = series.map(s => s.periodStart);
    const data = series.map(s => s.count);
    this.lineChartData.set({
      labels,
      datasets: [
        {
          label: 'Clientes Nuevos',
          data,
          fill: true,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59,130,246,0.15)'
        }
      ]
    });
  }

  private buildBarChart(stats: CouponStatsDTO[]): void {
    const labels = stats.map(s => s.campaignName);
    const created = stats.map(s => s.couponsCreated);
    const redeemed = stats.map(s => s.couponsRedeemed);
    this.barChartData.set({
      labels,
      datasets: [
        { label: 'Creados', backgroundColor: '#3B82F6', data: created },
        { label: 'Redimidos', backgroundColor: '#10B981', data: redeemed }
      ]
    });
  }

  private buildDoughnut(stats: CouponStatsDTO[]): void {
    const labels = stats.map(s => s.campaignName);
    const data = stats.map(s => Number(s.redemptionRatePct ?? 0));
    const colors = this.generateColors(stats.length);
    this.doughnutData.set({
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        hoverBackgroundColor: colors
      }]
    });
  }

  private generateColors(count: number): string[] {
    const palette = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
    return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
  }

  getBadgeSeverity(pct: number): 'success' | 'warn' | 'danger' {
    if (pct > 70) return 'success';
    if (pct >= 50) return 'warn';
    return 'danger';
  }

  private extractArray(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (value?.object && Array.isArray(value.object)) return value.object;
    return [];
  }

  private extractValue(value: any): any {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object' && 'object' in value) return value.object;
    return value;
  }

  private generateInsights(): void {
    const insights: Insight[] = [];
    const performance = this.campanasPerformance();
    const cupones = this.cuponesStats();
    const ventas = this.ventasResumen();

    // Insight 1: Campaña con mejor rendimiento
    if (performance.length > 0) {
      const bestCampaign = performance.reduce((prev, current) =>
        (current.redemptionRatePct > prev.redemptionRatePct) ? current : prev
      );

      if (bestCampaign.redemptionRatePct > 30) {
        insights.push({
          type: 'success',
          icon: 'pi-chart-line',
          message: `Tu campaña "${bestCampaign.campaignName}" tiene una redención del ${bestCampaign.redemptionRatePct.toFixed(1)}%, por encima del promedio.`
        });
      } else if (bestCampaign.redemptionRatePct >= 15) {
        insights.push({
          type: 'info',
          icon: 'pi-info-circle',
          message: `Tu campaña "${bestCampaign.campaignName}" tiene una redención del ${bestCampaign.redemptionRatePct.toFixed(1)}%, dentro del promedio esperado.`
        });
      }
    }

    // Insight 2: Ticket promedio
    if (ventas && ventas.avgTicket > 0) {
      const avgTicketFormatted = ventas.avgTicket.toFixed(2);
      insights.push({
        type: 'info',
        icon: 'pi-shopping-cart',
        message: `El ticket promedio con cupón es de $${avgTicketFormatted}, basado en ${ventas.transactionCount} transacciones.`
      });
    }

    // Insight 3: Cupones sin redimir
    if (cupones.length > 0) {
      const totalCreated = cupones.reduce((sum, c) => sum + c.couponsCreated, 0);
      const totalRedeemed = cupones.reduce((sum, c) => sum + c.couponsRedeemed, 0);
      const unredeemed = totalCreated - totalRedeemed;
      const unredeemedPct = totalCreated > 0 ? (unredeemed / totalCreated) * 100 : 0;

      if (unredeemedPct > 70) {
        insights.push({
          type: 'warn',
          icon: 'pi-exclamation-triangle',
          message: `Hay ${unredeemed} cupones activos sin redimir (${unredeemedPct.toFixed(0)}% del total). Considera estrategias de activación.`
        });
      } else if (unredeemed > 0) {
        insights.push({
          type: 'info',
          icon: 'pi-ticket',
          message: `${unredeemed} cupones aún no han sido redimidos. Tasa de redención global: ${(100 - unredeemedPct).toFixed(0)}%.`
        });
      }
    }

    // Insight 4: Crecimiento de clientes
    const nuevos = this.clientesNuevos();
    if (nuevos.length >= 2) {
      const lastWeek = nuevos[nuevos.length - 1]?.count || 0;
      const previousWeek = nuevos[nuevos.length - 2]?.count || 0;

      if (lastWeek > previousWeek) {
        const growth = previousWeek > 0 ? ((lastWeek - previousWeek) / previousWeek * 100) : 0;
        insights.push({
          type: 'success',
          icon: 'pi-arrow-up',
          message: `¡Excelente! Tuviste un crecimiento del ${growth.toFixed(0)}% en clientes nuevos esta semana.`
        });
      } else if (lastWeek < previousWeek && previousWeek > 0) {
        insights.push({
          type: 'warn',
          icon: 'pi-arrow-down',
          message: `Los clientes nuevos disminuyeron esta semana. Considera activar más campañas.`
        });
      }
    }

    // Insight 5: Campañas con bajo rendimiento
    if (performance.length > 0) {
      const lowPerformers = performance.filter(p => p.redemptionRatePct < 10 && p.couponsIssued > 10);
      if (lowPerformers.length > 0) {
        insights.push({
          type: 'error',
          icon: 'pi-exclamation-circle',
          message: `${lowPerformers.length} campaña(s) tienen menos del 10% de redención. Revisa su configuración o audiencia.`
        });
      }
    }

    this.insights.set(insights.slice(0, 4)); // Máximo 4 insights
  }
}

