import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { AuthServices } from '../../shared/services/auth-services';
import { DialogoGenerico } from '../forms/dialogo-generico/dialogo-generico';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule,
    ReactiveFormsModule, MatInputModule, MatDividerModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})

export class Login {
  frmLogin: FormGroup;
  private builder = inject(FormBuilder);
  private svrAuth = inject(AuthServices);
  private router = inject(Router)
  private dialog = inject(MatDialog);
  public errorLogin = signal(false);

  constructor() {
    this.frmLogin = this.builder.group({
      id: (0),
      correo: ('Henry@example.com'),
      passw: ('henryNewPass1')
    });
  }

  get login() {
    return this.frmLogin.controls;
  }

  public onLogin() {
    delete this.frmLogin.value.id
    this.svrAuth.login({ "correo": this.frmLogin.value.correo, "passw": this.frmLogin.value.passw }).subscribe(
      (res) => {
        this.errorLogin.set(!res || res == 401)
        if (this.errorLogin()) {
          this.dialog.open(DialogoGenerico, {
            data: {
              tipo: 'Error',
              mensaje: 'Correo o contraseña incorrectos.',
              textoAceptar: 'Aceptar'
            }
          });
        } else {
          this.dialog.open(DialogoGenerico, {
            data: {
              tipo: 'informacion',
              mensaje: 'Inicio de sesión exitoso. ',
              textoAceptar: 'Aceptar'
            }
          });
        }
      }
    );    
  }

}
