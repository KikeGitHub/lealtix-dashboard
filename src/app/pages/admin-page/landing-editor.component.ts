import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { EditorModule } from 'primeng/editor';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { TextareaModule } from 'primeng/textarea';
import { StepperModule } from 'primeng/stepper';
import { MessageModule } from 'primeng/message';
import { Tenant } from '../model/tenat.component';
import { TenantService } from './service/tenant.service';
import { ImageService } from '../service/image.service';

@Component({
    selector: 'app-landing-editor',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FileUploadModule, InputTextModule, TextareaModule, EditorModule, CardModule, ButtonModule, InputGroupModule, StepperModule, MessageModule ],
    templateUrl: './landing-editor.component.html',
    styleUrls: ['./landing-editor.component.scss']
})
export class LandingEditorComponent {
    private logoObjectUrl: string | null = null;
    email: string = 'jakatox466@gddcorp.com';
    step: number = 1;
    landingForm: FormGroup;
    socialPlatforms = [
        { name: 'Facebook', icon: 'pi pi-facebook', control: 'facebook' },
        { name: 'Instagram', icon: 'pi pi-instagram', control: 'instagram' },
        { name: 'TikTok', icon: 'pi pi-tiktok', control: 'tiktok' },
        { name: 'LinkedIn', icon: 'pi pi-linkedin', control: 'linkedin' },
        { name: 'X', icon: 'pi pi-twitter', control: 'x' }
    ];
    tenantId: number = 0;


    constructor(private fb: FormBuilder,
                private cdr: ChangeDetectorRef,
                private tenantService: TenantService,
                private imageService: ImageService
    ) {
        this.landingForm = this.fb.group({
            logo: [null, Validators.required],
            businessName: ['', Validators.required],
            slogan: ['', Validators.required],
            history: ['', Validators.required],
            vision: ['', Validators.required],
            address: ['', Validators.required],
            phone: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            schedule: [''],
            facebook: [''],
            instagram: [''],
            tiktok: [''],
            linkedin: [''],
            x: ['']
        });

    }

    nextStep() {
        if (this.isStepValid(this.step)) {
            this.step++;
            this.createTenant(this.step);
        } else {
            this.landingForm.markAllAsTouched();
        }
    }

    prevStep() {
        if (this.step > 1) this.step--;
    }

    isStepValid(step: number): boolean {
        switch (step) {
            case 1:
                return !!this.landingForm.get('logo')?.valid &&
                       !!this.landingForm.get('businessName')?.valid &&
                       !!this.landingForm.get('slogan')?.valid;
            case 2:
                return !!this.landingForm.get('history')?.valid && !!this.landingForm.get('vision')?.valid;
            case 3:
                return !!this.landingForm.get('address')?.valid &&
                       !!this.landingForm.get('phone')?.valid &&
                       !!this.landingForm.get('email')?.valid &&
                       !!this.landingForm.get('schedule')?.valid;
            default:
                return true;
        }
    }

    createTenant(step: number) {
        debugger;
        const tenantData: Tenant = this.landingForm.value;
        const email = 'jakatox466@gddcorp.com';
        const nombreNegocio = this.landingForm.value.businessName;
        const slogan = this.landingForm.value.slogan;
        const logoFile = this.landingForm.get('logo')?.value;
        if (step === 2 && logoFile) {
            this.imageService.uploadImage(logoFile, 'logo', email, nombreNegocio, slogan).subscribe({
                next: (tenantId: number) => {
                    this.tenantId = tenantId;
                },
                error: (error) => {
                    console.error('Error uploading image:', error);
                }
            });
        } else {
            tenantData.id = this.tenantId;
            tenantData.direccion = this.landingForm.value.address;
            tenantData.telefono = this.landingForm.value.phone;
            tenantData.bussinessEmail = this.landingForm.value.email;
            tenantData.schedules = this.landingForm.value.schedule;

            this.tenantService.createTenant(tenantData).subscribe({
                next: (response) => {
                    console.log('Tenant created successfully:', response);
                },
                error: (error) => {
                    console.error('Error creating tenant:', error);
                }
            });
        }
    }

    onFileSelect(event: any) {
        const file = event.files && event.files.length ? event.files[0] : null;
        this.landingForm.patchValue({ logo: file });
        // Clean up previous object URL if any
        if (this.logoObjectUrl) {
            URL.revokeObjectURL(this.logoObjectUrl);
            this.logoObjectUrl = null;
        }
        if (file instanceof File || file instanceof Blob) {
            this.logoObjectUrl = URL.createObjectURL(file);
        }
        setTimeout(() => this.cdr.detectChanges());
    }

    getLogoPreview(): string | null {
        const logo = this.landingForm.value.logo;
        if (!logo) return null;
        if (typeof logo === 'string') return logo;
        if ((logo instanceof File || logo instanceof Blob) && this.logoObjectUrl) {
            return this.logoObjectUrl;
        }
        return null;
    }
    ngOnDestroy() {
        if (this.logoObjectUrl) {
            URL.revokeObjectURL(this.logoObjectUrl);
        }
    }

    save() {
        if (this.landingForm.valid) {
            // Aquí se enviaría la data al backend
            alert('¡Cambios guardados!');
        }
    }

    edit(){}


    onEditorTextChange(event: any, controlName: string) {
        const text = event.htmlValue || '';
        // Quitar etiquetas HTML para contar solo caracteres visibles
        const plainText = text.replace(/<[^>]*>/g, '');
        if (plainText.length > 499) {
            // Limitar el texto visible
            const truncated = plainText.substring(0, 499);
            this.landingForm.get(controlName)?.setValue(truncated);
        }
    }
}
