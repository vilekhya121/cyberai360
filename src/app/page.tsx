/* /app/page.tsx */
"use client";
import Image from "next/image";
import { Mail, Lock } from "lucide-react";
import MATHOPS_LOGO from "../../public/mathops.png";
import SIDE_IMAGE from "../../public/image.png";
import BG from "../../public/bg.png";
import { useState } from "react";
import { useRouter } from "next/navigation";

const LOGIN_URL = "https://nmqhfvs3-8000.inc1.devtunnels.ms/login";

// Password rule: at least one lowercase, one uppercase, one digit, one special char, min 8 chars
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg("Please enter your email.");
      return;
    }
    if (!PASSWORD_RULE.test(password)) {
      setErrorMsg(
        "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character (min 8 chars)."
      );
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      type LoginResponse = { message?: string };
      const data: LoginResponse = await res
        .json()
        .catch(() => ({} as LoginResponse));
      const msg = (data?.message || "").toString();

      if (res.ok && msg.toLowerCase().includes("logged in successfully")) {
        if (remember) {
          localStorage.setItem("mathops_user", JSON.stringify({ email }));
        } else {
          sessionStorage.setItem("mathops_user", JSON.stringify({ email }));
        }
        router.push("/overview");
      } else {
        setErrorMsg(
          msg ||
            "Login failed. Please verify your email & password and try again."
        );
      }
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* LEFT SIDEBAR — fixed 1/3 on md+, full width on mobile */}
      <aside
        className="w-full md:w-1/4 shadow md:shadow-lg border-r md:min-h-screen"
        style={{
          background: "linear-gradient(360deg, #E8EAF3 0%, #FFFFFF 100%)",
        }}
      >
        <div className="h-full px-8 md:px-10 py-8 mt-12 flex flex-col justify-between">
          <div>
            <Image
              src={MATHOPS_LOGO}
              alt="MathOps Logo"
              width={180}
              height={70}
              priority
            />
            <p className="mt-10 text-sm leading-relaxed text-[#194981]">
              <strong>MathOps</strong> is a cutting-edge platform combining
              advanced mathematical precision and operational efficiency,
              offering data-driven insights, resource optimization, and
              performance analytics to empower organizations with smarter,
              faster, and scalable decision-making solutions.
            </p>
          </div>

          <div className="mb-24">
            <Image
              src={SIDE_IMAGE}
              alt="Illustration"
              className="w-full max-w-sm mx-auto"
              priority
            />
          </div>
        </div>
      </aside>

      {/* RIGHT AREA — 2/3 with background + centered login card */}
      <section
        className="relative flex-1 min-h-[60vh] flex items-center justify-center px-4 py-10"
        style={{
          backgroundImage: `url(${BG.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Slight backdrop to make inputs pop on busy BG */}
        <div className="w-full max-w-xl">
          <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-lg px-6 sm:px-8 py-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Login</h2>

            {errorMsg && (
              <div className="mb-4 text-sm text-red-600 border border-red-200 bg-red-50 rounded p-2">
                {errorMsg}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="flex items-center border rounded-lg px-3 py-2">
                <Mail className="w-4 h-4 text-gray-500 mr-2" />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full outline-none text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="flex items-center border rounded-lg px-3 py-2">
                <Lock className="w-4 h-4 text-gray-500 mr-2" />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full outline-none text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember me
                </label>
                {/* Uncomment if you add route later */}
                {/* <a href="#" className="text-blue-800 hover:underline">Forgot Password?</a> */}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-900 text-white py-2 rounded-md shadow hover:bg-blue-800 disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <p className="text-[11px] text-gray-500 mt-1">
                Password must contain at least one lowercase letter, one
                uppercase letter, one digit, and one special character.
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
