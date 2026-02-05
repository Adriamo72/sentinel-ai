
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Radio, ShieldAlert, Lock, CloudUpload, CheckCircle } from 'lucide-react';
import { setupAcousticSurveillance } from '../services/geminiService';
import { ForensicService } from '../services/forensicService';
import { SecurityAlert } from '../types';

interface Props {
  onAlert: (alert: SecurityAlert) => void;
}

const SAMPLE_RATE = 16000;
const BUFFER_SECONDS = 30;
const TOTAL_SAMPLES = SAMPLE_RATE * BUFFER_SECONDS;

const AcousticMonitor: React.FC<Props> = ({ onAlert }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [forensicStatus, setForensicStatus] = useState<'idle' | 'encrypting' | 'uploading' | 'secured'>('idle');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  
  // Rolling circular buffer for forensics
  const forensicBufferRef = useRef<Float32Array>(new Float32Array(TOTAL_SAMPLES));
  const bufferIndexRef = useRef<number>(0);

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const handleForensicCapture = useCallback(async () => {
    setForensicStatus('encrypting');
    
    // Create a copy of the buffer in chronological order
    const orderedBuffer = new Float32Array(TOTAL_SAMPLES);
    const start = bufferIndexRef.current;
    
    orderedBuffer.set(forensicBufferRef.current.slice(start));
    orderedBuffer.set(forensicBufferRef.current.slice(0, start), TOTAL_SAMPLES - start);

    try {
      const encrypted = await ForensicService.encryptAudio(orderedBuffer);
      setForensicStatus('uploading');
      await ForensicService.transmitForensicData(encrypted);
      setForensicStatus('secured');
      setTimeout(() => setForensicStatus('idle'), 5000);
    } catch (err) {
      console.error("Forensic transmission failed:", err);
      setForensicStatus('idle');
    }
  }, []);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtxRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
      
      const sessionPromise = setupAcousticSurveillance(
        (alert) => {
          onAlert(alert);
          if (alert.tipo_incidente === 'robo') {
            setIsCritical(true);
            handleForensicCapture();
          }
        }, 
        (text) => {
          setTranscription(text);
          if (text.toLowerCase().includes("bolso") || text.toLowerCase().includes("soltame") || text.toLowerCase().includes("ayuda")) {
            setIsCritical(true);
          }
        }
      );

      sessionPromiseRef.current = sessionPromise;
      const session = await sessionPromise;

      const source = audioCtxRef.current.createMediaStreamSource(stream);
      const scriptProcessor = audioCtxRef.current.createScriptProcessor(4096, 1, 1);
      
      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Fill rolling buffer
        for (let i = 0; i < inputData.length; i++) {
          forensicBufferRef.current[bufferIndexRef.current] = inputData[i];
          bufferIndexRef.current = (bufferIndexRef.current + 1) % TOTAL_SAMPLES;
        }

        const int16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          int16[i] = inputData[i] * 32768;
        }
        
        const base64 = encode(new Uint8Array(int16.buffer));
        
        sessionPromiseRef.current?.then((activeSession) => {
          activeSession.sendRealtimeInput({ 
            media: { data: base64, mimeType: 'audio/pcm;rate=16000' } 
          });
        });
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(audioCtxRef.current.destination);
      setIsActive(true);
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const stopMonitoring = () => {
    sessionPromiseRef.current?.then(s => s.close());
    audioCtxRef.current?.close();
    setIsActive(false);
    setIsCritical(false);
    setForensicStatus('idle');
  };

  return (
    <div className={`bg-slate-900 border ${isCritical ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'border-slate-800'} rounded-2xl p-4 flex flex-col gap-3 transition-all duration-500`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isActive ? (isCritical ? 'bg-red-600 animate-pulse' : 'bg-green-600') : 'bg-slate-800'}`}>
            <Mic size={16} className="text-white" />
          </div>
          <div>
             <span className={`text-[10px] font-bold block leading-none uppercase tracking-widest ${isCritical ? 'text-red-400' : 'text-slate-400'}`}>
               {isCritical ? 'THREAT ACTIVE' : 'Acoustic Guard'}
             </span>
             <span className="text-[8px] text-slate-500 font-mono">30S ROLLING BUFFER ACTIVE</span>
          </div>
        </div>
        <button 
          onClick={isActive ? stopMonitoring : startMonitoring}
          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${isActive ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          {isActive ? 'SHUTDOWN' : 'INITIALIZE'}
        </button>
      </div>

      {forensicStatus !== 'idle' && (
        <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-3 flex flex-col gap-2 animate-pulse">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Lock size={12} className="text-red-500" />
                 <span className="text-[10px] font-bold text-red-400">SECURE EXFILTRATION PROTOCOL</span>
              </div>
              <div className="text-[9px] font-mono text-red-500">AES-256-GCM</div>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                 <div 
                    className={`h-full bg-red-500 transition-all duration-500 ${forensicStatus === 'encrypting' ? 'w-1/3' : forensicStatus === 'uploading' ? 'w-2/3' : 'w-full'}`}
                 />
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">
                {forensicStatus === 'encrypting' ? 'Encrypting...' : forensicStatus === 'uploading' ? 'Uploading...' : 'Secured'}
              </span>
           </div>
        </div>
      )}

      <div className={`h-12 bg-slate-950 rounded-lg border ${isCritical ? 'border-red-900' : 'border-slate-800'} flex items-center justify-center relative overflow-hidden`}>
        {isActive ? (
          <div className="flex gap-1 items-end h-6">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className={`w-1 rounded-full animate-bounce ${isCritical ? 'bg-red-500' : 'bg-green-500'}`} 
                style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.05}s` }}
              ></div>
            ))}
          </div>
        ) : (
          <span className="text-[9px] text-slate-600 font-mono tracking-tighter uppercase">SENSOR OFFLINE</span>
        )}
      </div>

      {transcription && (
        <div className={`mt-2 p-2 rounded border transition-colors ${isCritical ? 'bg-red-950/30 border-red-500/50' : 'bg-slate-950/50 border-slate-800/50'}`}>
          <div className="flex items-center gap-2 mb-1">
             <ShieldAlert size={12} className={isCritical ? 'text-red-500' : 'text-slate-500'} />
             <span className="text-[8px] font-bold uppercase text-slate-500">Signal Intelligence</span>
             {forensicStatus === 'secured' && <CheckCircle size={10} className="text-green-500 ml-auto" />}
          </div>
          <p className={`text-[11px] font-mono italic leading-tight ${isCritical ? 'text-red-400 font-bold' : 'text-blue-400'}`}>
            "{transcription}"
          </p>
        </div>
      )}
    </div>
  );
};

export default AcousticMonitor;
