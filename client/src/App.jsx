import { useState } from "react";
import Camera from "./components/Camera";
import MomentComposer from "./components/MomentComposer";
import Feed from "./components/Feed";
import ProfileModal from "./components/ProfileModal";
import CreateAccount from "./components/CreateAccount";
import "./styles/global.css";


const INITIAL_MOMENTS = [
  {
    id: 101,
    author: "arjun",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1000&q=80",
    activity: "studying for tomorrow's exam.",
    mood: { id: "tired", label: "tired", emoji: "😴" },
    location: "College",
    voiceUrl: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
    voiceDuration: 7,
    createdAt: new Date().toISOString(),
    expiresIn: "23:41:18",
    reactions: {
      feltThis: 4,
      same: 6,
      loveThis: 1,
    },
  },
  {
    id: 102,
    author: "ananya",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80",
    activity: "went out for chai with my friends.",
    mood: { id: "happy", label: "happy", emoji: "✨" },
    location: "Bandra",
    voiceUrl: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
    voiceDuration: 4,
    createdAt: new Date().toISOString(),
    expiresIn: "21:15:02",
    reactions: {
      feltThis: 2,
      same: 1,
      loveThis: 8,
    },
  },
];

function App() {
  // Navigation states: 'home' | 'feed'
  const [activeScreen, setActiveScreen] = useState("home");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [accountMode, setAccountMode] = useState("create");
  const [capturedImage, setCapturedImage] = useState(null);
  const [moments, setMoments] = useState(INITIAL_MOMENTS);

  // User account state persisted in localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("irl_current_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  function handleSaveAccount(userData) {
    setCurrentUser(userData);
    try {
      localStorage.setItem("irl_current_user", JSON.stringify(userData));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
    setCreateAccountOpen(false);
    setActiveScreen("feed");
  }

  function handleLogout() {
    setCurrentUser(null);
    try {
      localStorage.removeItem("irl_current_user");
    } catch (e) {
      console.warn("Could not clear localStorage", e);
    }
    setProfileOpen(false);
  }

  // When photo review screen clicks "use moment →"
  function handleUseMoment(image) {
    setCapturedImage(image);
    setCameraOpen(false);
    setComposerOpen(true);
  }

  // When moment composer finishes sharing
  function handlePublishMoment(newMoment) {
    setMoments((prev) => [newMoment, ...prev]);
  }

  function handleCloseComposer() {
    setComposerOpen(false);
    setCapturedImage(null);
    setActiveScreen("feed");
  }

  // Active Camera overlay takes full screen precedence
  if (cameraOpen) {
    return (
      <Camera
        onClose={() => setCameraOpen(false)}
        onUseMoment={handleUseMoment}
      />
    );
  }

  // Active Composer overlay takes full screen precedence
  if (composerOpen) {
    return (
      <MomentComposer
        image={capturedImage}
        currentUser={currentUser}
        onClose={handleCloseComposer}
        onPublish={handlePublishMoment}
      />
    );
  }

  // Create / Edit Account page
  if (createAccountOpen) {
    return (
      <CreateAccount
        initialUser={accountMode === "create" ? null : currentUser}
        onSave={handleSaveAccount}
        onClose={() => setCreateAccountOpen(false)}
      />
    );
  }

  return (
    <div className="app-shell">
      {/* Feed View */}
      {activeScreen === "feed" ? (
        <Feed
          moments={moments}
          currentUser={currentUser}
          onOpenCapture={() => setCameraOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenAccount={() => {
            setAccountMode(currentUser ? "edit" : "create");
            setCreateAccountOpen(true);
          }}
          onBackHome={() => setActiveScreen("home")}
        />
      ) : (
        /* Home Landing Screen (Matches page 1 of PDF) */
        <main className="irl">
          <header className="irl-header">
            <span className="irl-live-pill">
              <span className="pulse-dot" /> LIVE
            </span>

            <div className="irl-nav-right">
              {currentUser ? (
                <button
                  className="irl-account-chip-btn"
                  onClick={() => setProfileOpen(true)}
                  title={`View ${currentUser.displayName || currentUser.username}'s profile`}
                >
                  <span className="nav-avatar-wrap">
                    {currentUser.avatar && (
                      <img
                        src={currentUser.avatar}
                        alt=""
                        className="nav-avatar-circle"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fb = e.currentTarget.parentElement?.querySelector(".nav-avatar-circle-placeholder");
                          if (fb) fb.style.display = "inline-flex";
                        }}
                      />
                    )}
                    <span
                      className="nav-avatar-circle-placeholder"
                      style={{ display: currentUser.avatar ? "none" : "inline-flex" }}
                    >
                      {(currentUser.displayName || currentUser.username || "U")[0]?.toUpperCase() || "U"}
                    </span>
                  </span>
                  <span className="nav-handle">
                    {currentUser.displayName || `@${currentUser.username}`}
                  </span>
                </button>
              ) : (
                <button
                  className="irl-create-profile-btn"
                  onClick={() => {
                    setAccountMode("create");
                    setCreateAccountOpen(true);
                  }}
                  title="Create your profile"
                >
                  <span className="nav-plus">+</span>
                  <span className="nav-handle">create profile</span>
                </button>
              )}

              <button
                className="irl-feed-link"
                onClick={() => setActiveScreen("feed")}
                title="View live feed"
              >
                feed <span>→</span>
              </button>
            </div>
          </header>

          <section className="hero">
            <p className="eyebrow">IN REAL LIFE</p>
            <h1>right now.</h1>

            <button
              className="capture-button"
              onClick={() => setCameraOpen(true)}
              aria-label="Capture a moment"
            >
              <span>+</span>
            </button>

            <p className="capture-label">capture a moment</p>
            <span className="capture-sub-rule">unfiltered • live camera only</span>
          </section>

          <footer className="irl-footer">
            <button
              className="today-button"
              onClick={() => setActiveScreen("feed")}
            >
              today I...
            </button>
          </footer>
        </main>
      )}

      {/* Profile Sheet Modal (Pillar 4) */}
      <ProfileModal
        isOpen={profileOpen}
        currentUser={currentUser}
        onClose={() => setProfileOpen(false)}
        onEditProfile={() => {
          setProfileOpen(false);
          setAccountMode("edit");
          setCreateAccountOpen(true);
        }}
        onNewProfile={() => {
          setProfileOpen(false);
          setAccountMode("create");
          setCreateAccountOpen(true);
        }}
        onSwitchUser={(user) => {
          handleSaveAccount(user);
        }}
        onLogout={handleLogout}
        momentsCount={moments.length}
      />
    </div>
  );
}

export default App;