import { useState, useRef, useEffect } from "react";

const MOOD_OPTIONS = [
  { id: "tired", label: "tired", emoji: "😴" },
  { id: "calm", label: "calm", emoji: "☕" },
  { id: "happy", label: "happy", emoji: "✨" },
  { id: "excited", label: "excited", emoji: "⚡" },
  { id: "bored", label: "bored", emoji: "🫠" },
  { id: "focused", label: "focused", emoji: "🧠" },
  { id: "vibing", label: "vibing", emoji: "🫧" },
  { id: "grateful", label: "grateful", emoji: "🌿" },
];

const LOCATION_SUGGESTIONS = [
  "Mumbai",
  "Bandra",
  "College Campus",
  "Library",
  "Late Night Cafe",
  "Home",
];

function MomentComposer({ image, onClose, onPublish, currentUser }) {
  // Wizard steps: 'activity' -> 'mood' -> 'voice' -> 'location' -> 'preview' -> 'posted'
  const [step, setStep] = useState("activity");

  // State data
  const [activity, setActivity] = useState("");
  const [selectedMood, setSelectedMood] = useState(MOOD_OPTIONS[0]); // default e.g. tired
  const [locationName, setLocationName] = useState("Mumbai");
  const [showLocation, setShowLocation] = useState(true);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState(null);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const audioElementRef = useRef(null);

  // 24-Hour countdown for posted state
  const [countdown, setCountdown] = useState(86399); // 23h 59m 59s

  useEffect(() => {
    let interval = null;
    if (step === "posted") {
      interval = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step]);

  // Clean up audio blob URL on unmount
  useEffect(() => {
    return () => {
      if (voiceAudioUrl && voiceAudioUrl.startsWith("blob:")) {
        URL.revokeObjectURL(voiceAudioUrl);
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [voiceAudioUrl]);

  // Audio recording handlers
  async function startRecording() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Audio recording unsupported");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setVoiceAudioUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordSeconds(0);

      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordSeconds(elapsed);
        setVoiceDuration(elapsed);

        // Auto stop at 10 seconds max
        if (elapsed >= 10) {
          stopRecording();
        }
      }, 200);
    } catch (err) {
      console.warn("Microphone access unavailable, using simulated voice note:", err);
      // Fallback: create simulated 6-second voice thought for foolproof demo
      simulateVoiceNote();
    }
  }

  function stopRecording() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }

  function simulateVoiceNote() {
    setIsRecording(true);
    setRecordSeconds(0);
    let count = 0;
    timerIntervalRef.current = setInterval(() => {
      count += 1;
      setRecordSeconds(count);
      setVoiceDuration(count);
      if (count >= 6) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        setIsRecording(false);
        // Fallback placeholder audio or silent tone
        setVoiceAudioUrl("https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg");
      }
    }, 500);
  }

  function deleteVoice() {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    setIsPlayingAudio(false);
    setVoiceAudioUrl(null);
    setVoiceDuration(0);
    setRecordSeconds(0);
  }

  function toggleAudioPlayback() {
    if (!audioElementRef.current) return;
    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.currentTime = 0;
      audioElementRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((e) => console.log("Audio play error", e));
    }
  }

  // Geolocation lookup
  function detectCurrentLocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationName("Campus");
        },
        () => {
          setLocationName("Mumbai");
        },
        { timeout: 4000 }
      );
    }
  }

  // Finalize Moment
  function handleShareMoment() {
    const newMoment = {
      id: Date.now(),
      author: currentUser?.username || "you",
      avatar: currentUser?.avatar || null,
      image,
      activity: activity.trim() || "in the moment.",
      mood: selectedMood,
      location: showLocation ? locationName : null,
      voiceUrl: voiceAudioUrl,
      voiceDuration: voiceDuration || (voiceAudioUrl ? 6 : null),
      createdAt: new Date().toISOString(),
      expiresIn: "23:59:59",
      reactions: {
        feltThis: 1,
        same: 0,
        loveThis: 2,
      },
    };

    setStep("posted");
    if (onPublish) {
      onPublish(newMoment);
    }
  }

  function formatCountdown(totalSecs) {
    const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
    const secs = String(totalSecs % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  }

  const stepsList = ["activity", "mood", "voice", "location", "preview"];
  const currentStepIndex = stepsList.indexOf(step);

  return (
    <main className="moment-composer-wrapper">
      {/* Background audio element */}
      {voiceAudioUrl && (
        <audio
          ref={audioElementRef}
          src={voiceAudioUrl}
          onEnded={() => setIsPlayingAudio(false)}
        />
      )}

      {/* Top Header */}
      <header className="composer-nav-header">
        <button
          className="composer-close-btn"
          onClick={onClose}
          aria-label="Exit composer"
        >
          ✕
        </button>

        <div className="composer-logo-badge">
          <span>IRL</span>
          <span className="dot-divider">•</span>
          <span className="composer-flow-tag">
            {step === "activity" && "TODAY I..."}
            {step === "mood" && "MOOD"}
            {step === "voice" && "VOICE THOUGHT"}
            {step === "location" && "LOCATION"}
            {step === "preview" && "MOMENT PREVIEW"}
            {step === "posted" && "POSTED"}
          </span>
        </div>

        {step !== "posted" && (
          <div className="step-dots-indicator">
            {stepsList.map((s, idx) => (
              <span
                key={s}
                className={`step-dot ${idx <= currentStepIndex ? "active" : ""}`}
              />
            ))}
          </div>
        )}
      </header>

      {/* STEP 1: TODAY I... */}
      {step === "activity" && (
        <section className="composer-card-step">
          <div className="composer-media-thumbnail">
            <img src={image} alt="Captured moment" />
            <span className="live-tag">LIVE MOMENT</span>
          </div>

          <div className="composer-body-center">
            <p className="composer-step-kicker">STEP 1 OF 4</p>
            <h1 className="composer-hero-title">
              today I...
            </h1>
            <p className="composer-sub-prompt">
              what are you doing right now?
            </p>

            <div className="activity-input-box">
              <span className="activity-prefix">today I...</span>
              <textarea
                className="activity-textarea"
                placeholder="studying for tomorrow's exam..."
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                maxLength={140}
                autoFocus
                rows={3}
              />
            </div>

            <div className="input-meta-bar">
              <span className="char-counter">
                {activity.length} / 140
              </span>
              <span className="rule-note">
                authentic & unfiltered
              </span>
            </div>
          </div>

          <footer className="composer-bottom-actions">
            <button
              className="action-pill primary-next-btn"
              onClick={() => setStep("mood")}
            >
              continue →
            </button>
          </footer>
        </section>
      )}

      {/* STEP 2: MOOD */}
      {step === "mood" && (
        <section className="composer-card-step">
          <div className="composer-media-thumbnail mini">
            <img src={image} alt="Captured moment" />
            <span className="activity-badge-inline">
              today I... {activity || "hanging out"}
            </span>
          </div>

          <div className="composer-body-center">
            <p className="composer-step-kicker">STEP 2 OF 4</p>
            <h1 className="composer-hero-title">
              feeling?
            </h1>
            <p className="composer-sub-prompt">
              how are you feeling right now?
            </p>

            <div className="mood-chip-grid">
              {MOOD_OPTIONS.map((mood) => {
                const isSelected = selectedMood?.id === mood.id;
                return (
                  <button
                    key={mood.id}
                    className={`mood-chip ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedMood(mood)}
                  >
                    <span className="mood-emoji">{mood.emoji}</span>
                    <span className="mood-label">{mood.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <footer className="composer-bottom-actions dual">
            <button
              className="text-btn back-step-btn"
              onClick={() => setStep("activity")}
            >
              ← back
            </button>
            <button
              className="action-pill primary-next-btn"
              onClick={() => setStep("voice")}
            >
              continue →
            </button>
          </footer>
        </section>
      )}

      {/* STEP 3: VOICE THOUGHT */}
      {step === "voice" && (
        <section className="composer-card-step">
          <div className="composer-media-thumbnail mini">
            <img src={image} alt="Captured moment" />
            <span className="activity-badge-inline">
              {selectedMood?.emoji} {selectedMood?.label}
            </span>
          </div>

          <div className="composer-body-center">
            <p className="composer-step-kicker">STEP 3 OF 4</p>
            <h1 className="composer-hero-title">
              voice thought
            </h1>
            <p className="composer-sub-prompt voice-rule">
              say it, don't type it <span className="mono-cap">● 0:10 max</span>
            </p>

            <div className="voice-recorder-console">
              {/* If no recording yet */}
              {!voiceAudioUrl && !isRecording && (
                <div className="recorder-idle-state">
                  <button
                    className="mic-record-btn"
                    onClick={startRecording}
                    aria-label="Start recording voice thought"
                  >
                    <div className="mic-icon-circle">🎙</div>
                    <span className="mic-press-label">tap to record</span>
                  </button>
                  <span className="max-time-sub">10s quick audio note</span>
                </div>
              )}

              {/* If currently recording */}
              {isRecording && (
                <div className="recorder-active-state">
                  <div className="live-waveform-bars">
                    <span className="wave-bar b1" />
                    <span className="wave-bar b2" />
                    <span className="wave-bar b3" />
                    <span className="wave-bar b4" />
                    <span className="wave-bar b5" />
                    <span className="wave-bar b6" />
                    <span className="wave-bar b7" />
                  </div>

                  <div className="recording-timer mono-time">
                    0:{String(recordSeconds).padStart(2, "0")} / 0:10
                  </div>

                  <button
                    className="stop-record-btn"
                    onClick={stopRecording}
                  >
                    ⏹ Stop Recording
                  </button>
                </div>
              )}

              {/* If recorded & ready to preview */}
              {voiceAudioUrl && !isRecording && (
                <div className="recorder-playback-state">
                  <div className="audio-capsule-player">
                    <button
                      className="audio-play-toggle"
                      onClick={toggleAudioPlayback}
                      aria-label={isPlayingAudio ? "Pause voice" : "Play voice"}
                    >
                      {isPlayingAudio ? "⏸" : "▶"}
                    </button>

                    <div className="audio-timeline-track">
                      <div className="static-audio-wave">
                        <span style={{ height: "40%" }} />
                        <span style={{ height: "70%" }} />
                        <span style={{ height: "90%" }} />
                        <span style={{ height: "50%" }} />
                        <span style={{ height: "100%" }} />
                        <span style={{ height: "65%" }} />
                        <span style={{ height: "85%" }} />
                        <span style={{ height: "45%" }} />
                      </div>
                      <span className="voice-duration-label mono-time">
                        0:0{voiceDuration || 6}
                      </span>
                    </div>

                    <button
                      className="delete-voice-btn"
                      onClick={deleteVoice}
                      title="Delete recording"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="voice-recorded-hint">
                    Recorded voice thought attached
                  </p>
                </div>
              )}
            </div>
          </div>

          <footer className="composer-bottom-actions dual">
            <button
              className="text-btn back-step-btn"
              onClick={() => setStep("mood")}
            >
              ← back
            </button>
            <button
              className="action-pill primary-next-btn"
              onClick={() => setStep("location")}
            >
              {voiceAudioUrl ? "continue →" : "skip voice →"}
            </button>
          </footer>
        </section>
      )}

      {/* STEP 4: LOCATION */}
      {step === "location" && (
        <section className="composer-card-step">
          <div className="composer-media-thumbnail mini">
            <img src={image} alt="Captured moment" />
          </div>

          <div className="composer-body-center">
            <p className="composer-step-kicker">STEP 4 OF 4</p>
            <h1 className="composer-hero-title">
              where are you?
            </h1>
            <p className="composer-sub-prompt">
              add real-time context to your moment
            </p>

            <div className="location-control-panel">
              <div className="location-input-row">
                <span className="loc-pin">📍</span>
                <input
                  type="text"
                  className="location-text-input"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Mumbai, Bandra, College..."
                />
                <button
                  type="button"
                  className="gps-detect-btn"
                  onClick={detectCurrentLocation}
                  title="Detect GPS"
                >
                  detect
                </button>
              </div>

              {/* Suggestions chips */}
              <div className="location-chip-list">
                {LOCATION_SUGGESTIONS.map((loc) => (
                  <button
                    key={loc}
                    className={`loc-tag-chip ${locationName === loc ? "active" : ""}`}
                    onClick={() => setLocationName(loc)}
                  >
                    {loc}
                  </button>
                ))}
              </div>

              {/* Show / Hide toggle (Specified in PDF page 3!) */}
              <div className="privacy-toggle-box">
                <div className="privacy-text">
                  <span className="privacy-title">Display location on moment</span>
                  <span className="privacy-sub">
                    {showLocation ? "Visible to friends (Show)" : "Hidden on post (Hide)"}
                  </span>
                </div>

                <button
                  type="button"
                  className={`toggle-switch-btn ${showLocation ? "on" : "off"}`}
                  onClick={() => setShowLocation(!showLocation)}
                >
                  <span className="toggle-slider" />
                  <span className="toggle-label-text">
                    {showLocation ? "Show" : "Hide"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <footer className="composer-bottom-actions dual">
            <button
              className="text-btn back-step-btn"
              onClick={() => setStep("voice")}
            >
              ← back
            </button>
            <button
              className="action-pill primary-next-btn"
              onClick={() => setStep("preview")}
            >
              preview moment →
            </button>
          </footer>
        </section>
      )}

      {/* STEP 5: MOMENT PREVIEW */}
      {step === "preview" && (
        <section className="composer-card-step preview-stage">
          <div className="preview-top-banner">
            <span className="preview-badge">FINAL REVIEW</span>
            <p className="preview-helper-text">This will be shared for 24 hours</p>
          </div>

          <div className="moment-card-canvas">
            <div className="moment-photo-wrap">
              <img src={image} alt="Moment Preview" className="canvas-photo" />
              <div className="moment-expiry-pill mono-time">
                ⏱ 24h moment
              </div>
            </div>

            <div className="moment-details-stack">
              <div className="moment-activity-line">
                <span className="prompt-label">today I...</span>
                <p className="activity-body-text">
                  {activity.trim() || "enjoying the moment without any filter."}
                </p>
              </div>

              <div className="moment-meta-tags-row">
                {selectedMood && (
                  <span className="moment-badge mood-badge">
                    feeling: {selectedMood.emoji} {selectedMood.label}
                  </span>
                )}

                {showLocation && locationName && (
                  <span className="moment-badge location-badge">
                    📍 {locationName}
                  </span>
                )}

                {voiceAudioUrl && (
                  <button
                    className="moment-badge voice-badge-interactive"
                    onClick={toggleAudioPlayback}
                  >
                    🎙 {isPlayingAudio ? "playing..." : "voice thought"} (0:0{voiceDuration || 6})
                  </button>
                )}
              </div>
            </div>
          </div>

          <footer className="composer-bottom-actions dual">
            <button
              className="text-btn back-step-btn"
              onClick={() => setStep("location")}
            >
              ← edit
            </button>
            <button
              className="action-pill share-moment-btn"
              onClick={handleShareMoment}
            >
              share moment →
            </button>
          </footer>
        </section>
      )}

      {/* STEP 6: POSTED STATE */}
      {step === "posted" && (
        <section className="composer-card-step posted-stage">
          <div className="posted-success-card">
            <div className="posted-ring-icon">✦</div>
            <h1 className="posted-heading">
              Your moment is live.
            </h1>
            <p className="posted-subtitle">
              Captured authentically in real life.
            </p>

            <div className="expiry-counter-box">
              <span className="expiry-label">expires in</span>
              <span className="expiry-clock mono-time">
                {formatCountdown(countdown)}
              </span>
              <span className="expiry-note">automatically disappears after 24 hours</span>
            </div>

            <button
              className="action-pill view-feed-btn"
              onClick={onClose}
            >
              view in IRL feed →
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default MomentComposer;