import { Flag, Shield, Trophy } from "lucide-react";

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 w-32 h-32 border-4 border-primary/30 border-t-primary rounded-full animate-spin-slow" />
        
        {/* Middle pulsing ring */}
        <div className="absolute inset-4 w-24 h-24 border-4 border-chart-3/30 border-t-chart-3 rounded-full animate-spin-reverse" />
        
        {/* Inner pulsing circle */}
        <div className="absolute inset-8 w-16 h-16 bg-gradient-to-br from-primary via-chart-3 to-chart-5 rounded-full animate-pulse flex items-center justify-center">
          <Flag className="h-8 w-8 text-white animate-bounce" />
        </div>

        {/* Orbiting icons */}
        <div className="absolute inset-0 w-32 h-32 animate-spin-slow">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            <div className="bg-primary rounded-full p-2">
              <Shield className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 w-32 h-32 animate-spin-reverse">
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <div className="bg-chart-5 rounded-full p-2">
              <Trophy className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading text */}
      <div className="absolute top-2/3 left-1/2 -translate-x-1/2 mt-8">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold animate-pulse">Loading</span>
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
            <span className="w-2 h-2 bg-chart-3 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            <span className="w-2 h-2 bg-chart-5 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
