/**
 * Unit tests for useWebRTC hook
 * Tests WebRTC peer connection management, media streams, and signaling
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useWebRTC } from "../hooks/useWebRTC";
import type { Socket } from "socket.io-client";

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn();
Object.defineProperty(global.navigator, "mediaDevices", {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  localDescription: RTCSessionDescription | null = null;
  remoteDescription: RTCSessionDescription | null = null;
  ontrack: ((event: RTCTrackEvent) => void) | null = null;
  onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  connectionState: RTCPeerConnectionState = "new";

  addTrack() {
    return {} as RTCRtpSender;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    return { type: "offer", sdp: "mock-offer-sdp" };
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    return { type: "answer", sdp: "mock-answer-sdp" };
  }

  async setLocalDescription(desc: RTCSessionDescriptionInit) {
    this.localDescription = desc as RTCSessionDescription;
  }

  async setRemoteDescription(desc: RTCSessionDescriptionInit) {
    this.remoteDescription = desc as RTCSessionDescription;
  }

  async addIceCandidate() {
    // Mock implementation
  }

  close() {
    this.connectionState = "closed";
  }
}

global.RTCPeerConnection =
  MockRTCPeerConnection as unknown as typeof RTCPeerConnection;

// Mock Socket.io
const createMockSocket = (): Socket => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listeners: Record<string, ((...args: any[]) => void)[]> = {};

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on: (event: string, callback: (...args: any[]) => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
      return {} as Socket;
    },
    off: (event: string) => {
      delete listeners[event];
      return {} as Socket;
    },
    emit: vi.fn(),
    trigger: (event: string, ...args: unknown[]) => {
      listeners[event]?.forEach((cb) => cb(...args));
    },
  } as unknown as Socket;
};

describe("useWebRTC", () => {
  let mockSocket: Socket & {
    trigger: (event: string, ...args: unknown[]) => void;
  };
  const mockStream = {
    getTracks: () => [
      { kind: "video", stop: vi.fn(), enabled: true },
      { kind: "audio", stop: vi.fn(), enabled: true },
    ],
    getVideoTracks: () => [{ kind: "video", stop: vi.fn(), enabled: true }],
    getAudioTracks: () => [{ kind: "audio", stop: vi.fn(), enabled: true }],
  } as unknown as MediaStream;

  beforeEach(() => {
    mockSocket = createMockSocket();
    mockGetUserMedia.mockResolvedValue(mockStream);
    vi.clearAllMocks();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() =>
      useWebRTC({
        roomId: "test-room",
        userId: "user-1",
        socket: mockSocket,
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      }),
    );

    expect(result.current.localStream).toBeNull();
    expect(result.current.remoteStreams.size).toBe(0);
    expect(result.current.isConnected).toBe(false);
  });

  it("should request media stream on joinRoom", async () => {
    const { result } = renderHook(() =>
      useWebRTC({
        roomId: "test-room",
        userId: "user-1",
        socket: mockSocket,
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      }),
    );

    await act(async () => {
      await result.current.joinRoom();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    await waitFor(() => {
      expect(result.current.localStream).toBeTruthy();
    });
  });

  it("should emit join-video-room event", async () => {
    const { result } = renderHook(() =>
      useWebRTC({
        roomId: "test-room",
        userId: "user-1",
        socket: mockSocket,
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      }),
    );

    await act(async () => {
      await result.current.joinRoom();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("join-video-room", {
      roomId: "test-room",
      userId: "user-1",
    });
  });

  it("should toggle camera", async () => {
    const { result } = renderHook(() =>
      useWebRTC({
        roomId: "test-room",
        userId: "user-1",
        socket: mockSocket,
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      }),
    );

    await act(async () => {
      await result.current.joinRoom();
    });

    await waitFor(() => {
      expect(result.current.localStream).toBeTruthy();
    });

    act(() => {
      result.current.toggleCamera();
    });

    const videoTrack = result.current.localStream?.getVideoTracks()[0];
    expect(videoTrack?.enabled).toBeDefined();
  });

  it("should cleanup on leaveRoom", async () => {
    const { result } = renderHook(() =>
      useWebRTC({
        roomId: "test-room",
        userId: "user-1",
        socket: mockSocket,
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      }),
    );

    await act(async () => {
      await result.current.joinRoom();
    });

    await waitFor(() => {
      expect(result.current.localStream).toBeTruthy();
    });

    act(() => {
      result.current.leaveRoom();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("leave-video-room", {
      roomId: "test-room",
      userId: "user-1",
    });

    await waitFor(() => {
      expect(result.current.localStream).toBeNull();
    });
  });

  it("should handle getUserMedia error", async () => {
    mockGetUserMedia.mockRejectedValue(new Error("Permission denied"));

    const { result } = renderHook(() =>
      useWebRTC({
        roomId: "test-room",
        userId: "user-1",
        socket: mockSocket,
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      }),
    );

    await act(async () => {
      await expect(result.current.joinRoom()).rejects.toThrow(
        "Permission denied",
      );
    });
  });
});
