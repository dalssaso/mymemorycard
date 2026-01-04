import { useState } from "react";
import "./index.css";

function App() {
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement auth with TanStack Query
    console.log(isLogin ? "Login" : "Register", { password, username });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <h1 className="text-ctp-mauve mb-6 text-center">MyMemoryCard</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="auth-username">
                Username
              </label>
              <input
                id="auth-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input w-full"
                placeholder="Enter username"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              placeholder="Enter password"
            />
          </div>

          <button type="submit" className="btn btn-primary w-full">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="text-center mt-4 text-zinc-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-ctp-teal hover:text-cyan-400 transition-colors"
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default App;
