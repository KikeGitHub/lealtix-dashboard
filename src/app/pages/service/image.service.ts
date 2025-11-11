import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../commons/environment';

@Injectable({ providedIn: 'root' })
export class ImageService {
    private baseUrl = `${environment.apiUrl}/images`;

    constructor(private http: HttpClient) {}

    /**
     * Sube una imagen usando JSON, según el nuevo curl del backend.
     * @param file Archivo seleccionado por el usuario
     * @param type Tipo de imagen
     * @param email Email
     * @param nombreNegocio Nombre del negocio
     * @param slogan Slogan
     */
    uploadImage(file: File, type: string, email: string, nombreNegocio: string, slogan: string): Observable<any> {
        return new Observable((observer) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64File = (reader.result as string).split(',')[1];
                const body = {
                    email,
                    nombreNegocio,
                    slogan,
                    type,
                    base64File
                };
                this.http
                    .post(`${this.baseUrl}/upload`, body, {
                        headers: { 'Content-Type': 'application/json' },
                        responseType: 'text'
                    })
                    .subscribe({
                        next: (res) => {
                            observer.next(res);
                            observer.complete();
                        },
                        error: (err) => observer.error(err)
                    });
            };
            reader.onerror = (err) => observer.error(err);
            reader.readAsDataURL(file);
        });
    }

    uploadImageProd(file: File, type: string, tenantId: number, productName: string): Observable<any> {
        return new Observable((observer) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64File = (reader.result as string).split(',')[1];
                const body = {
                    tenantId,
                    productName,
                    type,
                    base64File
                };
                this.http
                    .post(`${this.baseUrl}/uploadImgProd`, body, {
                        headers: { 'Content-Type': 'application/json' },
                        responseType: 'text'
                    })
                    .subscribe({
                        next: (res) => {
                            observer.next(res);
                            observer.complete();
                        },
                        error: (err) => observer.error(err)
                    });
            };
            reader.onerror = (err) => observer.error(err);
            reader.readAsDataURL(file);
        });
    }
}
