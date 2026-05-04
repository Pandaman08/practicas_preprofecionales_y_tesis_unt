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
  PENDIENTE = 'PENDIENTE',
  EN_CURSO = 'EN_CURSO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
}

export enum EstadoTesis {
  PROPUESTA = 'PROPUESTA',
  EN_DESARROLLO = 'EN_DESARROLLO',
  OBSERVADA = 'OBSERVADA',
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
  EN_RENOVACION = 'EN_RENOVACION',
}

export enum TipoTesis {
  TESIS = 'TESIS',
  TRABAJO_SUFICIENCIA = 'TRABAJO_SUFICIENCIA',
  PROYECTO_INVESTIGACION = 'PROYECTO_INVESTIGACION',
}

// ========================
// Entidades
// ========================
export interface Usuario {
  id: number;
  email: string;
  nombres?: string;
  apellidos?: string;
  rol: Rol;
  activo: boolean;
  createdAt: string;
  perfil?: {
    id?: number;
    nombres?: string;
    apellidos?: string;
    razonSocial?: string;
  } | null;
}

export interface Estudiante {
  id: number;
  nombres: string;
  apellidos: string;
  codigo: string;
  dni: string;
  ciclo: number;
  especialidad: string;
  telefono?: string;
  direccion?: string;
  usuario: (Usuario & { id: number });
}

export interface Asesor {
  id: number;
  nombres: string;
  apellidos: string;
  especialidad: string;
  telefono?: string;
  usuario: (Usuario & { id: number });
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
  usuario?: (Usuario & { id: number });
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
  vacantes: number;
  fechaLimite?: string;
  activo: boolean;
  empresa: Empresa;
}

export interface Postulacion {
  id: number;
  estado: EstadoPostulacion;
  fechaPostulacion: string;
  cartaMotivacion?: string;
  archivoCv?: string;
  observaciones?: string;
  estudiante: Estudiante;
  oferta: Oferta;
  practica?: Pick<Practica, 'id' | 'estado' | 'titulo'>;
}

export interface Practica {
  id: number;
  titulo: string;
  fechaInicio: string;
  fechaFin?: string;
  horasTotales: number;
  estado: EstadoPractica;
  observaciones?: string;
  ofertaId?: number;
  postulacionId?: number;
  estudiante: Estudiante;
  empresa: Empresa;
  asesor?: Asesor;
  seguimientos?: Seguimiento[];
}

export interface Seguimiento {
  id: number;
  fecha: string;
  horasEjecutadas: number;
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
  fechaInicio?: string;
  fechaSustentacion?: string;
  estudiante: Estudiante;
  asesor?: Asesor;
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

export interface KpiItem {
  key: string;
  label: string;
  value: number;
  hint?: string;
}

export interface DashboardTrend {
  label: string;
  current: number;
  previous: number;
  delta: number;
  percent: number;
}

export interface DashboardResumen {
  role: Rol;
  title: string;
  kpis: KpiItem[];
  trend?: DashboardTrend;
  highlights: string[];
}

export interface DashboardAdminAnalytics {
  filters: {
    month: number | null;
    year: number | null;
    especialidad: string | null;
    estado: string | null;
  };
  kpis: {
    estudiantesTotal: number;
    asesoresTotal: number;
    empresasTotal: number;
    practicasActivas: number;
    practicasCompletadas: number;
    tesisEnProceso: number;
    tesisFinalizadas: number;
    ofertasActivas: number;
    postulacionesPendientes: number;
    postulacionesAceptadas: number;
    postulacionesRechazadas: number;
    rendimientoTesis: number;
  };
  charts: {
    monthlyTrend: Array<{ month: string; practicas: number; tesis: number }>;
    careerDistribution: Array<{ name: string; value: number }>;
    companyDistribution: Array<{ name: string; value: number }>;
    donutStatus: Array<{ name: string; value: number }>;
  };
  alerts: Array<{
    id: number;
    titulo: string;
    empresa: string;
    estudiante: string;
    fechaFin: string | Date | null;
  }>;
  quickAccess: Array<{ label: string; href: string }>;
  actionLog: Array<{
    id: string;
    modulo: string;
    accion: string;
    fecha: string | Date;
    descripcion: string;
  }>;
  generatedAt: string;
}
