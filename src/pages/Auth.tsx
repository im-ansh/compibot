import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { verifyApiKey } from "@/lib/gemini";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyStep, setShowApiKeyStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const hasApiKey = localStorage.getItem("gemini_api_key");
        const isOwner = session.user.email === "aaronvanoss@gmail.com";
        if (hasApiKey || isOwner) {
          navigate("/");
        } else {
          setShowApiKeyStep(true);
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      authSchema.parse({ email, password });

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({ title: error.message, variant: "destructive" });
        } else {
          const hasApiKey = localStorage.getItem("gemini_api_key");
          const isOwner = data.user?.email === "aaronvanoss@gmail.com";
          
          if (hasApiKey || isOwner) {
            toast({ title: "Welcome back!" });
            navigate("/");
          } else {
            setShowApiKeyStep(true);
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          toast({ title: error.message, variant: "destructive" });
        } else {
          const isOwner = data.user?.email === "aaronvanoss@gmail.com";
          
          if (isOwner) {
            toast({ title: "Account created! Check your email to confirm." });
            navigate("/");
          } else {
            toast({ title: "Account created! Now add your Gemini API key." });
            setShowApiKeyStep(true);
          }
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

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isValid = await verifyApiKey(apiKey);
      
      if (isValid) {
        localStorage.setItem("gemini_api_key", apiKey);
        toast({ title: "API key verified successfully!" });
        navigate("/");
      } else {
        toast({ 
          title: "Invalid API key", 
          description: "Please check your Gemini API key and try again.",
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Verification failed", 
        description: "Unable to verify API key. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (showApiKeyStep) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <img src="/compibot-icon.png" alt="Compibot" className="mx-auto h-20 w-20 mb-4" />
            <h1 className="font-serif text-4xl mb-2">Setup Your API Key</h1>
            <p className="text-muted-foreground">
              Enter your Gemini API key to use Compibot
            </p>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
            >
              Get your API key from Google AI Studio
            </a>
          </div>

          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Paste your Gemini API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-black text-white hover:bg-black/90">
              {loading ? "Verifying..." : "Verify & Continue"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src="/compibot-icon.png" alt="Compibot" className="mx-auto h-20 w-20 mb-4" />
          <h1 className="font-serif text-4xl mb-2">Compibot</h1>
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
