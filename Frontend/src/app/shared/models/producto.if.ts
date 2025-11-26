export interface ProductoIf {
	id_Producto?: number;
	id_Categoria: number;
	descripcion: string;
	cantidad: number;
	descuento?: number;
	precio: number;
	imagen_producto?: string;
}

export interface CartProducto{
	id_Producto?: number;
	imagen: string,	
	descripcion:string,
	descuento?:number,
	precio:number
}

// Respuesta de creación de producto con imagen
export interface ProductoCreadoResponse {
	id: number;
	mensaje: string;
	imagen_url: string;
}

// Respuesta genérica de mensaje
export interface MensajeResponse {
	mensaje: string;
}
