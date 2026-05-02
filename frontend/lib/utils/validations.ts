import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  nombres: z.string().min(2, 'Requerido'),
  apellidos: z.string().min(2, 'Requerido'),
  codigo: z.string().min(5, 'Código requerido'),
  dni: z.string().length(8, 'DNI debe tener 8 dígitos'),
  ciclo: z.number().min(1).max(12),
  especialidad: z.string().min(3, 'Especialidad requerida'),
});

export const ofertaSchema = z.object({
  titulo: z.string().min(5, 'Título demasiado corto'),
  descripcion: z.string().min(10, 'Descripción requerida'),
  requisitos: z.string().min(5, 'Requisitos requeridos'),
  modalidad: z.string().min(1, 'Selecciona modalidad'),
  horasSemana: z.number().min(1).max(48),
  vacantes: z.number().min(1),
  fechaLimite: z.string().min(1, 'Fecha límite requerida'),
  remuneracion: z.number().optional(),
});

export const tesisSchema = z.object({
  titulo: z.string().min(10, 'Título demasiado corto'),
  resumen: z.string().optional(),
  tipo: z.enum(['PREGRADO', 'POSGRADO']),
  asesorId: z.number().min(1, 'Selecciona un asesor'),
  fechaInicio: z.string().min(1, 'Fecha de inicio requerida'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type OfertaFormData = z.infer<typeof ofertaSchema>;
export type TesisFormData = z.infer<typeof tesisSchema>;
