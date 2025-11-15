import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { DialogoGenerico, DialogData } from './dialogo-generico';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialog = inject(MatDialog);

  /**
   * Muestra un diálogo de confirmación
   * @param mensaje - Mensaje a mostrar
   * @param titulo - Título opcional del diálogo
   * @returns Observable<boolean> - true si acepta, false si cancela
   */
  confirmar(mensaje: string, titulo?: string): Observable<boolean> {
    const dialogRef = this.dialog.open(DialogoGenerico, {
      width: '400px',
      disableClose: true,
      data: {
        tipo: 'confirmacion',
        titulo: titulo,
        mensaje: mensaje,
        textoAceptar: 'Confirmar',
        textoCancelar: 'Cancelar',
        mostrarCancelar: true
      } as DialogData
    });

    return dialogRef.afterClosed();
  }

  /**
   * Muestra un diálogo informativo
   * @param mensaje - Mensaje a mostrar
   * @param titulo - Título opcional del diálogo
   * @returns Observable<boolean>
   */
  informar(mensaje: string, titulo?: string): Observable<boolean> {
    const dialogRef = this.dialog.open(DialogoGenerico, {
      width: '400px',
      data: {
        tipo: 'informacion',
        titulo: titulo,
        mensaje: mensaje,
        textoAceptar: 'Aceptar',
        mostrarCancelar: false
      } as DialogData
    });

    return dialogRef.afterClosed();
  }

  /**
   * Muestra un diálogo de error
   * @param mensaje - Mensaje de error a mostrar
   * @param titulo - Título opcional del diálogo
   * @returns Observable<boolean>
   */
  error(mensaje: string, titulo?: string): Observable<boolean> {
    const dialogRef = this.dialog.open(DialogoGenerico, {
      width: '400px',
      data: {
        tipo: 'error',
        titulo: titulo,
        mensaje: mensaje,
        textoAceptar: 'Aceptar',
        mostrarCancelar: false
      } as DialogData
    });

    return dialogRef.afterClosed();
  }

  /**
   * Diálogo personalizado con todas las opciones
   * @param config - Configuración completa del diálogo
   * @returns Observable<boolean>
   */
  personalizado(config: DialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(DialogoGenerico, {
      width: '400px',
      disableClose: config.tipo === 'confirmacion',
      data: config
    });

    return dialogRef.afterClosed();
  }
}