import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let refreshTokenRequest$: Observable<string> | null = null;

const isAuthEndpoint = (url: string): boolean =>
  url.includes('/Auth/login') ||
  url.includes('/Auth/register') ||
  url.includes('/Auth/refresh-token');

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  const shouldAttachAccessToken = token && !isAuthEndpoint(req.url);

  const authReq = shouldAttachAccessToken
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status !== 401 ||
        isAuthEndpoint(req.url) ||
        req.headers.has('x-refresh-attempt')
      ) {
        return throwError(() => error);
      }

      const storedRefreshToken = authService.getRefreshToken();
      if (!storedRefreshToken) {
        authService.clearAuth();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      if (!refreshTokenRequest$) {
        refreshTokenRequest$ = authService.refreshToken().pipe(
          map((response) => response.token),
          catchError((refreshError: HttpErrorResponse) => {
            authService.clearAuth();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          }),
          finalize(() => {
            refreshTokenRequest$ = null;
          }),
          shareReplay(1)
        );
      }

      return refreshTokenRequest$.pipe(
        switchMap((newToken) => {
          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
              'x-refresh-attempt': 'true',
            },
          });

          return next(retryReq);
        })
      );
    })
  );
};