import { Injectable } from '@angular/core';
import { CanActivateChild, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivateChild, CanActivate {
    constructor(private auth: AuthService, private router: Router) {}

    private checkAuth(state: RouterStateSnapshot | null): boolean | UrlTree {
        const isAuth = this.auth.isAuthenticated();
        // debug log to help trace why routing isn't redirecting
        try {
            // eslint-disable-next-line no-console
            console.log('[AuthGuard] checkAuth called, isAuthenticated=', isAuth, 'state=', state?.url);
        } catch (e) {
            // ignore logging failures in some environments
        }
        if (isAuth) {
            return true;
        }
        const returnUrl = state ? state.url : '/dashboard/kpis';
        return this.router.createUrlTree(['/dashboard/auth/login'], { queryParams: { returnUrl } });
    }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean | UrlTree {
        return this.checkAuth(state);
    }

    canActivateChild(
        childRoute: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean | UrlTree {
        return this.checkAuth(state);
    }
}
