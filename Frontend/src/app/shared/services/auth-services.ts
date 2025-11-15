import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, retry, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Token } from './token';
import { IToken } from '../models/itoken';
import { Usuario } from '../models/usuarios';


const _SERVER = environment.Servidor
const LIMITE_REFRESH = 60

@Injectable({
  providedIn: 'root'
})
export class AuthServices {

  private http = inject(HttpClient);
  private srvToken = inject(Token);
  private router = inject(Router);
  public userActuals = signal(new Usuario);

  constructor() { }

  public login(datos: { correo: '', passw: '' }): Observable<any> {
    const body = new HttpParams()
      .set('username', datos.correo)
      .set('password', datos.passw);
    const header = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })

    return this.http
      .post<IToken>(`${_SERVER}/auth/login`, body.toString(), { headers: header })
      .pipe(
        retry(1),
        tap(
          (tokens) => {
            this.doLogin(tokens);
            this.router.navigate(['home']);
          }
        ),
        map(() => true),
        catchError((error) => {
          return of(error.status)
        })
      )
  }

  public loggOut(){
    if(this.isLoggedIn()){
      this.http
      .delete(`${_SERVER}/auth/${this.userActual.idUsuario}`)
      .subscribe();
      this.doLoggOut();
    }
  }

  private doLogin(tokens: IToken) {
    this.srvToken.Tokens = tokens;
    this.userActuals.set(this.userActual)
  }

  private doLoggOut() {
    if (this.srvToken.Token){
      this.srvToken.clearTokens();
    }
    this.userActuals.set(this.userActual);
    this.router.navigate(['/login']);
  }

  public isLoggedIn(): boolean {
    return !!this.srvToken.Token && !this.srvToken.jwtTokenExp();
  }

  public get userActual(): Usuario {
    if (!this.srvToken.Token){
      return new Usuario()
    }
    const tokenD = this.srvToken.decodeToken();
    return new Usuario({
      idUsuario: Number(tokenD.sub),
      nombre: tokenD.nombre,
      email: tokenD.correo,
      rol: Number(tokenD.rol)
    });
  }

  public verificarRefresh(): boolean {
    if (this.isLoggedIn()) {
      const tiempo = this.srvToken.tiempoExpToken();
      if (tiempo <= 0) {
        this.loggOut();
        return false;
      }      
      if (tiempo > 0 && tiempo <= LIMITE_REFRESH) {
        this.srvToken.refreshTokens();
      }
      return true;      
    } else {
      this.loggOut();
      return false;
    }
  }
}
