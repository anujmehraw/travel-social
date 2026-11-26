import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Camera, MapPin, Pencil, Users } from "lucide-react";
import { useAuth } from "../auth";
import type { Post, TravelRoom } from "../data";
import PostCard from "../components/PostCard";
import { apiRequest } from "../lib/api";
import { uploadImage } from "../lib/uploads";

type ProfileData = {
  user_id: string;
  username: string;
  display_name: string;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  interests: string[];
  created_at: string;
};

type ProfileResponse = {
  profile: ProfileData;
  posts: Post[];
  posts_count: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  joined_rooms: TravelRoom[];
};

export default function Profile() {
  const { user } = useAuth();
  const { userId: routeUserId } = useParams<{ userId: string }>();
  const userId = routeUserId ?? user?.id;
  const isOwnProfile = userId === user?.id;
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [interests, setInterests] = useState("");

  function applyProfile(response: ProfileResponse) {
    setProfileData(response);
    setDisplayName(response.profile.display_name);
    setUsername(response.profile.username);
    setLocation(response.profile.location ?? "");
    setBio(response.profile.bio ?? "");
    setAvatarUrl(response.profile.avatar_url ?? "");
    setCoverUrl(response.profile.cover_url ?? "");
    setInterests(response.profile.interests.join(", "));
  }

  async function loadProfile() {
    if (!userId) return;
    try {
      const response = await apiRequest<ProfileResponse>(`/api/profiles/${userId}`);
      setError("");
      applyProfile(response);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not load this profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userId) return;
    let active = true;
    apiRequest<ProfileResponse>(`/api/profiles/${userId}`)
      .then((response) => {
        if (active) {
          setError("");
          applyProfile(response);
        }
      })
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : "Could not load this profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest<ProfileData>("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          display_name: displayName.trim(),
          username: username.trim(),
          location: location.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          cover_url: coverUrl.trim() || null,
          interests: interests.split(",").map((item) => item.trim()).filter(Boolean),
        }),
      });
      setEditing(false);
      await loadProfile();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleFollow() {
    if (!userId || !profileData) return;
    setSaving(true);
    setError("");
    try {
      await apiRequest<void>(`/api/profiles/${userId}/follow`, {
        method: profileData.is_following ? "DELETE" : "POST",
      });
      await loadProfile();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not update your follow.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadProfileImage(file: File, setter: (url: string) => void) {
    setImageUploading(true);
    setError("");
    try {
      setter(await uploadImage(file, "profiles"));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not upload profile image.");
    } finally {
      setImageUploading(false);
    }
  }

  if (loading || profileData?.profile.user_id !== userId) {
    return <main className="mx-auto max-w-5xl px-4 py-12 text-center text-stone-500">Loading profile...</main>;
  }

  if (!profileData) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-stone-900">Profile unavailable</h1>
        <p role="alert" className="mt-3 text-sm text-stone-600">{error || "This profile could not be found."}</p>
        <button onClick={() => void loadProfile()} className="mt-5 rounded-lg bg-orange-800 px-4 py-2 text-sm font-medium text-white">Try again</button>
      </main>
    );
  }

  const { profile, posts, posts_count, followers_count, following_count, joined_rooms, is_following } = profileData;
  const upcomingTrips = joined_rooms.filter((room) => room.departure_date && room.departure_date >= new Date().toISOString().slice(0, 10));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

      <section className="overflow-hidden border-y border-stone-200 bg-white sm:rounded-2xl sm:border">
        <div className="relative aspect-[16/7] min-h-36 overflow-hidden bg-stone-100 sm:aspect-[16/5] sm:min-h-48">
          {profile.cover_url && <img src={profile.cover_url} alt="" className="h-full w-full object-contain object-center" />}
          {!profile.cover_url && <div className="h-full w-full bg-gradient-to-br from-orange-100 via-stone-100 to-emerald-100" />}
        </div>
        <div className="px-5 pb-6 sm:px-8">
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-orange-100 text-2xl font-semibold text-orange-900 shadow-sm">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={`${profile.display_name}'s profile`} className="h-full w-full object-cover" />
                : profile.display_name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            {isOwnProfile ? (
              <button onClick={() => setEditing((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50">
                <Pencil size={16} /> {editing ? "Close editor" : "Edit profile"}
              </button>
            ) : (
              <div className="flex gap-2">
                <Link to={`/chats?username=${encodeURIComponent(profile.username)}`} className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50">Message</Link>
                <button onClick={toggleFollow} disabled={saving} className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${is_following ? "border border-stone-300 text-stone-800 hover:bg-stone-50" : "bg-orange-800 text-white hover:bg-orange-900"}`}>
                  {is_following ? "Following" : "Follow"}
                </button>
              </div>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-stone-900">{profile.display_name}</h1>
          <p className="mt-1 text-sm text-stone-500">@{profile.username}</p>
          {profile.bio && <p className="mt-4 max-w-2xl whitespace-pre-wrap leading-7 text-stone-600">{profile.bio}</p>}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-500">
            {profile.location && <span className="flex items-center gap-1.5"><MapPin size={16} />{profile.location}</span>}
            <span className="flex items-center gap-1.5"><CalendarDays size={16} />Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
          </div>

          {profile.interests.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.interests.map((interest) => <span key={interest} className="rounded-full bg-orange-50 px-3 py-1 text-sm text-orange-900">{interest}</span>)}
            </div>
          )}

          <div className="mt-6 grid grid-cols-3 border-t border-stone-100 pt-5 text-center">
            <div><p className="text-xl font-semibold text-stone-900">{posts_count}</p><p className="mt-1 text-xs text-stone-500">Posts</p></div>
            <div><p className="text-xl font-semibold text-stone-900">{followers_count}</p><p className="mt-1 text-xs text-stone-500">Followers</p></div>
            <div><p className="text-xl font-semibold text-stone-900">{following_count}</p><p className="mt-1 text-xs text-stone-500">Following</p></div>
          </div>
        </div>
      </section>

      {editing && isOwnProfile && (
        <form onSubmit={saveProfile} className="mt-5 grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-2 sm:p-6">
          <label className="text-sm font-medium text-stone-700">Display name
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} required className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal outline-none focus:border-orange-600" />
          </label>
          <label className="text-sm font-medium text-stone-700">Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" required className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal outline-none focus:border-orange-600" />
          </label>
          <label className="text-sm font-medium text-stone-700">Location
            <input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={120} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal outline-none focus:border-orange-600" />
          </label>
          <label className="text-sm font-medium text-stone-700">Travel interests
            <input value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="Nature, Food, Hiking" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal outline-none focus:border-orange-600" />
          </label>
          <label className="text-sm font-medium text-stone-700 sm:col-span-2">Bio
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={300} rows={3} className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal outline-none focus:border-orange-600" />
          </label>
          <label className="text-sm font-medium text-stone-700">Profile photo
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadProfileImage(file, setAvatarUrl);
            }} className="mt-2 block w-full text-xs text-stone-500 file:mr-2 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-xs file:font-medium file:text-orange-900" />
            <span className="mt-1 block text-xs font-normal text-stone-500">Choose a JPEG, PNG, WebP, or GIF up to 5 MB.</span>
          </label>
          <label className="text-sm font-medium text-stone-700">Cover photo
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadProfileImage(file, setCoverUrl);
            }} className="mt-2 block w-full text-xs text-stone-500 file:mr-2 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-xs file:font-medium file:text-orange-900" />
            <span className="mt-1 block text-xs font-normal text-stone-500">Choose a JPEG, PNG, WebP, or GIF up to 5 MB.</span>
          </label>
          <div className="flex justify-end sm:col-span-2">
            <button disabled={saving || imageUploading} className="rounded-xl bg-orange-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-900 disabled:opacity-60">{imageUploading ? "Uploading image..." : saving ? "Saving..." : "Save profile"}</button>
          </div>
        </form>
      )}

      {joined_rooms.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-stone-900"><Users size={20} />Joined travel rooms</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {joined_rooms.map((room) => (
              <Link key={room.id} to={`/rooms/${room.id}`} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 transition hover:border-orange-300 hover:shadow-sm">
                <span><span className="block font-medium text-stone-900">{room.name}</span><span className="mt-1 block text-sm text-stone-500">{room.destination} · {room.departure_date ?? "Dates to be planned"}</span></span>
                <span className="text-orange-800">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      {upcomingTrips.length > 0 && (
        <section className="mt-8 rounded-2xl border border-orange-200 bg-orange-50/60 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-900"><CalendarDays size={19} />Upcoming trips</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {upcomingTrips.map((room) => (
              <Link key={room.id} to={`/rooms/${room.id}`} className="rounded-full border border-orange-200 bg-white px-3 py-1.5 text-sm text-orange-900 hover:border-orange-400">
                {room.destination ?? room.name} · {room.departure_date}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-9">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-stone-900"><Camera size={22} />Travel stories</h2>
        <div className="mt-5 space-y-6">
          {posts.length ? posts.map((post) => <PostCard key={post.id} post={post} onChanged={() => void loadProfile()} />) : (
            <p className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
              {isOwnProfile ? "Your travel stories will show up here." : "This traveler hasn't posted yet."}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
