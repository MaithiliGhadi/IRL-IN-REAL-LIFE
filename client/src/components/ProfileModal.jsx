function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  onEditProfile,
  onNewProfile,
  onSwitchUser,
  onLogout,
  momentsCount = 3,
}) {
  if (!isOpen) return null;

  return (
    <div className="profile-backdrop" onClick={onClose}>
      <div
        className="profile-sheet-card"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="profile-sheet-header">
          <div className="profile-identity-title">
            <span className="profile-super-tag">PILLAR 4 IDENTITY</span>
            <h2>TODAY I...</h2>
          </div>
          <button
            className="sheet-close-btn"
            onClick={onClose}
            aria-label="Close profile"
          >
            ✕
          </button>
        </header>

        {/* User Profile Card Header */}
        <div className="profile-user-summary-card">
          <div className="profile-avatar-wrapper">
            {currentUser?.avatar && (
              <img
                src={currentUser.avatar}
                alt=""
                className="profile-user-avatar"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.parentElement?.querySelector(".profile-user-avatar-placeholder");
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            )}
            <div
              className="profile-user-avatar-placeholder"
              style={{ display: currentUser?.avatar ? "none" : "flex" }}
            >
              {(currentUser?.displayName || currentUser?.username || "U")[0]?.toUpperCase() || "U"}
            </div>
            <span className="profile-avatar-dot" />
          </div>

          <div className="profile-user-meta">
            <div className="profile-user-name-row">
              <span className="profile-display-name">
                {currentUser?.displayName || "You"}
              </span>
              <span className="profile-handle">
                @{currentUser?.username || "you"}
              </span>
            </div>

            <p className="profile-user-bio">
              {currentUser?.bio || "sharing what's happening right now in real life."}
            </p>

            <button
              className="edit-profile-action-btn"
              onClick={onEditProfile}
            >
              <span>✎ edit profile</span>
            </button>
          </div>
        </div>

        {/* Demo Switcher for Professor Presentation */}
        {onSwitchUser && (
          <div className="profile-switcher-section">
            <span className="section-card-title">SWITCH ACCOUNT</span>
            <div className="profile-switcher-pills">
              <button
                className={`switch-user-pill ${currentUser?.username === "maithili" ? "active" : ""}`}
                onClick={() =>
                  onSwitchUser({
                    username: "maithili",
                    displayName: "Maithili",
                    bio: "capturing real moments • unedited",
                    avatar:
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                    joinedAt: new Date().toISOString(),
                  })
                }
              >
                👤 Maithili
              </button>
              <button
                className={`switch-user-pill ${currentUser?.username === "arjun" ? "active" : ""}`}
                onClick={() =>
                  onSwitchUser({
                    username: "arjun",
                    displayName: "Arjun",
                    bio: "studying for tomorrow's exam 😴",
                    avatar:
                      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
                    joinedAt: new Date().toISOString(),
                  })
                }
              >
                👤 Arjun
              </button>
              <button
                className={`switch-user-pill ${currentUser?.username === "ananya" ? "active" : ""}`}
                onClick={() =>
                  onSwitchUser({
                    username: "ananya",
                    displayName: "Ananya",
                    bio: "chai in Bandra ✨",
                    avatar:
                      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
                    joinedAt: new Date().toISOString(),
                  })
                }
              >
                👤 Ananya
              </button>
              <button
                className="switch-user-pill new-user"
                onClick={onNewProfile}
              >
                ➕ New Profile
              </button>
            </div>
          </div>
        )}

        <p className="profile-statement-quote">
          &ldquo;No follower counts. No vanity metrics. Just your authentic life in snapshots.&rdquo;
        </p>

        {/* Stats Grid based on PDF Page 5 */}
        <div className="profile-journal-grid">
          <div className="journal-stat-card highlight">
            <span className="stat-number mono-time">{momentsCount}</span>
            <span className="stat-label">moments captured today</span>
            <span className="stat-sub">unfiltered & 24h temporary</span>
          </div>

          <div className="journal-stat-card">
            <span className="stat-number mono-time">12</span>
            <span className="stat-label">moments this week</span>
            <span className="stat-sub">spontaneous journaling</span>
          </div>

          {/* Recent Moods */}
          <div className="journal-section-card full-width">
            <span className="section-card-title">RECENT MOODS</span>
            <div className="recent-moods-flow">
              <span className="profile-mood-pill">😴 tired (4)</span>
              <span className="profile-mood-pill">✨ happy (5)</span>
              <span className="profile-mood-pill">⚡ excited (2)</span>
              <span className="profile-mood-pill">☕ calm (1)</span>
            </div>
          </div>

          {/* Places I've Been */}
          <div className="journal-section-card full-width">
            <span className="section-card-title">PLACES I&apos;VE BEEN</span>
            <div className="places-list-flow">
              <span className="profile-place-tag">📍 College Campus</span>
              <span className="profile-place-tag">📍 Bandra</span>
              <span className="profile-place-tag">📍 Library</span>
              <span className="profile-place-tag">📍 Late Night Cafe</span>
            </div>
          </div>
        </div>

        <footer className="profile-sheet-footer">
          {onLogout && (
            <button
              className="text-btn logout-sheet-btn"
              onClick={onLogout}
            >
              log out / reset
            </button>
          )}
          <button className="action-pill done-sheet-btn" onClick={onClose}>
            back to IRL feed
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ProfileModal;
