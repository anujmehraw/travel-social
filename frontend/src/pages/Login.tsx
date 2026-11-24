
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Compass } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      navigate("/");
    } catch (loginFailure) {
      setError(
        loginFailure instanceof Error
          ? loginFailure.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-orange-800 text-white p-2 rounded-xl">
            <Compass size={25} />
          </div>
          <span className="text-2xl font-bold text-stone-900">
            Travel Social
          </span>
        </Link>

        {/* Login Card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-stone-900">
              Welcome back!
            </h1>
            <p className="text-stone-500 mt-2">
              Sign in to continue your journey.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full border border-stone-300 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-orange-700 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full border border-stone-300 rounded-xl py-3 pl-11 pr-12 outline-none focus:border-orange-700 focus:ring-2 focus:ring-orange-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-orange-800 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-800 hover:bg-orange-900 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>

          <div className="relative my-7">
            <div className="border-t border-stone-200" />
            <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-3 text-sm text-stone-400">
              New to Travel Social?
            </span>
          </div>

          <Link
            to="/signup"
            className="block text-center w-full border border-stone-300 hover:bg-stone-50 py-3 rounded-xl font-semibold text-stone-800 transition"
          >
            Create an account
          </Link>
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          Discover places. Share stories. Find your people.
        </p>

      </div>
    </div>
  );
}
