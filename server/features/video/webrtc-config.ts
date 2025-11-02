/**
 * WebRTC Configuration
 *
 * ICE servers and WebRTC settings for video streaming
 */

export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  // Public STUN servers
  {
    urls: "stun:stun.l.google.com:19302",
  },
  {
    urls: "stun:stun1.l.google.com:19302",
  },
  {
    urls: "stun:stun2.l.google.com:19302",
  },
  // Add TURN server configuration here if available
  // {
  //   urls: 'turn:turn.example.com:3478',
  //   username: process.env.TURN_USERNAME,
  //   credential: process.env.TURN_PASSWORD,
  // },
];

export const DEFAULT_MEDIA_CONSTRAINTS = {
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

export const MOBILE_MEDIA_CONSTRAINTS = {
  video: {
    width: { ideal: 640, max: 1280 },
    height: { ideal: 480, max: 720 },
    frameRate: { ideal: 24, max: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

export const LOW_BANDWIDTH_CONSTRAINTS = {
  video: {
    width: { ideal: 480, max: 640 },
    height: { ideal: 360, max: 480 },
    frameRate: { ideal: 15, max: 24 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};
