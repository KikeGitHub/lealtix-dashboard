import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-manual-code-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    MessageModule
  ],
  template: `
    <div class="manual-input-container">
      <p-card styleClass="input-card">
        <ng-template pTemplate="header">
          <div class="card-header">
            <i class="pi pi-qrcode"></i>
            <h2>Ingresar Código Manualmente</h2>
          </div>
        </ng-template>

        <div class="input-content">
          <p class="description">
            Si el código QR no se puede escanear, ingresa el código manualmente:
          </p>

          <div class="input-group">
            <input
              type="text"
              pInputText
              [(ngModel)]="couponCode"
              placeholder="Ingresa el código del cupón"
              (keyup.enter)="validateCode()"
              class="code-input"
              autofocus
            />
            <p-button
              label="Validar"
              icon="pi pi-check"
              (onClick)="validateCode()"
              [disabled]="!couponCode || couponCode.length < 3"
              styleClass="validate-button">
            </p-button>
          </div>

          <p-message
            *ngIf="errorMessage"
            severity="error"
            [text]="errorMessage"
            styleClass="error-message">
          </p-message>
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    .manual-input-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    ::ng-deep .input-card {
      width: 100%;
      max-width: 500px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    }

    .card-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      text-align: center;
      color: white;

      i {
        font-size: 3rem;
        margin-bottom: 0.75rem;
        display: block;
      }

      h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
      }
    }

    .input-content {
      padding: 2rem;
    }

    .description {
      color: #6b7280;
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .input-group {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;

      @media (max-width: 768px) {
        flex-direction: column;
      }
    }

    .code-input {
      flex: 1;
      height: 48px;
      font-size: 1rem;
      padding: 0 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;

      &:focus {
        border-color: #667eea;
        outline: none;
      }
    }

    ::ng-deep .validate-button {
      height: 48px;
      min-width: 120px;
    }

    ::ng-deep .error-message {
      margin-top: 1rem;
    }
  `]
})
export class ManualCodeInputComponent {
  couponCode: string = '';
  errorMessage: string = '';

  constructor(private router: Router) {}

  validateCode(): void {
    if (!this.couponCode || this.couponCode.length < 3) {
      this.errorMessage = 'Por favor, ingresa un código válido';
      return;
    }

    // Navegar a la página de redención con el código
    this.router.navigate(['/redeem', this.couponCode]);
  }
}
