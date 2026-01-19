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
import { TooltipModule } from 'primeng/tooltip';
import { TouchTooltipDirective } from '@/shared/directives/touch-tooltip.directive';

@Component({
    selector: 'app-category-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        DialogModule,
        ButtonModule,
        TooltipModule,
        InputTextModule,
        TextareaModule,
        MessageModule,
        CheckboxModule,
        InputNumberModule,
        TouchTooltipDirective
    ],
    template: `
    <p-dialog [(visible)]="visible" [style]="{ width: '450px' }" header="Detalle de Categoría" [modal]="true" (onHide)="onHide()">
        <ng-template #content>
            <div class="p-4">
                <form [formGroup]="categoryForm" class="space-y-4">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label for="name" class="block font-medium">Nombre</label>
                            <button pButton type="button" icon="pi pi-info-circle" class="p-button-text p-button-plain p-button-sm" pTooltip="Escribe un nombre claro y corto para la categoría (ej. Desayunos, Bebidas). Este nombre será visible para los clientes." tooltipPosition="top" appTouchTooltip></button>
                        </div>
                        <input type="text" pInputText id="name" formControlName="name" required autofocus class="w-full" />
                        <p-message *ngIf="categoryForm.get('name')?.invalid && (categoryForm.get('name')?.touched || submitted)"
                            severity="error" variant="text" size="small">Nombre es requerido.</p-message>
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label for="description" class="block font-medium">Descripción</label>
                            <button pButton type="button" icon="pi pi-info-circle" class="p-button-text p-button-plain p-button-sm" pTooltip="Describe brevemente la categoría y qué tipos de productos incluye. Ayuda a los clientes a entender lo que van a encontrar." tooltipPosition="top" appTouchTooltip></button>
                        </div>
                        <textarea id="description" pTextarea formControlName="description" rows="4" class="w-full"></textarea>
                        <p-message *ngIf="categoryForm.get('description')?.invalid && (categoryForm.get('description')?.touched || submitted)"
                            severity="error" variant="text" size="small">Descripción es requerida.</p-message>
                    </div>
                        <div class="flex items-center gap-3">
                        <p-checkbox formControlName="active" binary="true" inputId="active"></p-checkbox>
                        <label for="active" class="mb-0">Activo</label>
                        <button pButton type="button" icon="pi pi-info-circle" class="p-button-text p-button-plain p-button-sm" pTooltip="Marca como activo para que la categoría esté disponible en el menú. Desactívala si no quieres mostrarla temporalmente." tooltipPosition="top" appTouchTooltip></button>
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
