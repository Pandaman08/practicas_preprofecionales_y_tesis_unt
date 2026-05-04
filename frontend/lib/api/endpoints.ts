export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },

  // Usuarios
  USERS: {
    BASE: '/users',
    BY_ID: (id: number) => `/users/${id}`,
  },

  // Estudiantes
  ESTUDIANTES: {
    BASE: '/estudiantes',
    MI_PERFIL: '/estudiantes/mi-perfil',
    BY_ID: (id: number) => `/estudiantes/${id}`,
  },

  // Asesores
  ASESORES: {
    BASE: '/asesores',
    MI_PERFIL: '/asesores/mi-perfil',
    BY_ID: (id: number) => `/asesores/${id}`,
  },

  // Empresas
  EMPRESAS: {
    BASE: '/empresas',
    MI_PERFIL: '/empresas/mi-perfil',
    BY_ID: (id: number) => `/empresas/${id}`,
    CONVENIOS: (id: number) => `/empresas/${id}/convenios`,
  },

  // Ofertas
  OFERTAS: {
    BASE: '/ofertas',
    BY_ID: (id: number) => `/ofertas/${id}`,
    MIS_POSTULACIONES: '/ofertas/mis-postulaciones',
    POSTULAR: (id: number) => `/ofertas/${id}/postular`,
    POSTULACIONES: (id: number) => `/ofertas/${id}/postulaciones`,
    ESTADO_POSTULACION: (postId: number) => `/ofertas/postulaciones/${postId}/estado`,
  },

  // Prácticas
  PRACTICAS: {
    BASE: '/practicas',
    BY_ID: (id: number) => `/practicas/${id}`,
    SEGUIMIENTOS: (id: number) => `/practicas/${id}/seguimientos`,
    SEGUIMIENTO_BY_ID: (segId: number) => `/practicas/seguimientos/${segId}`,
  },

  // Tesis
  TESIS: {
    BASE: '/tesis',
    BY_ID: (id: number) => `/tesis/${id}`,
    AVANCES: (id: number) => `/tesis/${id}/avances`,
    AVANCE_BY_ID: (avanceId: number) => `/tesis/avances/${avanceId}`,
  },

  // Dashboard
  DASHBOARD: {
    STATS: '/dashboard/stats',
    MI_RESUMEN: '/dashboard/mi-resumen',
    ADMIN_ANALYTICS: '/dashboard/admin-analytics',
  },

  // Reportes
  REPORTES: {
    PRACTICAS: '/reportes/practicas',
    TESIS: '/reportes/tesis',
    EMPRESAS: '/reportes/empresas',
  },
};
