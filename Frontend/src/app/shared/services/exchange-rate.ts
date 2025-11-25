import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ExchangeRateService {
  private http = inject(HttpClient);
  private cache = new Map<string, Observable<number>>();

  /**
   * Obtiene la tasa de cambio de `base` a `target`.
   * Si `forceReload` es true no usa cache y hace una petición fresca.
   * Hace fallback automático a otra API pública si la primera falla o requiere API key.
   */
  getRate(base = 'CRC', target = 'USD', forceReload = false): Observable<number> {
    const key = `${base}_${target}`;
    if (!forceReload && this.cache.has(key)) return this.cache.get(key)!;

    const urlDirect = `https://api.exchangerate.host/latest?base=${base}&symbols=${target}`;
    const obs$ = this.http.get<any>(urlDirect).pipe(
      switchMap(res => {
        // exchangerate.host returns { rates: { USD: 0.0017 }, ... }
        if (res && res.rates && res.rates[target]) {
          return of(Number(res.rates[target]));
        }
        // si la respuesta contiene error (por ejemplo apilayer) o no tiene la tasa, usar fallback
        return this.fallbackRate(base, target);
      }),
      catchError(err => {
        // en caso de error de red o CORS, intentar fallback
        console.warn('ExchangeRateService: direct fetch failed, trying fallback', err);
        return this.fallbackRate(base, target);
      }),
      shareReplay(1)
    );

    if (!forceReload) this.cache.set(key, obs$);
    return obs$;
  }

  private fallbackRate(base: string, target: string): Observable<number> {
    // open.er-api.com devuelve tasas sin API key: { rates: { USD: ... } }
    const url = `https://open.er-api.com/v6/latest/${base}`;
    return this.http.get<any>(url).pipe(
      map(res => (res && res.rates && res.rates[target]) ? Number(res.rates[target]) : 0),
      catchError(err => {
        console.error('ExchangeRateService: fallback failed', err);
        return of(0);
      }),
      shareReplay(1)
    );
  }
}
