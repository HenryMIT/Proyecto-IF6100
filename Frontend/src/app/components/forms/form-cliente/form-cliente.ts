import { Component, inject, OnInit, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ClienteServices } from '../../../shared/services/cliente-services';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-form-cliente',
  imports: [CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule],
  templateUrl: './form-cliente.html',
  styleUrl: './form-cliente.css'
})
export class FormCliente implements OnInit {
  clienteForm: FormGroup;
  enviando = false;
  mensajeExito = '';
  mensajeError = '';
  esEdicion = false;
  idCliente?: number;

  private fb = inject(FormBuilder);
  private svrCliente = inject(ClienteServices);

  constructor(
    @Optional() public dialogRef: MatDialogRef<FormCliente>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.clienteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      primer_apellido: ['', [Validators.required, Validators.minLength(2)]],
      segundo_apellido: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{8,15}$')]],
      direccion: ['', [Validators.minLength(10), Validators.maxLength(255)]],
      clave: ['', [Validators.required, Validators.minLength(6)]]
    });

    if (data?.datos) {
      this.esEdicion = true;
      this.idCliente = data.datos.id;
      this.clienteForm.patchValue({
        nombre: data.datos.nombre,
        primer_apellido: data.datos.primer_apellido,
        segundo_apellido: data.datos.segundo_apellido,
        correo: data.datos.correo,
        telefono: data.datos.telefono,
        direccion: data.datos.direccion,
        clave: ''
      });
      // En modo edición, la clave no es requerida
      this.clienteForm.get('clave')?.clearValidators();
      this.clienteForm.get('clave')?.updateValueAndValidity();
    }
  }

  ngOnInit(): void { }

  isFieldInvalid(field: string): boolean {
    const control = this.clienteForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldError(field: string): string {
    const control = this.clienteForm.get(field);
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['email']) return 'Correo inválido';
    if (control.errors['pattern']) return 'Formato inválido';
    return '';
  }

  onSubmit() {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }
    this.enviando = true;
    this.mensajeExito = '';
    this.mensajeError = '';

    const datos = this.clienteForm.value;

    if (this.esEdicion && this.idCliente) {
      this.svrCliente.actualizarClientes(this.idCliente, datos).subscribe({
        next: () => {
          this.mensajeExito = 'Cliente actualizado correctamente';
          this.enviando = false;
          this.dialogRef?.close(true);
        },
        error: (err) => {
          this.mensajeError = 'Error al actualizar: ' + (err.error?.detail || err.message);
          this.enviando = false;
        }
      });
    } else {
      this.svrCliente.crearClientes(datos).subscribe({
        next: () => {
          this.mensajeExito = 'Cliente creado correctamente';
          this.clienteForm.reset();
          this.enviando = false;
          this.dialogRef?.close(true);
        },
        error: (err) => {
          this.mensajeError = 'Error al crear: ' + (err.error?.detail || err.message);
          this.enviando = false;
        }
      });
    }
  }

  onCancelar() {
    this.dialogRef?.close(false);
  }
}
