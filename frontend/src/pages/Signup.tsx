import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Compass,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  UserRound,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const travelInterests = [
  "Adventure",
  "Food",
  "Culture",
  "Nature",
  "Beaches",
  "Photography",
  "Road trips",
  "History",
];

export default function Signup() {
  const navigate = useNavigate();
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const latestDateOfBirth = today.toISOString().slice(0, 10);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function toggleInterest(interest: string) {
    setInterests((selected) =>
      selected.includes(interest)
        ? selected.filter((item) => item !== interest)
        : [...selected, interest]
    );
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (interests.length === 0) {
      setError("Choose at least one travel interest.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName.trim(),
            username: username.trim(),
            date_of_birth: dateOfBirth,
            location: location.trim(),
            interests,
            bio: bio.trim(),
          },
        },
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      if (data.session) {
        navigate("/", { replace: true });
        return;
      }

      setSuccess(
        "Your account is ready. Check your email to confirm your address, then sign in."
      );
    } catch (signupFailure) {
      setError(
        signupFailure instanceof Error
          ? signupFailure.message
          : "We couldn't create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="rounded-xl bg-orange-800 p-2 text-white">
            <Compass size={25} />
          </span>
          <span className="text-2xl font-bold text-stone-900">
            Travel Social
          </span>
        </Link>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-stone-900">
              Create your traveler profile
            </h1>
            <p className="mt-2 text-stone-500">
              Tell the community a little about you before you set off.
            </p>
          </header>

          <form onSubmit={handleSignup} className="space-y-6">
            <fieldset className="space-y-4">
              <legend className="mb-4 text-lg font-semibold text-stone-900">
                About you
              </legend>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-stone-700">
                  Full name
                  <span className="relative mt-2 block">
                    <UserRound
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                      autoComplete="name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                      maxLength={80}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-stone-300 py-3 pl-10 pr-4 outline-none focus:border-orange-700 focus:ring-2 focus:ring-orange-100"
                    />
                  </span>
                </label>

                <label className="block text-sm font-medium text-stone-700">
                  Username
                  <span className="relative mt-2 block">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                      @
                    </span>
                    <input
                      autoComplete="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      required
                      minLength={3}
                      maxLength={24}
                      pattern="[A-Za-z0-9_]+"
                      title="Use 3–24 letters, numbers, or underscores."
                      placeholder="yourusername"
                      className="w-full rounded-xl border border-stone-300 py-3 pl-9 pr-4 outline-none focus:border-orange-700 focus:ring-2 focus:ring-orange-100"
                    />
                  </span>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-stone-700">
                  Date of birth
                  <span className="relative mt-2 block">
                    <CalendarDays
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(event) => setDateOfBirth(event.target.value)}
                      required
                      max={latestDateOfBirth}
                      className="w-full rounded-xl border border-stone-300 py-3 pl-10 pr-4 outline-none focus:border-orange-700 focus:ring-2 focus:ring-orange-100"
                    />
                  </span>
                </label>

                <label className="block text-sm font-medium text-stone-700">
                  Where are you based?
                  <span className="relative mt-2 block">
                    <MapPin
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                    />
                    <input
                      autoComplete="address-level2"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      required
                      maxLength={100}
                      placeholder="City, country"
                      className="w-full rounded-xl border border-stone-300 py-3 pl-10 pr-4 outline-none focus:border-orange-700 focus:ring-2 focus:ring-orange-100"
                    />
                  </span>
                </label>
              </div>

              <label className="block text-sm font-medium text-stone-700">
                Short bio <span className="font-normal text-stone-400">(optional)</span>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  maxLength={240}
                  rows={3}
                  placeholder="What do you love about traveling?"
                  className="mt-2 w-full resize-y rounded-xl border border-stone-300 px-4 py-3 outline-none focus:border-orange-700 focus:ring-2 focus:ring-orange-100"
                />
              </label>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-stone-700">
                  Your travel interests
                </legend>
                <div className="flex flex-wrap gap-2">
                  {travelInterests.map((interest) => {
                    const selected = interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleInterest(interest)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition ${
                          selected
                            ? "border-orange-800 bg-orange-800 text-white"
                            : "border-stone-300 text-stone-700 hover:border-orange-700"
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </fieldset>

            <fieldset className="space-y-4 border-t border-stone-100 pt-5">
              <legend className="text-lg font-semibold text-stone-900">
                Sign-in details
              </legend>

              <label className="block text-sm font-medium text-stone-700">
                Email address
                <span className="relative mt-2 block">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-stone-300 py-3 pl-10 pr-4 outline-none focus:border-orange-700 focus:ring-2 focus:ring-orange-100"
                  />
                </span>
              </label>

              <label className="block text-sm font-medium text-stone-700">
                Password
                <span className="relative mt-2 block">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-stone-300 py-3 pl-10 pr-12 outline-none focus:border-orange-700 focus:ring-2 focus:ring-orange-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
            </fieldset>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {success && (
              <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-orange-800 py-3 font-semibold text-white transition hover:bg-orange-900 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-orange-800 hover:underline">
              Sign in
            </Link>
          </p>
          <p className="mt-4 text-center text-xs text-stone-400">
            Your date of birth is saved to your account and isn’t displayed on your public profile.
          </p>
        </section>
      </div>
    </main>
  );
}
