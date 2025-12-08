import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, map, catchError, of } from 'rxjs';
import { CampaignService } from '@/pages/campaigns/services/campaign.service';

@Injectable({
  providedIn: 'root'
})
export class CampaignExistsGuard implements CanActivate {

  constructor(
    private campaignService: CampaignService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const campaignId = +route.params['id'];

    if (!campaignId || isNaN(campaignId)) {
      this.router.navigate(['/dashboard/campaigns']);
      return of(false);
    }

    return this.campaignService.get(campaignId).pipe(
      map(() => true), // Si la campaña existe, permitir acceso
      catchError(() => {
        // Si hay error (campaña no existe), redirigir
        this.router.navigate(['/dashboard/campaigns']);
        return of(false);
      })
    );
  }
}
