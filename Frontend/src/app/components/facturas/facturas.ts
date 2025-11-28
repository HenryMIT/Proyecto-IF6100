import { AfterViewInit, Component, inject, signal, ViewChild } from '@angular/core';
import { FacturaConDetalle } from '../../shared/models/Factura';
import { FacturaServices } from '../../shared/services/factura-services';
import { DialogService } from '../forms/dialogo-generico/dialog.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-facturas',
  imports: [MatCardModule, MatTableModule, MatIconModule, MatPaginatorModule, MatButtonModule, DatePipe, CurrencyPipe, MatExpansionModule, MatInputModule, MatFormFieldModule],
  templateUrl: './facturas.html',
  styleUrl: './facturas.css'
})
export class Facturas implements AfterViewInit {
  private readonly facturaSrv = inject(FacturaServices);
  private readonly dialogService = inject(DialogService);
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // PARA LA TABLA
  panelOpenState = signal(false);
  columnas: string[] = ['id_Factura', 'id_usuario', 'usuario_correo', 'fecha', 'estado', 'total_productos', 'total_items', 'total', 'comentario', 'botonera'];
  filtro: any;

  // signal para manejar los datos de la tabla de forma reactiva
  dataSource = signal(new MatTableDataSource<FacturaConDetalle>());

  // apenas se carga el componente, se carga la lista de facturas
  ngAfterViewInit(): void {
    this.filtro = { id_factura: '', correo: '', comentario: '' };
    this.cargarFacturas();
  }

  onFiltroChange(f: any) {
    this.filtro = f;
    this.buscarFacturasAvanzado();
  }

  limpiarFiltros() {
    this.filtro = { id_factura: '', correo: '', comentario: '' };
    (document.querySelector('#fid_factura') as HTMLInputElement).value = '';
    (document.querySelector('#fcorreo') as HTMLInputElement).value = '';
    (document.querySelector('#fcomentario') as HTMLInputElement).value = '';
    this.cargarFacturas();
  }

  // Método para cargar todas las facturas desde el servidor con resumen
  cargarFacturas() {
    this.facturaSrv.obtenerFacturas().subscribe({
      next: (data: any[]) => {
        const newDataSource = new MatTableDataSource<FacturaConDetalle>(data);
        newDataSource.paginator = this.paginator;
        this.dataSource.set(newDataSource);
      },
      error: (err) => console.log(err)
    });
  }

  // Método para buscar facturas usando el procedimiento avanzado
  buscarFacturasAvanzado() {
    // Construir parámetros y campos para la búsqueda
    const parametros: string[] = [];
    const campos: string[] = [];

    // Para campos numéricos, verificar que no sean vacíos
    if (this.filtro.id_factura && String(this.filtro.id_factura).trim() !== '') {
      parametros.push(String(this.filtro.id_factura));
      campos.push('id_Factura');
    }
    if (this.filtro.correo && this.filtro.correo.trim() !== '') {
      parametros.push(this.filtro.correo);
      campos.push('correo');
    }
    if (this.filtro.comentario && this.filtro.comentario.trim() !== '') {
      parametros.push(this.filtro.comentario);
      campos.push('comentario');
    }

    // Si no hay filtros, cargar todas las facturas
    if (parametros.length === 0) {
      this.cargarFacturas();
      return;
    }

    // Unir con & para el formato del procedimiento almacenado
    const parametrosStr = parametros.join('&');
    const camposStr = campos.join('&');

    

    this.facturaSrv.buscarFacturasAvanzado(parametrosStr, camposStr).subscribe({
      next: (data: any[]) => {
        const newDataSource = new MatTableDataSource<FacturaConDetalle>(data);
        newDataSource.paginator = this.paginator;
        this.dataSource.set(newDataSource);
      },
      error: (err) => {
        console.error('Error en búsqueda avanzada:', err);
      }
    });
  }

  // Método para filtrar por estado usando búsqueda avanzada
  onFiltrarPorEstado(estado: string) {
    this.facturaSrv.buscarFacturasAvanzado(estado, 'estado').subscribe({
      next: (data: any[]) => {
        // Filtrar en el frontend para distinguir exactamente entre ENTREGADO y NO ENTREGADO
        let resultadosFiltrados = data;
        if (estado === 'ENTREGADO') {
          // Solo facturas exactamente ENTREGADO (excluir NO ENTREGADO)
          resultadosFiltrados = data.filter((f: any) => f.estado === 'ENTREGADO');
        } else if (estado === 'NO ENTREGADO') {
          // Solo facturas exactamente NO ENTREGADO
          resultadosFiltrados = data.filter((f: any) => f.estado === 'NO ENTREGADO');
        }

        const newDataSource = new MatTableDataSource<FacturaConDetalle>(resultadosFiltrados);
        newDataSource.paginator = this.paginator;
        this.dataSource.set(newDataSource);
      },
      error: (err) => console.log(err)
    });
  }

  // Método para cambiar estado de la factura
  onCambiarEstado(id: number, estadoActual: string) {
    // Solo dos estados disponibles según la BD
    const nuevoEstado = estadoActual === 'ENTREGADO' ? 'NO ENTREGADO' : 'ENTREGADO';

    this.dialogService.confirmar(
      `¿Está seguro de que desea cambiar el estado de "${estadoActual}" a "${nuevoEstado}"?`,
      'Cambiar Estado'
    ).subscribe(resultado => {
      if (resultado) {
        this.facturaSrv.actualizarEstadoFactura(id, nuevoEstado).subscribe({
          next: (res) => {
           
            this.cargarFacturas(); // Recargar la tabla
            this.dialogService.informar(
              `Estado actualizado a: ${nuevoEstado}`,
              'Estado Actualizado'
            ).subscribe();
          },
          error: (err) => {
            console.log('Error al actualizar estado:', err);
            this.dialogService.error(
              'Error al actualizar el estado de la factura',
              'Error'
            ).subscribe();
          }
        });
      }
    });
  }

  // Método para eliminar factura
  onEliminar(id: number) {
    this.dialogService.confirmar(
      '¿Está seguro de que desea eliminar esta factura? Esta acción no se puede deshacer.',
      'Eliminar Factura'
    ).subscribe(resultado => {
      if (resultado) {
        this.facturaSrv.eliminarFactura(id).subscribe({
          next: (res) => {
    
            this.cargarFacturas(); // Recargar la tabla
            this.dialogService.informar(
              'Factura eliminada correctamente',
              'Factura Eliminada'
            ).subscribe();
          },
          error: (err) => {
            console.log('Error al eliminar factura:', err);
            this.dialogService.error(
              'Error al eliminar la factura',
              'Error'
            ).subscribe();
          }
        });
      }
    });
  }

  // Métodos auxiliares para mostrar información formateada
  getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'NO ENTREGADO': 'text-red-600 font-medium',
      'ENTREGADO': 'text-green-600 font-medium'
    };
    return clases[estado] || 'text-gray-600 font-medium';
  }

  getEstadoIcon(estado: string): string {
    const iconos: { [key: string]: string } = {
      'NO ENTREGADO': 'pending',
      'ENTREGADO': 'check_circle'
    };
    return iconos[estado] || 'help';
  }

  // Método para ver el detalle de la factura
 
  onVerDetalle(id: number) {
  this.facturaSrv.obtenerDetalleFactura(id).subscribe({
    next: (detalle: any[]) => {
      

      let mensaje = `DETALLE DE FACTURA #${id}\n\n`;

      if (!detalle || detalle.length === 0) {
        mensaje += 'Esta factura no tiene productos.';
      } else {
        // Encabezado tipo tabla
        const header =
          'PRODUCTO'.padEnd(28) +
          'CANT'.padStart(6) +
          'PRECIO'.padStart(14) +
          'DESC'.padStart(8) +
          'SUBTOTAL'.padStart(14);

        const separador = '─'.repeat(header.length);

        mensaje += header + '\n';
        mensaje += separador + '\n';

        let totalGeneral = 0;

        detalle.forEach((item: any) => {
          // Cortamos la descripción si es muy larga para que no rompa la tabla
          const desc = (item.producto_descripcion ?? '')
            .toString()
            .slice(0, 27)
            .padEnd(28);

          const cant = String(item.cantidad).padStart(6);

          const precio = (
            '₡' +
            Number(item.producto_precio).toLocaleString('es-CR', {
              minimumFractionDigits: 2,
            })
          ).padStart(14);

          const descuento = (item.producto_descuento + '%').padStart(8);

          const subtotalNum =
            item.subtotal ??
            item.cantidad *
              item.producto_precio *
              (1 - (item.producto_descuento || 0) / 100);

          const subtotal = (
            '₡' +
            Number(subtotalNum).toLocaleString('es-CR', {
              minimumFractionDigits: 2,
            })
          ).padStart(14);

          totalGeneral += subtotalNum;

          mensaje += desc + cant + precio + descuento + subtotal + '\n';
        });

        mensaje += separador + '\n';
        mensaje +=
          'TOTAL'.padEnd(56) +
          (
            '₡' +
            totalGeneral.toLocaleString('es-CR', { minimumFractionDigits: 2 })
          ).padStart(22);
      }

      this.dialogService.informar(mensaje, 'Detalle de Factura').subscribe();
    },
    error: (err) => {
      console.log('Error al obtener detalle:', err);
      this.dialogService
        .error('Error al obtener el detalle de la factura', 'Error')
        .subscribe();
    },
  });
}



}
