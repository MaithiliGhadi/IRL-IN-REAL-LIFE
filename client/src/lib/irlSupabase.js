import { supabase, isSupabaseConfigured } from "./supabaseClient";

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || "application/octet-stream";
  const bytes = atob(base64);
  const array = new Uint8Array(bytes.length);

  for (let i = 0; i < bytes.length; i += 1) {
    array[i] = bytes.charCodeAt(i);
  }

  return new Blob([array], { type: mime });
}

async function uploadAsset(bucket, path, source, fallbackType) {
  if (!supabase || !source) return null;

  let body = source;
  let contentType = fallbackType;

  if (typeof source === "string" && source.startsWith("data:")) {
    body = dataUrlToBlob(source);
    contentType = body.type || fallbackType;
  } else if (typeof source === "string" && source.startsWith("blob:")) {
    const response = await fetch(source);
    body = await response.blob();
    contentType = body.type || fallbackType;
  } else if (typeof source === "string" && /^https?:/i.test(source)) {
    // Existing remote demo audio can remain remote; browser CORS may prevent copying it.
    return source;
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function ensureAnonymousUser() {
  if (!supabase) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user) {
    return sessionData.session.user;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;

  return data.user;
}

export async function loadCurrentProfile() {
  if (!supabase) return null;

  const user = await ensureAnonymousUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, joined_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  return {
    username: data.username,
    displayName: data.display_name,
    bio: data.bio,
    avatar: data.avatar_url,
    joinedAt: data.joined_at,
  };
}

export async function saveCurrentProfile(userData) {
  if (!supabase) return userData;

  const user = await ensureAnonymousUser();
  if (!user) return userData;

  let avatarUrl = userData.avatar || null;

  if (avatarUrl?.startsWith("data:")) {
    const extension = avatarUrl.includes("image/svg+xml") ? "svg" : "jpg";
    avatarUrl = await uploadAsset(
      "avatars",
      `${user.id}/profile-${Date.now()}.${extension}`,
      avatarUrl,
      extension === "svg" ? "image/svg+xml" : "image/jpeg"
    );
  }

  const profile = {
    id: user.id,
    username: userData.username,
    display_name: userData.displayName,
    bio: userData.bio,
    avatar_url: avatarUrl,
    joined_at: userData.joinedAt || new Date().toISOString(),
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "id" });

  if (error) throw error;

  return {
    ...userData,
    avatar: avatarUrl,
  };
}

function mapMoment(row) {
  const expiresAt = new Date(row.expires_at).getTime();
  const remaining = Math.max(0, expiresAt - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);

  return {
    id: row.id,
    author: row.username,
    avatar: row.avatar_url,
    image: row.image_url,
    activity: row.activity,
    mood: row.mood_id
      ? { id: row.mood_id, label: row.mood_label, emoji: row.mood_emoji }
      : null,
    location: row.location,
    voiceUrl: row.voice_url,
    voiceDuration: row.voice_duration,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    expiresIn: `${String(Math.floor(totalSeconds / 3600)).padStart(2, "0")}:${String(
      Math.floor((totalSeconds % 3600) / 60)
    ).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`,
    reactions: {
      feltThis: 0,
      same: 0,
      loveThis: 0,
    },
  };
}

export async function loadActiveMoments() {
  if (!supabase) return [];

  await ensureAnonymousUser();

  const { data, error } = await supabase
    .from("moments")
    .select(
      "id, username, avatar_url, image_url, activity, mood_id, mood_label, mood_emoji, location, voice_url, voice_duration, created_at, expires_at"
    )
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(mapMoment);
}

export async function publishMoment(moment) {
  if (!supabase) return moment;

  const user = await ensureAnonymousUser();
  if (!user) return moment;

  const timestamp = Date.now();
  const imageUrl = await uploadAsset(
    "moments",
    `${user.id}/${timestamp}.jpg`,
    moment.image,
    "image/jpeg"
  );

  let voiceUrl = null;
  if (moment.voiceUrl) {
    if (moment.voiceUrl.startsWith("blob:")) {
      voiceUrl = await uploadAsset(
        "voice-notes",
        `${user.id}/${timestamp}.webm`,
        moment.voiceUrl,
        "audio/webm"
      );
    } else {
      voiceUrl = moment.voiceUrl;
    }
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const row = {
    user_id: user.id,
    username: moment.author,
    avatar_url: moment.avatar,
    image_url: imageUrl || moment.image,
    activity: moment.activity,
    mood_id: moment.mood?.id || null,
    mood_label: moment.mood?.label || null,
    mood_emoji: moment.mood?.emoji || null,
    location: moment.location || null,
    voice_url: voiceUrl,
    voice_duration: moment.voiceDuration || null,
    created_at: moment.createdAt || new Date().toISOString(),
    expires_at: expiresAt,
  };

  const { data, error } = await supabase
    .from("moments")
    .insert(row)
    .select(
      "id, username, avatar_url, image_url, activity, mood_id, mood_label, mood_emoji, location, voice_url, voice_duration, created_at, expires_at"
    )
    .single();

  if (error) throw error;

  return mapMoment(data);
}

export function supabaseReady() {
  return isSupabaseConfigured;
}
