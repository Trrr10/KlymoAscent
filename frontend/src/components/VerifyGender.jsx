import React, { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";

export default function VerifyGender({ onVerified }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [gender, setGender] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [captured, setCaptured] = useState(false);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /* ---------- Load Models & Setup ---------- */
  useEffect(() => {
    const loadModels = async () => {
      try {
        const URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(URL),
          faceapi.nets.ageGenderNet.loadFromUri(URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(URL),
        ]);
        setModelsLoaded(true);
        startCamera();
      } catch (err) {
        setError("Neural link failed. Verify network connection.");
      }
    };
    loadModels();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
          facingMode: "user" 
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Hardware access denied. Camera permissions required.");
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
  };

  /* ---------- Face Detection Engine ---------- */
  const onPlay = () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    // Set internal canvas resolution to match video feed
    const displaySize = { 
      width: videoRef.current.videoWidth, 
      height: videoRef.current.videoHeight 
    };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || captured) return;

      setIsAnalyzing(true);
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withAgeAndGender();

      if (!detection) {
        clearOverlay();
        setConfidence(0);
        return;
      }

      const resizedDetection = faceapi.resizeResults(detection, displaySize);
      setGender(resizedDetection.gender);
      setConfidence(Math.round(resizedDetection.genderProbability * 100));
      drawBiometrics(resizedDetection);
    }, 150);
  };

  const clearOverlay = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const drawBiometrics = (det) => {
    const ctx = canvasRef.current.getContext("2d");
    const { x, y, width, height } = det.detection.box;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const activeColor = det.gender === "male" ? "#3b82f6" : "#ec4899";
    
    // Draw Corner Brackets (Cyberpunk Style)
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    
    // Top Left
    ctx.beginPath(); ctx.moveTo(x, y + 40); ctx.lineTo(x, y); ctx.lineTo(x + 40, y); ctx.stroke();
    // Top Right
    ctx.beginPath(); ctx.moveTo(x + width - 40, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + 40); ctx.stroke();
    // Bottom Left
    ctx.beginPath(); ctx.moveTo(x, y + height - 40); ctx.lineTo(x, y + height); ctx.lineTo(x + 40, y + height); ctx.stroke();
    // Bottom Right
    ctx.beginPath(); ctx.moveTo(x + width - 40, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width, y + height - 40); ctx.stroke();

    // Draw scanning text next to face
    ctx.fillStyle = activeColor;
    ctx.font = "bold 12px monospace";
    ctx.fillText(`ID_SCAN: ${det.gender.toUpperCase()}`, x, y - 15);
    ctx.fillText(`${Math.round(det.genderProbability * 100)}% CONF`, x + width - 70, y - 15);
  };

  const handleCapture = () => {
    setCaptured(true);
    stopCamera();
  };

  const themeColor = !gender ? "indigo" : gender === "male" ? "blue" : "pink";

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[700px] p-8 backdrop-blur-3xl bg-white/90 transition-all duration-1000 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-white/50 max-w-lg mx-auto overflow-hidden">
      
      {/* Dynamic Background Mesh */}
      <div className={`absolute top-[-10%] left-[-10%] w-[120%] h-[120%] pointer-events-none opacity-30 transition-colors duration-1000 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-from)_0%,_transparent_50%)] from-${themeColor}-200`}></div>
      
      {/* Header Section */}
      <div className="relative z-10 text-center mb-10">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 mb-4 text-[11px] font-black tracking-[0.2em] text-white uppercase rounded-full shadow-xl transition-all duration-500 bg-${themeColor}-600 shadow-${themeColor}-200`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          Biometric Interface v2.4
        </div>
        <h2 className="text-4xl font-[1000] text-slate-900 tracking-tight leading-none">Authentication</h2>
        <p className="text-[13px] font-bold text-slate-400 mt-3 uppercase tracking-widest opacity-80">Phase: Gender Identity Analysis</p>
      </div>

      {error && (
        <div className="relative z-20 mb-8 w-full p-5 bg-red-50/80 backdrop-blur-md text-red-600 text-[11px] font-black rounded-3xl border border-red-100 flex items-center gap-4 animate-shake shadow-lg shadow-red-100">
          <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shrink-0">!</div>
          {error}
        </div>
      )}

      {/* Main Scanner Viewport */}
      <div className={`relative z-10 w-full aspect-[4/5] bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl border-[8px] transition-all duration-700 ${gender === 'male' ? 'border-blue-500/20 shadow-blue-500/10' : gender === 'female' ? 'border-pink-500/20 shadow-pink-500/10' : 'border-slate-800'}`}>
        {!captured ? (
          <>
            {!modelsLoaded && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl">
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-[10px] font-black tracking-[0.4em] text-white uppercase animate-pulse">Initializing Neural Nets</p>
              </div>
            )}
            
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onPlay={onPlay}
              className="w-full h-full object-cover scale-x-[-1] opacity-80"
            />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none z-30 scale-x-[-1]" />
            
            {/* HUD Scanline Overlay */}
            <div className="absolute inset-0 z-40 pointer-events-none border-[1px] border-white/5 rounded-[2.5rem]">
              <div className={`w-full h-[3px] bg-${themeColor}-400/40 blur-sm absolute top-0 left-0 animate-scan`}></div>
              <div className="absolute bottom-6 left-6 font-mono text-[9px] text-white/40 space-y-1">
                <p>SYS.01: ACTIVE</p>
                <p>REF_HZ: 60.00</p>
                <p>LOC: 0x2441-A</p>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white animate-fadeIn">
            <div className={`relative w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-8 transition-all duration-700 scale-110 shadow-[0_0_50px_rgba(0,0,0,0.5)] ${gender === 'male' ? 'bg-blue-600 shadow-blue-600/50' : 'bg-pink-600 shadow-pink-600/50'}`}>
                <span className="text-6xl animate-bounce-short">✓</span>
            </div>
            <div className="text-center space-y-2">
              <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.5em]">System Confirmed</p>
              <h3 className={`text-6xl font-[1000] tracking-tighter transition-colors duration-500 ${gender === 'male' ? 'text-blue-400' : 'text-pink-400'}`}>
                  {gender?.toUpperCase()}
              </h3>
              <div className="inline-block px-5 py-2 mt-6 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10">
                <span className="text-[11px] font-bold tracking-widest uppercase opacity-60">Accuracy Rating: </span>
                <span className={`text-[11px] font-black ${gender === 'male' ? 'text-blue-400' : 'text-pink-400'}`}>{confidence}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Telemetry Row */}
      <div className="relative z-10 h-20 flex items-center justify-center mt-4 w-full">
        {!captured && gender ? (
          <div className={`group flex items-center gap-4 px-8 py-3 rounded-2xl font-black text-[12px] uppercase tracking-tighter transition-all duration-500 border ${gender === 'male' ? 'bg-blue-50/50 text-blue-700 border-blue-100' : 'bg-pink-50/50 text-pink-700 border-pink-100'}`}>
            <span className="opacity-40 tracking-[0.2em]">Telemetry:</span>
            <span>{gender} Detected</span>
            <span className="w-[1px] h-4 bg-current opacity-20"></span>
            <span className="font-mono">{confidence}% Match</span>
          </div>
        ) : (
           !captured && <p className="text-slate-300 text-[11px] font-black uppercase tracking-widest animate-pulse">Awaiting Facial Recognition...</p>
        )}
      </div>

      {/* Interactive CTA Hub */}
      <div className="relative z-10 w-full flex flex-col gap-4">
        {!captured ? (
          <button
            disabled={confidence < 85}
            onClick={handleCapture}
            className={`group relative overflow-hidden w-full py-6 rounded-[2rem] font-black text-[13px] uppercase tracking-[0.2em] transition-all duration-500 ${
              confidence >= 85 
                ? "bg-slate-950 text-white shadow-2xl shadow-indigo-300 hover:scale-[1.02] hover:-translate-y-1 active:scale-95" 
                : "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200"
            }`}
          >
            <span className="relative z-10">{confidence >= 85 ? "Confirm Biometrics" : `Calibration Required (${confidence}%)`}</span>
            {confidence >= 85 && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            )}
          </button>
        ) : (
          <div className="flex gap-4 w-full animate-slideUp">
            <button
              onClick={handleRetake}
              className="flex-1 py-6 bg-white border-2 border-slate-100 text-slate-800 rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
            >
              Re-Scan
            </button>
            <button
              onClick={() => onVerified({ gender })}
              className={`flex-1 py-6 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 hover:brightness-110 ${
                gender === 'male' ? 'bg-blue-600 shadow-blue-200' : 'bg-pink-600 shadow-pink-200'
              }`}
            >
              Finalize Identity
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-10%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(1200%); opacity: 0; }
        }
        .animate-scan { animation: scan 2.5s linear infinite; }
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-short { animation: bounce-short 2s ease-in-out infinite; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        .animate-fadeIn { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slideUp { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; filter: blur(20px); transform: scale(0.95); } to { opacity: 1; filter: blur(0); transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}