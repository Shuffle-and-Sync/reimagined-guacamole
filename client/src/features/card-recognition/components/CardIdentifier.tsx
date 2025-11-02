/**
 * CardIdentifier Component
 *
 * Overlay that allows clicking on video to identify cards
 */

import { Loader2, MousePointerClick } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CardIdentifierProps {
  videoRef: React.RefObject<{ videoElement: HTMLVideoElement | null }>;
  isEnabled: boolean;
  onIdentify: (
    videoElement: HTMLVideoElement,
    x: number,
    y: number,
  ) => Promise<void>;
  isRecognizing: boolean;
  error?: string | null;
}

export function CardIdentifier({
  videoRef,
  isEnabled,
  onIdentify,
  isRecognizing,
  error,
}: CardIdentifierProps) {
  const [clickPosition, setClickPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    const videoElement = videoRef.current?.videoElement;
    if (!isEnabled || isRecognizing || !videoElement) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert to video coordinates
    const scaleX = videoElement.videoWidth / rect.width;
    const scaleY = videoElement.videoHeight / rect.height;
    const videoX = x * scaleX;
    const videoY = y * scaleY;

    setClickPosition({ x, y });

    try {
      await onIdentify(videoElement, videoX, videoY);
    } finally {
      // Clear click position after a delay
      setTimeout(() => setClickPosition(null), 2000);
    }
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <div className="relative">
      {/* Click overlay */}
      <div
        className={`absolute inset-0 z-10 ${
          isRecognizing ? "cursor-wait" : "cursor-crosshair"
        }`}
        onClick={handleClick}
      >
        {/* Click indicator */}
        {clickPosition && (
          <div
            className="absolute w-8 h-8 -ml-4 -mt-4 border-4 border-blue-500 rounded-full animate-ping"
            style={{ left: clickPosition.x, top: clickPosition.y }}
          />
        )}

        {/* Recognition in progress indicator */}
        {isRecognizing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
              <p className="text-sm mt-2 text-center">Recognizing card...</p>
            </div>
          </div>
        )}

        {/* Help text when idle */}
        {!isRecognizing && !clickPosition && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="bg-black/70 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <MousePointerClick className="w-4 h-4" />
              <span className="text-sm">Click on a card to identify it</span>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
