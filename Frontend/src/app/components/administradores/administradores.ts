import { AfterViewInit, Component, inject, signal, ViewChild } from '@angular/core';
import { AdministradorIf } from '../../shared/models/administrador.if';
import { AdministradorService } from '../../shared/services/administrador';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { DialogoGenerico } from '../forms/dialogo-generico/dialogo-generico';
import { FormAdminComponent } from '../forms/form-admin/form-admin';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatPaginator } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-administradores',
  imports: [
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './administradores.html',
  styleUrl: './administradores.css'
})
export class AdministradoresComponent implements AfterViewInit {
  private readonly adminService = inject(AdministradorService);
  private readonly dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  panelOpenState = signal(false);
  columnas: string[] = ['id', 'nombre', 'primer_apellido', 'segundo_apellido', 'correo', 'telefono', 'botonera'];

  // Filtros
  filtroNombre: string = '';
  filtroPrimerApellido: string = '';
  filtroSegundoApellido: string = '';

  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 10;
  totalItems: number = 0;

  dataSource = signal(new MatTableDataSource<AdministradorIf>());

  ngAfterViewInit(): void {
    this.cargarAdministradores();
  }

  onFiltroChange() {
    this.paginaActual = 1; // Resetear a la primera página al filtrar
    this.cargarAdministradores();
  }

  limpiarFiltros() {
    this.filtroNombre = '';
    this.filtroPrimerApellido = '';
    this.filtroSegundoApellido = '';
    this.paginaActual = 1;
    this.cargarAdministradores();
  }

  onPageChange(event: PageEvent) {
    this.paginaActual = event.pageIndex + 1; // Material paginator es 0-indexed
    this.itemsPorPagina = event.pageSize;
    this.cargarAdministradores();
  }

  cargarAdministradores() {
    const nombre = this.filtroNombre.trim() || undefined;
    const primerApellido = this.filtroPrimerApellido.trim() || undefined;
    const segundoApellido = this.filtroSegundoApellido.trim() || undefined;

    this.adminService.filtrarAdministradores(
      this.paginaActual,
      this.itemsPorPagina,
      nombre,
      primerApellido,
      segundoApellido
    ).subscribe({
      next: (data: AdministradorIf[]) => {
        this.dataSource.set(new MatTableDataSource(data));
        // Como el backend maneja la paginación, no necesitamos asignar el paginator al dataSource
      },
      error: (err) => {
        console.error('Error al cargar administradores:', err);
        this.dialog.open(DialogoGenerico, {
          data: {
            tipo: 'error',
            mensaje: 'Error al cargar administradores',
            textoAceptar: 'Aceptar'
          }
        });
      }
    });
  }

  onNuevo() {
    const dialogRef = this.dialog.open(FormAdminComponent, {
      width: '50vw',
      maxHeight: '90vh',
      data: {
        title: 'Nuevo Administrador'
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe({
      next: (res) => {
        if (res !== false) {
          this.cargarAdministradores();
        }
      },
      error: (err) => console.log(err)
    });
  }

  onEditar(id: number) {
    this.adminService.obtenerAdministradorPorId(id).subscribe({
      next: (data) => {
        const dialogRef = this.dialog.open(FormAdminComponent, {
          width: '50vw',
          maxHeight: '90vh',
          data: {
            title: 'Editar Administrador',
            datos: data
          },
          disableClose: true
        });

        dialogRef.afterClosed().subscribe({
          next: (res) => {
            if (res !== false) {
              this.cargarAdministradores();
            }
          },
          error: (err) => console.log(err)
        });
      },
      error: (err) => {
        console.error('Error al obtener administrador:', err);
        this.dialog.open(DialogoGenerico, {
          data: {
            tipo: 'error',
            mensaje: 'Error al obtener los datos del administrador',
            textoAceptar: 'Aceptar'
          }
        });
      }
    });
  }

  onEliminar(id: number) {
    const dialogRef = this.dialog.open(DialogoGenerico, {
      data: {
        tipo: 'confirmacion',
        mensaje: '¿Está seguro de que desea eliminar este administrador?',
        textoAceptar: 'Sí',
        textoCancelar: 'No'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.adminService.eliminarAdministrador(id)
          .subscribe({
            next: () => {
              this.dialog.open(DialogoGenerico, {
                data: {
                  tipo: 'informacion',
                  mensaje: 'Administrador eliminado correctamente',
                  textoAceptar: 'Aceptar'
                }
              });
              this.cargarAdministradores();
            },
            error: (err) => {
              this.dialog.open(DialogoGenerico, {
                data: {
                  tipo: 'error',
                  mensaje: 'Error al eliminar el administrador: ' + (err.error?.detail || err.message),
                  textoAceptar: 'Aceptar'
                }
              });
            }
          });
      }
    });
  }

  onInfo(id: number) {
    this.adminService.obtenerAdministradorPorId(id).subscribe({
      next: (admin) => {
        this.dialog.open(DialogoGenerico, {
          width: '40vw',
          data: {
            tipo: 'informacion',
            titulo: 'Información del Administrador',
            mensaje: `
              ID: ${admin.id}
              Nombre: ${admin.nombre} ${admin.primer_apellido} ${admin.segundo_apellido}
              Correo: ${admin.correo}
              Teléfono: ${admin.telefono}
            `,
            textoAceptar: 'Cerrar'
          }
        });
      },
      error: (err) => {
        console.error('Error al obtener administrador:', err);
        this.dialog.open(DialogoGenerico, {
          data: {
            tipo: 'error',
            mensaje: 'Error al obtener la información del administrador',
            textoAceptar: 'Aceptar'
          }
        });
      }
    });
  }
}