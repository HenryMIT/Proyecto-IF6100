import { AfterViewInit, Component, inject, signal, ViewChild } from '@angular/core';
import { ProductoIf } from '../../shared/models/producto.if';
import { Productos as ProductosService } from '../../shared/services/productos';
import { CategoriasService } from '../../shared/services/categorias';
import { CategoriaIf } from '../../shared/models/categoria.if';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { DialogoGenerico } from '../forms/dialogo-generico/dialogo-generico';
import { FormProductoComponent } from '../forms/form-producto/form-producto';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatPaginator } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-productos',
  imports: [
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './productos.html',
  styleUrl: './productos.css'
})
export class ProductosComponent implements AfterViewInit {
  private readonly productosSrv = inject(ProductosService);
  private readonly dialog = inject(MatDialog);
  private readonly categoriasSrv = inject(CategoriasService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  panelOpenState = signal(false);
  columnas: string[] = ['id_Producto', 'descripcion', 'id_Categoria', 'cantidad', 'precio', 'descuento', 'imagen_producto', 'botonera'];
  filtro: any;
  categorias: CategoriaIf[] = [];
  categoriaSeleccionada: number | null = null;

  dataSource = signal(new MatTableDataSource<ProductoIf>());

  ngAfterViewInit(): void {
    this.filtro = { categoria: null, busqueda: '' };

    // Cargar categorías
    this.categoriasSrv.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
      },
      error: (err) => console.log(err)
    });

    this.cargarProductos();
  }

  onFiltroChange(f: any) {
    this.filtro = f;
    this.cargarProductos();
  }

  onCategoriaChange() {
    this.filtro.categoria = this.categoriaSeleccionada;
    this.cargarProductos();
  }

  limpiarFiltros() {
    this.restablecerFiltro();
    this.categoriaSeleccionada = null;
    (document.querySelector('#fBusqueda') as HTMLInputElement).value = '';
  }

  restablecerFiltro() {
    this.filtro = { categoria: null, busqueda: '' };
    this.cargarProductos();
  }

  cargarProductos() {
    this.productosSrv.getProductos(this.filtro.categoria, this.filtro.busqueda).subscribe({
      next: (data: ProductoIf[]) => {
        this.dataSource.set(new MatTableDataSource(data));
        if (this.paginator) {
          this.dataSource().paginator = this.paginator;
        }
      },
      error: (err) => console.log(err)
    });
  }

  onNuevo() {
    const dialogRef = this.dialog.open(FormProductoComponent, {
      width: '50vw',
      maxHeight: '90vh',
      data: {
        title: 'Nuevo Producto'
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe({
      next: (res) => {
        if (res !== false) {
          this.cargarProductos();
        }
      },
      error: (err) => console.log(err)
    });
  }

  onEditar(id: number) {
    this.productosSrv.getProducto(id).subscribe((data) => {
      const dialogRef = this.dialog.open(FormProductoComponent, {
        width: '50vw',
        maxHeight: '90vh',
        data: {
          title: 'Editar Producto',
          datos: data
        },
        disableClose: true
      });

      dialogRef.afterClosed().subscribe({
        next: (res) => {
          if (res !== false) {
            this.cargarProductos();
          }
        },
        error: (err) => console.log(err)
      });
    });
  }

  onEliminar(id: number) {
    const dialogRef = this.dialog.open(DialogoGenerico, {
      data: {
        tipo: 'confirmacion',
        mensaje: '¿Está seguro de que desea eliminar este producto?',
        textoAceptar: 'Sí',
        textoCancelar: 'No'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.productosSrv.eliminarProducto(id)
          .subscribe({
            next: () => {
              this.dialog.open(DialogoGenerico, {
                data: {
                  tipo: 'informacion',
                  mensaje: 'Producto eliminado correctamente',
                  textoAceptar: 'Aceptar'
                }
              });
              this.cargarProductos();
            },
            error: () => {
              this.dialog.open(DialogoGenerico, {
                data: {
                  tipo: 'error',
                  mensaje: 'Error al eliminar el producto',
                  textoAceptar: 'Aceptar'
                }
              });
            }
          });
      }
    });
  }

  onInfo(id: number) {
    this.productosSrv.getProducto(id).subscribe({
      next: (producto) => {
        this.dialog.open(DialogoGenerico, {
          width: '40vw',
          data: {
            tipo: 'informacion',
            titulo: 'Información del Producto',
            mensaje: `
              ID: ${producto.id_Producto}
              Descripción: ${producto.descripcion}
              Categoría: ${producto.id_Categoria}
              Cantidad: ${producto.cantidad}
              Precio: ₡${producto.precio}
              Descuento: ${producto.descuento || 0}%
            `,
            textoAceptar: 'Cerrar'
          }
        });
      },
      error: (err) => console.log(err)
    });
  }

  getImageUrl(relativePath: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return 'http://localhost:8000' + relativePath;
  }
}
