import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FloatingElementProps {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}

interface NoInternetProps {
    refresh: () => void;
}

// ─── FloatingElement ─────────────────────────────────────────────────────────

const FloatingElement = ({ children, delay = 0, className }: FloatingElementProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div
            className={cn(
                "transition-all duration-700 ease-out",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
                className
            )}
        >
            {children}
        </div>
    );
};

// ─── AnimatedWifiIcon ─────────────────────────────────────────────────────────

const AnimatedWifiIcon = () => (
    <div className="relative inline-flex items-center justify-center">
        {/* Ripple rings */}
        <span className="absolute w-28 h-28 rounded-full border-2 border-primary opacity-0 animate-[ripple_3s_ease-out_infinite]" />
        <span className="absolute w-28 h-28 rounded-full border-2 border-primary/60 opacity-0 animate-[ripple_3s_ease-out_infinite_1s]" />

        {/* Icon */}
        <WifiOff
            className="relative z-10 w-16 h-16 text-primary animate-[pulse-icon_2s_ease-in-out_infinite]"
            strokeWidth={1.5}
        />

        {/* Floating particles */}
        <span className="absolute top-[20%] left-[5%] w-1.5 h-1.5 rounded-full bg-primary animate-[particle1_4s_ease-in-out_infinite]" />
        <span className="absolute top-[30%] right-[5%] w-1 h-1 rounded-full bg-primary/70 animate-[particle2_3s_ease-in-out_infinite_1s]" />
    </div>
);

// ─── NoInternet ───────────────────────────────────────────────────────────────

const NoInternet = ({ refresh }: NoInternetProps) => {
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRefresh = useCallback(async () => {
        setIsRetrying(true);
        await new Promise((res) => setTimeout(res, 1000)); // visual feedback delay
        refresh();
        setIsRetrying(false);
    }, [refresh]);

    return (
        <>
            {/* Keyframe definitions */}
            <style>{`
        @keyframes ripple {
          0%   { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes pulse-icon {
          0%, 100% { transform: scale(1);    opacity: 0.8; }
          50%       { transform: scale(1.08); opacity: 1;   }
        }
        @keyframes particle1 {
          0%, 100% { transform: translate(0, 0)       scale(0.5); opacity: 0.3; }
          50%       { transform: translate(14px, -14px) scale(1);   opacity: 0.8; }
        }
        @keyframes particle2 {
          0%, 100% { transform: translate(0, 0)       scale(0.5); opacity: 0.3; }
          50%       { transform: translate(-10px, 10px) scale(1);   opacity: 0.8; }
        }
      `}</style>

            <div className="min-h-[calc(100vh-6rem)] sm:min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
                <div className="w-full max-w-md mx-auto">
                    <div className="flex flex-col items-center justify-center gap-8 text-center">

                        {/* Animated Icon */}
                        <FloatingElement delay={200}>
                            <AnimatedWifiIcon />
                        </FloatingElement>

                        {/* Text Content */}
                        <FloatingElement delay={400} className="space-y-6">
                            <div className="space-y-3 pt-4">
                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                                    No Internet Connection
                                </h1>
                                <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                    Please check your network connection and try again. Make sure
                                    you're connected to WiFi or mobile data.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                <Button
                                    size="lg"
                                    onClick={handleRefresh}
                                    disabled={isRetrying}
                                    className="w-full sm:w-auto min-w-44 gap-2 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    <RefreshCw
                                        className={cn("w-4 h-4", isRetrying && "animate-spin")}
                                    />
                                    {isRetrying ? "Checking..." : "Try Again"}
                                </Button>
                            </div>
                        </FloatingElement>

                    </div>
                </div>
            </div>
        </>
    );
};

export default NoInternet;