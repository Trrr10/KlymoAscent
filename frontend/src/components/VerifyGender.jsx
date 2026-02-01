import { useEffect, useRef, useState } from "react";

export default function VerifyGender({ onVerified }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoRef.current.srcObject = stream;
    });
  }, []);

  const capture = async () => {
    setLoading(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    // simulate API
    setTimeout(() => {
      const result = Math.random() > 0.5 ? "Male" : "Female";
      console.log("Gender verified:", result);
      setLoading(false);
      onVerified(result);
    }, 1500);
  };

  return (
    <div>
      <h2>Live Gender Verification</h2>
      <video ref={videoRef} autoPlay playsInline />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <button onClick={capture} disabled={loading}>
        {loading ? "Verifying..." : "Capture & Verify"}
      </button>
    </div>
  );
}

