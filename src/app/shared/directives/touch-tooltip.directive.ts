import { Directive, ElementRef, HostListener } from '@angular/core';

/**
 * Directiva no intrusiva que convierte eventos táctiles en mouseenter/mouseleave
 * para que los tooltips de PrimeNG funcionen en dispositivos móviles.
 * Reversible: simplemente remover el atributo appTouchTooltip para desactivar.
 */
@Directive({
  selector: '[appTouchTooltip]',
  standalone: true
})
export class TouchTooltipDirective {
  constructor(private el: ElementRef) {}

  @HostListener('touchstart', ['$event'])
  onTouchStart(_e: TouchEvent) {
    const ev = new Event('mouseenter', { bubbles: true, cancelable: true });
    this.el.nativeElement.dispatchEvent(ev);
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(_e: TouchEvent) {
    // Esperar 2.5 segundos para que el usuario lea el tooltip, luego cerrar
    setTimeout(() => {
      const ev = new Event('mouseleave', { bubbles: true, cancelable: true });
      this.el.nativeElement.dispatchEvent(ev);
    }, 2500);
  }

  @HostListener('touchcancel', ['$event'])
  onTouchCancel(_e: TouchEvent) {
    const ev = new Event('mouseleave', { bubbles: true, cancelable: true });
    this.el.nativeElement.dispatchEvent(ev);
  }
}
