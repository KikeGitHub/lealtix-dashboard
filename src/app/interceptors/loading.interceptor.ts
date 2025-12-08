import { Injectable, signal } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = signal<number>(0);

  // Exposer el estado de loading como computed o getter
  get isLoading(): boolean {
    return this.activeRequests() > 0;
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Incrementar contador de requests activos
    this.activeRequests.update(count => count + 1);

    return next.handle(req).pipe(
      finalize(() => {
        // Decrementar contador cuando la request termine
        this.activeRequests.update(count => Math.max(0, count - 1));
      })
    );
  }
}

// Servicio para acceder al estado de loading desde componentes
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  constructor(private loadingInterceptor: LoadingInterceptor) {}

  get isLoading(): boolean {
    return this.loadingInterceptor.isLoading;
  }
}
