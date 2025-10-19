import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from "@/layout/component/app.floatingconfigurator";
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, CommonModule],
    templateUrl: './login.component.html',
})
export class LoginComponent {
    email: string = '';

    password: string = '';

    checked: boolean = false;

    loading: boolean = false;

    errorMessage: string | null = null;

    constructor(private authService: AuthService, private router: Router) {}

    submit() {
        this.errorMessage = null;
        this.loading = true;
        this.authService.loginAndStore({ email: this.email, password: this.password }).subscribe({
            next: (res) => {
                this.loading = false;
                if (res && res.code === 200) {
                    // Guardar el objeto de login en localStorage o sessionStorage según el checkbox
                    try {
                        const serialized = JSON.stringify(res.object);
                        if (this.checked) {
                            localStorage.setItem('loginObject', serialized);
                        } else {
                            sessionStorage.setItem('loginObject', serialized);
                        }
                    } catch (e) {
                        console.warn('No se pudo guardar el objeto de login', e);
                    }

                    // Redirige al dashboard o ruta principal
                    this.router.navigate(['/adminPage']);
                } else {
                    this.errorMessage = res?.message || 'Error en login';
                }
            },
            error: (err) => {
                this.loading = false;
                this.errorMessage = err?.error?.message || 'Error de red o servidor';
            }
        });
    }
}
