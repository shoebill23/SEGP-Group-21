import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Floating particle component for animated background
 * Creates a professional algae-themed visualization
 */
function FloatingParticles() {
  const [particles, setParticles] = useState<Array<{ id: string; x: number; y: number; duration: number; delay: number; size: number; glowSize: number }>>([]);

  useEffect(() => {
    // Generate random floating particles with all properties pre-calculated
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: `particle-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 15 + Math.random() * 10,
      delay: Math.random() * 5,
      size: Math.random() * 40 + 30,
      glowSize: Math.random() * 20 + 15,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style>{`
        @keyframes float-wave {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-30px) translateX(15px);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-60px) translateX(0px);
            opacity: 0.4;
          }
          75% {
            transform: translateY(-30px) translateX(-15px);
            opacity: 0.5;
          }
        }
        
        .floating-particle {
          position: absolute;
          border-radius: 50%;
          filter: blur(1px);
          animation: float-wave infinite ease-in-out;
          will-change: transform;
        }
      `}</style>
      
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="floating-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: `radial-gradient(circle, rgba(72, 187, 120, 0.4) 0%, rgba(52, 168, 83, 0.2) 70%, transparent 100%)`,
            boxShadow: `0 0 ${particle.glowSize}px rgba(72, 187, 120, 0.3)`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Validate inputs
      if (!email.trim()) {
        throw new Error("Email is required");
      }
      if (!password) {
        throw new Error("Password is required");
      }

      // Attempt login
      await login(email, password);

      // Redirect to dashboard on success
      navigate("/", { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingParticles />
      
      <div className="w-full max-w-md relative z-10">
        {/* Header Section - Takes more space */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Microalgae Monitor
          </h1>
          <p className="text-lg text-muted-foreground">
            Algae International Berhad
          </p>
          <div className="pt-4 pb-6">
            <div className="h-1 w-16 bg-gradient-to-r from-primary via-accent to-primary mx-auto rounded-full"></div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="bg-card/95 backdrop-blur-sm border border-border shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <h2 className="text-2xl font-bold text-foreground">Sign In</h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access the dashboard
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@algae.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || isLoading}
                  className="bg-secondary/50 border-border focus:bg-secondary"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting || isLoading}
                    className="bg-secondary/50 border-border focus:bg-secondary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting || isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 gap-2"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-12 text-center text-xs text-muted-foreground">
          <p>For security issues, contact IT support</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
