import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@/pages/commons/environment';

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
	constructor(private http: HttpClient) {}

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
}
