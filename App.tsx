import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Shield, AlertCircle, Radio, Activity } from 'lucide-react';
import { setupAcousticSurveillance } from './services/geminiService';
import { ForensicService } from './services/forensicService';
import CameraView from './components/CameraView';

// Simulamos el plugin nativo si no estamos en entorno APK
const BackgroundMode = (window as any).BackgroundMode || {
  enable: () => console.log("BG Mode Standby"),
  on: (event: string, cb: Function) => console.log(`Event listener: ${event}`),
  setDefaults: (cfg: any) => console.log("BG Configured")
};

const App: React.FC = () => {
  const [incidenteEnCurso, setIncidenteEnCurso] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [trustEmail, setTrustEmail] = useState("");
  const cameraRef = useRef<any>(null);
  const incidenteRef = useRef(false);
  const recognitionRef = useRef<any>(null);

  // ACCIÓN FORENSE Y PERSUASIÓN
  const dispararTrampa = useCallback(async () => {
    if (!incidenteRef.current) return;
    if (cameraRef.current?.takeSnapshot) {
      const selfie = cameraRef.current.takeSnapshot();
      await ForensicService.sendEmailReport(trustEmail, selfie, "Almagro - Sector Táctico");
    }
    const msg = new SpeechSynthesisUtterance("Protocolo Sentinel. Rostro capturado. Evidencia enviada.");
    msg.lang = 'es-AR';
    window.speechSynthesis.speak(msg);
    
    incidenteRef.current = false;
    setIncidenteEnCurso(false);
  }, [trustEmail]);

  // BUCLE DE REPARACIÓN DE MICRÓFONO
  const iniciarGuardiaIA = useCallback(async () => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      (window as any).activeStream = stream;

      const sentinelIA = await setupAcousticSurveillance(
        (alert) => {
          if (alert.alerta_activa) {
            incidenteRef.current = true;
            setIncidenteEnCurso(true);
            dispararTrampa(); // Ejecución inmediata al detectar amenaza
          }
        },
        (text) => console.log("Sentinel Audio:", text)
      );

      const SpeechConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechConstructor) return;

      const recognition = new SpeechConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-AR';

      recognition.onresult = (event: any) => {
        const text = event.results[event.results.length - 1][0].transcript;
        sentinelIA.analyzeText(text);
      };

      // Si el micro se pierde (por una llamada), se reinicia solo al colgar
      recognition.onend = () => {
        if (incidenteRef.current === false && isActive) {
          setTimeout(iniciarGuardiaIA, 3000);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsActive(true);

    } catch (err: any) {
      console.error("Fallo de hardware:", err);
      // Reintento silencioso cada 5 segundos hasta que el micro se libere
      setTimeout(iniciarGuardiaIA, 5000);
    }
  }, [isActive, dispararTrampa]);

  // ACTIVACIÓN DEL MODO CENTINELA PERSISTENTE
  const armarPerimetro = async () => {
    BackgroundMode.enable();
    BackgroundMode.setDefaults({
      title: 'Sentinel Security Hub',
      text: 'Guardia activa en segundo plano',
      icon: 'ic_launcher',
      color: 'F53D3D',
      resume: true,
      hidden: false
    });

    await iniciarGuardiaIA();
  };

  return (
    <div className="h-screen bg-black text-green-500 font-mono p-4 flex flex-col overflow-hidden">
      <div className="border-b border-green-900 pb-2 mb-4 flex justify-between items-center text-[10px]">
        <div className="flex items-center gap-2">
          <Shield className={isActive ? "text-green-400 animate-pulse" : "text-zinc-800"} />
          <span className="tracking-widest">SENTINEL HUD v2.0</span>
        </div>
        <div className="flex items-center gap-2">
          <Radio size={12} className={isActive ? "text-red-500 animate-ping" : ""} />
          <span className="text-[8px]">{isActive ? "ON AIR" : "OFFLINE"}</span>
        </div>
      </div>

      <div 
        className={`flex-1 border rounded relative overflow-hidden transition-all duration-700 ${incidenteEnCurso ? 'border-red-600 shadow-[0_0_50px_rgba(255,0,0,0.3)]' : 'border-green-900'}`} 
        onClick={dispararTrampa}
      >
        <CameraView ref={cameraRef} onDetection={() => {}} isAnalyzing={false} setIsAnalyzing={() => {}} />
        
        {incidenteEnCurso && (
          <div className="absolute inset-0 bg-red-900/40 backdrop-blur-sm flex flex-col items-center justify-center">
            <AlertCircle size={60} className="text-red-500 animate-bounce" />
            <p className="text-red-500 font-black text-xl uppercase mt-4">Trampa Ejecutada</p>
            <p className="text-white text-[10px] animate-pulse">EXTRAYENDO EVIDENCIA...</p>
          </div>
        )}

        {!isActive && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-8 text-center">
            <p className="text-[10px] opacity-50">SISTEMA EN ESPERA. CONFIGURE EMAIL Y ARME PERÍMETRO.</p>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div className="relative">
          <input 
            type="email" placeholder="EMAIL_DE_RESPALDO@GMAIL.COM" 
            className="w-full bg-zinc-900 border border-green-900 p-4 text-[11px] text-green-400 focus:border-green-400 focus:outline-none transition-colors"
            onChange={(e) => setTrustEmail(e.target.value)}
          />
          <Activity size={14} className="absolute right-4 top-4 text-green-900" />
        </div>
        
        <button 
          onClick={armarPerimetro}
          disabled={isActive}
          className={`w-full py-5 text-sm font-black uppercase tracking-tighter transition-all ${isActive ? 'bg-zinc-900 text-zinc-700 border-zinc-800' : 'border-2 border-green-600 hover:bg-green-600 hover:text-black active:scale-95'}`}
        >
          {isActive ? 'Vigilancia Activa' : 'Iniciar Guardia Persistente'}
        </button>
      </div>
      
      <div className="mt-2 text-[8px] text-zinc-600 text-center uppercase tracking-widest">
        Protección Forense IA - Buenos Aires
      </div>
    </div>
  );
};

export default App;