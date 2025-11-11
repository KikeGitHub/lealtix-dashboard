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
import { finalize } from 'rxjs/operators';

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

        const email = (this.email || '').trim();
        const password = (this.password || '').trim();

        if (!email || !password) {
            this.errorMessage = !email && !password
                ? 'Email y Password son requeridos.'
                : !email
                    ? 'Email es requerido.'
                    : 'Password es requerido.';
            this.loading = false;
            return;
        }

        this.loading = true;
        this.authService.loginAndStore({ email, password })
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (res: any) => {
                    if (!res) {
                        this.handleErrorResponse('Respuesta inválida del servidor');
                        return;
                    }

                    if (res.code === 200) {
                        this.saveLoginObject(res.object);
                        this.router.navigate(['/adminPage']);
                        return;
                    } else if (res.code === 401) {
                        this.errorMessage = res.message || 'Credenciales inválidas';
                        return;
                    }

                    this.handleErrorResponse(res?.message || 'Error en login');
                },
                error: (err: any) => {
                    if (err?.error?.code === 401) {
                        this.errorMessage = err.error.message || 'Credenciales inválidas';
                        return;
                    }

                    this.handleErrorResponse(err?.error?.message || 'Error de red o servidor');
                }
            });
    }

    private saveLoginObject(obj: any): void {
        try {
            const serialized = JSON.stringify(obj);
            if (this.checked) {
                localStorage.setItem('usuario', serialized);
            } else {
                sessionStorage.setItem('usuario', serialized);
            }
        } catch (e) {
            console.warn('No se pudo guardar el objeto de login', e);
            this.router.navigate(['/auth/error']);
        }
    }

    private handleErrorResponse(message: string): void {
        this.errorMessage = message;
        this.router.navigate(['/auth/error']);
    }
}
