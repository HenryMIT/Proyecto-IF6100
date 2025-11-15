import { Component, inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactoService } from '../../../shared/services/contacto';
import { ContactoData, TipoConsulta } from '../../../shared/models/contactos.if';

@Component({
  selector: 'app-form-contacto',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './form-contacto.html',
  styleUrl: './form-contacto.css'
})
export class FormContacto implements OnInit {
  
  @Input() tipoPreseleccionado?: number;
  
  private fb = inject(FormBuilder);
  private contactoService = inject(ContactoService);
  
  contactoForm: FormGroup;
  enviando = false;
  mensajeExito = '';
  mensajeError = '';
  
  // Opciones para el select de tipo de consulta
  tiposConsulta = [
    { id: TipoConsulta.GENERAL, nombre: 'Consulta General', descripcion: 'Información general sobre nuestros servicios' },
    { id: TipoConsulta.SOPORTE_TECNICO_MANTENIMIENTO, nombre: 'Soporte Técnico o Mantenimiento', descripcion: 'Mantenimiento y reparación de equipos' },
    { id: TipoConsulta.CITAS_INSPECCION, nombre: 'Citas de Inspección', descripcion: 'Evaluación y análisis de espacios' },
    { id: TipoConsulta.PROYECTO_A_LA_MEDIDA, nombre: 'Proyecto a la Medida', descripcion: 'Diseños personalizados para tu cocina' },
    { id: TipoConsulta.OTROS, nombre: 'Otros', descripcion: 'Otras consultas no especificadas' }
  ];

  constructor() {
    this.contactoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      tipo: ['', Validators.required],
      mensaje: ['', [Validators.required, Validators.minLength(10)]]
    });
  }
  
  ngOnInit() {
    // Si hay un tipo preseleccionado, establecerlo en el formulario
    if (this.tipoPreseleccionado) {
      this.contactoForm.patchValue({ tipo: this.tipoPreseleccionado.toString() });
    }
  }

  onSubmit() {
    if (this.contactoForm.valid) {
      this.enviando = true;
      this.mensajeError = '';
      this.mensajeExito = '';

      const contactoData: ContactoData = {
        nombre: this.contactoForm.value.nombre,
        apellido: this.contactoForm.value.apellido,
        correo: this.contactoForm.value.correo,
        mensaje: this.contactoForm.value.mensaje,
        tipo: parseInt(this.contactoForm.value.tipo)
      };

      this.contactoService.crearContacto(contactoData).subscribe({
        next: (response) => {
          this.mensajeExito = '¡Mensaje enviado exitosamente! Nos pondremos en contacto contigo pronto.';
          this.contactoForm.reset();
          this.enviando = false;
          
          // Limpiar mensaje después de 5 segundos
          setTimeout(() => {
            this.mensajeExito = '';
          }, 5000);
        },
        error: (error) => {
          console.error('Error al enviar contacto:', error);
          this.mensajeError = 'Hubo un error al enviar tu mensaje. Por favor intenta nuevamente.';
          this.enviando = false;
          
          // Limpiar mensaje después de 5 segundos
          setTimeout(() => {
            this.mensajeError = '';
          }, 5000);
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      this.markFormGroupTouched(this.contactoForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  // Helpers para validación en el template
  isFieldInvalid(field: string): boolean {
    const control = this.contactoForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getFieldError(field: string): string {
    const control = this.contactoForm.get(field);
    if (control?.errors) {
      if (control.errors['required']) {
        return `${field} es requerido`;
      }
      if (control.errors['email']) {
        return 'Email inválido';
      }
      if (control.errors['minlength']) {
        return `${field} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }
}
