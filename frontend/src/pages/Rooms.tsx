import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarDays, MapPin, Plus, Search, Users } from "lucide-react";
import type { TravelRoom } from "../data";
import { apiRequest } from "../lib/api";
import { uploadImage } from "../lib/uploads";

const categories = ["Adventure", "Culture", "Food", "Nature", "Road trip", "Beach", "City break"];

function getRoomsPath(
  destination: string,
  category: string,
  minBudget: string,
  maxBudget: string,
  earliest: string,
  latest: string
) {
  const params = new URLSearchParams();
  if (destination.trim()) params.set("destination", destination.trim());
  if (category) params.set("category", category);
  if (minBudget) params.set("minBudget", minBudget);
  if (maxBudget) params.set("maxBudget", maxBudget);
  if (earliest) params.set("earliest", earliest);
  if (latest) params.set("latest", latest);
  return `/api/rooms${params.size ? `?${params}` : ""}`;
}

export default function Rooms() {
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState<TravelRoom[]>([]);
  const [destination, setDestination] = useState(() => searchParams.get("destination") ?? "");
  const [category, setCategory] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [earliest, setEarliest] = useState("");
  const [latest, setLatest] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const roomsPath = getRoomsPath(destination, category, minBudget, maxBudget, earliest, latest);

  const loadRooms = useCallback(async () => {
    try {
      setRooms(await apiRequest<TravelRoom[]>(roomsPath));
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not load travel rooms.");
    } finally {
      setLoading(false);
    }
  }, [roomsPath]);

  useEffect(() => {
    let active = true;
    apiRequest<TravelRoom[]>(roomsPath)
      .then((loaded) => {
        if (active) {
          setRooms(loaded);
          setError("");
        }
      })
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : "Could not load travel rooms.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [roomsPath]);

  const roomCountText = useMemo(() => `${rooms.length} ${rooms.length === 1 ? "trip" : "trips"}`, [rooms.length]);

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const coverFile = form.get("cover_file");
      const coverUrl = coverFile instanceof File && coverFile.size > 0
        ? await uploadImage(coverFile, "rooms")
        : null;
      await apiRequest<TravelRoom>("/api/rooms", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          destination: form.get("destination"),
          start_location: form.get("start_location"),
          description: form.get("description"),
          departure_date: form.get("departure_date"),
          return_date: form.get("return_date"),
          budget: form.get("budget") ? Number(form.get("budget")) : null,
          max_members: Number(form.get("max_members")),
          category: form.get("category"),
          cover_url: coverUrl,
          is_public: form.get("is_public") === "public",
        }),
      });
      formElement.reset();
      setCreating(false);
      setNotice("Your travel room is live.");
      await loadRooms();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not create the travel room.");
    } finally {
      setSaving(false);
    }
  }

  async function joinRoom(room: TravelRoom) {
    setError("");
    setNotice("");
    try {
      const result = await apiRequest<{ status: string }>(`/api/rooms/${room.id}/join`, { method: "POST" });
      setNotice(result.status === "requested" ? "Join request sent to the room creator." : "You've joined the travel room.");
      await loadRooms();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not join this room.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-9 sm:px-6">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-orange-800">Travel together</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">Find your next travel crew</h1>
          <p className="mt-4 leading-7 text-stone-600">Explore real trips, compare plans and meet the people heading to the same place.</p>
        </div>
        <button onClick={() => setCreating((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-900">
          <Plus size={18} /> Plan a trip
        </button>
      </header>

      {notice && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

      {creating && (
        <form onSubmit={createRoom} className="mt-7 grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6">
          <h2 className="text-xl font-semibold text-stone-900 sm:col-span-2">Create a travel room</h2>
          <label className="text-sm font-medium text-stone-700">Room name
            <input name="name" required maxLength={80} placeholder="A week in the Dolomites" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal outline-none focus:border-orange-600" />
          </label>
          <label className="text-sm font-medium text-stone-700">Destination
            <input name="destination" required maxLength={120} placeholder="Destination" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal outline-none focus:border-orange-600" />
          </label>
          <label className="text-sm font-medium text-stone-700">Starting location
            <input name="start_location" maxLength={120} placeholder="Where the trip begins" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal outline-none focus:border-orange-600" />
          </label>
          <label className="text-sm font-medium text-stone-700">Travel category
            <select name="category" defaultValue="Adventure" className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-orange-600">
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-stone-700">Departure
            <input name="departure_date" type="date" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal outline-none focus:border-orange-600" />
          </label>
          <label className="text-sm font-medium text-stone-700">Return
            <input name="return_date" type="date" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal outline-none focus:border-orange-600" />
          </label>
          <label className="text-sm font-medium text-stone-700">Estimated budget per person
            <input name="budget" type="number" min="0" step="1" placeholder="Budget" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal outline-none focus:border-orange-600" />
          </label>
          <label className="text-sm font-medium text-stone-700">Maximum members
            <input name="max_members" type="number" min="2" max="100" step="1" defaultValue="8" required className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal outline-none focus:border-orange-600" />
          </label>
          <label className="text-sm font-medium text-stone-700 sm:col-span-2">Trip description
            <textarea name="description" maxLength={500} rows={3} placeholder="What are you planning to see and do?" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal outline-none focus:border-orange-600" />
          </label>
          <label className="text-sm font-medium text-stone-700 sm:col-span-2">Cover image (optional, up to 5 MB)
            <input name="cover_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-1.5 block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-orange-900" />
          </label>
          <fieldset className="flex gap-5 text-sm text-stone-700 sm:col-span-2">
            <legend className="mb-2 font-medium">Room access</legend>
            <label className="flex items-center gap-2"><input type="radio" name="is_public" value="public" defaultChecked /> Public</label>
            <label className="flex items-center gap-2"><input type="radio" name="is_public" value="private" /> Private (request or invite)</label>
          </fieldset>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={() => setCreating(false)} className="rounded-xl px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-100">Cancel</button>
            <button disabled={saving} className="rounded-xl bg-orange-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-900 disabled:opacity-60">{saving ? "Creating..." : "Create room"}</button>
          </div>
        </form>
      )}

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5" aria-label="Filter travel rooms">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          <label className="relative sm:col-span-2 lg:col-span-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Destination" className="w-full rounded-xl border border-stone-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-600" />
          </label>
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by travel category" className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-orange-600">
            <option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <input type="number" min="0" value={minBudget} onChange={(event) => setMinBudget(event.target.value)} placeholder="Min budget" aria-label="Minimum budget" className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-600" />
          <input type="number" min="0" value={maxBudget} onChange={(event) => setMaxBudget(event.target.value)} placeholder="Max budget" aria-label="Maximum budget" className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-600" />
          <input type="date" value={earliest} onChange={(event) => setEarliest(event.target.value)} aria-label="Departing on or after" className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-600" />
          <input type="date" value={latest} onChange={(event) => setLatest(event.target.value)} aria-label="Departing on or before" className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-orange-600" />
        </div>
      </section>

      <div className="mt-8 flex items-end justify-between">
        <div><h2 className="text-2xl font-semibold text-stone-900">Trips looking for travelers</h2><p className="mt-1 text-sm text-stone-500">A great trip starts with the right people.</p></div>
        <span className="text-sm text-stone-500">{roomCountText}</span>
      </div>

      {loading ? (
        <p className="mt-5 rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-500">Finding trips...</p>
      ) : rooms.length ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <article key={room.id} className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative h-48 bg-stone-100">
                {room.cover_url ? <img src={room.cover_url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" /> : <div className="h-full w-full bg-gradient-to-br from-orange-100 via-stone-100 to-sky-100" />}
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-stone-700">{room.is_public ? "Public room" : "Private room"}</span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-orange-800">{room.category ?? "Travel"}</p><h3 className="mt-1 text-lg font-semibold text-stone-900">{room.name}</h3></div>
                  {room.budget !== null && <span className="shrink-0 rounded-lg bg-stone-50 px-2.5 py-1.5 text-sm font-semibold text-stone-800">₹{Number(room.budget).toLocaleString()}</span>}
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-500"><MapPin size={15} />{room.destination || "Destination to be announced"}</p>
                {room.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">{room.description}</p>}
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-stone-500">
                  {room.departure_date && <span className="flex items-center gap-1.5"><CalendarDays size={14} />{room.departure_date}{room.return_date ? ` – ${room.return_date}` : ""}</span>}
                  <span className="flex items-center gap-1.5"><Users size={14} />{room.member_count ?? 0}/{room.max_members} travelers</span>
                </div>
                <div className="mt-5 flex gap-2 border-t border-stone-100 pt-4">
                  {(room.can_view || room.is_public) && <Link to={`/rooms/${room.id}`} className="flex-1 rounded-xl border border-stone-300 px-3 py-2.5 text-center text-sm font-medium text-stone-700 hover:bg-stone-50">{room.has_pending_invitation && !room.is_member ? "View invitation" : "Trip details"}</Link>}
                  {!room.is_member && !room.is_creator && !room.has_pending_invitation && (
                    <button onClick={() => void joinRoom(room)} className="flex-1 rounded-xl bg-orange-800 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-900">{room.is_public ? "Join trip" : "Request access"}</button>
                  )}
                  {room.has_pending_invitation && !room.is_member && <Link to="/notifications" className="flex-1 rounded-xl bg-orange-800 px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-orange-900">Accept invitation</Link>}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-500">No trips match those filters yet. Try another destination or start a room of your own.</p>
      )}
    </main>
  );
}
