import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { AlertTriangle } from 'lucide-react';

const CameraView = forwardRef((_props, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useImperativeHandle(ref, () => ({
    takeSnapshot: () => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        }
      }
      return null;
    }
  }));

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user" }, 
          audio: false 
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setHasPermission(true);
      } catch (err) {
        setHasPermission(false);
      }
    }
    setupCamera();
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      {hasPermission === false ? (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 p-4">
          <AlertTriangle size={24} className="text-red-600 mr-2" />
          <span className="text-red-600 text-[10px] uppercase font-mono">Hardware Failure: Camera Access Denied</span>
        </div>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-40" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute top-2 left-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-red-600 animate-pulse rounded-full" />
            <span className="text-red-600 font-bold text-[8px] uppercase">Sentinel Optic Guard</span>
          </div>
        </>
      )}
    </div>
  );
});

export default CameraView;