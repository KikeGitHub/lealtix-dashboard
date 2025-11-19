import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Category } from '../model/category.component';
import { CategoryService } from './service/category.service';
import { forkJoin } from 'rxjs';
import { TenantService } from '../admin-page/service/tenant.service';
import { CategoryDialogComponent } from './category-dialog.component';

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    selector: 'app-categories-menu',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        ProgressSpinnerModule,
        InputTextModule,
        TextareaModule,
        MessageModule,
        CheckboxModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        CategoryDialogComponent
    ],
    templateUrl: './categories-menu.component.html',
    styleUrls: ['./categories-menu.component.scss'],
    providers: [MessageService, CategoryService, ConfirmationService]
})
export class CategoriesMenuComponent implements OnInit {
    loading: boolean = false;
    categoryDialog: boolean = false;
    tenantId: number = 0;

    categories = signal<Category[]>([]);
    category!: Category;
    categoryForm!: FormGroup;
    selectedCategories!: Category[] | null;
    submitted: boolean = false;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private categoryService: CategoryService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder,
        private tenantService: TenantService
    ) {
        this.categoryForm = this.fb.group({
            id: [null],
            name: ['', Validators.required],
            description: ['', Validators.required],
            tenantId: [this.tenantId],
            active: [true]
        });
    }

    ngOnInit() {
        const userStr = sessionStorage.getItem('usuario') ?? localStorage.getItem('usuario');
        if (userStr) {
            try {
                const userObj = JSON.parse(userStr);
                if (userObj && userObj.userEmail) {
                    this.tenantService.getTenantByEmail(String(userObj.userEmail || '').trim()).subscribe({
                        next: (resp) => {
                            debugger;
                            const tenant = resp?.object;
                            this.tenantId = tenant?.id ?? 0;
                            this.categoryForm.patchValue({ tenantId: this.tenantId });
                            this.loadCategories();
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
    }

    startLoading() {
        this.loading = true;
    }

    stopLoading() {
        this.loading = false;
    }

    loadCategories() {
        this.startLoading();
        this.categoryService.getCategoriesByTenantId(this.tenantId).subscribe({
            next: (data) => {
                const mapped = data.object.map((item: any) => ({
                    id: item.categoryId,
                    name: item.categoryName,
                    description: item.categoryDescription || '',
                    active: typeof item.active === 'boolean' ? item.active : true,
                    tenantId: item.tenantId
                }));
                this.categories.set(mapped);
                console.log('Loaded categories:', mapped);
            },
            error: (err) => {
                console.error('Failed to load categories', err);
                this.categories.set([]);
            },
            complete: () => {
                this.stopLoading();
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    openNew() {
        this.category = { tenantId: this.tenantId, isActive: true };
        this.submitted = false;
        this.categoryForm.reset({
            id: null,
            name: '',
            description: '',
            tenantId: this.tenantId,
            active: true
        });
        this.categoryDialog = true;
    }

    editCategory(category: Category) {
        this.category = { ...category };
        this.categoryForm.patchValue({
            id: category.id ?? null,
            name: category.name ?? '',
            description: category.description ?? '',
            tenantId: category.tenantId ?? this.tenantId,
            active: category.isActive ?? true
        });
        this.categoryDialog = true;
    }

    deleteSelectedCategories() {
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar las categorías seleccionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.startLoading();
                const deletes = (this.selectedCategories || [])
                    .map((category) => {
                        if (category && category.id !== undefined && category.id !== null) {
                            const idNum = typeof category.id === 'number' ? category.id : Number(category.id);
                            if (!Number.isNaN(idNum)) {
                                return this.categoryService.deleteCategoryById(idNum);
                            }
                        }
                        return null;
                    })
                    .filter(Boolean) as any[];

                if (deletes.length > 0) {
                    forkJoin(deletes).subscribe({
                        next: () => {
                            this.loadCategories();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Categorías Eliminadas',
                                life: 3000
                            });
                        },
                        error: (err) => {
                            console.error('Error deleting categories', err);
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'Error al eliminar algunas categorías',
                                life: 3000
                            });
                        },
                        complete: () => {
                            this.stopLoading();
                        }
                    });
                } else {
                    this.stopLoading();
                }
                this.selectedCategories = null;
            }
        });
    }

    hideDialog() {
        this.categoryDialog = false;
        this.submitted = false;
    }

    deleteCategory(category: Category) {
        this.confirmationService.confirm({
            message: '¿Está seguro de que desea eliminar ' + category.name + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idValue = category?.id;
                const idNum = typeof idValue === 'number' ? idValue : Number(idValue);

                if (!Number.isNaN(idNum)) {
                    this.startLoading();
                    this.categoryService.deleteCategoryById(idNum).subscribe({
                        next: () => {
                            this.loadCategories();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Exitoso',
                                detail: 'Categoría Eliminada',
                                life: 3000
                            });
                        },
                        error: (err) => {
                            console.error('Failed to delete category:', err);
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'No se pudo eliminar la categoría',
                                life: 3000
                            });
                        },
                        complete: () => {
                            this.stopLoading();
                        }
                    });
                } else {
                    console.warn('Skipping delete for category with invalid id', category);
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: 'ID de categoría inválido, no se pudo eliminar',
                        life: 3000
                    });
                }
            }
        });
    }

    getSeverity(status: boolean) {
        if (status) {
            return 'success';
        } else {
            return 'danger';
        }
    }

    getStatusTitle(status: boolean) {
        if (status) {
            return 'ACTIVO';
        } else {
            return 'INACTIVO';
        }
    }

    saveCategory() {
        this.submitted = true;
        this.categoryForm.markAllAsTouched();

        if (this.categoryForm.invalid) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Complete los campos requeridos',
                life: 3000
            });
            return;
        }

        const formValue = this.categoryForm.value;
        const payload: any = {
            name: formValue.name.trim(),
            description: formValue.description.trim(),
            tenantId: this.tenantId,
            active: formValue.active,
            productsDTO: []
        };

        if (formValue.id !== undefined && formValue.id !== null) {
            payload.id = formValue.id;
        }
        debugger;
        this.startLoading();
        this.categoryService.createCategory(payload).subscribe({
            next: (resp) => {
                this.loadCategories();
                this.categoryDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exitoso',
                    detail: payload.id ? 'Categoría actualizada' : 'Categoría creada',
                    life: 3000
                });
            },
            error: (err) => {
                console.error('Error saving category', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo guardar la categoría',
                    life: 3000
                });
            },
            complete: () => {
                this.stopLoading();
            }
        });
    }
}
