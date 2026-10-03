import { useEffect, useState } from "react";
import Camera from "./components/Camera";
import MomentComposer from "./components/MomentComposer";
import Feed from "./components/Feed";
import ProfileModal from "./components/ProfileModal";
import CreateAccount from "./components/CreateAccount";
import FloatingLines from "./components/FloatingLines";
import {
  ensureAnonymousUser,
  loadActiveMoments,
  loadCurrentProfile,
  publishMoment,
  saveCurrentProfile,
  supabaseReady,
} from "./lib/irlSupabase";
import "./styles/global.css";

const INITIAL_MOMENTS = [];

function App() {
  const [activeScreen, setActiveScreen] = useState("home");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [accountMode, setAccountMode] = useState("create");
  const [capturedImage, setCapturedImage] = useState(null);
  const [moments, setMoments] = useState(INITIAL_MOMENTS);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 768px)").matches
      : false
  );

  // Keep the WebGL background lighter on phones.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleViewportChange = () => setIsMobile(mediaQuery.matches);

    handleViewportChange();
    mediaQuery.addEventListener?.("change", handleViewportChange);

    return () => {
      mediaQuery.removeEventListener?.("change", handleViewportChange);
    };
  }, []);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("irl_current_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Supabase uses an anonymous Auth user so the current UI can stay frictionless.
  // No email/password is required for the demo account flow.
  useEffect(() => {
    if (!supabaseReady()) return;

    let cancelled = false;

    async function bootstrapBackend() {
      try {
        await ensureAnonymousUser();

        const [profile, backendMoments] = await Promise.all([
          loadCurrentProfile(),
          loadActiveMoments(),
        ]);

        if (cancelled) return;

        if (profile) {
          setCurrentUser(profile);
          localStorage.setItem("irl_current_user", JSON.stringify(profile));
        }

        if (backendMoments.length > 0) {
          setMoments(backendMoments);
        }
      } catch (error) {
        console.warn(
          "Supabase is not ready yet. IRL will continue in local demo mode.",
          error
        );
      }
    }

    bootstrapBackend();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveAccount(userData) {
    try {
      const savedUser = supabaseReady()
        ? await saveCurrentProfile(userData)
        : userData;

      setCurrentUser(savedUser);
      localStorage.setItem("irl_current_user", JSON.stringify(savedUser));
    } catch (error) {
      console.error("Could not save profile to Supabase:", error);
      setCurrentUser(userData);
      localStorage.setItem("irl_current_user", JSON.stringify(userData));
    }

    setCreateAccountOpen(false);
    setActiveScreen("feed");
  }

  function handleLogout() {
    setCurrentUser(null);
    localStorage.removeItem("irl_current_user");
    setProfileOpen(false);
  }

  function handleUseMoment(image) {
    setCapturedImage(image);
    setCameraOpen(false);
    setComposerOpen(true);
  }

  async function handlePublishMoment(newMoment) {
    try {
      const savedMoment = supabaseReady()
        ? await publishMoment(newMoment)
        : newMoment;

      setMoments((prev) => [savedMoment, ...prev]);
    } catch (error) {
      console.error("Could not publish moment to Supabase:", error);
      // Keep the demo usable even if the Supabase project has not been configured.
      setMoments((prev) => [newMoment, ...prev]);
    }
  }

  function handleCloseComposer() {
    setComposerOpen(false);
    setCapturedImage(null);
    setActiveScreen("feed");
  }

  return (
    <div className="app-root">
      {!cameraOpen && !composerOpen && !createAccountOpen && (
        <div className="floating-lines-bg-fixed" aria-hidden="true">
          <FloatingLines
            enabledWaves={["top", "middle", "bottom"]}
            lineCount={isMobile ? [2, 3, 2] : [6, 8, 7]}
            lineDistance={isMobile ? [8, 7, 9] : [5, 4, 6]}
            animationSpeed={isMobile ? 0.35 : 0.8}
            interactive={!isMobile}
            bendRadius={isMobile ? 3.5 : 5.0}
            bendStrength={isMobile ? -0.25 : -0.5}
            parallax={!isMobile}
            parallaxStrength={0.2}
          />
        </div>
      )}

      {cameraOpen ? (
        <Camera
          onClose={() => setCameraOpen(false)}
          onUseMoment={handleUseMoment}
        />
      ) : composerOpen ? (
        <MomentComposer
          image={capturedImage}
          currentUser={currentUser}
          onClose={handleCloseComposer}
          onPublish={handlePublishMoment}
        />
      ) : createAccountOpen ? (
        <CreateAccount
          initialUser={accountMode === "create" ? null : currentUser}
          onSave={handleSaveAccount}
          onClose={() => setCreateAccountOpen(false)}
        />
      ) : (
        <div className="app-shell">
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
                              const fb = e.currentTarget.parentElement?.querySelector(
                                ".nav-avatar-circle-placeholder"
                              );
                              if (fb) fb.style.display = "inline-flex";
                            }}
                          />
                        )}
                        <span
                          className="nav-avatar-circle-placeholder"
                          style={{
                            display: currentUser.avatar
                              ? "none"
                              : "inline-flex",
                          }}
                        >
                          {(
                            currentUser.displayName ||
                            currentUser.username ||
                            "U"
                          )[0]?.toUpperCase() || "U"}
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
                <span className="capture-sub-rule">
                  unfiltered • live camera only
                </span>
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
      )}
    </div>
  );
}

export default App;
