import { Profiler as ReactProfiler, ProfilerOnRenderCallback } from "react";
import { performanceMonitor } from "@/lib/performanceMonitor";

interface ProfilerProps {
  id: string;
  children: React.ReactNode;
  logToConsole?: boolean;
}

/**
 * Wrapper around React's Profiler that logs performance metrics
 * to our performance monitor
 *
 * @example
 * ```tsx
 * <Profiler id="Calendar">
 *   <Calendar />
 * </Profiler>
 * ```
 */
export const Profiler = ({
  id,
  children,
  logToConsole = false,
}: ProfilerProps) => {
  const onRenderCallback: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  ) => {
    // Add metric to performance monitor
    performanceMonitor.addMetric({
      id,
      phase,
      duration: actualDuration,
      timestamp: Date.now(),
    });

    // Optionally log to console in development
    if (logToConsole && process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log({
        id,
        phase,
        actualDuration: `${actualDuration.toFixed(2)}ms`,
        baseDuration: `${baseDuration.toFixed(2)}ms`,
        startTime,
        commitTime,
      });
    }
  };

  return (
    <ReactProfiler id={id} onRender={onRenderCallback}>
      {children}
    </ReactProfiler>
  );
};
