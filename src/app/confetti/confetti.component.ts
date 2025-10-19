import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import confetti from 'canvas-confetti';
import { Subscription } from 'rxjs';
import { ConfettiService } from './confetti.service';

@Component({
  selector: 'app-confetti',
  templateUrl: './confetti.component.html',
  styleUrls: ['./confetti.component.scss']
})
export class ConfettiComponent implements AfterViewInit, OnDestroy {
  @ViewChild('confettiCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private myConfetti!: confetti.CreateTypes; // tipo del helper
  private isDestroyed = false;
  private sub!: Subscription;

  constructor(private confettiService: ConfettiService){}

  ngAfterViewInit(): void {
    // crea instancia ligada al canvas; resize:true hará que el canvas siempre cubra viewport
    this.myConfetti = confetti.create(this.canvasRef.nativeElement, {
      resize: true,
      useWorker: true
    });
    this.sub = this.confettiService.onEvent().subscribe(e => {
    if (this.isDestroyed) return;
    if (e.action === 'shoot') this.shoot(e.payload?.particleCount ?? 60, e.payload?.spread ?? 60, e.payload?.origin);
    if (e.action === 'burst') this.burst();
    if (e.action === 'party') this.party();
  });
  }

  // Método simple: dispara un 'shot' con opciones
  shoot(particleCount = 60, spread = 60, origin = { x: 0.5, y: 0.5 }) {
    if (!this.myConfetti || this.isDestroyed) return;
    this.myConfetti({
      particleCount,
      spread,
      origin
    });
  }

  // Método 'burst' con varios disparos para efecto más vistoso
  burst() {
    if (!this.myConfetti || this.isDestroyed) return;

    this.myConfetti({
      particleCount: 90,
      spread: 80,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.3 }
    });

    this.myConfetti({
      particleCount: 60,
      spread: 120,
      startVelocity: 25,
      origin: { x: 0.2, y: 0.4 }
    });

    this.myConfetti({
      particleCount: 60,
      spread: 120,
      startVelocity: 25,
      origin: { x: 0.8, y: 0.4 }
    });
  }

  // Fiesta (party) configurable
  party() {
    if (!this.myConfetti || this.isDestroyed) return;
    const defaults = { origin: { y: 0.6 } };

    this.myConfetti(Object.assign({}, defaults, {
      particleCount: 150,
      spread: 160,
      ticks: 200
    }));

    this.myConfetti(Object.assign({}, defaults, {
      particleCount: 120,
      spread: 200,
      ticks: 300
    }));
  }

  ngOnDestroy(): void {
    // marca destrucción para evitar llamadas después
    this.isDestroyed = true;
    this.sub?.unsubscribe();
  }
}
