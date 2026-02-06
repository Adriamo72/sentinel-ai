import React, { useState, useRef, useCallback } from 'react';
import { Shield, AlertCircle, Radio, Activity } from 'lucide-react';
import { setupAcousticSurveillance } from './services/geminiService';
import { ForensicService } from './services/forensicService';
import CameraView from './components/CameraView';

// Soporte para plugin nativo
const BackgroundMode = (window as any).BackgroundMode || (window as any).cordova?.plugins?.backgroundMode;

const App: React.FC = () => {
  const [incidenteEnCurso, setIncidenteEnCurso] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [trustEmail, setTrustEmail] = useState("");
  const cameraRef = useRef<any>(null);
  const incidenteRef = useRef(false);

  // ACCIÓN FORENSE Y PERSUASIÓN
  const dispararTrampa = useCallback(async () => {
    if (!incidenteRef.current) return;
    
    // Captura inmediata antes de la persuasión
    if (cameraRef.current?.takeSnapshot) {
      const selfie = cameraRef.current.takeSnapshot();
      if (selfie) {
        await ForensicService.sendEmailReport(trustEmail, selfie, "Almagro - Perímetro Activo");
      }
    }

    const msg = new SpeechSynthesisUtterance("Protocolo Sentinel. Evidencia exfiltrada.");
    msg.lang = 'es-AR';
    window.speechSynthesis.speak(msg);
    
    incidenteRef.current = false;
    setIncidenteEnCurso(false);
  }, [trustEmail]);

  // MOTOR DE AUDIO E IA
  const iniciarGuardiaIA = useCallback(async () => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      await navigator.mediaDevices.getUserMedia({ audio: true });

      const sentinelIA = await setupAcousticSurveillance(
        (alert) => {
          if (alert.alerta_activa) {
            incidenteRef.current = true;
            setIncidenteEnCurso(true);
            dispararTrampa(); 
          }
        },
        (text) => console.log("Radar:", text)
      );

      const SpeechConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-AR';

      recognition.onresult = (event: any) => {
        const text = event.results[event.results.length - 1][0].transcript;
        sentinelIA.analyzeText(text);
      };

      recognition.onend = () => { if (isActive) setTimeout(iniciarGuardiaIA, 3000); };
      recognition.start();
      setIsActive(true);

    } catch (err: any) {
      setTimeout(iniciarGuardiaIA, 5000);
    }
  }, [isActive, dispararTrampa]);

  const armarPerimetro = async () => {
    if (BackgroundMode) {
      BackgroundMode.enable();
      BackgroundMode.setDefaults({ title: 'Sentinel', text: 'Vigilancia Activa', hidden: false });
    }
    await iniciarGuardiaIA();
  };

  return (
    <div className="h-screen bg-black text-green-500 font-mono p-4 flex flex-col overflow-hidden">
      <div className="border-b border-green-900 pb-2 mb-4 flex justify-between items-center text-[10px]">
        <div className="flex items-center gap-2">
          <Shield className={isActive ? "text-green-400 animate-pulse" : "text-zinc-800"} />
          <span>SENTINEL TACTICAL HUD</span>
        </div>
        <Radio size={12} className={isActive ? "text-red-500 animate-ping" : ""} />
      </div>

      <div 
        className={`flex-1 border rounded relative overflow-hidden transition-all duration-700 ${incidenteEnCurso ? 'border-red-600' : 'border-green-900'}`} 
        onClick={dispararTrampa}
      >
        {/* CORRECCIÓN: Eliminamos las props que daban error de compilación */}
        <CameraView ref={cameraRef} /> 
        
        {incidenteEnCurso && (
          <div className="absolute inset-0 bg-red-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-center">
            <AlertCircle size={40} className="text-red-500 animate-bounce" />
            <p className="text-red-500 font-black text-xs mt-2 uppercase">Trampa Ejecutada</p>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <input 
          type="email" placeholder="EMAIL_DE_RESPALDO" 
          className="w-full bg-zinc-900 border border-green-900 p-4 text-[10px] text-green-400 focus:outline-none"
          onChange={(e) => setTrustEmail(e.target.value)}
        />
        <button 
          onClick={armarPerimetro}
          className={`w-full py-4 text-xs font-black uppercase border-2 ${isActive ? 'border-zinc-800 text-zinc-700' : 'border-green-600 hover:bg-green-600 hover:text-black'}`}
          disabled={isActive}
        >
          {isActive ? 'Vigilancia Activa' : 'Iniciar Guardia Persistente'}
        </button>
      </div>
    </div>
  );
};

export default App;