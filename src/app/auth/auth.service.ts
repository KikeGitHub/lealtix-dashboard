import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, of, map, catchError } from 'rxjs';
import { environment } from '@/pages/commons/environment';
import { TenantService } from '@/pages/admin-page/service/tenant.service';

interface LoginCredentials {
	email: string;
	password: string;
}

interface BackendWrapper<T> {
	code: number;
	message: string;
	object: T;
}

interface LoginObject {
	accessToken: string;
	userEmail: string;
	userId: number;
}

type LoginResponse = BackendWrapper<LoginObject>;

@Injectable({
	providedIn: 'root'
})
export class AuthService {

    private baseUrl = `${environment.apiUrl}/auth`;
	constructor(
		private http: HttpClient,
		private tenantService: TenantService
	) {}

	/**
	 * Comprueba si existe un token de acceso en localStorage.
	 */
	isAuthenticated(): boolean {
		try {
			const token = localStorage.getItem('accessToken');
			return !!token;
		} catch (e) {
			return false;
		}
	}

	/**
	 * Elimina las credenciales locales (logout local).
	 */
	logout(): void {
		try {
			localStorage.removeItem('accessToken');
		} catch (e) {
			// ignore
		}
	}

	/**
	 * Realiza login al backend usando POST /api/auth/login
	 * @param credentials { email, password }
	 * @returns Observable<LoginResponse>
	 */
	login(credentials: LoginCredentials): Observable<LoginResponse> {
		const url = `${this.baseUrl}/login`;
		const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: '*/*' });
		return this.http.post<LoginResponse>(url, credentials, { headers });
	}

	/**
	 * Llama a login y almacena accessToken en localStorage si la respuesta es exitosa.
	 * @param credentials
	 */
	loginAndStore(credentials: LoginCredentials): Observable<LoginResponse> {
		return this.login(credentials).pipe(
			tap((res) => {
				if (res && res.object && res.object.accessToken) {
					try {
						localStorage.setItem('accessToken', res.object.accessToken);
					} catch (e) {
						// localStorage podría no estar disponible en ciertos entornos
						console.warn('No se pudo guardar accessToken en localStorage', e);
					}
				}
			})
		);
	}

	/**
	 * Obtiene el usuario actual desde sessionStorage o localStorage
	 * @returns Objeto con email y userId del usuario, o null si no existe
	 */
	getCurrentUser(): { email: string; userEmail: string; userId: number; tenantId?: number } | null {
		try {
			const userStr = sessionStorage.getItem('usuario') ?? localStorage.getItem('usuario');

			if (!userStr) {
				return null;
			}

			const userObj = JSON.parse(userStr);

			if (userObj && userObj.userEmail) {
				return {
					email: String(userObj.userEmail || '').trim(),
					userEmail: String(userObj.userEmail || '').trim(),
					userId: userObj.userId || 0,
					tenantId: userObj.tenantId || userObj.tenant?.id || undefined
				};
			}

			return null;
		} catch (e) {
			console.warn('Error parsing user from storage:', e);
			return null;
		}
	}

	/**
	 * Obtiene el usuario actual con tenantId actualizado desde el backend
	 * @returns Observable con el usuario actualizado o null
	 */
	getCurrentUserWithTenant(): Observable<{ email: string; userEmail: string; userId: number; tenantId?: number } | null> {
		try {
			const userStr = sessionStorage.getItem('usuario') ?? localStorage.getItem('usuario');

			if (!userStr) {
				return of(null);
			}

			const userObj = JSON.parse(userStr);

			if (userObj && userObj.userEmail) {
				const userEmail = String(userObj.userEmail || '').trim();

				return this.tenantService.getTenantByEmail(userEmail).pipe(
					map((resp) => {
						const tenant = resp?.object;
						const tenantId = tenant?.id || userObj.tenantId || userObj.tenant?.id || undefined;

						return {
							email: userEmail,
							userEmail: userEmail,
							userId: userObj.userId || 0,
							tenantId: tenantId
						};
					}),
					catchError((error) => {
						console.warn('Error fetching tenant:', error);
						// Retornar el usuario con datos del storage si falla la llamada
						return of({
							email: userEmail,
							userEmail: userEmail,
							userId: userObj.userId || 0,
							tenantId: userObj.tenantId || userObj.tenant?.id || undefined
						});
					})
				);
			}

			return of(null);
		} catch (e) {
			console.warn('Error parsing user from storage:', e);
			return of(null);
		}
	}

	/**
	 * Obtiene el ID del tenant del usuario actual
	 * @returns ID del tenant o 1 por defecto si no existe
	 */
	getTenantId(): number {
		const user = this.getCurrentUser();
		return user?.tenantId || 1;
	}
}
