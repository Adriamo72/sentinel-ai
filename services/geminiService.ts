import { GoogleGenAI } from "@google/genai";
import { SecurityAlert, IncidentType, SuggestedAction } from "../types";

const API_KEY = "AIzaSyBdHnnPlJ_tlNPT1945mnndVKH6pxfSJJ4";
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const setupAcousticSurveillance = async (
  onAlert: (alert: SecurityAlert) => void,
  onTranscription: (text: string) => void
) => {
  // Usamos el modelo más rápido para evitar latencia en el robo
  const model = (ai as any).getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: "Eres Sentinel. Si el texto indica un robo o amenaza, responde JSON con alerta_activa: true. Si es normal, false." }] },
    ],
  });

  return {
    analyzeText: async (text: string) => {
      onTranscription(text);
      // Fast-Path de Almagro: Reacción inmediata
      const critical = ["dame", "celular", "todo", "perdiste", "entregá", "quemó"];
      if (critical.some(word => text.toLowerCase().includes(word))) {
        onAlert({
          alerta_activa: true,
          nivel_confianza: 0.99,
          tipo_incidente: 'robo' as IncidentType,
          accion_sugerida: 'exfiltracion_forense' as SuggestedAction,
          timestamp: new Date().toLocaleTimeString(),
        });
        return;
      }

      try {
        const result = await chat.sendMessage(text);
        const response = JSON.parse(result.response.text());
        if (response.alerta_activa) onAlert({ ...response, timestamp: new Date().toLocaleTimeString() });
      } catch (e) { console.error("IA Silenciada"); }
    }
  };
};