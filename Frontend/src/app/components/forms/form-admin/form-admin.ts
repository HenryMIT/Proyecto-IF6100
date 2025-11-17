import { Component, inject, OnInit, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdministradorService } from '../../../shared/services/administrador';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-form-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  styleUrls: ['./form-admin.css'],
  templateUrl: './form-admin.html'
})
export class FormAdminComponent implements OnInit {
  adminForm: FormGroup;
  enviando = false;
  mensajeExito = '';
  mensajeError = '';
  esEdicion = false;
  idAdmin?: number;

  private fb = inject(FormBuilder);
  private adminService = inject(AdministradorService);

  constructor(
    @Optional() public dialogRef: MatDialogRef<FormAdminComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.adminForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      primer_apellido: ['', [Validators.required, Validators.minLength(2)]],
      segundo_apellido: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{8,15}$')]],
      clave: ['', [Validators.required, Validators.minLength(6)]]
    });

    if (data?.datos) {
      this.esEdicion = true;
      this.idAdmin = data.datos.id;
      this.adminForm.patchValue({
        nombre: data.datos.nombre,
        primer_apellido: data.datos.primer_apellido,
        segundo_apellido: data.datos.segundo_apellido,
        correo: data.datos.correo,
        telefono: data.datos.telefono,
        clave: ''
      });
      // En modo edición, la clave no es requerida
      this.adminForm.get('clave')?.clearValidators();
      this.adminForm.get('clave')?.updateValueAndValidity();
    }
  }

  ngOnInit(): void {}

  isFieldInvalid(field: string): boolean {
    const control = this.adminForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldError(field: string): string {
    const control = this.adminForm.get(field);
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'Este campo es obligatorio';
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['email']) return 'Correo inválido';
    if (control.errors['pattern']) return 'Formato inválido';
    return '';
  }

  onSubmit() {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }
    this.enviando = true;
    this.mensajeExito = '';
    this.mensajeError = '';

    const adminData = this.adminForm.value;

    if (this.esEdicion && this.idAdmin) {
      this.adminService.actualizarAdministrador(this.idAdmin, adminData).subscribe({
        next: () => {
          this.mensajeExito = 'Administrador actualizado correctamente';
          this.enviando = false;
          this.dialogRef?.close(true);
        },
        error: (err) => {
          this.mensajeError = 'Error al actualizar: ' + (err.error?.detail || err.message);
          this.enviando = false;
        }
      });
    } else {
      this.adminService.crearAdministrador(adminData).subscribe({
        next: () => {
          this.mensajeExito = 'Administrador creado correctamente';
          this.adminForm.reset();
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