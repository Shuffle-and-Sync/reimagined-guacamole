/**
 * Video feature types for TableSync video streaming
 */

export interface RTCConfiguration {
  iceServers: RTCIceServer[];
}

export interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export interface VideoRoomState {
  roomId: string;
  userId: string;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  peers: Map<string, PeerConnection>;
  isConnected: boolean;
  error: string | null;
}

export interface SignalingEvents {
  "join-video-room": (data: { roomId: string; userId: string }) => void;
  "leave-video-room": (data: { roomId: string; userId: string }) => void;
  "user-joined": (data: { userId: string }) => void;
  "user-left": (data: { userId: string }) => void;
  "existing-users": (data: { users: string[] }) => void;
  offer: (data: { offer: RTCSessionDescriptionInit; from: string }) => void;
  answer: (data: { answer: RTCSessionDescriptionInit; from: string }) => void;
  "ice-candidate": (data: {
    candidate: RTCIceCandidateInit;
    from: string;
  }) => void;
  error: (data: { message: string }) => void;
}

export interface MediaConstraints {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

export interface VideoLayoutType {
  type: "grid" | "focused" | "stack";
  focusedUserId?: string;
}

export interface VideoQualitySettings {
  resolution: "720p" | "480p" | "360p";
  frameRate: 30 | 24 | 15;
  bitrate: "auto" | number;
}
