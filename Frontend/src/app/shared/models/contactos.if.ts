// Interfaces para la entidad Contactos

// ==========================================
// INTERFACES DE CONTACTO
// ==========================================

// Interfaz para los datos del contacto que se envían al backend
export interface ContactoData {
  nombre: string;
  apellido: string;
  correo: string;
  mensaje: string;
  tipo: number;
}

// Interfaz para la respuesta del servidor al crear un contacto
export interface ContactoResponse {
  id: number;
  mensaje: string;
}

// Interfaz para el contacto completo (cuando se obtiene del backend)
export interface Contacto extends ContactoData {
  id_Mensaje: number;
  fecha_creacion?: string;
  estado?: boolean;
}

// Interfaz para la respuesta de listar contactos
export interface ContactosListResponse {
  contactos: Contacto[];
}

// Interfaz para la respuesta de búsqueda por estado
export interface ContactosPorEstadoResponse {
  estado_filtrado: boolean;
  descripcion: string;
  total_encontrados: number;
  contactos: Contacto[];
}

// Interfaz para la respuesta de búsqueda por correo
export interface ContactosPorCorreoResponse {
  filtro_aplicado: string;
  descripcion: string;
  total_encontrados: number;
  contactos: Contacto[];
}

// Interfaz para la respuesta de actualizar estado
export interface ActualizarEstadoResponse {
  id: number;
  nuevo_estado: boolean;
  mensaje: string;
  contactos_actualizados: number;
}

// Interfaz para la respuesta de eliminar contacto
export interface EliminarContactoResponse {
  id: number;
  mensaje: string;
  contactos_eliminados: number;
}

// ==========================================
// TIPOS DE CONSULTA
// ==========================================

// Enum para los tipos de consulta disponibles
export enum TipoConsulta {
  GENERAL = 1,
  SOPORTE_TECNICO_MANTENIMIENTO = 2,
  CITAS_INSPECCION = 3,
  PROYECTO_A_LA_MEDIDA = 4,
  OTROS = 5
}

// Interfaz para los tipos de consulta con descripción
export interface TipoConsultaInfo {
  id: number;
  nombre: string;
  descripcion: string;
}