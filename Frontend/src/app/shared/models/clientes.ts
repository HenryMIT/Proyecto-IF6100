export interface Clientes {
    idCliente: number;
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    direccion: string;
}

export interface ClienteRegister {
    nombre: string;
    apellido1: string;
    apellido2: string;
    correo: string;
    telefono: string;
    direccion: string;
    clave: string;    
}