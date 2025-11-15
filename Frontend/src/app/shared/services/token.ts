import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { IToken } from '../models/itoken';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class Token {

  private readonly JWT_TOKEN = 'JWT_TOKEN';
  private readonly REFRESH_TOKEN = 'REFRESH_TOKEN';

  private http = inject(HttpClient);
  private refrescando = false;

  constructor() { }

  public set Token(tokens: IToken) {
    localStorage.setItem(this.JWT_TOKEN, tokens.token);
  }

  public set RefToken(tkRef: string) {
    localStorage.setItem(this.REFRESH_TOKEN, tkRef);
  }

  public set Tokens(tokens: IToken) {
    this.Token = tokens;
    this.RefToken = tokens.tkRef;
  }

  public get Token(): any {
    return localStorage.getItem(this.JWT_TOKEN);
  }

  public get RefToken(): any {
    return localStorage.getItem(this.REFRESH_TOKEN);
  }

  public clearTokens() {
    localStorage.removeItem(this.JWT_TOKEN);
    localStorage.removeItem(this.REFRESH_TOKEN);
  }

  public decodeToken(): any {
    const helper = new JwtHelperService();
    return helper.decodeToken(this.Token);
  }

  public jwtTokenExp(): boolean | Promise<boolean> {
    const helper = new JwtHelperService();
    return helper.isTokenExpired(this.Token);
  }

  public tiempoExpToken(): number {
    return this.decodeToken().exp - (Date.now() / 1000)
  }

  public refreshTokens() {
    if (!this.refrescando) {
      this.refrescando = true;
      return this.http.patch<IToken>(`${environment.Servidor}/auth/refreshToken`,
        {
          "id_usuario": (this.decodeToken().sub),
          "tkRef": this.RefToken
        }
      ).subscribe(
        tokens => {
          this.Tokens = tokens;
          this.refrescando = false;
        }
      )
    }
    return false;
  }

}
