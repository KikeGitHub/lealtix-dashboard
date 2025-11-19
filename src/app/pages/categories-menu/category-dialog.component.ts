import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
    selector: 'app-category-dialog',
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
        InputNumberModule
    ],
    template: `
    <p-dialog [(visible)]="visible" [style]="{ width: '450px' }" header="Detalle de Categoría" [modal]="true" (onHide)="onHide()">
        <ng-template #content>
            <div class="p-4">
                <form [formGroup]="categoryForm" class="space-y-4">
                    <div>
                        <label for="name" class="block font-medium mb-2">Nombre</label>
                        <input type="text" pInputText id="name" formControlName="name" required autofocus class="w-full" />
                        <p-message *ngIf="categoryForm.get('name')?.invalid && (categoryForm.get('name')?.touched || submitted)"
                            severity="error" variant="text" size="small">Nombre es requerido.</p-message>
                    </div>

                    <div>
                        <label for="description" class="block font-medium mb-2">Descripción</label>
                        <textarea id="description" pTextarea formControlName="description" rows="4" class="w-full"></textarea>
                        <p-message *ngIf="categoryForm.get('description')?.invalid && (categoryForm.get('description')?.touched || submitted)"
                            severity="error" variant="text" size="small">Descripción es requerida.</p-message>
                    </div>

                    <div>
                        <label for="displayOrder" class="block font-medium mb-2">Orden de Visualización</label>
                        <p-inputNumber id="displayOrder" formControlName="displayOrder" [min]="0" class="w-full"
                            [showButtons]="true" buttonLayout="horizontal" inputStyleClass="w-full"
                            decrementButtonClass="p-button-secondary" incrementButtonClass="p-button-secondary"
                            incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus">
                        </p-inputNumber>
                        <small class="text-gray-500">Número que determina la posición de la categoría en el listado</small>
                    </div>

                    <div class="flex items-center gap-3">
                        <p-checkbox formControlName="active" binary="true" inputId="active"></p-checkbox>
                        <label for="active" class="mb-0">Activo</label>
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
export class CategoryDialogComponent {
    @Input() visible: boolean = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    @Input() category: any = {};
    @Input() categoryForm!: any;
    @Input() submitted: boolean = false;

    @Output() save = new EventEmitter<void>();
    @Output() hide = new EventEmitter<void>();

    onHide() {
        this.visibleChange.emit(false);
        this.hide.emit();
    }
}
