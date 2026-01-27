import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { QRCodeComponent } from 'angularx-qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { TenantService } from '@/pages/admin-page/service/tenant.service';
import { ProductService } from '@/pages/products-menu/service/product.service';
import { AuthService } from '@/auth/auth.service';
import { environment } from '@/pages/commons/environment';

// Interfaces para el menú
interface MenuProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isActive: boolean;
}

interface MenuCategory {
  name: string;
  products: MenuProduct[];
}

@Component({
  selector: 'app-menu-print',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    ProgressSpinnerModule,
    ToastModule,
    QRCodeComponent
  ],
  providers: [MessageService],
  templateUrl: './menu-print.component.html',
  styleUrls: ['./menu-print.component.css']
})
export class MenuPrintComponent implements OnInit {
  // Signals para datos reactivos
  menuCategorias = signal<MenuCategory[]>([]);
  tenantName = signal<string>('');
  tenantSlug = signal<string>('');
  tenantLogoUrl = signal<string>('');
  tenantAddress = signal<string>('');
  tenantPhone = signal<string>('');
  tenantSchedules = signal<string>('');
  landingUrl = signal<string>('');
  isLoading = signal<boolean>(true);
  isExporting = signal<boolean>(false);

  qrSize = 150;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tenantService: TenantService,
    private productService: ProductService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadMenuData();

    // Verificar si se debe exportar automáticamente
    const navigation = this.router.getCurrentNavigation();
    const autoExport = navigation?.extras?.state?.['autoExport'];

    if (autoExport) {
      // Esperar a que carguen los datos antes de exportar
      setTimeout(() => {
        if (!this.isLoading()) {
          this.exportMenuToPdf();
        }
      }, 1000);
    }
  }

  /**
   * Carga los datos del menú usando los servicios existentes
   * Métodos usados:
   * - TenantService.getTenantByEmail() para obtener tenantId y metadatos del negocio
   * - ProductService.getProductsByTenantId() para obtener el array de productos
   */
  private loadMenuData(): void {
    this.isLoading.set(true);

    const user = this.authService.getCurrentUser();
    if (!user || !user.userEmail) {
      this.showError('No se encontró usuario autenticado');
      this.isLoading.set(false);
      return;
    }

    // Obtener tenant por email (equivalente a getDatosPorSlug)
    this.tenantService.getTenantByEmail(user.userEmail).subscribe({
      next: (resp) => {
        const tenant = resp?.object;
        const tenantId = tenant?.id;
        const tenantSlug = tenant?.slug;
        const tenantName = tenant?.nombreNegocio || tenant?.businessName || 'Mi Negocio';
        const tenantLogoUrl = tenant?.logoUrl || '';

        // Guardar logo del tenant para binding en la plantilla
        this.tenantLogoUrl.set(tenantLogoUrl);

        // Guardar contacto y horarios para footer
        const direccion = tenant?.direccion || '';
        const telefono = tenant?.telefono || '';
        const schedulesRaw = tenant?.schedules;
        const schedules = Array.isArray(schedulesRaw) ? schedulesRaw.join(' · ') : (typeof schedulesRaw === 'string' ? schedulesRaw : '');
        this.tenantAddress.set(direccion);
        this.tenantPhone.set(telefono);
        this.tenantSchedules.set(schedules);

        if (!tenantId || !tenantSlug) {
          this.showError('No se encontró información del tenant');
          this.isLoading.set(false);
          return;
        }

        // Guardar datos del tenant
        this.tenantSlug.set(tenantSlug);
        this.tenantName.set(tenantName);

        // Construir URL de landing
        const baseUrl = this.getBaseUrl();
        const landingUrl = `${baseUrl}/${tenantSlug}`;
        this.landingUrl.set(landingUrl);

        // Obtener productos por tenantId (equivalente a getProductsByTenantId)
        this.productService.getProductsByTenantId(tenantId).subscribe({
          next: (productResp) => {
            const products = productResp?.object || [];

            // Transformar productos a categorías de menú
            const menuCategorias = this.mapProductsToMenuCategorias(products);
            this.menuCategorias.set(menuCategorias);

            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Error al cargar productos:', error);
            this.showError('Error al cargar productos');
            this.isLoading.set(false);
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar información del tenant:', error);
        this.showError('Error al cargar información del tenant');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Transforma el array de productos en menuCategorias preservando el orden
   * Método: mapProductsToMenuCategorias
   * Filtra productos inactivos
   */
  private mapProductsToMenuCategorias(products: any[]): MenuCategory[] {
    if (!products || products.length === 0) {
      return [];
    }

    // Filtrar solo productos activos
    const activeProducts = products.filter(p => p.isActive);

    // Agrupar por categoría manteniendo el orden de aparición
    const categoriesMap = new Map<string, MenuProduct[]>();
    const categoryOrder: string[] = [];

    activeProducts.forEach(product => {
      const categoryName = product.categoryName || 'Sin Categoría';

      if (!categoriesMap.has(categoryName)) {
        categoriesMap.set(categoryName, []);
        categoryOrder.push(categoryName);
      }

      categoriesMap.get(categoryName)!.push({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: product.price || 0,
        imageUrl: product.imageUrl,
        isActive: product.isActive
      });
    });

    // Convertir el mapa a array manteniendo el orden
    return categoryOrder.map(categoryName => ({
      name: categoryName,
      products: categoriesMap.get(categoryName) || []
    }));
  }

  /**
   * Optimiza URLs de imágenes de Cloudinary
   * Método: getOptimizedImage
   */
  getOptimizedImage(url: string): string {
    if (!url) return '';

    try {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        const after = parts[1];
        const restIndex = after.indexOf('/');
        const imagePath = restIndex >= 0 ? after.substring(restIndex + 1) : after;
        // Transformación optimizada para imágenes pequeñas en menú
        const transform = 'w_120,h_120,c_fill,f_auto,q_auto:good';
        return parts[0] + '/upload/' + transform + '/' + imagePath;
      }
      return url;
    } catch (e) {
      return url;
    }
  }

  /**
   * Obtiene la URL base de la aplicación
   */
  private getBaseUrl(): string {
    const cfg = environment as { landingPageBaseUrl?: string };

    if (cfg.landingPageBaseUrl && cfg.landingPageBaseUrl.trim() !== '') {
      return cfg.landingPageBaseUrl.replace(/\/+$/g, '');
    }

    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return `${window.location.origin}/landing-page`;
    }

    return 'https://lealtix.com.mx/landing-page';
  }

  /**
   * Exporta el menú a PDF usando html2canvas y jsPDF
   * Método: exportMenuToPdf
   * @param filename - Nombre del archivo (opcional)
   */
  async exportMenuToPdf(filename?: string): Promise<void> {
    this.isExporting.set(true);

    // Pequeño delay para que el spinner se muestre
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const menuElement = document.getElementById('menu');
      if (!menuElement) {
        throw new Error('No se encontró el elemento del menú');
      }

      const pageWidthMm = 210;
      const pageHeightMm = 297;
      const marginLeftMm = 15;
      const marginRightMm = 15;
      const contentWidthMm = pageWidthMm - marginLeftMm - marginRightMm;

      // Capturar elementos
      const headerElement = menuElement.querySelector('.menu-header') as HTMLElement;
      const footerElement = menuElement.querySelector('.menu-footer') as HTMLElement;

      // Opciones optimizadas para velocidad
      const canvasOptions = {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: null as any,
        imageTimeout: 0
      };

      // Capturar header
      let headerCanvas: HTMLCanvasElement | null = null;
      let headerHeight = 0;
      if (headerElement) {
        headerCanvas = await html2canvas(headerElement, canvasOptions);
        headerHeight = (headerCanvas.height * contentWidthMm) / headerCanvas.width;
      }

      // Capturar footer
      let footerCanvas: HTMLCanvasElement | null = null;
      let footerHeight = 0;
      if (footerElement) {
        footerCanvas = await html2canvas(footerElement, canvasOptions);
        footerHeight = (footerCanvas.height * contentWidthMm) / footerCanvas.width;
      }

      // Capturar cada categoría individualmente para respetarlas como bloques completos
      const categoryElements = menuElement.querySelectorAll('.category-section');
      const categoriesData: Array<{ canvas: HTMLCanvasElement; height: number }> = [];

      for (const categoryEl of categoryElements) {
        const categoryCanvas = await html2canvas(categoryEl as HTMLElement, canvasOptions);
        const categoryHeight = (categoryCanvas.height * contentWidthMm) / categoryCanvas.width;
        categoriesData.push({ canvas: categoryCanvas, height: categoryHeight });
      }

      // Crear PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const marginTopBottom = 10;
      const availableContentHeight = pageHeightMm - headerHeight - footerHeight - marginTopBottom;
      let categoryIndex = 0;
      let pageNumber = 0;

      // Generar páginas - agregar categorías completas
      while (categoryIndex < categoriesData.length) {
        if (pageNumber > 0) {
          pdf.addPage();
        }

        // Agregar header con márgenes
        if (headerCanvas) {
          const headerImg = headerCanvas.toDataURL('image/png');
          pdf.addImage(headerImg, 'PNG', marginLeftMm, 5, contentWidthMm, headerHeight);
        }

        // Agregar categorías que quepan en esta página
        let currentPageHeight = 0;
        const startIndex = categoryIndex;

        while (categoryIndex < categoriesData.length) {
          const { canvas, height } = categoriesData[categoryIndex];
          const gap = currentPageHeight > 0 ? 3 : 0; // 3mm entre categorías

          // Verificar si esta categoría cabe completa en la página
          if (currentPageHeight + gap + height <= availableContentHeight) {
            // Agregar categoría
            const categoryImg = canvas.toDataURL('image/png');
            const contentY = 5 + headerHeight + 3 + currentPageHeight + gap;
            pdf.addImage(categoryImg, 'PNG', marginLeftMm, contentY, contentWidthMm, height);

            currentPageHeight += gap + height;
            categoryIndex++;
          } else {
            // No cabe, pasar a siguiente página
            break;
          }
        }

        // Agregar footer con márgenes
        if (footerCanvas) {
          const footerImg = footerCanvas.toDataURL('image/png');
          const footerY = pageHeightMm - footerHeight - 5;
          pdf.addImage(footerImg, 'PNG', marginLeftMm, footerY, contentWidthMm, footerHeight);
        }

        pageNumber++;

        // Seguridad: si no se agregó ninguna categoría (muy grande), forzar avance
        if (categoryIndex === startIndex && categoryIndex < categoriesData.length) {
          console.warn('Categoría muy grande, forzando en página separada');
          const { canvas, height } = categoriesData[categoryIndex];
          const categoryImg = canvas.toDataURL('image/png');
          const contentY = 5 + headerHeight + 3;
          // Agregar aunque se corte
          const maxHeight = Math.min(height, availableContentHeight);
          pdf.addImage(categoryImg, 'PNG', marginLeftMm, contentY, contentWidthMm, maxHeight);
          categoryIndex++;
        }
      }

      // Descargar PDF
      const pdfFilename = filename || `menu-${this.tenantSlug()}-${Date.now()}.pdf`;
      pdf.save(pdfFilename);

      this.messageService.add({
        severity: 'success',
        summary: '✓ PDF generado',
        detail: 'El menú se ha exportado correctamente',
        life: 3000
      });
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo exportar el menú a PDF',
        life: 5000,
        sticky: true
      });
    } finally {
      this.isExporting.set(false);
    }
  }

  /**
   * Captura el contenido (categorías) como un canvas unificado
   */
  private async captureContent(elements: NodeListOf<Element>): Promise<HTMLCanvasElement> {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '800px'; // Ancho fijo para mantener proporción
    tempContainer.style.backgroundColor = 'transparent';
    document.body.appendChild(tempContainer);

    try {
      // Clonar todos los elementos de contenido
      elements.forEach(el => {
        const clone = el.cloneNode(true) as HTMLElement;
        tempContainer.appendChild(clone);
      });

      // Capturar con mismas opciones optimizadas
      const canvas = await html2canvas(tempContainer, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: null,
        imageTimeout: 0
      });

      return canvas;
    } finally {
      document.body.removeChild(tempContainer);
    }
  }

  /**
   * Convierte un color CSS (hex, rgb(a)) a objeto RGB usable por jsPDF.
   * Si el color tiene alpha < 1 o no es parseable, devuelve null.
   */
  private parseCssColor(color: string | null): { r: number; g: number; b: number } | null {
    if (!color) return null;

    color = color.trim();

    // rgb(a) => extraer componentes
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/i);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      const a = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1;
      if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
      // Evitar colores transparentes que jsPDF no soporta
      if (a < 1) return null;
      return { r, g, b };
    }

    // Hex formats
    const hexMatch = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      let hex = hexMatch[1];
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
      }
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return { r, g, b };
    }

    return null;
  }


  /**
   * Obtiene la fecha actual formateada
   */
  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Muestra mensaje de error
   */
  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 5000
    });
  }
}
