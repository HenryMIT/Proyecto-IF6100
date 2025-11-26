export interface Factura{
    id_Factura?: number;
    id_usuario: number;
    fecha: string;
    comentario: string;
    estado: string;
    total: number;
}

export interface CreateFactura{
    id_usuario: number;
    comentario: string;
}

export interface FacturaUpdate{
    comentario: string;
    estado: string;
    total: number;
}

export interface FacturaConDetalle{
    id_Factura: number;
    id_usuario: number;
    fecha: string;
    comentario: string;
    estado: string;
    total: number;
    usuario_correo: string;
    total_productos: number;
    total_items: number;
}      

export interface FacturaProducto{
    id_factura:number;
    id_producto:number;
    cantidad:number;
}