import { createFileRoute } from "@tanstack/react-router";

import { motion, AnimatePresence } from "motion/react";
import { useState, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
// import { Mail, ArrowLeft, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
} from "lucide-react";
import { pushToast } from "@/components/ui/sonner";
import { forgotPassword } from "@/api/auth";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

/* Input Field Component - matches project's design */
function Field({
  icon: Icon, label, type = "text", value, onChange, placeholder, autoComplete, error,
  rightSlot, id,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  rightSlot?: React.ReactNode;
  id: string;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <div
        className={cn(
          "relative flex items-center rounded-2xl glass transition-all duration-300",
          focus ? "ring-2 ring-primary/50 shadow-glow" : "",
          error ? "ring-2 ring-destructive/60" : "",
        )}
      >
        <Icon className={cn(
          "ml-3.5 h-4 w-4 shrink-0 transition-colors",
          focus ? "text-primary" : "text-muted-foreground"
        )} />
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className="w-full bg-transparent px-3 py-3.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
        />
        {rightSlot}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-err`}
            initial={{ opacity: 0, y: -4, x: 0 }}
            animate={{ opacity: 1, y: 0, x: [0, -4, 4, -2, 2, 0] }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.4 }}
            className="mt-1.5 text-xs text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Primary Button with Loading/Success states - matches project's design */
function PrimaryButton({
  status, label, success,
}: { status: "idle" | "loading" | "success"; label: string; success: string }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const id = Date.now();
    setRipples((p) => [...p, { x: e.clientX - r.left, y: e.clientY - r.top, id }]);
    setTimeout(() => setRipples((p) => p.filter((rp) => rp.id !== id)), 700);
  };
  return (
    <motion.button
      ref={btnRef}
      type="submit"
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={status !== "idle"}
      className="relative w-full overflow-hidden rounded-2xl bg-primary-gradient px-6 py-3.5
                 text-sm font-semibold text-primary-foreground shadow-glow
                 transition-shadow duration-300 hover:shadow-[0_0_80px_-5px_var(--glow)]
                 disabled:opacity-90 disabled:cursor-not-allowed"
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent hover:translate-x-full transition-transform duration-700" />
      {ripples.map((r) => (
        <motion.span key={r.id}
          className="pointer-events-none absolute rounded-full bg-white/40"
          style={{ left: r.x, top: r.y }}
          initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.6 }}
          animate={{ width: 400, height: 400, x: -200, y: -200, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      ))}
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          {status === "loading" ? (
            <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Working…
            </motion.span>
          ) : status === "success" ? (
            <motion.span key="s" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2">
              <Check className="h-4 w-4" /> {success}
            </motion.span>
          ) : (
            <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2">
              {label} <ArrowRight className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setStatus("loading");

    try {
      await forgotPassword(email);
      pushToast("success", "If this email exists, a password reset link has been sent.");
      setStatus("success");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong.");
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="relative glass-strong border border-white/[0.08] p-6 sm:p-8 rounded-3xl space-y-6 shadow-elegant">
          <Link
            to="/"
            onClick={() => {}}
            className="inline-flex items-center text-xs text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="h-3 w-3 mr-1" /> Back
          </Link>

          <div className="text-center">
            <h1 className="font-display text-2xl font-semibold">Forgot Password</h1>
            <p className="mt-2 text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Field
              id="fp-email"
              icon={Mail}
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
              error={error || undefined}
              autoComplete="email"
            />

            <PrimaryButton
              status={status}
              label="Send Reset Link"
              success="Link sent"
            />
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Remember your password?{" "}
            <Link to="/" className="text-primary hover:text-secondary transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

