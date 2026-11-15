
import { MapPin, CalendarDays, Camera } from "lucide-react";
import { posts } from "../data";
import PostCard from "../components/PostCard";

export default function Profile() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <img
          src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=85"
          alt="Mountain lake cover"
          className="h-48 w-full object-cover sm:h-64"
        />

        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-orange-100 text-3xl font-semibold text-orange-900">
              AM
            </div>
            <button
              onClick={() => window.alert("Profile editing will be added in a later step.")}
              className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Edit profile
            </button>
          </div>

          <h1 className="mt-4 text-2xl font-semibold text-stone-900">Anuj Mehra</h1>
          <p className="mt-1 text-sm text-stone-500">@anujtravels</p>
          <p className="mt-4 max-w-2xl leading-7 text-stone-600">
            Exploring new places, finding local food, and learning the stories
            behind every destination.
          </p>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-500">
            <span className="flex items-center gap-1.5"><MapPin size={16} /> Bhopal, India</span>
            <span className="flex items-center gap-1.5"><CalendarDays size={16} /> Joined recently</span>
          </div>

          <div className="mt-6 grid grid-cols-3 border-t border-stone-100 pt-5 text-center">
            <div><p className="text-xl font-semibold text-stone-900">3</p><p className="mt-1 text-xs text-stone-500">Stories</p></div>
            <div><p className="text-xl font-semibold text-stone-900">8</p><p className="mt-1 text-xs text-stone-500">Places visited</p></div>
            <div><p className="text-xl font-semibold text-stone-900">42</p><p className="mt-1 text-xs text-stone-500">Connections</p></div>
          </div>
        </div>
      </section>

      <section className="mt-9">
        <h2 className="text-2xl font-semibold text-stone-900">Places I've explored</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { name: "Bhopal", image: "photo-1519608487953-e999c86e7455" },
            { name: "Manali", image: "photo-1464822759023-fed622ff2c3b" },
            { name: "Jaipur", image: "photo-1599661046827-dacff0c0f09a" },
            { name: "Goa", image: "photo-1512343879784-a960bf40e7f2" },
          ].map((place) => (
            <div key={place.name} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <img
                src={`https://images.unsplash.com/${place.image}?auto=format&fit=crop&w=600&q=80`}
                alt={place.name}
                loading="lazy"
                className="h-32 w-full object-cover"
              />
              <p className="p-3 text-sm font-medium text-stone-800">{place.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-9">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-stone-900">
          <Camera size={22} /> Travel stories
        </h2>
        <div className="mt-5 space-y-6">
          {posts.slice(0, 2).map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      </section>
    </main>
  );
}
