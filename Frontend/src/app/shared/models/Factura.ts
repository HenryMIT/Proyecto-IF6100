export interface Factura{
    id_Factura?: number;
    id_usuario: number;
    fecha: string;
    comentario: string;
    estado: string;
    total: number;
}

export interface FacturaUpdate{
    comentario: string;
    estado: string;
    total: number;
}