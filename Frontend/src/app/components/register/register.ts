import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, PatternValidator, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { AuthServices } from '../../shared/services/auth-services';
import { ClienteRegister } from '../../shared/models/clientes'
import { DialogoGenerico } from '../forms/dialogo-generico/dialogo-generico';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-register',
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule,
    ReactiveFormsModule, MatInputModule, MatDividerModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  frmRegister: FormGroup;
  private builder = inject(FormBuilder);
  private svrAuth = inject(AuthServices);
  public errorLogin = signal(false);
  private readonly dialog = inject(MatDialog);

  constructor() {
    this.frmRegister = this.builder.group(
      {
        nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30),
        Validators.pattern('([A-Za-zÑñáéíóú]*)( ([A-Za-zÑñáéíóú])*){0,1}')]],
        apellido1: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30),
        Validators.pattern('([A-Za-zÑñáéíóú]*)( ([A-Za-zÑñáéíóú])*){0,1}')]],
        apellido2: ['', [Validators.maxLength(30),
        Validators.pattern('([A-Za-zÑñáéíóú]*)( ([A-Za-zÑñáéíóú])*){0,1}')]],
        correo: ['', [Validators.required, Validators.email]],
        telefono: ['', Validators.pattern('[0-9]{8}')],
        direccion: ['', [Validators.minLength(10), Validators.maxLength(255)]],
        clave: ['', [Validators.required, Validators.minLength(8),
        this.passwordValidator
        ]]
      }
    );
  }

   passwordValidator(control: any) {
    const value = control.value || '';
    const errors: any = {};

    if (!/[A-Z]/.test(value)) {
      errors.missingUpper = true;
    }
    if (!/[a-z]/.test(value)) {
      errors.missingLower = true;
    }
    if (!/[0-9]/.test(value)) {
      errors.missingNumber = true;
    }
    if (!/[@$!%*?&]/.test(value)) {
      errors.missingSymbol = true;
    }

    // Si no hay errores, devolver null
    return Object.keys(errors).length ? errors : null;
  }

  get register() {
    return this.frmRegister.controls;
  }

  public onRegister() {
 
    if (this.frmRegister.valid) {
      const datos: ClienteRegister = this.frmRegister.value;
      this.svrAuth.register(datos).subscribe(
        (response) => {
  
          this.markFormGroupTouched(this.frmRegister)          
          if (response === true) {
            this.dialog.open(DialogoGenerico, {
              data: {
                tipo: 'informacion',
                mensaje: 'Registrado exitosamente. ',
                textoAceptar: 'Aceptar'
              }
            });
            
          } else {
            this.dialog.open(DialogoGenerico, {
              data: {
                tipo: 'error',
                mensaje: 'Error al registrar el usuario. ',
                textoAceptar: 'Aceptar'
              }
            });
            this.errorLogin.set(true)
          }
          
        }
      );
    } else {
      this.markFormGroupTouched(this.frmRegister);
      this.errorLogin.set(true)
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }
}
