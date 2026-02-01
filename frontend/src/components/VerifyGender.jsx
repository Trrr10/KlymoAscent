
import React, { useEffect, useRef, useState } from "react";
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

  /* ---------- Load Models ---------- */
  useEffect(() => {
    const loadModels = async () => {
      try {
        const URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(URL),
          faceapi.nets.ageGenderNet.loadFromUri(URL),
        ]);
        setModelsLoaded(true);
        startCamera();
      } catch (err) {
        setError("AI Engine offline. Please check connection.");
      }
    };
    loadModels();
    return () => stopCamera();
  }, []);

  /* ---------- Camera Control ---------- */
  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Camera blocked. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
  };

  /* ---------- Face Detection Loop ---------- */
  const onPlay = () => {
    if (!canvasRef.current) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || captured) return;

      const det = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withAgeAndGender();

      if (!det) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        return;
      }

      setGender(det.gender);
      setConfidence(Math.round(det.genderProbability * 100));
      drawBox(det);
    }, 200);
  };

  const drawBox = (det) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const box = det.detection.box;
    ctx.strokeStyle = det.gender === "male" ? "#60a5fa" : "#f472b6";
    ctx.lineWidth = 6;
    ctx.setLineDash([10, 10]);
    ctx.strokeRect(box.x, box.y, box.width, box.height);
  };

  const handleCapture = () => {
    setCaptured(true);
    stopCamera();
  };

  const handleRetake = () => {
    setCaptured(false);
    setGender(null);
    setConfidence(0);
    setTimeout(() => startCamera(), 100);
  };

  // Theme logic based on detection
  const themeColor = !gender ? "indigo" : gender === "male" ? "blue" : "pink";

  return (
    <div className={`relative flex flex-col items-center justify-center p-8 backdrop-blur-2xl bg-white/80 transition-all duration-700 rounded-[2.5rem] shadow-[0_22px_70px_4px_rgba(0,0,0,0.1)] border border-white max-w-md mx-auto overflow-hidden`}>
      
      {/* Background Glow Decorations */}
      <div className={`absolute -top-24 -right-24 w-64 h-64 bg-${themeColor}-400/20 blur-[80px] rounded-full transition-colors duration-1000`}></div>
      <div className={`absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-400/10 blur-[80px] rounded-full`}></div>

      <div className="relative z-10 text-center mb-8">
        <div className="inline-block px-3 py-1 mb-3 text-[10px] font-bold tracking-widest text-white uppercase bg-indigo-500 rounded-full shadow-lg shadow-indigo-200">
          Identity Layer v2
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Biometric Verification</h2>
        <p className="text-sm font-medium text-slate-400 mt-2">Secure gender identification protocol</p>
      </div>

      {error && (
        <div className="relative z-10 mb-6 w-full p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 flex items-center gap-3 animate-shake">
          <span className="text-lg">⚠️</span> {error}
        </div>
      )}

      {/* Main Viewfinder Container */}
      <div className={`relative z-10 w-full aspect-square bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border-[6px] transition-colors duration-700 ${gender === 'male' ? 'border-blue-400/30' : gender === 'female' ? 'border-pink-400/30' : 'border-slate-800'}`}>
        {!captured ? (
          <>
            {!modelsLoaded && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm text-white">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
                  <div className="absolute w-10 h-10 border-b-4 border-white/20 rounded-full animate-spin-reverse"></div>
                </div>
                <p className="mt-6 text-xs font-black tracking-widest uppercase opacity-60">Encrypting Engine...</p>
              </div>
            )}
            
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onPlay={onPlay}
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" />
            
            {/* Cyberpunk Scan Effect */}
            <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                <div className={`w-full h-[20%] bg-gradient-to-b from-transparent via-${themeColor}-400/20 to-transparent absolute top-0 left-0 animate-scan`}></div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white animate-fadeIn">
            <div className={`relative w-28 h-28 rounded-3xl flex items-center justify-center mb-6 transition-transform duration-500 hover:scale-110 shadow-2xl ${gender === 'male' ? 'bg-blue-500 shadow-blue-500/40' : 'bg-pink-500 shadow-pink-500/40'}`}>
               <span className="text-5xl">✓</span>
            </div>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Protocol Success</p>
            <h3 className={`text-5xl font-black mt-2 tracking-tighter ${gender === 'male' ? 'text-blue-300' : 'text-pink-300'}`}>
                {gender?.toUpperCase()}
            </h3>
            <div className="mt-4 px-4 py-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold tracking-tighter uppercase">
                {confidence}% Accuracy Rating
            </div>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="relative z-10 h-14 flex items-center justify-center mt-6 w-full">
        {!captured && gender && (
          <div className={`flex items-center gap-3 px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-500 ${gender === 'male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current`}></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
            </span>
            {gender} detected / {confidence}% match
          </div>
        )}
      </div>

      {/* Action Hub */}
      <div className="relative z-10 w-full mt-4 flex flex-col gap-4">
        {!captured ? (
          <button
            disabled={confidence < 75}
            onClick={handleCapture}
            className={`group relative overflow-hidden w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all duration-300 ${
              confidence >= 75 
                ? "bg-slate-900 text-white shadow-2xl shadow-indigo-200 hover:translate-y-[-2px]" 
                : "bg-slate-100 text-slate-300 cursor-not-allowed"
            }`}
          >
            <span className="relative z-10">{confidence >= 75 ? "Submit Biometrics" : "Calibrating..."}</span>
            {confidence >= 75 && <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>}
          </button>
        ) : (
          <div className="flex gap-4 w-full animate-slideUp">
            <button
              onClick={handleRetake}
              className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
            >
              Recalibrate
            </button>
            <button
              onClick={() => onVerified({ gender })}
              className={`flex-1 py-5 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
                gender === 'male' ? 'bg-blue-600 shadow-blue-200 hover:bg-blue-700' : 'bg-pink-600 shadow-pink-200 hover:bg-pink-700'
              }`}
            >
              Verify identity
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(500%); }
        }
        .animate-scan {
          animation: scan 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-reverse {
          animation: spin-reverse 1.5s linear infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; filter: blur(10px); } to { opacity: 1; filter: blur(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
