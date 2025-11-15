import { AfterViewInit, Component, inject, signal, ViewChild } from '@angular/core';
import { Contacto } from '../../shared/models/contactos.if';
import { ContactoService } from '../../shared/services/contacto';
import { DialogService } from '../forms/dialogo-generico/dialog.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatPaginator } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-contactos',
  imports: [MatCardModule, MatTableModule, MatIconModule, MatExpansionModule, MatPaginatorModule, MatInputModule, MatFormFieldModule, MatButtonModule, DatePipe],
  templateUrl: './contactos.html',
  styleUrl: './contactos.css'
})
export class Contactos implements AfterViewInit {
  private readonly contactoSrv = inject(ContactoService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogService = inject(DialogService);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  // PARA LA TABLA 
  panelOpenState = signal(false);
  columnas: string[] = ['id_Mensaje', 'nombre', 'apellido', 'correo', 'tipo', 'estado', 'fecha', 'botonera'];
  filtro: any;
  
  // signal para manejar los datos de la tabla de forma reactiva
  dataSource = signal(new MatTableDataSource<Contacto>());

  // apenas se carga el componente, se inicializa el filtro y se carga la lista de contactos
  ngAfterViewInit(): void {
    this.filtro = { nombre: '', apellido: '', correo: '' };
    this.cargarContactos();
  }

  onFiltroChange(f: any) {
    this.filtro = f;
    this.filtrarContactos();
  }

  limpiarFiltros() {
    this.restablecerFiltro();
    (document.querySelector('#fnombre') as HTMLInputElement).value = '';
    (document.querySelector('#fapellido') as HTMLInputElement).value = '';
    (document.querySelector('#fcorreo') as HTMLInputElement).value = '';
  }

  restablecerFiltro() {
    this.filtro = { nombre: '', apellido: '', correo: '' };
    this.filtrarContactos();
  }

  // Método para cargar todos los contactos desde el servidor
  cargarContactos() {
    this.contactoSrv.listarContactos().subscribe({
      next: (data: Contacto[]) => {
        const newDataSource = new MatTableDataSource<Contacto>(data);
        newDataSource.paginator = this.paginator;
        this.dataSource.set(newDataSource);
      },
      error: (err) => console.log(err)
    });
  }

  // Método principal de filtrado - similar al de visitantes
  filtrarContactos() {
    // Si todos los filtros están vacíos, cargar todos los contactos
    const filtrosVacios = !this.filtro.nombre.trim() && !this.filtro.apellido.trim() && !this.filtro.correo.trim();
    
    if (filtrosVacios) {
      this.cargarContactos();
    } else {
      // Si hay filtros, aplicar filtrado local (o aquí podrías llamar al servidor)
      this.aplicarFiltrosLocales();
    }
  }

  // Método para aplicar filtros localmente (renombrado para claridad)
  aplicarFiltrosLocales() {
    const currentData = this.dataSource().data;
    let filteredData = currentData;

    // Filtrar por nombre
    if (this.filtro.nombre && this.filtro.nombre.trim() !== '') {
      filteredData = filteredData.filter(contacto => 
        contacto.nombre.toLowerCase().includes(this.filtro.nombre.toLowerCase())
      );
    }

    // Filtrar por apellido
    if (this.filtro.apellido && this.filtro.apellido.trim() !== '') {
      filteredData = filteredData.filter(contacto => 
        contacto.apellido.toLowerCase().includes(this.filtro.apellido.toLowerCase())
      );
    }

    // Filtrar por correo
    if (this.filtro.correo && this.filtro.correo.trim() !== '') {
      filteredData = filteredData.filter(contacto => 
        contacto.correo.toLowerCase().includes(this.filtro.correo.toLowerCase())
      );
    }

    // Actualizar la tabla con los datos filtrados
    const newDataSource = new MatTableDataSource<Contacto>(filteredData);
    newDataSource.paginator = this.paginator;
    this.dataSource.set(newDataSource);
  }

  // Método para cambiar estado del contacto (marcar como revisado/no revisado)
  onCambiarEstado(id: number, estadoActual: boolean) {
    const nuevoEstado = !estadoActual;
    const textoEstado = nuevoEstado ? 'revisado' : 'no revisado';
    
    this.dialogService.confirmar(
      `¿Está seguro de que desea marcar este contacto como ${textoEstado}?`,
      'Cambiar Estado'
    ).subscribe(resultado => {
      if (resultado) {
        this.contactoSrv.actualizarEstadoContacto(id, nuevoEstado).subscribe({
          next: (res) => {
            console.log('Estado actualizado:', res);
            this.filtrarContactos(); // Recargar la tabla
            this.dialogService.informar(
              `Contacto marcado como ${textoEstado} correctamente`,
              'Estado Actualizado'
            ).subscribe();
          },
          error: (err) => {
            console.log('Error al actualizar estado:', err);
            this.dialogService.error(
              'Error al actualizar el estado del contacto',
              'Error'
            ).subscribe();
          }
        });
      }
    });
  }

  // Método para eliminar contacto
  onEliminar(id: number) {
    this.dialogService.confirmar(
      '¿Está seguro de que desea eliminar este contacto? Esta acción no se puede deshacer.',
      'Eliminar Contacto'
    ).subscribe(resultado => {
      if (resultado) {
        this.contactoSrv.eliminarContacto(id).subscribe({
          next: (res) => {
            console.log('Contacto eliminado:', res);
            this.filtrarContactos(); // Recargar la tabla
            this.dialogService.informar(
              'Contacto eliminado correctamente',
              'Contacto Eliminado'
            ).subscribe();
          },
          error: (err) => {
            console.log('Error al eliminar contacto:', err);
            this.dialogService.error(
              'Error al eliminar el contacto',
              'Error'
            ).subscribe();
          }
        });
      }
    });
  }

  // Método para filtrar por estado
  onFiltrarPorEstado(estado: boolean) {
    this.contactoSrv.buscarContactosPorEstado(estado).subscribe({
      next: (data) => {
        const newDataSource = new MatTableDataSource<Contacto>(data.contactos);
        newDataSource.paginator = this.paginator;
        this.dataSource.set(newDataSource);
      },
      error: (err) => console.log(err)
    });
  }

  // Métodos auxiliares para mostrar información formateada
  getTipoConsultaTexto(tipo: number): string {
    const tipos: { [key: number]: string } = {
      1: 'General',
      2: 'Soporte Técnico',
      3: 'Citas Inspección',
      4: 'Proyecto a Medida',
      5: 'Otros'
    };
    return tipos[tipo] || 'No especificado';
  }

  getEstadoTexto(estado: boolean): string {
    return estado ? 'Revisado' : 'Pendiente';
  }

  getEstadoClass(estado: boolean): string {
    return estado ? 'text-green-600 font-medium' : 'text-orange-600 font-medium';
  }
}