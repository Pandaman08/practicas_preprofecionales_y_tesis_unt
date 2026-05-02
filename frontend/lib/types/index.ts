// ========================
// Enums
// ========================
export enum Rol {
  ADMIN = 'ADMIN',
  COORDINADOR = 'COORDINADOR',
  ASESOR = 'ASESOR',
  ESTUDIANTE = 'ESTUDIANTE',
  EMPRESA = 'EMPRESA',
}

export enum EstadoPractica {
  EN_PROCESO = 'EN_PROCESO',
  COMPLETADA = 'COMPLETADA',
  SUSPENDIDA = 'SUSPENDIDA',
}

export enum EstadoTesis {
  EN_PROCESO = 'EN_PROCESO',
  LISTA_SUSTENTACION = 'LISTA_SUSTENTACION',
  SUSTENTADA = 'SUSTENTADA',
  APROBADA = 'APROBADA',
}

export enum EstadoPostulacion {
  PENDIENTE = 'PENDIENTE',
  ACEPTADA = 'ACEPTADA',
  RECHAZADA = 'RECHAZADA',
}

export enum EstadoConvenio {
  ACTIVO = 'ACTIVO',
  VENCIDO = 'VENCIDO',
  SUSPENDIDO = 'SUSPENDIDO',
}

export enum TipoTesis {
  PREGRADO = 'PREGRADO',
  POSGRADO = 'POSGRADO',
}

// ========================
// Entidades
// ========================
export interface Usuario {
  id: number;
  email: string;
  nombres: string;
  apellidos: string;
  rol: Rol;
  activo: boolean;
  createdAt: string;
}

export interface Estudiante {
  id: number;
  codigo: string;
  dni: string;
  ciclo: number;
  especialidad: string;
  telefono?: string;
  direccion?: string;
  usuario: Usuario;
}

export interface Asesor {
  id: number;
  codigo: string;
  especialidad: string;
  telefono?: string;
  usuario: Usuario;
}

export interface Empresa {
  id: number;
  razonSocial: string;
  ruc: string;
  sector: string;
  direccion: string;
  telefono?: string;
  contactoNombre?: string;
  contactoEmail?: string;
  usuario?: Usuario;
  _count?: {
    ofertas: number;
    convenios: number;
  };
}

export interface Convenio {
  id: number;
  numero: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoConvenio;
  observaciones?: string;
  empresa: Empresa;
}

export interface Oferta {
  id: number;
  titulo: string;
  descripcion: string;
  requisitos: string;
  modalidad: string;
  remuneracion?: number;
  horasSemana: number;
  vacantes: number;
  fechaLimite: string;
  activo: boolean;
  empresa: Empresa;
}

export interface Postulacion {
  id: number;
  estado: EstadoPostulacion;
  fechaPostulacion: string;
  observaciones?: string;
  estudiante: Estudiante;
  oferta: Oferta;
}

export interface Practica {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  totalHoras: number;
  horasCompletadas: number;
  estado: EstadoPractica;
  observaciones?: string;
  estudiante: Estudiante;
  empresa: Empresa;
  asesor?: Asesor;
  seguimientos?: Seguimiento[];
}

export interface Seguimiento {
  id: number;
  fecha: string;
  horas: number;
  actividades: string;
  observaciones?: string;
  practicaId: number;
}

export interface Tesis {
  id: number;
  titulo: string;
  resumen?: string;
  tipo: TipoTesis;
  estado: EstadoTesis;
  fechaInicio: string;
  fechaSustentacion?: string;
  estudiante: Estudiante;
  asesor: Asesor;
  avances?: AvanceTesis[];
}

export interface AvanceTesis {
  id: number;
  fecha: string;
  porcentaje: number;
  descripcion: string;
  observaciones?: string;
  tesisId: number;
}

// ========================
// API Responses
// ========================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthResponse {
  access_token: string;
  user: Usuario;
}

export interface DashboardStats {
  estudiantes?: number;
  asesores?: number;
  empresas?: number;
  practicasActivas?: number;
  tesisEnProceso?: number;
  ofertasActivas?: number;
  postulacionesPendientes?: number;
  practicasCompletadas?: number;
  miasTesis?: number;
  conveniosActivos?: number;
  misOfertas?: number;
}
