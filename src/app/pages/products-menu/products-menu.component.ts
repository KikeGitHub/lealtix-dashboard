import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { RatingModule } from 'primeng/rating';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Product } from '../model/product.component';
import { ProductService } from './service/product.service';
import { ImageService } from '../service/image.service';
import { ProductDialogComponent } from './product-dialog.component';
import { forkJoin } from 'rxjs';

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
    selector: 'app-menu-products',
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
        RatingModule,
        InputTextModule,
        TextareaModule,
    MessageModule,
        SelectModule,
        RadioButtonModule,
        CheckboxModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
    FileUploadModule,
    ConfirmDialogModule,
    ProductDialogComponent
    ],
    templateUrl: './products-menu.component.html',
    styleUrls: ['./products-menu.component.scss'],
    providers: [MessageService, ProductService, ConfirmationService]
})
export class ProductMenuComponent implements OnInit {
    // spinner flag: cuando true muestra el spinner global
    loading: boolean = false;

    startLoading() { this.loading = true; }
    stopLoading() { this.loading = false; }

    productDialog: boolean = false;
    tenantId: number = 0;

    products = signal<Product[]>([]);

    newCategory: { name?: string; description?: string; tenantId?: string; active: boolean } = {
        name: '',
        description: '',
        tenantId: '',
        active: true
    };

    categoryForm!: FormGroup;

    categoryDialog: boolean = false;

    editingCategoryId: string | number | null = null;

    constructor(
        private productService: ProductService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
        , private fb: FormBuilder,
        private imageService: ImageService,
    ) {
        // initialize reactive form for category creation
        this.categoryForm = this.fb.group({
            id: [0],
            name: ['', Validators.required],
            description: ['', Validators.required],
            tenantId: [this.tenantId ? this.tenantId.toString() : ''],
            active: [true],
            categories: this.fb.array([])
        });

        // product form
        this.productForm = this.fb.group({
            id: [null],
            name: ['', Validators.required],
            description: ['', Validators.required],
            price: [null, Validators.required],
            img_url: [''],
            productImage: [null] // store actual File/Blob for upload
        });
    }

     ngOnInit() {

        debugger;
        const user = sessionStorage.getItem('usuario');
        if (user) {
          const userObj = JSON.parse(user);
          //this.email = userObj.email;
        }
        this.loadCategories();
        this.loadProducts();
    }

    openNewCategory() {
    // Reset only the individual category fields and keep the FormArray 'categories' intact
    const tenant = this.newCategory.tenantId || (this.tenantId ? this.tenantId.toString() : '');
    this.categoryForm.patchValue({ id: null, name: '', description: '', tenantId: tenant, active: true });
    // ensure any validators / touched state are cleared for the controls we reset
    this.categoryForm.get('name')?.markAsUntouched();
    this.categoryForm.get('name')?.markAsPristine();
    this.categoryForm.get('description')?.markAsUntouched();
    this.categoryForm.get('description')?.markAsPristine();
    this.categoryForm.get('active')?.setValue(true);
    this.categoryDialog = true;
    }

    hideCategoryDialog() {
    this.categoryDialog = false;
    this.categoryForm.markAsUntouched();
    this.editingCategoryId = null;
    }

    onCategorySelect(selectedValue: string | number | null) {
        if (!selectedValue) {
            return;
        }
    const cat = this.categoriesArray.value.find((c: any) => String(c.value) === String(selectedValue));
        if (!cat) return;

        const idCtrl = this.categoryForm.get('id');
        const nameCtrl = this.categoryForm.get('name');
        const descCtrl = this.categoryForm.get('description');
        const tenantCtrl = this.categoryForm.get('tenantId');
        const activeCtrl = this.categoryForm.get('active');

        const tenantValue = this.categoryForm.get('tenantId')?.value || this.tenantId?.toString();

        if (idCtrl) idCtrl.setValue(cat.value);
        if (nameCtrl) nameCtrl.setValue(cat.label || '');
        if (descCtrl) descCtrl.setValue((cat as any).description || '');
        if (tenantCtrl) tenantCtrl.setValue(tenantValue);
        if (activeCtrl) activeCtrl.setValue(typeof (cat as any).active === 'boolean' ? (cat as any).active : true);

        // mark controls so UI reflects changes immediately
        [idCtrl, nameCtrl, descCtrl, tenantCtrl, activeCtrl].forEach((c) => {
            if (c) {
                c.markAsDirty();
                c.markAsTouched();
                c.updateValueAndValidity();
            }
        });

        // set editing id so UI shows 'Editar'
        this.editingCategoryId = selectedValue;
    }

    /** Open the category dialog in edit mode using the currently selected editingCategoryId */
    openEditCategory() {
        if (!this.editingCategoryId) {
            // nothing selected
            this.messageService.add({ severity: 'warn', summary: 'Seleccione', detail: 'Seleccione una categoría para editar', life: 3000 });
            return;
        }

        this.onCategorySelect(this.editingCategoryId);
        this.categoryDialog = true;
    }

    product!: Product;
    productForm!: FormGroup;

    selectedProducts!: Product[] | null;

    submitted: boolean = false;

    statuses!: any[];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];



    get categoriesArray(): FormArray {
        return this.categoryForm.get('categories') as FormArray;
    }

    private setCategoriesFormArray(items: any[]) {
        const arr = items.map((it) =>
            this.fb.group({
                label: [it.label],
                value: [it.value],
                description: [it.description || ''],
                active: [typeof it.active === 'boolean' ? it.active : true],
                disabled: [it.disabled || false]
            })
        );
        this.categoryForm.setControl('categories', this.fb.array(arr));
    }

    exportCSV() {
        this.dt.exportCSV();
    }



    // Load categories from backend for the category select
    loadCategories() {
        this.startLoading();
        this.productService.getCategoriesByTenantId(this.tenantId).subscribe({
            next: (data) => {
                const mapped = data.object.map((item: any) => ({
                    label: item.categoryName,
                    value: item.categoryId,
                    description: item.categoryDescription || '',
                    active: typeof item.active === 'boolean' ? item.active : true,
                    tenantId: item.tenantId
                }));
                // populate categories form array
                this.setCategoriesFormArray(mapped);
                console.log('Loaded categories:', mapped);
            },
            error: (err) => {
                console.error('Failed to load categories', err);
                this.setCategoriesFormArray([]);
            },
            complete: () => {
                this.stopLoading();
            }
        });
    }

    // Load products from backend
    loadProducts() {
        this.startLoading();
        this.productService.getProductsByTenantId(this.tenantId).subscribe({
            next: (data) => {
                // Preserve original image URLs (do not modify Cloudinary URLs here)
                this.products.set(data.object || []);
            },
            error: (err) => {
                console.error('Failed to load products', err);
                this.products.set([]);
            },
            complete: () => {
                this.stopLoading();
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    getOptimizedImage(url: string): string {
        if (!url) return '';

        try {
            // If the url already contains '/upload/', remove any existing transformation segment
            // so we don't double-apply transformations which may cause distortion.
            const parts = url.split('/upload/');
            if (parts.length === 2) {
                const after = parts[1];
                // strip leading transformation parts (they usually contain = or commas and underscores)
                const restIndex = after.indexOf('/');
                const imagePath = restIndex >= 0 ? after.substring(restIndex + 1) : after;
        // Restore previous optimized transform used before: width 266x110 with c_limit
        const transform = 'w_266,h_110,c_limit,f_auto,q_auto';
                return parts[0] + '/upload/' + transform + '/' + imagePath;
            }
            // If url doesn't match expected Cloudinary pattern, return as-is
            return url;
        } catch (e) {
            // fallback: return original url
            return url;
        }
    }

    openNew() {
    this.product = {};
    // default category selection should be the placeholder (null)
    (this.product as any).categoryId = null;
        this.submitted = false;
    // reset product form (clear productImage as well)
    this.productForm.reset({ id: null, name: '', description: '', price: null, img_url: '', productImage: null });
    // ensure preview and internal file reference are cleared when creating new
    this.productImagePreview = null;
    this.productForm.get('productImage')?.setValue(null);
        this.productDialog = true;
    }

    editProduct(product: Product) {
        this.product = { ...product };
        // populate productForm
        this.productForm.patchValue({
            id: product.id ?? null,
            name: product.name ?? '',
            description: product.description ?? '',
            price: product.price ?? null,
            img_url: product.imageUrl ?? ''
        });
        // ensure any previously selected File is cleared for edit mode
        this.productForm.get('productImage')?.setValue(null);
        // set preview so editing modal shows existing image
        this.productImagePreview = product.imageUrl ?? null;
        this.productDialog = true;
    }

    deleteSelectedProducts() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected products?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                // show global spinner while deleting
                this.startLoading();
                const deletes = (this.selectedProducts || []).map(product => {
                    if (product && product.id !== undefined && product.id !== null) {
                        const idNum = typeof product.id === 'number' ? product.id : Number(product.id);
                        if (!Number.isNaN(idNum)) {
                            return this.productService.deleteProductById(idNum);
                        }
                    }
                    return null;
                }).filter(Boolean) as any[];

                if (deletes.length > 0) {
                    // run all deletes in parallel and refresh once done
                    forkJoin(deletes).subscribe({
                        next: () => {
                            this.loadProducts();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Products Deleted',
                                life: 3000
                            });
                        },
                        error: (err) => {
                            console.error('Error deleting products', err);
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error deleting some products', life: 3000 });
                        },
                        complete: () => {
                            this.stopLoading();
                        }
                    });
                } else {
                    this.stopLoading();
                }
                this.selectedProducts = null;
            }
        });
    }

    hideDialog() {
        this.productDialog = false;
        this.submitted = false;
        // clear image preview and selected file when dialog closes
        this.productImagePreview = null;
        if (this.productForm) {
            this.productForm.get('productImage')?.setValue(null);
            this.productForm.get('img_url')?.setValue('');
        }
    }

    deleteProduct(product: Product) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + product.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const idValue = product?.id;
                const idNum = typeof idValue === 'number' ? idValue : Number(idValue);

                if (!Number.isNaN(idNum)) {
                    this.startLoading();
                    this.productService.deleteProductById(idNum).subscribe({
                        next: () => {
                            this.loadProducts();
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Product Deleted',
                                life: 3000
                            });
                        },
                        error: (err) => {
                            console.error('Failed to delete product:', err);
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'No se pudo eliminar el producto',
                                life: 3000
                            });
                        },
                        complete: () => {
                            this.stopLoading();
                        }
                    });
                } else {
                    console.warn('Skipping delete for product with invalid id', product);
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: 'ID de producto inválido, no se pudo eliminar',
                        life: 3000
                    });
                }
            }
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.products().length; i++) {
            if (this.products()[i].id === id) {
                index = i;
                break;
            }
        }

        return index;
    }

    createId(): string {
        let id = '';
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < 5; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    getSeverity(status: boolean) {
        if(status) {
            return 'success';
        }else{
            return 'danger';
        }
    }

    getStatusTitle(status: boolean) {
        if(status) {
            return 'ACTIVO';
        } else {
            return 'INACTIVO';
        }
    }

    saveProduct() {
        this.submitted = true;
        if (!this.product || (this.product as any).categoryId === null || (this.product as any).categoryId === undefined) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione una categoría', life: 3000 });
            return;
        }

        this.productForm.markAllAsTouched();
        if (this.productForm.invalid) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Complete los campos requeridos del producto', life: 3000 });
            return;
        }

        const prod = this.productForm.value;
        const imgFile: File | Blob | null = this.productForm.get('productImage')?.value || null;

        const selectedCategoryId = (this.product as any).categoryId;

        const createProductAndClose = (imageUrl?: string) => {
            const newProduct: Product = {
                id: prod.id,
                categoryId: selectedCategoryId,
                tenantId: this.tenantId,
                name: prod.name,
                description: prod.description,
                price: prod.price,
                imageUrl: imageUrl ?? prod.img_url
            } as any;
            this.startLoading();
            this.productService.createProduct(newProduct).subscribe({
                next: (resp) => {
                    this.loadProducts();
                    this.messageService.add({ severity: 'success', summary: 'Producto creado', detail: `${newProduct.name} creado`, life: 3000 });
                },
                error: (err) => {
                    console.error('Error creating product:', err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el producto', life: 3000 });
                },
                complete: () => {
                    this.stopLoading();
                }
            });

            this.productDialog = false;
        };

        // If we have a real File/Blob, upload first and then create product with returned URL
        if (imgFile instanceof File || imgFile instanceof Blob) {
            // Cast to File because uploadImageProd expects a File. We already ensure imgFile is a File or Blob above.
            this.startLoading();
            this.imageService.uploadImageProd(imgFile as File, 'product', this.tenantId, prod.name).subscribe({
                next: (imgURresp: string) => {
                    prod.img_url = imgURresp;
                    createProductAndClose(imgURresp);
                },
                error: (error) => {
                    console.error('Error uploading image:', error);
                    // fallback: still attempt to create using existing img_url (if any)
                    createProductAndClose();
                },
                complete: () => {
                    // createProductAndClose will call stopLoading when create completes; ensure we don't stop prematurely here
                }
            });
        } else {
            // No file to upload: create product using whatever img_url is set (could be a URL or null)
            createProductAndClose();
        }
    }

    // Create a new category and add it to the categories list
    createCategory() {
        this.categoryForm.markAllAsTouched();
        if (this.categoryForm.invalid) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Nombre y descripción son requeridos', life: 3000 });
            return;
        }
        const payloadForm = this.categoryForm.value;
        const value = payloadForm.name.trim();
        const payload: any = {
            name: value,
            description: payloadForm.description,
            tenantId: this.tenantId,
            active: payloadForm.active,
            productsDTO: [],
        };

        if (payloadForm.id !== undefined && payloadForm.id !== null) {
            payload.id = payloadForm.id;
        } else if (this.editingCategoryId !== undefined && this.editingCategoryId !== null) {
            // fallback: use the selected option's value if form id wasn't set for some reason
            payload.id = this.editingCategoryId;
        }

        this.startLoading();
        this.productService.createCategory(payload).subscribe({
            next: (resp) => {
                this.loadCategories();
                this.hideCategoryDialog();
                this.messageService.add({ severity: 'success', summary: 'Categoría creada', detail: `${value} creada`, life: 3000 });
            },
            error: (err) => {
                console.error('Error creating category', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la categoría', life: 3000 });
            },
            complete: () => {
                this.stopLoading();
            }
        });
    }

    onImageFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input || !input.files || input.files.length === 0) {
            return;
        }
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // save preview and also keep the data url for immediate display
            this.productForm.get('img_url')?.setValue(result);
            this.productImagePreview = result;
            // store the original File for upload
            this.productForm.get('productImage')?.setValue(file);
        };
        reader.readAsDataURL(file);
    }

    clearProductImage() {
    this.productForm.get('img_url')?.setValue('');
    this.productImagePreview = null;
    this.productForm.get('productImage')?.setValue(null);
    }

    // preview for product image selected via FileUpload
    productImagePreview: string | null = null;

    onProductFileSelect(event: any) {
        const files: File[] = event?.originalEvent?.target?.files || event?.files || null;
        if (!files || files.length === 0) return;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = () => {
            this.productImagePreview = reader.result as string;
            // update reactive form img_url with preview (optional)
            this.productForm.get('img_url')?.setValue(this.productImagePreview);
            // store the original File for upload
            this.productForm.get('productImage')?.setValue(file);
        };
        reader.readAsDataURL(file);
    }

    getProductImagePreview(): string | null {
        return this.productImagePreview || this.productForm.get('img_url')?.value || null;
    }
}
