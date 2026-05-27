import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage("Check your email to confirm your account!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", padding: 24 }}>
      <h2 style={{ color: "#1A4731" }}>
        {isSignUp ? "Create Account" : "Sign In to FreshTrack"}
      </h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 12, padding: 10, fontSize: 15 }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: 12, padding: 10, fontSize: 15 }}
      />
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ width: "100%", padding: 12, background: "#2D6A4F", color: "white", border: "none", fontSize: 15, cursor: "pointer" }}
      >
        {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
      </button>
      {message && <p style={{ marginTop: 12, color: "#555" }}>{message}</p>}
      <p
        onClick={() => setIsSignUp(!isSignUp)}
        style={{ marginTop: 16, cursor: "pointer", color: "#2D6A4F" }}
      >
        {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
      </p>
    </div>
  );
}