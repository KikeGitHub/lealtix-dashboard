import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CampaignResponse, CreateCampaignRequest, UpdateCampaignRequest } from '@/models/campaign.model';
import { CampaignStatus } from '@/models/enums';
import { CampaignService } from '../../services/campaign.service';
import { TenantService } from '@/pages/admin-page/service/tenant.service';
import { CampaignDialogComponent } from '../campaign-dialog/campaign-dialog.component';

interface TableColumn {
    field: string;
    header: string;
}

@Component({
    selector: 'app-campaign-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        TableModule,
        InputTextModule,
        ChipModule,
        ConfirmDialogModule,
        FloatLabelModule,
        ToolbarModule,
        IconFieldModule,
        InputIconModule,
        SelectModule,
        ToastModule,
        CampaignDialogComponent
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './campaign-list.component.html',
    styles: [
        `
            :host {
                display: block;
            }

            .min-w-200 {
                min-width: 200px;
            }

            .w-200 {
                width: 200px;
            }
        `
    ]
})
export class CampaignListComponent implements OnInit {
    campaigns = signal<CampaignResponse[]>([]);
    loading = signal<boolean>(true);
    searchText = '';
    selectedStatus: string | null = null;
    email: string = '';
    userId: number = 0;
    tenantId: number = 0;
    businessId: number = 0;

    // Dialog state
    campaignDialog = signal<boolean>(false);
    selectedCampaign = signal<CampaignResponse | null>(null);
    submitted = signal<boolean>(false);
    isEditMode = signal<boolean>(false);

    // Inject DestroyRef for takeUntilDestroyed
    private destroyRef = inject(DestroyRef);

    columns: TableColumn[] = [
        { field: 'title', header: 'Título' },
        { field: 'promoType', header: 'Tipo' },
        { field: 'status', header: 'Estado' },
        { field: 'startDate', header: 'Fechas' },
        { field: 'channels', header: 'Canales' }
    ];

    statusOptions = [
        { label: 'Borrador', value: CampaignStatus.DRAFT },
        { label: 'Activa', value: CampaignStatus.ACTIVE },
        { label: 'Inactiva', value: CampaignStatus.INACTIVE },
        { label: 'Programada', value: CampaignStatus.SCHEDULED }
    ];

    filteredCampaigns = computed(() => {
        let filtered = this.campaigns();

        // Filter by search text
        if (this.searchText) {
            const search = this.searchText.toLowerCase();
            filtered = filtered.filter((campaign) => campaign.title.toLowerCase().includes(search) || campaign.subtitle?.toLowerCase().includes(search) || campaign.description?.toLowerCase().includes(search));
        }

        // Filter by status
        if (this.selectedStatus) {
            filtered = filtered.filter((campaign) => campaign.status === this.selectedStatus);
        }

        return filtered;
    });

    constructor(
        private campaignService: CampaignService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private router: Router,
        private tenantService: TenantService
    ) {}

    ngOnInit(): void {
        const userStr = sessionStorage.getItem('usuario') ?? localStorage.getItem('usuario');
        if (userStr) {
            try {
                const userObj = JSON.parse(userStr);
                if (userObj && userObj.userEmail) {
                    this.email = String(userObj.userEmail || '').trim();
                    this.userId = userObj.userId;
                }
            } catch (e) {
                console.warn('Failed to parse stored usuario:', e);
            }
        }
        this.tenantService.getTenantByEmail(this.email).subscribe({
            next: (tenant: any) => {
                if (tenant) {
                    this.tenantId = tenant.object.id ?? 0;
                    this.businessId = this.tenantId;
                }
            },
            error: (error) => {
                console.error('No tenant found:');
            }
        });
        this.loadCampaigns();
    }

    private loadCampaigns(): void {
        this.loading.set(true);
        this.campaignService
            .getByBusiness(this.businessId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (campaigns) => {
                    this.campaigns.set(campaigns);
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error('Error loading campaigns:', error);
                    this.loading.set(false);
                }
            });
    }

    onSearchChange(event: any): void {
        this.searchText = event.target.value;
    }

    onStatusChange(): void {
        // El computed se actualizará automáticamente
    }

    refreshData(): void {
        this.loadCampaigns();
    }

    createNewCampaign(): void {
        this.selectedCampaign.set(null);
        this.isEditMode.set(false);
        this.submitted.set(false);
        this.campaignDialog.set(true);
    }

    viewCampaign(campaign: CampaignResponse): void {
        this.router.navigate(['/dashboard/campaigns', campaign.id]);
    }

    editCampaign(campaign: CampaignResponse): void {
        this.selectedCampaign.set(campaign);
        this.isEditMode.set(true);
        this.submitted.set(false);
        this.campaignDialog.set(true);
    }

    hideCampaignDialog(): void {
        this.campaignDialog.set(false);
        this.submitted.set(false);
    }

    saveCampaign(campaignDialog: any): void {
        this.submitted.set(true);

        if (campaignDialog.campaignForm.invalid) {
            campaignDialog.campaignForm.markAllAsTouched();
            return;
        }

        campaignDialog.setSaving(true);

        if (this.isEditMode()) {
            this.updateCampaign(campaignDialog);
        } else {
            this.createCampaignRequest(campaignDialog);
        }
    }

    private createCampaignRequest(campaignDialog: any): void {
        const formValue = campaignDialog.getFormValue();

        const request: CreateCampaignRequest = {
            templateId: campaignDialog.getSelectedTemplateId(),
            businessId: this.businessId,
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
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (campaign) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Campaña creada exitosamente'
                    });
                    this.loadCampaigns();
                    this.hideCampaignDialog();
                    campaignDialog.setSaving(false);
                },
                error: (error) => {
                    console.error('Error creating campaign:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo crear la campaña'
                    });
                    campaignDialog.setSaving(false);
                }
            });
    }

    private updateCampaign(campaignDialog: any): void {
        const formValue = campaignDialog.getFormValue();
        const campaignId = this.selectedCampaign()?.id;

        if (!campaignId) {
            return;
        }

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

        this.campaignService.update(campaignId, request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (campaign) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Campaña actualizada exitosamente'
                    });
                    this.loadCampaigns();
                    this.hideCampaignDialog();
                    campaignDialog.setSaving(false);
                },
                error: (error) => {
                    console.error('Error updating campaign:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo actualizar la campaña'
                    });
                    campaignDialog.setSaving(false);
                }
            });
    }

    deleteCampaign(campaign: CampaignResponse): void {
        this.confirmationService.confirm({
            message: `¿Estás seguro de que quieres eliminar la campaña "${campaign.title}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.campaignService
                    .delete(campaign.id)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                        next: () => {
                            // Remover de la lista
                            const currentCampaigns = this.campaigns();
                            this.campaigns.set(currentCampaigns.filter((c) => c.id !== campaign.id));
                        },
                        error: (error) => {
                            console.error('Error deleting campaign:', error);
                        }
                    });
            }
        });
    }

    getStatusLabel(status: string): string {
        const option = this.statusOptions.find((opt) => opt.value === status);
        return option?.label || status;
    }

    getStatusStyle(status: string): any {
        switch (status) {
            case CampaignStatus.ACTIVE:
                return { 'background-color': '#10b981', color: 'white' };
            case CampaignStatus.INACTIVE:
                return { 'background-color': '#ef4444', color: 'white' };
            case CampaignStatus.SCHEDULED:
                return { 'background-color': '#3b82f6', color: 'white' };
            case CampaignStatus.DRAFT:
            default:
                return { 'background-color': '#6b7280', color: 'white' };
        }
    }
}
