import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private messageService: MessageService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    return next.handle(req).pipe(
      tap((event) => {
        // Opcional: manejar respuestas exitosas
        if (event instanceof HttpResponse) {
          // Aquí puedes agregar logging o notificaciones de éxito
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // Manejo global de errores
        let errorMessage = 'Ha ocurrido un error inesperado';

        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Mostrar toast de error
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000
        });

        // Re-throw para que otros interceptors o componentes puedan manejarlo
        return throwError(() => error);
      })
    );
  }
}
