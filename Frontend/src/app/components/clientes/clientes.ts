import { AfterViewInit, Component, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ClienteServices } from '../../shared/services/cliente-services';
import { Clientes as iClientes } from '../../shared/models/clientes';
import { DialogoGenerico } from '../forms/dialogo-generico/dialogo-generico';
import { FormCliente } from '../forms/form-cliente/form-cliente';

@Component({
  selector: 'app-clientes',
  imports: [MatCardModule,
    MatTableModule,
    MatIconModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    FormsModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css'
})
export class Clientes implements AfterViewInit {
  private readonly svrCliente = inject(ClienteServices)
  private readonly dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  panelOpenState = signal(false);
  columnas: string[] = ['id', 'nombre', 'primer_apellido', 'segundo_apellido', 'correo', 'telefono', 'direccion', 'botonera'];

  dataSource = signal(new MatTableDataSource<iClientes>());
  filtro: any;

  paginaActual: number = 1;
  itemsPorPagina: number = 10;
  totalItems: number = 0;

  ngAfterViewInit(): void {
    this.filtrar();
  }

  limpiarFiltros() {
    //this.resetearFiltro();
    (document.querySelector('#fidUsuario') as HTMLInputElement).value = '';
    (document.querySelector('#fnombre') as HTMLInputElement).value = '';
    (document.querySelector('#fapellido1') as HTMLInputElement).value = '';
    (document.querySelector('#fapellido2') as HTMLInputElement).value = '';
  }

  onFiltroChange(f: any) {
    this.paginaActual = 1;
    this.filtro = f;
    this.filtrar();
  }

  onPageChange(event: PageEvent) {
    this.paginaActual = event.pageIndex + 1; // Material paginator es 0-indexed
    this.itemsPorPagina = event.pageSize;
    this.filtrar();
  }

  resetearFiltro() {
    this.filtro = { nombre: '', apellido1: '', apellido2: '' };
    this.filtrar();
  }

  filtrar() {
    this.svrCliente.filtrarClientes(this.paginaActual, this.itemsPorPagina, this.filtro).subscribe({
      next: (data: iClientes[]) => {
        const newDataSource = new MatTableDataSource<iClientes>(data);
        newDataSource.paginator = this.paginator;
        this.dataSource.set(newDataSource);
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        this.dialog.open(DialogoGenerico, {
          data: {
            tipo: 'error',
            mensaje: 'Error al cargar clientes',
            textoAceptar: 'Aceptar'
          }
        });
      }
    });
  }

  onNuevo() {
    const dialogRef = this.dialog.open(FormCliente, {
      width: '50vw',
      maxHeight: '90vh',
      data: {
        title: 'Nuevo Cliente'
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe({
      next: (res) => {
        if (res !== false) {
          this.filtrar();
        }
      },
      error: (err) => console.log(err)
    });
  }

  onEditar(id: number) {
    this.svrCliente.obtenerClientesPorId(id).subscribe({
      next: (data) => {
        const dialogRef = this.dialog.open(FormCliente, {
          width: '50vw',
          maxHeight: '90vh',
          data: {
            title: 'Editar Cliente',
            datos: data
          },
          disableClose: true
        });

        dialogRef.afterClosed().subscribe({
          next: (res) => {
            if (res !== false) {
              this.filtrar();
            }
          },
          error: (err) => console.log(err)
        });
      },
      error: (err) => {
        console.error('Error al obtener cliente:', err);
        this.dialog.open(DialogoGenerico, {
          data: {
            tipo: 'error',
            mensaje: 'Error al obtener los datos del cliente',
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
        mensaje: '¿Está seguro de que desea eliminar este cliente?',
        textoAceptar: 'Sí',
        textoCancelar: 'No'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.svrCliente.eliminarClientes(id)
          .subscribe({
            next: () => {
              this.dialog.open(DialogoGenerico, {
                data: {
                  tipo: 'informacion',
                  mensaje: 'Cliente eliminado correctamente',
                  textoAceptar: 'Aceptar'
                }
              });
              this.filtrar();
            },
            error: (err) => {
              this.dialog.open(DialogoGenerico, {
                data: {
                  tipo: 'error',
                  mensaje: 'Error al eliminar el cliente: ' + (err.error?.detail || err.message),
                  textoAceptar: 'Aceptar'
                }
              });
            }
          });
      }
    });
  }

  onInfo(id: number) {
    this.svrCliente.obtenerClientesPorId(id).subscribe({
      next: (admin) => {
        this.dialog.open(DialogoGenerico, {
          width: '40vw',
          data: {
            tipo: 'informacion',
            titulo: 'Información del Cliente',
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
        console.error('Error al obtener cliente:', err);
        this.dialog.open(DialogoGenerico, {
          data: {
            tipo: 'error',
            mensaje: 'Error al obtener la información del cliente',
            textoAceptar: 'Aceptar'
          }
        });
      }
    });
  }

}
