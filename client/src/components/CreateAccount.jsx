import { useState, useRef, useEffect } from "react";
import ProfilePhotoAdjuster from "./ProfilePhotoAdjuster";

const RANDOM_HANDLES = [
  "campus_nomad",
  "midnight_chai",
  "coffee_coder",
  "library_ghost",
  "real_vibe",
  "mumbai_wanderer",
  "daily_journal",
  "night_owl",
  "unfiltered_life",
  "spontaneous_snap",
];

const RANDOM_BIOS = [
  "sharing what's happening right now.",
  "studying IT • living in real life.",
  "late night chai & honest thoughts 🌙",
  "no filters, no gallery spam ✦",
  "capturing the day as it happens.",
];

function generateDefaultAvatar(name) {
  const initial = (name ? name.charAt(0) : "U").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#181a20"/><circle cx="100" cy="100" r="90" fill="#20222a"/><text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="80" font-weight="700" fill="#f5f4ef" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function CreateAccount({ initialUser, onSave, onClose }) {
  const isEditing = Boolean(initialUser && initialUser.username);

  // When creating a new account, everything starts clean with NOBODY's picture
  const [username, setUsername] = useState(
    isEditing && initialUser?.username ? initialUser.username.replace(/^@/, "") : ""
  );
  const [displayName, setDisplayName] = useState(
    isEditing ? initialUser?.displayName || "" : ""
  );
  const [bio, setBio] = useState(
    isEditing ? initialUser?.bio || "" : ""
  );
  const [avatar, setAvatar] = useState(
    isEditing ? initialUser?.avatar || null : null
  );

  // Interactive cropper/adjuster state
  const [imageToAdjust, setImageToAdjust] = useState(null);

  const [isSelfieMode, setIsSelfieMode] = useState(false);
  const [selfieStream, setSelfieStream] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Ensure video element receives camera stream when selfie viewfinder opens
  useEffect(() => {
    if (isSelfieMode && selfieStream && videoRef.current) {
      videoRef.current.srcObject = selfieStream;
      videoRef.current.play().catch((err) => {
        console.warn("Selfie video autoplay failed", err);
      });
    }
  }, [isSelfieMode, selfieStream]);

  // Clean up camera stream tracks on unmount
  useEffect(() => {
    return () => {
      if (selfieStream) {
        selfieStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selfieStream]);

  // Quick 1-tap random handle generator
  function rollRandomHandle() {
    const randomHandle = RANDOM_HANDLES[Math.floor(Math.random() * RANDOM_HANDLES.length)];
    setUsername(randomHandle);
    if (!displayName) {
      setDisplayName(randomHandle.replace(/_/g, " "));
    }
  }

  // 1-Tap Quick Start (Uses neutral placeholder, no stranger's picture)
  function handleQuickStart() {
    const randomHandle = RANDOM_HANDLES[Math.floor(Math.random() * RANDOM_HANDLES.length)];
    const randomBio = RANDOM_BIOS[Math.floor(Math.random() * RANDOM_BIOS.length)];

    const userData = {
      username: randomHandle,
      displayName: randomHandle.replace(/_/g, " "),
      bio: randomBio,
      avatar: avatar || generateDefaultAvatar(randomHandle),
      joinedAt: new Date().toISOString(),
    };

    onSave(userData);
  }

  // Handle local file upload: opens cropper/adjuster immediately for perfect circle fit
  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageToAdjust(reader.result);
      }
    };
    reader.readAsDataURL(file);

    // Reset file input so re-selecting triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Handle live camera selfie for profile picture
  async function startSelfieCapture() {
    try {
      setIsSelfieMode(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      setSelfieStream(stream);
    } catch (err) {
      console.warn("Selfie camera unavailable", err);
      alert("Unable to access front camera. Please check camera permissions in your browser.");
      setIsSelfieMode(false);
    }
  }

  function snapSelfie() {
    const video = videoRef.current;
    if (!video) {
      stopSelfieStream();
      return;
    }

    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;
    const rawSize = Math.min(vWidth, vHeight);

    const canvas = document.createElement("canvas");
    canvas.width = rawSize;
    canvas.height = rawSize;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Center crop & mirror for selfie
      ctx.translate(rawSize, 0);
      ctx.scale(-1, 1);
      const startX = Math.max(0, (vWidth - rawSize) / 2);
      const startY = Math.max(0, (vHeight - rawSize) / 2);

      try {
        ctx.drawImage(video, startX, startY, rawSize, rawSize, 0, 0, rawSize, rawSize);
        const capturedData = canvas.toDataURL("image/jpeg", 0.92);
        // Automatically open adjuster so user can zoom and align their face in the circle
        setImageToAdjust(capturedData);
      } catch (err) {
        console.warn("Failed to capture selfie frame", err);
      }
    }

    stopSelfieStream();
  }

  function stopSelfieStream() {
    if (selfieStream) {
      selfieStream.getTracks().forEach((track) => track.stop());
      setSelfieStream(null);
    }
    setIsSelfieMode(false);
  }

  // Photo adjuster callbacks
  function handleOpenAdjuster() {
    if (avatar) {
      setImageToAdjust(avatar);
    }
  }

  function handleApplyAdjustedCrop(croppedDataUrl) {
    setAvatar(croppedDataUrl);
    setImageToAdjust(null);
  }

  function handleCancelAdjuster() {
    setImageToAdjust(null);
  }

  // Username validation
  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_.]/g, "");
  const isUsernameValid = cleanUsername.length >= 3;

  function handleSubmit(e) {
    e.preventDefault();
    if (!isUsernameValid) return;

    const effectiveAvatar = avatar || generateDefaultAvatar(displayName || cleanUsername);

    const userData = {
      username: cleanUsername,
      displayName: displayName.trim() || cleanUsername,
      bio: bio.trim() || "sharing what's happening right now.",
      avatar: effectiveAvatar,
      joinedAt: initialUser?.joinedAt || new Date().toISOString(),
    };

    onSave(userData);
  }

  return (
    <div className="account-page-overlay">
      <main className="account-card">
        {/* Header */}
        <header className="account-card-header">
          {onClose && (
            <button
              className="circle-btn close-btn mini"
              onClick={() => {
                stopSelfieStream();
                onClose();
              }}
              aria-label="Back"
            >
              ✕
            </button>
          )}

          <div className="account-header-center">
            <span className="account-kicker">
              {isEditing ? "EDIT PROFILE" : "CREATE YOUR ACCOUNT"}
            </span>
            <h1 className="account-title">
              {isEditing ? "your identity." : "join IRL."}
            </h1>
          </div>

          <div className="account-header-spacer" />
        </header>

        {/* 1-Tap Quick Start Banner for new users */}
        {!isEditing && (
          <div className="quick-start-banner">
            <div className="quick-banner-text">
              <span className="quick-banner-title">⚡ In a hurry?</span>
              <span className="quick-banner-sub">
                Skip typing and enter immediately with a smart guest handle.
              </span>
            </div>
            <button
              type="button"
              className="quick-start-action-btn"
              onClick={handleQuickStart}
            >
              1-Tap Enter →
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="account-form">
          {/* PROFILE PICTURE SECTION — NOBODY'S PHOTO VISIBLE INITIALLY */}
          <div className="avatar-picker-section">
            <div className="avatar-preview-container">
              {isSelfieMode ? (
                <div className="selfie-viewfinder">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="selfie-video"
                  />
                  <button
                    type="button"
                    className="selfie-snap-btn"
                    onClick={snapSelfie}
                  >
                    snap 📸
                  </button>
                </div>
              ) : avatar ? (
                <div
                  className="avatar-image-ring"
                  onClick={handleOpenAdjuster}
                  title="Click to adjust photo inside circle"
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={avatar}
                    alt="Profile preview"
                    className="avatar-large-preview"
                    onError={(e) => {
                      console.warn("Avatar preview failed to load", e);
                    }}
                  />
                  <button
                    type="button"
                    className="avatar-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAvatar(null);
                    }}
                    title="Remove photo"
                    aria-label="Remove photo"
                  >
                    ✕
                  </button>
                  <span className="avatar-adjust-badge" title="Adjust photo in circle">
                    🔍
                  </span>
                </div>
              ) : (
                /* Completely blank placeholder: nobody's picture is seen */
                <div
                  className="avatar-empty-placeholder"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload profile photo"
                >
                  <div className="avatar-empty-icon">
                    <svg
                      width="42"
                      height="42"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <span className="avatar-plus-circle">+</span>
                </div>
              )}
            </div>

            <span className="avatar-prompt-text">
              {avatar ? "Profile photo added • tap photo to adjust" : "Add a profile photo (optional)"}
            </span>

            {/* Profile Picture Actions */}
            <div className="avatar-actions-row">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />

              <button
                type="button"
                className="avatar-action-btn primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <span>{avatar ? "Change photo" : "Upload photo"}</span>
              </button>

              {avatar && (
                <button
                  type="button"
                  className="avatar-action-btn adjust-crop-btn"
                  onClick={handleOpenAdjuster}
                  title="Adjust photo position & zoom in circle"
                >
                  <span>Adjust circle 🔍</span>
                </button>
              )}

              <button
                type="button"
                className="avatar-action-btn"
                onClick={isSelfieMode ? stopSelfieStream : startSelfieCapture}
              >
                <span>{isSelfieMode ? "Cancel selfie ✕" : "Live selfie 📸"}</span>
              </button>
            </div>
          </div>

          {/* USERNAME & BIO INPUTS */}
          <div className="account-fields-group">
            {/* Username Input with 🎲 Random Handle Roller */}
            <div className="account-field">
              <div className="field-label-row">
                <label htmlFor="irl-username">Username</label>
                <div className="field-actions-right">
                  <button
                    type="button"
                    className="dice-roll-btn"
                    onClick={rollRandomHandle}
                    title="Generate random handle"
                  >
                    🎲 roll handle
                  </button>
                  <span
                    className={`username-status ${isUsernameValid ? "valid" : "invalid"}`}
                  >
                    {cleanUsername.length === 0
                      ? "required"
                      : isUsernameValid
                      ? "✓ available"
                      : "min 3 chars"}
                  </span>
                </div>
              </div>
              <div className="input-with-affix">
                <span className="input-affix">@</span>
                <input
                  id="irl-username"
                  type="text"
                  placeholder="yourname"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={24}
                  autoComplete="off"
                  autoFocus={!isEditing}
                  required
                />
              </div>
              <p className="field-helper-text">
                Your unique IRL identity. Lowercase, numbers, underscores only.
              </p>
            </div>

            {/* Display Name Input */}
            <div className="account-field">
              <div className="field-label-row">
                <label htmlFor="irl-displayname">Display Name</label>
                <span className="field-optional">optional</span>
              </div>
              <input
                id="irl-displayname"
                type="text"
                className="standard-input"
                placeholder="e.g. Maithili"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={32}
              />
            </div>

            {/* Bio / Mindset */}
            <div className="account-field">
              <div className="field-label-row">
                <label htmlFor="irl-bio">Right now I am...</label>
                <span className="field-char-count">{bio.length} / 80</span>
              </div>
              <input
                id="irl-bio"
                type="text"
                className="standard-input"
                placeholder="e.g. studying IT • living uncurated"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={80}
              />
            </div>
          </div>

          {/* IRL Authenticity Promise */}
          <div className="authenticity-pledge-card">
            <span className="pledge-tag">IRL PROMISE</span>
            <ul className="pledge-bullets">
              <li>• Real-time moments only (no gallery spam)</li>
              <li>• Disappears automatically in 24 hours</li>
              <li>• No follower competitions or like counters</li>
            </ul>
          </div>

          {/* Submit Action */}
          <footer className="account-footer-actions">
            <button
              type="submit"
              className="action-pill save-account-btn"
              disabled={!isUsernameValid}
            >
              {isEditing ? "save profile →" : "create account & enter IRL →"}
            </button>
          </footer>
        </form>
      </main>

      {/* Interactive Photo Cropper / Adjuster Modal */}
      {imageToAdjust && (
        <ProfilePhotoAdjuster
          imageSrc={imageToAdjust}
          onApply={handleApplyAdjustedCrop}
          onCancel={handleCancelAdjuster}
        />
      )}
    </div>
  );
}

export default CreateAccount;
