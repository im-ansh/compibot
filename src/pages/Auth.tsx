import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      authSchema.parse({ email, password });

      // Simple local storage auth (not secure, for demo only)
      const users = JSON.parse(localStorage.getItem("compibot_users") || "{}");

      if (isLogin) {
        if (users[email] && users[email] === password) {
          localStorage.setItem("compibot_user", email);
          toast({ title: "Welcome back!" });
          navigate("/");
        } else {
          toast({ title: "Invalid credentials", variant: "destructive" });
        }
      } else {
        if (users[email]) {
          toast({ title: "User already exists", variant: "destructive" });
        } else {
          users[email] = password;
          localStorage.setItem("compibot_users", JSON.stringify(users));
          localStorage.setItem("compibot_user", email);
          toast({ title: "Account created successfully!" });
          navigate("/");
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: error.errors[0].message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src="/compibot-icon.png" alt="Compibot" className="mx-auto h-20 w-20 mb-4" />
          <h1 className="font-serif text-4xl font-bold mb-2">Compibot</h1>
          <p className="text-muted-foreground">Your intelligent AI companion</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-black text-white hover:bg-black/90">
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
