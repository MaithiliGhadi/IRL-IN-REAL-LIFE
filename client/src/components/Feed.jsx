import { useState, useRef } from "react";

function Feed({
  moments,
  currentUser,
  onOpenCapture,
  onOpenProfile,
  onOpenAccount,
  onBackHome,
}) {
  // Reaction states keyed by moment id
  const [reactionsState, setReactionsState] = useState({});
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRef = useRef(null);

  function handleReact(momentId, reactionType) {
    setReactionsState((prev) => {
      const current = prev[momentId] || {
        feltThis: 0,
        same: 0,
        loveThis: 0,
        userReacted: null,
      };

      const isCurrentReaction = current.userReacted === reactionType;
      const updatedCount = isCurrentReaction
        ? Math.max(0, current[reactionType] - 1)
        : current[reactionType] + 1;

      return {
        ...prev,
        [momentId]: {
          ...current,
          [reactionType]: updatedCount,
          userReacted: isCurrentReaction ? null : reactionType,
        },
      };
    });
  }

  function handlePlayVoice(momentId, voiceUrl) {
    if (!voiceUrl) return;

    if (playingAudioId === momentId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const newAudio = new Audio(voiceUrl);
      audioRef.current = newAudio;
      newAudio.onended = () => setPlayingAudioId(null);
      newAudio.play().then(() => {
        setPlayingAudioId(momentId);
      }).catch((e) => console.log("Audio play error", e));
    }
  }

  return (
    <div className="irl-feed-view">
      {/* Feed Sticky Header */}
      <header className="feed-header">
        <div
          className="feed-brand-col"
          onClick={onBackHome}
          role={onBackHome ? "button" : undefined}
          tabIndex={onBackHome ? 0 : undefined}
          style={onBackHome ? { cursor: "pointer" } : undefined}
          title="Back to home"
        >
          <span className="feed-logo">IRL</span>
          <span className="feed-sub-tag">LIVE MOMENTS</span>
        </div>

        <div className="feed-header-actions">
          {currentUser ? (
            <button
              className="feed-user-chip-btn"
              onClick={onOpenProfile}
              title={`View ${currentUser.displayName || currentUser.username}'s profile`}
            >
              <span className="user-chip-avatar-wrap">
                {currentUser.avatar && (
                  <img
                    src={currentUser.avatar}
                    alt=""
                    className="user-chip-avatar"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fb = e.currentTarget.parentElement?.querySelector(".user-chip-avatar-placeholder");
                      if (fb) fb.style.display = "inline-flex";
                    }}
                  />
                )}
                <span
                  className="user-chip-avatar-placeholder"
                  style={{ display: currentUser.avatar ? "none" : "inline-flex" }}
                >
                  {(currentUser.displayName || currentUser.username || "U")[0]?.toUpperCase() || "U"}
                </span>
              </span>
              <span className="user-chip-handle">
                {currentUser.displayName || `@${currentUser.username}`}
              </span>
            </button>
          ) : (
            <button
              className="feed-create-profile-btn"
              onClick={onOpenAccount}
              title="Create profile"
            >
              <span className="nav-plus">+</span>
              <span className="user-chip-handle">create profile</span>
            </button>
          )}

          {currentUser && onOpenAccount && (
            <button
              className="circle-btn mini"
              onClick={onOpenAccount}
              title="Edit account & avatar"
              aria-label="Edit account"
            >
              ✎
            </button>
          )}

          {onBackHome && (
            <button
              className="feed-home-link-btn"
              onClick={onBackHome}
              title="Return to capture home"
            >
              home <span>→</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Stream */}
      <main className="feed-stream">
        <div className="feed-stream-kicker">
          <p className="stream-heading">what&apos;s happening right now.</p>
          <span className="stream-badge mono-time">24-hour temporary stream</span>
        </div>

        {moments.length === 0 ? (
          <div className="empty-feed-card">
            <span className="empty-icon">📷</span>
            <h3>No moments yet.</h3>
            <p>Be the first to capture what you&apos;re doing in real life.</p>
            <button
              className="action-pill snap-now-btn"
              onClick={onOpenCapture}
            >
              + capture a moment
            </button>
          </div>
        ) : (
          <div className="moments-list">
            {moments.map((moment) => {
              const reactions = reactionsState[moment.id] || {
                feltThis: moment.reactions?.feltThis || 0,
                same: moment.reactions?.same || 0,
                loveThis: moment.reactions?.loveThis || 0,
                userReacted: null,
              };

              const isVoicePlaying = playingAudioId === moment.id;

              return (
                <article key={moment.id} className="moment-card">
                  {/* Card Top Meta */}
                  <header className="moment-card-header">
                    <div className="moment-author-info">
                      <div className="author-avatar-badge">
                        {moment.avatar ? (
                          <img
                            src={moment.avatar}
                            alt={moment.author}
                            className="author-avatar-img"
                          />
                        ) : (
                          <span className="author-initial">
                            {moment.author ? moment.author.charAt(0).toUpperCase() : "U"}
                          </span>
                        )}
                      </div>
                      <div className="author-names-col">
                        <span className="author-username">@{moment.author || "user"}</span>
                        <span className="moment-expiry-indicator mono-time">
                          ⏱ {moment.expiresIn || "23h left"}
                        </span>
                      </div>
                    </div>

                    <div className="live-real-stamp">
                      <span className="stamp-dot" />
                      LIVE CAPTURE
                    </div>
                  </header>

                  {/* Photo Container */}
                  <div className="moment-image-frame">
                    <img
                      src={moment.image}
                      alt={moment.activity || "IRL moment"}
                      className="moment-frame-img"
                      loading="lazy"
                    />
                  </div>

                  {/* Context Content (Pillar 2: Moment + Context) */}
                  <div className="moment-content-body">
                    {/* Activity: The core identity "Today I..." */}
                    <div className="moment-activity-block">
                      <span className="activity-prefix-tag">Today I...</span>
                      <p className="activity-main-text">{moment.activity}</p>
                    </div>

                    {/* Metadata tags */}
                    <div className="moment-tags-strip">
                      {moment.mood && (
                        <span className="context-pill mood-pill">
                          feeling: {moment.mood.emoji} {moment.mood.label}
                        </span>
                      )}

                      {moment.location && (
                        <span className="context-pill location-pill">
                          📍 {moment.location}
                        </span>
                      )}

                      {moment.voiceUrl && (
                        <button
                          className={`context-pill voice-pill ${isVoicePlaying ? "playing" : ""}`}
                          onClick={() => handlePlayVoice(moment.id, moment.voiceUrl)}
                        >
                          🎙 {isVoicePlaying ? "playing..." : "voice thought"} ({moment.voiceDuration ? `0:0${moment.voiceDuration}` : "0:05"})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Low-Pressure Social Reactions (Pillar 5) */}
                  <footer className="moment-social-footer">
                    <span className="reactions-hint">reactions</span>
                    <div className="low-pressure-reactions-bar">
                      <button
                        className={`reaction-chip ${reactions.userReacted === "feltThis" ? "reacted" : ""}`}
                        onClick={() => handleReact(moment.id, "feltThis")}
                        title="Felt this"
                      >
                        <span className="react-icon">♡</span>
                        <span className="react-label">felt this</span>
                        {reactions.feltThis > 0 && (
                          <span className="react-count">{reactions.feltThis}</span>
                        )}
                      </button>

                      <button
                        className={`reaction-chip ${reactions.userReacted === "same" ? "reacted" : ""}`}
                        onClick={() => handleReact(moment.id, "same")}
                        title="Same"
                      >
                        <span className="react-icon">😂</span>
                        <span className="react-label">same</span>
                        {reactions.same > 0 && (
                          <span className="react-count">{reactions.same}</span>
                        )}
                      </button>

                      <button
                        className={`reaction-chip ${reactions.userReacted === "loveThis" ? "reacted" : ""}`}
                        onClick={() => handleReact(moment.id, "loveThis")}
                        title="Love this moment"
                      >
                        <span className="react-icon">✨</span>
                        <span className="react-label">love this</span>
                        {reactions.loveThis > 0 && (
                          <span className="react-count">{reactions.loveThis}</span>
                        )}
                      </button>
                    </div>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Capture Bar */}
      <nav className="feed-floating-nav">
        <button
          className="nav-capture-button"
          onClick={onOpenCapture}
          aria-label="Capture a moment"
        >
          <span className="nav-plus-symbol">+</span>
          <span className="nav-capture-text">capture a moment</span>
        </button>
      </nav>
    </div>
  );
}

export default Feed;
