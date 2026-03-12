import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Loader2, ArrowRight, Camera, Clock, Send, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./shared/ThemeToggle";

function SwooshUnderline() {
  return (
    <svg
      viewBox="0 0 320 32"
      fill="none"
      className="w-[70%] h-auto mt-1"
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d="M8 20 C60 28, 120 8, 180 18 S280 10, 312 16"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="text-foreground/30"
        fill="none"
      />
    </svg>
  );
}

function PhoneMockup() {
  return (
    <div className="bg-card rounded-[2.5rem] shadow-2xl border border-border p-3 relative overflow-hidden w-[270px] lg:w-[290px]">
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2">
        <span className="text-xs font-medium text-foreground">9:41</span>
        <div className="w-20 h-5 bg-foreground rounded-full" />
        <div className="flex gap-1">
          <div className="w-4 h-2 bg-foreground/60 rounded-sm" />
          <div className="w-4 h-2 bg-foreground/60 rounded-sm" />
        </div>
      </div>

      {/* Stories row */}
      <div className="px-4 py-3">
        <div className="flex gap-3 overflow-hidden">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent p-[2px]">
              <div className="w-full h-full bg-card rounded-full flex items-center justify-center">
                <Camera className="w-5 h-5 text-primary" />
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">You</span>
          </div>
          {["Alex", "Sam", "Jo"].map((name, i) => (
            <div key={name} className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent p-[2px]">
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    backgroundColor: [
                      "hsl(200 60% 70%)",
                      "hsl(280 50% 70%)",
                      "hsl(140 50% 65%)",
                    ][i],
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat items */}
      <div className="px-4 space-y-3 pb-4">
        <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Send className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              Alex sent a snap
            </p>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                Expires in 8s
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Eye className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center shrink-0">
            <Camera className="w-4 h-4 text-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              Sam posted a story
            </p>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                23h remaining
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-sm">🔥</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              12-day streak with Jo
            </p>
            <span className="text-[10px] text-muted-foreground">
              Keep it going!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const LandingPage: React.FC = () => {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-dvh overflow-y-auto bg-landing relative">
      {/* Top nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5 max-w-7xl mx-auto w-full animate-fade-up">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Camera className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground text-lg tracking-tight">
            Ephemeral
          </span>
        </div>
        <ThemeToggle />
      </nav>

      {/* Main content */}
      <main className="relative z-10 min-h-[calc(100dvh-76px)] flex flex-col lg:flex-row items-center justify-center px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto w-full pb-16">
        {/* Left — text content */}
        <div className="flex-1 flex flex-col justify-center max-w-2xl">
          {/* Headline */}
          <h1 className="animate-fade-up-delay-1 leading-[0.88] select-none">
            <span className="block text-[3.25rem] sm:text-[4.5rem] md:text-[5.5rem] lg:text-[7rem] font-bold uppercase tracking-tighter text-foreground">
              Share the
            </span>
            <span className="block text-[3.25rem] sm:text-[4.5rem] md:text-[5.5rem] lg:text-[7rem] font-bold uppercase tracking-tighter text-primary italic font-display-serif">
              Moment
            </span>
            <SwooshUnderline />
          </h1>

          {/* Body card — matches reference's colored content panel */}
          <div className="mt-8 sm:mt-10 animate-fade-up-delay-2">
            <div className="bg-secondary rounded-3xl px-7 py-6 max-w-md">
              <p className="text-foreground/70 text-[15px] sm:text-base leading-relaxed">
                Capture, share, and let go. Photos and stories that disappear —
                because not everything needs to last forever.
              </p>

              <div className="mt-5">
                <Button
                  onClick={() => login()}
                  disabled={isLoggingIn}
                  size="lg"
                  className="h-12 px-7 rounded-full bg-foreground text-background hover:bg-foreground/90 text-sm font-medium shadow-lg transition-all"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in with Internet Identity
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right — phone + blob */}
        <div className="relative shrink-0 hidden md:flex items-center justify-center lg:mr-8 animate-fade-up-delay-2">
          {/* Organic blob */}
          <div className="absolute w-[400px] h-[480px] lg:w-[460px] lg:h-[540px] bg-landing-blob rounded-[40%_60%_55%_45%/50%_40%_60%_50%] -rotate-6 translate-x-2 translate-y-6" />

          {/* Tilted phone */}
          <div className="relative rotate-6 translate-y-2">
            <PhoneMockup />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-muted-foreground text-sm relative z-20">
        © 2026. Built with ❤️ using{" "}
        <a
          href="https://caffeine.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
};
