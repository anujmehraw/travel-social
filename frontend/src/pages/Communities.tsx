import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, Plus, Search, X } from "lucide-react";
import type { Community, CommunityRecord } from "../data";
import { communities as featuredCommunities, toCommunity } from "../data";
import CommunityCard from "../components/CommunityCard";
import { apiRequest } from "../lib/api";
import { uploadImage } from "../lib/uploads";

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export default function Communities() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Community[]>(featuredCommunities);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest<CommunityRecord[]>("/api/communities")
      .then((records) => {
        if (!active) return;
        const custom = records.map(toCommunity);
        const customSlugs = new Set(custom.map((community) => community.slug));
        setItems([
          ...custom,
          ...featuredCommunities.filter((community) => !customSlugs.has(community.slug)),
        ]);
        setLoadError("");
      })
      .catch((failure: unknown) => {
        if (active) {
          setLoadError(failure instanceof Error ? failure.message : "Could not load communities.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const results = useMemo(
    () => items.filter((community) =>
      `${community.name} ${community.city} ${community.description}`
        .toLowerCase()
        .includes(query.toLowerCase())
    ),
    [items, query]
  );

  async function createCommunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    setFormError("");
    try {
      const coverFile = form.get("cover_file");
      const imageUrl = coverFile instanceof File && coverFile.size > 0
        ? await uploadImage(coverFile, "communities")
        : null;
      const record = await apiRequest<CommunityRecord>("/api/communities", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          slug: form.get("slug"),
          city: form.get("city"),
          description: form.get("description"),
          image_url: imageUrl,
        }),
      });
      const created = toCommunity(record);
      setItems((current) => [
        created,
        ...current.filter((community) => community.slug !== created.slug),
      ]);
      navigate(`/communities/${created.slug}`);
    } catch (failure) {
      setFormError(failure instanceof Error ? failure.message : "Could not create the community.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-orange-800">
            Find your people
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-900">
            Explore communities
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-stone-600">
            Connect with people who know your city, share recommendations,
            and plan your next trip together.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating((current) => !current);
            setFormError("");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-900"
        >
          {creating ? <X size={17} /> : <Plus size={17} />}
          {creating ? "Cancel" : "Create community"}
        </button>
      </div>

      {creating && (
        <form
          onSubmit={createCommunity}
          className="mt-7 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7"
        >
          <h2 className="text-xl font-semibold text-stone-900">Start a community</h2>
          <p className="mt-1 text-sm text-stone-500">
            Create a place for travelers to connect around a destination or shared interest.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-stone-700">
              Community name
              <input
                name="name"
                required
                maxLength={80}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (!slugEdited) setSlug(makeSlug(event.target.value));
                }}
                placeholder="e.g. Jaipur Food Explorers"
                className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2.5 font-normal outline-none focus:border-orange-700"
              />
            </label>
            <label className="text-sm font-medium text-stone-700">
              URL name
              <input
                name="slug"
                required
                maxLength={60}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={slug}
                onChange={(event) => {
                  setSlug(makeSlug(event.target.value));
                  setSlugEdited(true);
                }}
                placeholder="jaipur-food-explorers"
                className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2.5 font-normal outline-none focus:border-orange-700"
              />
            </label>
            <label className="text-sm font-medium text-stone-700 sm:col-span-2">
              City or destination
              <input
                name="city"
                required
                maxLength={120}
                placeholder="Jaipur, Rajasthan"
                className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2.5 font-normal outline-none focus:border-orange-700"
              />
            </label>
            <label className="text-sm font-medium text-stone-700 sm:col-span-2">
              Description
              <textarea
                name="description"
                maxLength={500}
                rows={3}
                placeholder="What brings travelers together in this community?"
                className="mt-2 w-full resize-y rounded-xl border border-stone-200 px-3 py-2.5 font-normal outline-none focus:border-orange-700"
              />
            </label>
            <label className="text-sm font-medium text-stone-700 sm:col-span-2">
              Cover image (optional)
              <span className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-stone-300 px-3 py-3 font-normal text-stone-500">
                <ImagePlus size={18} />
                <input name="cover_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
              </span>
            </label>
          </div>
          {formError && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {formError}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="mt-5 rounded-xl bg-orange-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create community"}
          </button>
        </form>
      )}

      {loadError && (
        <p role="status" className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Could not fetch created communities: {loadError}
        </p>
      )}

      <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-500">
          {loading ? "Loading communities..." : `${results.length} ${results.length === 1 ? "community" : "communities"}`}
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 sm:w-72">
          <Search size={18} className="text-stone-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search communities..."
            aria-label="Search communities"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {results.map((community) => (
          <CommunityCard key={community.id} community={community} />
        ))}
      </div>

      {!loading && results.length === 0 && (
        <p className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-500">
          No communities found. Try another search or create the first one.
        </p>
      )}
    </main>
  );
}
