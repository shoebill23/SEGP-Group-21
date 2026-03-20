import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AccessDenied = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Lock className="h-16 w-16 text-destructive" />
        </div>
        <div>
          <h1 className="mb-2 text-4xl font-bold">403</h1>
          <p className="text-xl text-muted-foreground mb-2">Access Denied</p>
          <p className="text-muted-foreground">
            Your current role ({user?.role}) does not have access to this page.
          </p>
        </div>
        <div className="space-y-2">
          <Button onClick={() => navigate("/")} className="w-full">
            Return to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/login")}
            className="w-full"
          >
            Switch Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
