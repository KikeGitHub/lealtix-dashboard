import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
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
    providers: [MessageService, ProductService, ConfirmationService]
})
export class ProductMenuComponent implements OnInit {
    productDialog: boolean = false;
    tenantId: number = 3;

    products = signal<Product[]>([]);

    // Categories are stored inside the reactive form as a FormArray (categories)

    // Model for creating a new category
    // Legacy model (kept for compatibility) and reactive form
    newCategory: { name?: string; description?: string; tenantId?: string; active: boolean } = {
        name: '',
        description: '',
        tenantId: '',
        active: true
    };

    categoryForm!: FormGroup;

    // Dialog visibility for creating category
    categoryDialog: boolean = false;

    // if set, indicates we're editing an existing category (value = categoryId)
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
            }
        });
    }

    // Load products from backend
    loadProducts() {
        this.productService.getProductsByTenantId(this.tenantId).subscribe({
            next: (data) => {
                this.products.set(data.object);
            },
            error: (err) => {
                console.error('Failed to load products', err);
                this.products.set([]);
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
    this.product = {};
    // default category selection should be the placeholder (null)
    (this.product as any).categoryId = null;
        this.submitted = false;
    // reset product form (clear productImage as well)
    this.productForm.reset({ id: null, name: '', description: '', price: null, img_url: '', productImage: null });
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
                this.products.set(this.products().filter((val) => !this.selectedProducts?.includes(val)));
                this.selectedProducts = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Products Deleted',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.productDialog = false;
        this.submitted = false;
    }

    deleteProduct(product: Product) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + product.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.products.set(this.products().filter((val) => val.id !== product.id));
                this.product = {};
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Product Deleted',
                    life: 3000
                });
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

        debugger;
        const prod = this.productForm.value;
        const imgFile: File | Blob | null = this.productForm.get('productImage')?.value || null;

        const selectedCategoryId = (this.product as any).categoryId;

        const createProductAndClose = (imageUrl?: string) => {
            const newProduct: Product = {
                categoryId: selectedCategoryId,
                tenantId: this.tenantId,
                name: prod.name,
                description: prod.description,
                price: prod.price,
                imageUrl: imageUrl ?? prod.img_url
            } as any;

            this.productService.createProduct(newProduct).subscribe({
                next: (resp) => {
                    this.loadProducts();
                    this.messageService.add({ severity: 'success', summary: 'Producto creado', detail: `${newProduct.name} creado`, life: 3000 });
                },
                error: (err) => {
                    console.error('Error creating product:', err);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el producto', life: 3000 });
                }
            });

            this.productDialog = false;
        };

        // If we have a real File/Blob, upload first and then create product with returned URL
        if (imgFile instanceof File || imgFile instanceof Blob) {
            // Cast to File because uploadImageProd expects a File. We already ensure imgFile is a File or Blob above.
            this.imageService.uploadImageProd(imgFile as File, 'product', this.tenantId, prod.name).subscribe({
                next: (imgURresp: string) => {
                    prod.img_url = imgURresp;
                    createProductAndClose(imgURresp);
                },
                error: (error) => {
                    console.error('Error uploading image:', error);
                    // fallback: still attempt to create using existing img_url (if any)
                    createProductAndClose();
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

        this.productService.createCategory(payload).subscribe({
            next: (resp) => {
                this.loadCategories();
                this.hideCategoryDialog();
                this.messageService.add({ severity: 'success', summary: 'Categoría creada', detail: `${value} creada`, life: 3000 });
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
