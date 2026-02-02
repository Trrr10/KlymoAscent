import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface CameraVerificationProps {
  onVerified: (gender: 'male' | 'female') => void;
  onSkip?: () => void;
}

export const CameraVerification = ({ onVerified, onSkip }: CameraVerificationProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('');

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please allow camera access to continue.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraReady(false);
    }
  }, [stream]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Mirror the image to match the preview
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0);

    // Get base64 with reduced quality for faster upload
    const imageData = canvas.toDataURL('image/jpeg', 0.7);
    setCapturedImage(imageData);
    stopCamera();
    setIsCapturing(false);
  }, [cameraReady, stopCamera]);

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    setError(null);
    setVerificationStatus('');
    startCamera();
  };

  // Verify gender using AI edge function
  const verifyGender = async () => {
    if (!capturedImage) return;

    setIsVerifying(true);
    setError(null);
    setVerificationStatus('Analyzing image with AI...');

    try {
      // Call the edge function
      const { data, error: fnError } = await supabase.functions.invoke('verify-gender', {
        body: { imageBase64: capturedImage }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Verification failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Verification failed');
      }

      if (!data.gender) {
        throw new Error(data.reason || 'Could not determine gender. Please try again with a clearer photo.');
      }

      setVerificationStatus(`Detected: ${data.gender}`);
      
      // Clear the image immediately after verification (privacy)
      setCapturedImage(null);
      
      // Small delay to show the result
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onVerified(data.gender as 'male' | 'female');
      
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
      setVerificationStatus('');
    } finally {
      setIsVerifying(false);
    }
  };

  // Initialize camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="glass-card p-6 w-full max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Camera className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-display font-bold gradient-text mb-2">
          AI Gender Verification
        </h2>
        <p className="text-muted-foreground text-sm">
          Take a live selfie. Our AI will verify your gender instantly.
        </p>
      </div>

      {/* Camera / Captured Image Display */}
      <div className="relative aspect-[4/3] bg-muted rounded-2xl overflow-hidden mb-6">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "w-full h-full object-cover scale-x-[-1]",
                !cameraReady && "opacity-0"
              )}
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">
                  Starting camera...
                </div>
              </div>
            )}
            <div className="camera-overlay" />
            
            {/* Face guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-60 border-2 border-dashed border-primary/50 rounded-[100px]" />
            </div>
          </>
        ) : (
          <div className="relative w-full h-full">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
            {isVerifying && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="w-8 h-8 text-primary mx-auto mb-2 animate-pulse" />
                  <p className="text-sm text-foreground">{verificationStatus}</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Verification Status */}
      {verificationStatus && !error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-primary/10 text-primary text-sm">
          <Sparkles className="w-4 h-4 flex-shrink-0 animate-pulse" />
          {verificationStatus}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {!capturedImage ? (
          <Button
            onClick={capturePhoto}
            disabled={!cameraReady || isCapturing}
            variant="hero"
            size="lg"
            className="w-full"
          >
            <Camera className="w-5 h-5" />
            Capture Photo
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              onClick={retakePhoto}
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={isVerifying}
            >
              <RefreshCw className="w-4 h-4" />
              Retake
            </Button>
            <Button
              onClick={verifyGender}
              variant="hero"
              size="lg"
              className="flex-1"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Verify with AI
                </>
              )}
            </Button>
          </div>
        )}

        {onSkip && (
          <Button
            onClick={onSkip}
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            disabled={isVerifying}
          >
            Skip for now
          </Button>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 p-3 rounded-lg bg-muted/30 border border-border/50">
        <p className="text-xs text-center text-muted-foreground">
          🔒 <span className="text-primary font-medium">Privacy First:</span> Your image is analyzed instantly by AI and immediately deleted. 
          We never store photos on our servers.
        </p>
      </div>
    </div>
  );
};
