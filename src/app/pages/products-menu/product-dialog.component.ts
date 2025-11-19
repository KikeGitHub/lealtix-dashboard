import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';

@Component({
    selector: 'app-product-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, DialogModule, ButtonModule, FileUploadModule, InputTextModule, TextareaModule, InputNumberModule, MessageModule, CheckboxModule, SelectModule],
    template: `
    <p-dialog [(visible)]="visible" [style]="{ width: '450px' }" header="Detalle de Producto" [modal]="true" (onHide)="onHide()">
        <ng-template #content>
            <div class="p-4">
                <!-- Categories Row -->
                <div class="mb-4">
                    <label class="block font-semibold mb-2">Categoria</label>
                    <div class="flex items-center gap-3">
                        <div class="flex-1">
                            <p-select [(ngModel)]="product.categoryId" (ngModelChange)="categoryChange.emit($event)"
                                [options]="categoriesArrayValue" optionLabel="label" optionValue="value"
                                placeholder="Seleccione..." styleClass="w-full"></p-select>
                        </div>

                    </div>
                    <div class="mt-2">
                        <p-message *ngIf="(!product || product.categoryId === null || product.categoryId === undefined) && submitted"
                            severity="error" variant="text" size="small">Categoria es requerida</p-message>
                    </div>
                </div>

                <!-- Product form -->
                <form [formGroup]="productForm" class="space-y-4">
                    <input type="hidden" formControlName="img_url" />

                    <div>
                        <label for="name" class="block font-medium mb-2">Nombre</label>
                        <input type="text" pInputText id="name" formControlName="name" required autofocus class="w-full" />
                        <p-message *ngIf="productForm.get('name')?.invalid && (productForm.get('name')?.touched || submitted)"
                            severity="error" variant="text" size="small">Nombre es requerido.</p-message>
                    </div>

                    <div>
                        <label for="description" class="block font-medium mb-2">Descripción</label>
                        <textarea id="description" pTextarea formControlName="description" rows="3" class="w-full"></textarea>
                        <p-message *ngIf="productForm.get('description')?.invalid && (productForm.get('description')?.touched || submitted)"
                            severity="error" variant="text" size="small">Descripción es requerida.</p-message>
                    </div>

                    <div class="flex flex-col items-start gap-3">
                        <!-- Price + Active checkbox row -->
                        <div class="w-full flex items-start gap-4">
                            <div class="flex-1">
                                <label for="price" class="block font-medium mb-2">Precio</label>
                                <p-inputnumber id="price" formControlName="price" mode="currency" currency="MXN" locale="en-US" class="w-40" />
                                <p-message *ngIf="productForm?.get('price')?.invalid && (productForm.get('price')?.touched || submitted)"
                                    severity="error" variant="text" size="small">Precio es requerido.</p-message>
                            </div>

                            <div class="flex-none flex items-center mt-6 gap-2">
                                <label for="isActive" class="block font-medium mb-2">Activo</label>
                                <p-checkbox formControlName="isActive" binary="true" inputId="isActive" (onChange)="onActiveChange($event.checked)"></p-checkbox>
                            </div>
                        </div>

                        <!-- Imagen (URL o subir) -->
                        <div class="w-full">
                            <label class="block font-medium mb-2">Imagen (URL o subir)</label>
                            <div class="flex items-center gap-3">
                                <p-fileUpload mode="basic" name="productImage" accept="image/*" maxFileSize="2000000"
                                    (onSelect)="onProductFileSelect.emit($event)"></p-fileUpload>
                                <div *ngIf="productImagePreview || productForm.get('img_url')?.value" class="flex items-center">
                                    <img [src]="productImagePreview || productForm.get('img_url')?.value" alt="Product image preview"
                                        class="rounded shadow border border-gray-200" style="max-width:100px; max-height:64px; object-fit:contain;" />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </ng-template>

        <ng-template #footer>
            <div class="flex justify-end gap-3 p-3">
                <p-button label="Cancelar" icon="pi pi-times" text (click)="hide.emit()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="save.emit()" />
            </div>
        </ng-template>
    </p-dialog>
    `
})
export class ProductDialogComponent implements OnChanges {
    @Input() visible: boolean = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    @Input() product: any = {};
    @Input() productForm!: any;
    @Input() categoryForm!: any;
    @Input() categoryDialog: boolean = false;
    @Output() categoryDialogChange = new EventEmitter<boolean>();
    localCategoryVisible: boolean = false;
    @Input() productImagePreview: string | null = null;
    @Input() categoriesArrayValue: any[] = [];
    @Input() submitted: boolean = false;

    @Output() save = new EventEmitter<void>();
    @Output() hide = new EventEmitter<void>();
    @Output() openNewCategory = new EventEmitter<void>();
    @Output() openEditCategory = new EventEmitter<void>();
    @Output() createCategory = new EventEmitter<void>();
    @Output() onProductFileSelect = new EventEmitter<any>();
    @Output() categoryChange = new EventEmitter<any>();
    @Output() activeChange = new EventEmitter<boolean>();

    onHide() {
        this.visibleChange.emit(false);
        this.hide.emit();
    }

    closeCategoryDialog() {
        this.localCategoryVisible = false;
        this.categoryDialogChange.emit(false);
    }

    onCreateCategory() {
        this.createCategory.emit();
        this.closeCategoryDialog();
    }

    onCategorySelect(_event: any) {
        // passthrough — parent uses ngModel on product bound object
    }

    // Prevent the click from changing the p-select internal focus/value
    onNewCategoryClick(event: Event) {
        event.stopPropagation();
        this.openNewCategory.emit();
    }

    onEditCategoryClick(event: Event) {
        event.stopPropagation();
        this.openEditCategory.emit();
    }

    // Keep product.isActive in sync and seed form control when dialog receives a product
    ngOnChanges(changes: SimpleChanges) {
        if (changes['product']) {
            // Ensure product object exists
            this.product = this.product || {};

            // If product.isActive is undefined/null, default to true
            if (this.product.isActive === undefined || this.product.isActive === null) {
                this.product.isActive = true;
                this.activeChange.emit(true);
            }

            // If a reactive form with 'isActive' control is provided, set its value from the product
            if (this.productForm && this.productForm.get) {
                const isActiveControl = this.productForm.get('isActive');
                if (isActiveControl) {
                    try {
                        isActiveControl.setValue(this.product.isActive, { emitEvent: false });
                    } catch (e) {
                        // ignore if unable to set
                    }
                }
            }
        }
    }

    onActiveChange(value: boolean) {
        // If parent form contains the control, write value there; otherwise update product and emit
        if (this.productForm && this.productForm.get && this.productForm.get('isActive')) {
            try {
                this.productForm.get('isActive').setValue(value);
            } catch (e) {
                // ignore
            }
        } else {
            this.product = this.product || {};
            this.product.isActive = value;
            this.activeChange.emit(value);
        }
    }
}
