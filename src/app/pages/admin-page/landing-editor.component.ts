import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { EditorModule } from 'primeng/editor';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { TextareaModule } from 'primeng/textarea';
import { StepperModule } from 'primeng/stepper';
import { MessageModule } from 'primeng/message';
import { Tenant } from '../model/tenat.component';
import { TenantService } from './service/tenant.service';
import { ImageService } from '../service/image.service';
import { ConfettiService } from '@/confetti/confetti.service';
import { ConfettiComponent } from '@/confetti/confetti.component';

@Component({
    selector: 'app-landing-editor',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FileUploadModule, InputTextModule, TextareaModule, EditorModule, CardModule, ButtonModule, InputGroupModule, StepperModule, MessageModule, DialogModule, ConfettiComponent ],
    templateUrl: './landing-editor.component.html',
    styleUrls: ['./landing-editor.component.scss']
})
export class LandingEditorComponent implements OnInit {
    private logoObjectUrl: string | null = null;
    email: string = '';
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
    userId: number = 0;

    showCongrats: boolean = false;


    constructor(
        private fb: FormBuilder,
        private cdr: ChangeDetectorRef,
        private tenantService: TenantService,
        private imageService: ImageService,
        private confettiService: ConfettiService,
        private router: Router
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
                    this.landingForm.patchValue({
                        logo: tenant.object.logoUrl,
                        businessName: tenant.object.nombreNegocio,
                        slogan: tenant.object.slogan,
                        history: tenant.object.history,
                        vision: tenant.object.vision,
                        slug: tenant.object.slug,
                        address: tenant.object.direccion,
                        phone: tenant.object.telefono,
                        email: tenant.object.bussinessEmail,
                        schedule: tenant.object.schedules,
                        facebook: tenant.object.facebook,
                        instagram: tenant.object.instagram,
                        tiktok: tenant.object.tiktok,
                        linkedin: tenant.object.linkedin,
                        x: tenant.object.x
                    });
                }
            },
            error: (error) => {
                console.error('No tenant found:');
            }
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
        // Build a payload from the form once
        const form = this.landingForm.value;
        const tenantData: Tenant = {
            ...form,
            id: this.tenantId,
            userId: this.userId,
            logo: form.logo,
            businessName: form.businessName,
            slogan: form.slogan,
            history: form.history,
            vision: form.vision,
            direccion: form.address,
            telefono: form.phone,
            bussinessEmail: form.email,
            schedules: form.schedule,
            facebook: form.facebook,
            instagram: form.instagram,
            tiktok: form.tiktok,
            linkedin: form.linkedin,
            x: form.x
        } as Tenant;

        const logoFile = this.landingForm.get('logo')?.value;

        const doCreate = () => {
            // ensure tenantData.id is up-to-date
            tenantData.id = this.tenantId;
            this.postCreateTenant(tenantData);
        };

        // If we're in the image upload step and there is a file, upload first then create
        if (step === 2 && logoFile) {
            const email = this.email;
            const nombreNegocio = form.businessName;
            const slogan = form.slogan;
            this.imageService.uploadImage(logoFile, 'logo', email, nombreNegocio, slogan).subscribe({
                next: (tenantId: number) => {
                    this.tenantId = tenantId;
                    doCreate();
                },
                error: (error) => {
                    console.error('Error uploading image:', error);
                }
            });
        } else {
            doCreate();
        }
    }

    private postCreateTenant(tenantData: Tenant): void {
        this.tenantService.createTenant(tenantData).subscribe({
            next: (response) => {
                console.log('Tenant created successfully:', response);
            },
            error: (error) => {
                console.error('Error creating tenant:', error);
            }
        });
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
        this.confettiService.trigger({ action: 'burst' });
        this.showCongrats = true;
    }

    goToMenuConfig() {
        this.showCongrats = false;
        this.router.navigate(['/dashboard/categoriesMenu']);
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
