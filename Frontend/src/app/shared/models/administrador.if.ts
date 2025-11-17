export interface AdministradorIf {
  id: number;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  correo: string;
  telefono: string;
}

export interface AdministradorCreate {
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  correo: string;
  telefono: string;
  clave: string;
}

export interface AdministradorUpdate {
  nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  correo?: string;
  telefono?: string;
}