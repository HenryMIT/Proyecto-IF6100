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
  id: number;
  fecha_creacion?: Date;
  estado?: string;
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