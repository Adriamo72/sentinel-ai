/**
 * SENTINEL AI - Protocolo de Tipos de Misión
 * Definición de estados de incidente, acciones de respuesta y estructuras de telemetría.
 */

export type IncidentType = 
  | 'robo' 
  | 'agresión' 
  | 'emergencia_medica' 
  | 'falsa_alarma' 
  | 'PHYSICAL_ARREBATO'
  | 'normal'        // Para estado de vigilancia sin novedad
  | 'ninguno';      // Estado base de inicialización

export type SuggestedAction = 
  | 'bloqueo_inmediato' 
  | 'monitoreo_silencioso' 
  | 'exfiltracion_forense'
  | 'activar_persuasion' // Nueva: Activa la voz de autoridad
  | 'ninguna'
  | 'none';              // Para compatibilidad con el catch de Gemini

export interface SecurityAlert {
  alerta_activa: boolean;
  nivel_confianza: number;
  tipo_incidente: IncidentType;
  accion_sugerida: SuggestedAction;
  descripcion?: string;  // Detalles técnicos (ej. "G-Force: 9.2")
  timestamp: string;
  evidence?: string;     // Transcripción o ID de ráfaga
  location?: string;     // Coordenadas del evento
}

export interface StatisticsData {
  time: string;
  confidence: number;
}

/**
 * Interfaz para el reporte que se envía por Email al contacto de confianza
 */
export interface ForensicReport {
  reportId: string;
  timestamp: string;
  location: string;
  selfieData: string;    // Base64
  audioContext?: string; // Transcripción de frases de estrés
}