import { useState, useRef, useEffect, useCallback } from "react";

/**
 * ProfilePhotoAdjuster
 * Instagram/WhatsApp-style interactive profile photo cropper:
 * - Touch & mouse pan/drag
 * - Pinch-to-zoom & smooth slider zoom
 * - 90° rotation & reset
 * - Exact circular crop rendered to 360x360 canvas
 */
function ProfilePhotoAdjuster({ imageSrc, onApply, onCancel }) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPanRef = useRef({ x: 0, y: 0 });
  const initialTouchDistanceRef = useRef(null);
  const initialTouchScaleRef = useRef(1);

  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // The circular viewport size
  const CROP_DIAMETER = 240;

  // Load natural dimensions of the image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      setImgNaturalSize({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
      // Center and reset on load
      setScale(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Compute base dimensions when fitting into the 240px circle
  const getRenderDimensions = useCallback(() => {
    const natW = imgNaturalSize.width || 240;
    const natH = imgNaturalSize.height || 240;

    // Minimum side covers the circle
    const baseScale = CROP_DIAMETER / Math.min(natW, natH);
    const renderW = natW * baseScale * scale;
    const renderH = natH * baseScale * scale;

    return { renderW, renderH, natW, natH };
  }, [imgNaturalSize, scale]);

  // Keep pan bounded inside the circle so there are no empty gaps
  const clampPan = useCallback(
    (newX, newY, currentScale = scale) => {
      const { renderW, renderH } = getRenderDimensions();
      const currentW = (renderW / scale) * currentScale;
      const currentH = (renderH / scale) * currentScale;

      const isRotated = rotation === 90 || rotation === 270;
      const visualW = isRotated ? currentH : currentW;
      const visualH = isRotated ? currentW : currentH;

      const maxX = Math.max(0, (visualW - CROP_DIAMETER) / 2);
      const maxY = Math.max(0, (visualH - CROP_DIAMETER) / 2);

      return {
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY)),
      };
    },
    [getRenderDimensions, rotation, scale]
  );

  // MOUSE & POINTER DRAG
  function handlePointerDown(e) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPanRef.current = { ...pan };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const candidateX = initialPanRef.current.x + dx;
    const candidateY = initialPanRef.current.y + dy;
    setPan(clampPan(candidateX, candidateY));
  }

  function handlePointerUp() {
    isDraggingRef.current = false;
  }

  // TOUCH GESTURES (Single finger drag + 2-finger pinch zoom)
  function handleTouchStart(e) {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      initialPanRef.current = { ...pan };
      initialTouchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      initialTouchDistanceRef.current = dist;
      initialTouchScaleRef.current = scale;
    }
  }

  function handleTouchMove(e) {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPan(clampPan(initialPanRef.current.x + dx, initialPanRef.current.y + dy));
    } else if (e.touches.length === 2 && initialTouchDistanceRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / initialTouchDistanceRef.current;
      const newScale = Math.max(1, Math.min(3, initialTouchScaleRef.current * ratio));
      setScale(newScale);
      setPan((prev) => clampPan(prev.x, prev.y, newScale));
    }
  }

  function handleTouchEnd(e) {
    if (e.touches.length < 2) {
      initialTouchDistanceRef.current = null;
    }
    if (e.touches.length === 0) {
      isDraggingRef.current = false;
    }
  }

  // Zoom slider change
  function handleScaleChange(e) {
    const newScale = parseFloat(e.target.value);
    setScale(newScale);
    setPan((prev) => clampPan(prev.x, prev.y, newScale));
  }

  // Rotate 90° clockwise
  function handleRotate() {
    setRotation((prev) => (prev + 90) % 360);
    setPan({ x: 0, y: 0 }); // Recenter on rotate
  }

  // Reset to original center & 1x zoom
  function handleReset() {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  }

  // RENDER FINAL CROP ONTO 360x360 CANVAS
  function handleConfirmCrop() {
    if (!imageSrc) {
      onCancel();
      return;
    }

    const natW = imgNaturalSize.width || imgRef.current?.naturalWidth || imgRef.current?.width || 0;
    const natH = imgNaturalSize.height || imgRef.current?.naturalHeight || imgRef.current?.height || 0;

    // Safety fallback: if natural dimensions aren't ready, apply source directly so photo is NEVER dropped
    if (!natW || !natH) {
      onApply(imageSrc);
      return;
    }

    const TARGET_SIZE = 360;
    const canvas = document.createElement("canvas");
    canvas.width = TARGET_SIZE;
    canvas.height = TARGET_SIZE;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      onApply(imageSrc);
      return;
    }

    // 1. Clip to circular path
    ctx.beginPath();
    ctx.arc(TARGET_SIZE / 2, TARGET_SIZE / 2, TARGET_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Fill background black/dark surface in case of transparent PNG
    ctx.fillStyle = "#16181f";
    ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);

    // 2. High quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // 3. Coordinate transform from 240px viewport to 360px target canvas
    const multiplier = TARGET_SIZE / CROP_DIAMETER;

    ctx.save();
    // Center of canvas
    ctx.translate(TARGET_SIZE / 2, TARGET_SIZE / 2);
    // User Pan (scaled to target canvas)
    ctx.translate(pan.x * multiplier, pan.y * multiplier);
    // Rotation
    ctx.rotate((rotation * Math.PI) / 180);

    const baseScale = CROP_DIAMETER / Math.min(natW, natH);
    const finalDrawW = natW * baseScale * scale * multiplier;
    const finalDrawH = natH * baseScale * scale * multiplier;

    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth) {
      ctx.drawImage(img, -finalDrawW / 2, -finalDrawH / 2, finalDrawW, finalDrawH);
    } else {
      const tempImg = new Image();
      tempImg.onload = () => {
        ctx.drawImage(tempImg, -finalDrawW / 2, -finalDrawH / 2, finalDrawW, finalDrawH);
        ctx.restore();
        try {
          const croppedData = canvas.toDataURL("image/jpeg", 0.88);
          onApply(croppedData);
        } catch {
          onApply(imageSrc);
        }
      };
      tempImg.onerror = () => onApply(imageSrc);
      tempImg.src = imageSrc;
      return;
    }

    ctx.restore();

    // Export optimized, clean JPEG (~25-35KB)
    try {
      const croppedData = canvas.toDataURL("image/jpeg", 0.88);
      onApply(croppedData);
    } catch (err) {
      console.warn("Failed to generate cropped data URL, falling back to source", err);
      onApply(imageSrc);
    }
  }

  const { renderW, renderH } = getRenderDimensions();

  return (
    <div className="photo-adjuster-modal-backdrop" onClick={onCancel}>
      <div
        className="photo-adjuster-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Adjust profile picture"
      >
        <header className="adjuster-header">
          <button
            type="button"
            className="adjuster-cancel-btn text-btn"
            onClick={onCancel}
          >
            Cancel
          </button>
          <div className="adjuster-title-wrap">
            <span className="adjuster-kicker">PROFILE PICTURE</span>
            <h3>Adjust Photo</h3>
          </div>
          <button
            type="button"
            className="adjuster-done-btn action-pill"
            onClick={handleConfirmCrop}
          >
            Done ✓
          </button>
        </header>

        {/* CROP VIEWPORT */}
        <div className="adjuster-canvas-container">
          <div
            ref={containerRef}
            className="adjuster-crop-viewport"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ width: `${CROP_DIAMETER}px`, height: `${CROP_DIAMETER}px` }}
          >
            {/* The Image being transformed */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Adjust crop"
              className="adjuster-image-layer"
              draggable={false}
              style={{
                width: `${renderW}px`,
                height: `${renderH}px`,
                transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) rotate(${rotation}deg)`,
              }}
            />

            {/* Circular Vignette Cutout Overlay */}
            <div className="adjuster-circle-overlay">
              {/* Instagram-style 3x3 alignment grid */}
              <div className="adjuster-grid-lines">
                <span className="grid-line h h1" />
                <span className="grid-line h h2" />
                <span className="grid-line v v1" />
                <span className="grid-line v v2" />
              </div>
            </div>
          </div>

          <p className="adjuster-hint-text">
            👆 Drag with 1 finger • Pinch or slide to zoom
          </p>
        </div>

        {/* CONTROLS (ZOOM SLIDER + ROTATE + RESET) */}
        <div className="adjuster-controls-panel">
          <div className="adjuster-zoom-row">
            <span className="zoom-icon-label" title="Zoom out">🔍-</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.02"
              value={scale}
              onChange={handleScaleChange}
              className="adjuster-zoom-slider"
              aria-label="Zoom photo"
            />
            <span className="zoom-icon-label" title="Zoom in">🔍+</span>
            <span className="zoom-value-tag mono-time">{scale.toFixed(1)}x</span>
          </div>

          <div className="adjuster-quick-tools">
            <button
              type="button"
              className="adjuster-tool-btn"
              onClick={handleRotate}
              title="Rotate 90 degrees"
            >
              ⟳ Rotate 90°
            </button>
            <button
              type="button"
              className="adjuster-tool-btn"
              onClick={handleReset}
              title="Reset position & zoom"
            >
              ↺ Recenter
            </button>
          </div>
        </div>

        <footer className="adjuster-footer-action">
          <button
            type="button"
            className="adjuster-save-full-btn action-pill"
            onClick={handleConfirmCrop}
          >
            Set Profile Photo ✓
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ProfilePhotoAdjuster;
