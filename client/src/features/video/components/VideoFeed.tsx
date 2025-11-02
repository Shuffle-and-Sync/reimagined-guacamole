import { Video, VideoOff, Mic, MicOff } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VideoFeedProps {
  stream: MediaStream | null;
  userId?: string;
  userName?: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isCameraOff?: boolean;
  onToggleCamera?: () => void;
  onToggleMicrophone?: () => void;
  className?: string;
  cardRecognitionOverlay?: React.ReactNode;
  enableCardRecognition?: boolean;
}

export interface VideoFeedHandle {
  videoElement: HTMLVideoElement | null;
}

export const VideoFeed = forwardRef<VideoFeedHandle, VideoFeedProps>(
  function VideoFeed(
    {
      stream,
      userName = "Player",
      isLocal = false,
      isMuted = false,
      isCameraOff = false,
      onToggleCamera,
      onToggleMicrophone,
      className,
      cardRecognitionOverlay,
      enableCardRecognition = false,
    },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasVideo, setHasVideo] = useState(false);
    const [hasAudio, setHasAudio] = useState(false);

    // Expose videoRef to parent component
    useImperativeHandle(ref, () => ({
      videoElement: videoRef.current,
    }));

    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    // Track video and audio state
    useEffect(() => {
      if (!stream) return;

      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      const updateMediaState = () => {
        setHasVideo(
          videoTracks.length > 0 && (videoTracks[0]?.enabled ?? false),
        );
        setHasAudio(
          audioTracks.length > 0 && (audioTracks[0]?.enabled ?? false),
        );
      };

      updateMediaState();

      // Listen for track state changes
      videoTracks.forEach((track) => {
        track.addEventListener("ended", updateMediaState);
      });
      audioTracks.forEach((track) => {
        track.addEventListener("ended", updateMediaState);
      });

      return () => {
        videoTracks.forEach((track) => {
          track.removeEventListener("ended", updateMediaState);
        });
        audioTracks.forEach((track) => {
          track.removeEventListener("ended", updateMediaState);
        });
      };
    }, [stream]);

    return (
      <Card
        className={cn(
          "relative overflow-hidden bg-gray-900 aspect-video",
          className,
        )}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Always mute local video to prevent echo
          className={cn(
            "w-full h-full object-cover",
            (!hasVideo || isCameraOff) && "hidden",
          )}
        />

        {/* Placeholder when camera is off */}
        {(!hasVideo || isCameraOff) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                <VideoOff className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-300 font-medium">{userName}</p>
              <p className="text-gray-500 text-sm">Camera Off</p>
            </div>
          </div>
        )}

        {/* User info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium text-sm">{userName}</span>
              {isLocal && (
                <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-0.5 rounded">
                  You
                </span>
              )}
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-2">
              {!hasAudio || isMuted ? (
                <MicOff className="w-4 h-4 text-red-400" />
              ) : (
                <Mic className="w-4 h-4 text-green-400" />
              )}

              {!hasVideo || isCameraOff ? (
                <VideoOff className="w-4 h-4 text-red-400" />
              ) : (
                <Video className="w-4 h-4 text-green-400" />
              )}
            </div>
          </div>
        </div>

        {/* Local controls */}
        {isLocal && (onToggleCamera || onToggleMicrophone) && (
          <div className="absolute top-3 right-3 flex gap-2">
            {onToggleCamera && (
              <Button
                size="sm"
                variant={isCameraOff ? "destructive" : "secondary"}
                onClick={onToggleCamera}
                className="w-9 h-9 p-0"
              >
                {isCameraOff ? (
                  <VideoOff className="w-4 h-4" />
                ) : (
                  <Video className="w-4 h-4" />
                )}
              </Button>
            )}

            {onToggleMicrophone && (
              <Button
                size="sm"
                variant={isMuted ? "destructive" : "secondary"}
                onClick={onToggleMicrophone}
                className="w-9 h-9 p-0"
              >
                {isMuted ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        )}

        {/* Card recognition overlay */}
        {enableCardRecognition && cardRecognitionOverlay}
      </Card>
    );
  },
);
