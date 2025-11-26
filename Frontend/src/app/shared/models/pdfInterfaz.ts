export interface FacturaItemPdf {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface FacturaPdfData {
  numero: number | string;
  fecha: Date;
  clienteNombre: string;
  clienteCorreo?: string;
  clienteDireccion?: string;
  items: FacturaItemPdf[];
  subtotal: number;
  impuestos: number;
  total: number;
}