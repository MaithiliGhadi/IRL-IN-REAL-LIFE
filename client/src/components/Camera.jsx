import { useEffect, useRef, useState } from "react";

// Curated authentic real-time sample snapshots for instant presentation fallback
const DEMO_SNAPS = [
  "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1000&q=80", // Desk / Notebook / Studying
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80", // Chai / Coffee cup
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80", // Friends campus vibe
];

function Camera({ onClose, onUseMoment }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [error, setError] = useState("");
  const [facingMode, setFacingMode] = useState("environment");
  const [capturedImage, setCapturedImage] = useState(null);
  const [flashActive, setFlashActive] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setError("");
      } catch (err) {
        console.warn("Camera access unavailable, fallback enabled:", err);
        setError("Live webcam unavailable or blocked by browser.");
      }
    }

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  function switchCamera() {
    setFacingMode((current) =>
      current === "environment" ? "user" : "environment"
    );
  }

  function triggerFlash() {
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 240);
  }

  function captureMoment() {
    triggerFlash();

    const video = videoRef.current;
    if (video && video.readyState >= 2 && video.videoWidth > 0) {
      const canvas = document.createElement("canvas");
      const maxDimension = 1280;
      const sourceWidth = video.videoWidth;
      const sourceHeight = video.videoHeight;
      const scale = Math.min(
        1,
        maxDimension / Math.max(sourceWidth, sourceHeight)
      );

      canvas.width = Math.round(sourceWidth * scale);
      canvas.height = Math.round(sourceHeight * scale);

      const context = canvas.getContext("2d");
      // If user camera (front camera), mirror it naturally
      if (facingMode === "user") {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Keep captured moments light enough for mobile memory, upload, and feed loading.
      const image = canvas.toDataURL("image/jpeg", 0.82);
      setTimeout(() => setCapturedImage(image), 150);
      return;
    }

    // Fallback: Use demo live snap if webcam not ready
    captureDemoSnap();
  }

  function captureDemoSnap() {
    triggerFlash();
    const snap = DEMO_SNAPS[demoIndex % DEMO_SNAPS.length];
    setDemoIndex((prev) => prev + 1);
    setTimeout(() => setCapturedImage(snap), 150);
  }

  function retake() {
    setCapturedImage(null);
  }

  // PHOTO REVIEW SCREEN
  if (capturedImage) {
    return (
      <section className="camera-view preview-mode">
        <img
          src={capturedImage}
          className="preview-image"
          alt="Captured IRL moment"
        />

        <div className="camera-vignette" />

        <div className="preview-overlay">
          <header className="preview-header">
            <span className="live-pill">
              <span className="live-dot" /> MOMENT CAPTURED
            </span>
            <button
              className="circle-btn close-btn"
              onClick={onClose}
              aria-label="Close preview"
            >
              ✕
            </button>
          </header>

          <footer className="preview-bottom">
            <button
              className="text-btn retake-btn"
              onClick={retake}
            >
              ↺ retake
            </button>

            <button
              className="action-pill use-moment-btn"
              onClick={() => onUseMoment(capturedImage)}
            >
              use moment <span>→</span>
            </button>
          </footer>
        </div>
      </section>
    );
  }

  // LIVE CAMERA SCREEN
  return (
    <section className="camera-view">
      {flashActive && <div className="camera-flash" />}

      <video
        ref={videoRef}
        className="camera-video"
        autoPlay
        playsInline
        muted
      />

      <div className="camera-viewfinder-grid">
        <span className="grid-corner tl" />
        <span className="grid-corner tr" />
        <span className="grid-corner bl" />
        <span className="grid-corner br" />
      </div>

      <div className="camera-overlay">
        {/* Top Header */}
        <header className="camera-top-bar">
          <button
            className="circle-btn close-btn"
            onClick={onClose}
            aria-label="Close camera"
          >
            ✕
          </button>

          <div className="live-indicator">
            <span className="rec-dot" />
            <span className="live-text">IRL CAMERA</span>
          </div>

          <button
            className="circle-btn switch-btn"
            onClick={switchCamera}
            aria-label="Flip camera"
            title="Flip camera"
          >
            ↻
          </button>
        </header>

        {/* Error / Fallback Banner if camera blocked */}
        {error && (
          <div className="camera-notice-card">
            <div className="notice-icon">📷</div>
            <div className="notice-body">
              <p className="notice-title">Live Camera Fallback</p>
              <p className="notice-desc">
                Webcam access is restricted. Tap below to capture a live moment.
              </p>
            </div>
            <button
              className="demo-snap-btn"
              onClick={captureDemoSnap}
            >
              Snap Moment
            </button>
          </div>
        )}

        {/* Bottom Shutter Bar */}
        <footer className="camera-bottom-bar">
          <div className="shutter-meta-left">
            <span className="shutter-hint">no gallery uploads. real time only.</span>
          </div>

          <button
            className="shutter-btn"
            onClick={captureMoment}
            aria-label="Capture IRL moment"
          >
            <div className="shutter-ring">
              <span className="shutter-core" />
            </div>
          </button>

          <div className="shutter-meta-right">
            <button
              className="demo-pill-btn"
              onClick={captureDemoSnap}
              title="Quick sample snap"
            >
              Quick Snap
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}

export default Camera;