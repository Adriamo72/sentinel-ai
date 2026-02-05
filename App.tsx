import React, { useState, useRef, useCallback } from 'react';
import { Shield, AlertCircle, Lock } from 'lucide-react';
import { setupAcousticSurveillance } from './services/geminiService';
import { ForensicService } from './services/forensicService';
import CameraView from './components/CameraView';

const App: React.FC = () => {
  const [incidenteEnCurso, setIncidenteEnCurso] = useState(false);
  const [trustEmail, setTrustEmail] = useState("");
  const cameraRef = useRef<any>(null);
  const incidenteRef = useRef(false);

  // Acción cuando la IA o el usuario detectan el robo
  const dispararTrampa = useCallback(async () => {
    if (!incidenteRef.current) return;
    if (cameraRef.current?.takeSnapshot) {
      const selfie = cameraRef.current.takeSnapshot();
      await ForensicService.sendEmailReport(trustEmail, selfie, "Zona Almagro");
    }
    // Persuasión
    const msg = new SpeechSynthesisUtterance("Protocolo Sentinel. Rostro capturado.");
    msg.lang = 'es-AR';
    window.speechSynthesis.speak(msg);
    
    incidenteRef.current = false;
    setIncidenteEnCurso(false);
  }, [trustEmail]);

  // EL DISPARADOR DE GUARDIA
  const armarPerimetro = async () => {
  try {
    // 1. ARRANQUE DEL MOTOR DE AUDIO (Crucial para Android)
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    
    // Si el contexto está suspendido (común en Chrome Android), lo despertamos
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    // 2. PETICIÓN DE FLUJO (Stream)
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      } 
    });

    console.log("⚓ SISTEMA ACOPLADO: AudioContext activo y Stream recibido.");

    // 3. CONEXIÓN CON IA GEMINI
    const sentinelIA = await setupAcousticSurveillance(
      (alert) => {
        if (alert.alerta_activa) {
          incidenteRef.current = true;
          setIncidenteEnCurso(true);
        }
      },
      (text) => console.log("Radar:", text)
    );

    // 4. MOTOR DE RECONOCIMIENTO (Usando la API nativa del sistema)
    const SpeechConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-AR';

    recognition.onresult = (event: any) => {
      const text = event.results[event.results.length - 1][0].transcript;
      sentinelIA.analyzeText(text);
    };

    recognition.start();
    
    // Mantener una referencia al stream para que no se apague
    (window as any).activeStream = stream;

  } catch (err: any) {
    console.error("Fallo de hardware:", err);
    alert(`⚠️ FALLO TÁCTICO: ${err.message}. Verifique que ninguna otra app (WhatsApp/Google Assistant) esté usando el micro.`);
  }
};

  return (
    <div className="h-screen bg-black text-green-500 font-mono p-4 flex flex-col">
      <div className="border-b border-green-900 pb-2 mb-4 flex justify-between items-center text-[10px]">
        <span>SENTINEL TACTICAL HUD</span>
        <Shield className={incidenteEnCurso ? "text-red-500 animate-pulse" : "text-green-800"} />
      </div>

      <div className="flex-1 bg-zinc-950 border border-green-900 rounded relative overflow-hidden" onClick={dispararTrampa}>
       
        {incidenteEnCurso && (
          <div className="absolute inset-0 bg-red-900/20 flex flex-col items-center justify-center">
            <AlertCircle size={40} className="text-red-500 animate-bounce" />
            <p className="text-red-500 font-black text-xs uppercase mt-2">Trampa Armada</p>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <input 
          type="email" placeholder="EMAIL_RESPALDO" 
          className="w-full bg-zinc-900 border border-green-900 p-3 text-[10px] text-green-400"
          onChange={(e) => setTrustEmail(e.target.value)}
        />
        <button 
          onClick={armarPerimetro}
          className="w-full border-2 border-green-600 py-4 text-xs font-black hover:bg-green-600 hover:text-black uppercase"
        >
          Armar Perímetro de Guardia
        </button>
      </div>
    </div>
  );
};

export default App;