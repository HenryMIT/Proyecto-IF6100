import { Component, inject, OnInit, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Productos } from '../../../shared/services/productos';
import { CategoriasService } from '../../../shared/services/categorias';
import { CategoriaIf } from '../../../shared/models/categoria.if';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-form-producto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatSelectModule],
  styleUrls: ['./form-producto.css'],
  templateUrl: './form-producto.html'
})
export class FormProductoComponent implements OnInit {
  productoForm: FormGroup;
  enviando = false;
  mensajeExito = '';
  mensajeError = '';
  esEdicion = false;
  idProducto?: number;
  categorias: CategoriaIf[] = [];

  selectedFile: File | null = null;
  imagePreview: string | null = null;

  private fb = inject(FormBuilder);
  private productosService = inject(Productos);
  private categoriasService = inject(CategoriasService);

  constructor(
    @Optional() public dialogRef: MatDialogRef<FormProductoComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.productoForm = this.fb.group({
      descripcion: ['', [Validators.required, Validators.minLength(2)]],
      id_Categoria: ['', Validators.required],
      cantidad: ['', [Validators.required, Validators.min(1)]],
      precio: ['', [Validators.required, Validators.min(0)]],
      descuento: ['', [Validators.min(0)]]
    });

    // Si hay datos, es edición
    if (data?.datos) {
      this.esEdicion = true;
      this.idProducto = data.datos.id_Producto;
      this.productoForm.patchValue({
        descripcion: data.datos.descripcion,
        id_Categoria: data.datos.id_Categoria,
        cantidad: data.datos.cantidad,
        precio: data.datos.precio,
        descuento: data.datos.descuento || ''
      });
      if (data.datos.imagen_producto) {
        // Convertir la ruta relativa a URL completa
        this.imagePreview = this.getImageUrl(data.datos.imagen_producto);
      }
    }
  }

  getImageUrl(relativePath: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return 'http://localhost:8000' + relativePath;
  }
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = e => this.imagePreview = reader.result as string;
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.selectedFile = event.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = e => this.imagePreview = reader.result as string;
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  ngOnInit() {
    // Cargar categorías
    this.categoriasService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
      },
      error: (err) => console.log(err)
    });
  }

  onSubmit() {
    if (this.esEdicion) {
      // Modo edición
      if (this.productoForm.valid) {
        this.enviando = true;
        this.mensajeError = '';
        this.mensajeExito = '';

        const formValue = this.productoForm.value;
        const dataToUpdate: any = {
          descripcion: formValue.descripcion,
          id_Categoria: formValue.id_Categoria,
          cantidad: formValue.cantidad,
          precio: formValue.precio,
          descuento: formValue.descuento || 0
        };

        // Si el usuario seleccionó una nueva imagen
        if (this.selectedFile) {
          // Primero actualizar la imagen
          this.productosService.actualizarImagenProducto(this.idProducto!, this.selectedFile).subscribe({
            next: (response) => {
              // Agregar la nueva URL de la imagen a los datos
              dataToUpdate.imagen_producto = response.imagen_url;
              // Luego actualizar los datos con la nueva imagen
              this.actualizarDatosProducto(dataToUpdate);
            },
            error: () => {
              this.mensajeError = 'Error al actualizar la imagen';
              this.enviando = false;
            }
          });
        } else {
          // Si no hay nueva imagen, no incluir el campo imagen_producto
          // El backend mantendrá la imagen existente
          this.actualizarDatosProducto(dataToUpdate);
        }
      } else {
        this.markFormGroupTouched(this.productoForm);
      }
    } else {
      // Modo creación: requiere imagen
      if (this.productoForm.valid && this.selectedFile) {
        this.enviando = true;
        this.mensajeError = '';
        this.mensajeExito = '';

        const formValue = this.productoForm.value;
        const formData = new FormData();
        formData.append('descripcion', formValue.descripcion);
        formData.append('id_Categoria', formValue.id_Categoria);
        formData.append('cantidad', formValue.cantidad);
        formData.append('precio', formValue.precio);
        formData.append('descuento', formValue.descuento ?? '0');
        formData.append('imagen', this.selectedFile);

        this.productosService.crearProductoConImagen(formData).subscribe({
          next: () => {
            this.mensajeExito = 'Producto creado correctamente';
            this.enviando = false;
            setTimeout(() => {
              if (this.dialogRef) {
                this.dialogRef.close(true);
              } else {
                this.productoForm.reset();
                this.selectedFile = null;
                this.imagePreview = null;
              }
            }, 1500);
          },
          error: () => {
            this.mensajeError = 'Error al crear producto';
            this.enviando = false;
          }
        });
      } else {
        if (!this.selectedFile) {
          this.mensajeError = 'Debe seleccionar una imagen';
        }
        this.markFormGroupTouched(this.productoForm);
      }
    }
  }

  onCancelar() {
    if (this.dialogRef) {
      this.dialogRef.close(false);
    }
  }

  private actualizarDatosProducto(dataToUpdate: any) {
    this.productosService.actualizarProducto(this.idProducto!, dataToUpdate).subscribe({
      next: () => {
        this.mensajeExito = 'Producto actualizado correctamente';
        this.enviando = false;
        setTimeout(() => {
          if (this.dialogRef) {
            this.dialogRef.close(true);
          }
        }, 1500);
      },
      error: () => {
        this.mensajeError = 'Error al actualizar producto';
        this.enviando = false;
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.productoForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getFieldError(field: string): string {
    const control = this.productoForm.get(field);
    if (control?.errors) {
      if (control.errors['required']) {
        return `${field} es requerido`;
      }
      if (control.errors['min']) {
        return `${field} debe ser mayor o igual a ${control.errors['min'].min}`;
      }
      if (control.errors['minlength']) {
        return `${field} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }
}
