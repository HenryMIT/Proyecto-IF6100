import { Component, Inject,OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface DialogData {
  tipo: 'confirmacion' | 'informacion' | 'error';
  titulo?: string;
  mensaje: string;
  textoAceptar?: string;
  textoCancelar?: string;
  mostrarCancelar?: boolean;
}

@Component({
  selector: 'app-dialogo-generico',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CommonModule],
  styleUrls: ['./dialogo-generico.css'],
  template: `
    <div class="p-6">
      <!-- Header con ícono y título -->
      <div class="flex items-center mb-4">
        <mat-icon
          [class]="getIconoClass()"
          class="mr-3 text-3xl">
          {{getIcono()}}
        </mat-icon>
        <h2 class="text-xl font-semibold text-gray-900">
          {{getTitulo()}}
        </h2>
      </div>

        @if (usarTextoTabla()) {
          <pre class="mb-6 text-gray-700 text-base leading-relaxed font-mono whitespace-pre">
        {{ data.mensaje }}
          </pre>
        } @else {
          <div class="mb-6">
            <p class="text-gray-700 text-base leading-relaxed">
              {{ data.mensaje }}
            </p>
          </div>
        }

      <!-- Botones -->
      <div class="flex justify-end space-x-3">
        @if (data.mostrarCancelar !== false && data.tipo === 'confirmacion') {
          <button
            mat-button
            (click)="onCancelar()"
            class="px-4 py-2 text-gray-600 hover:text-gray-800">
            {{data.textoCancelar || 'Cancelar'}}
          </button>
        }

        <button
          mat-raised-button
          [color]="getColorBoton()"
          (click)="onAceptar()"
          class="px-6 py-2">
          {{data.textoAceptar || getTextoBotonDefault()}}
        </button>
      </div>
    </div>
  `
})
export class DialogoGenerico implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogoGenerico>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

   ngOnInit(): void {
   
    if (this.usarTextoTabla()) {
      // Ajustá el ancho a lo que te guste
      this.dialogRef.updateSize('2250px'); // o '700px', '60vw', etc.
    }
  }

  usarTextoTabla(): boolean {
    const titulo = (this.data.titulo || '').toLowerCase();
    return titulo.includes('detalle de factura');
  }

  onAceptar(): void {
    this.dialogRef.close(true);
  }

  onCancelar(): void {
    this.dialogRef.close(false);
  }

  getTitulo(): string {
    if (this.data.titulo) return this.data.titulo;

    switch (this.data.tipo) {
      case 'confirmacion': return 'Confirmar acción';
      case 'informacion': return 'Información';
      case 'error': return 'Error';
      default: return 'Mensaje';
    }
  }

  getIcono(): string {
    switch (this.data.tipo) {
      case 'confirmacion': return 'help';
      case 'informacion': return 'check_circle';
      case 'error': return 'error';
      default: return 'info';
    }
  }

  getIconoClass(): string {
    switch (this.data.tipo) {
      case 'confirmacion': return 'icon-warning';
      case 'informacion': return 'icon-success';
      case 'error': return 'icon-error';
      default: return 'text-gray-500';
    }
  }

  getColorBoton(): string {
    switch (this.data.tipo) {
      case 'confirmacion': return 'warn';
      case 'informacion': return 'primary';
      case 'error': return 'warn';
      default: return 'primary';
    }
  }

  getTextoBotonDefault(): string {
    switch (this.data.tipo) {
      case 'confirmacion': return 'Confirmar';
      case 'informacion': return 'Aceptar';
      case 'error': return 'Aceptar';
      default: return 'Aceptar';
    }
  }
}