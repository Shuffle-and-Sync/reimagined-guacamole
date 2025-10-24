interface PerformanceMetric {
  id: string;
  phase: "mount" | "update" | "nested-update";
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100;
  private enabled = process.env.NODE_ENV === "development";

  addMetric(metric: PerformanceMetric) {
    if (!this.enabled) return;

    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getAverageDuration(id: string): number {
    const componentMetrics = this.metrics.filter((m) => m.id === id);
    if (componentMetrics.length === 0) return 0;

    const sum = componentMetrics.reduce((acc, m) => acc + m.duration, 0);
    return sum / componentMetrics.length;
  }

  getSlowestComponents(limit = 10): Array<{ id: string; avgDuration: number }> {
    const componentIds = [...new Set(this.metrics.map((m) => m.id))];

    return componentIds
      .map((id) => ({
        id,
        avgDuration: this.getAverageDuration(id),
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }

  getMetricsByComponent(id: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.id === id);
  }

  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clear() {
    this.metrics = [];
  }

  printReport() {
    if (!this.enabled) {
      // eslint-disable-next-line no-console
      console.log("Performance monitoring is disabled in production");
      return;
    }

    // eslint-disable-next-line no-console
    console.group("📊 Performance Report");
    // eslint-disable-next-line no-console
    console.log("Total metrics:", this.metrics.length);
    // eslint-disable-next-line no-console
    console.log("\nSlowest components:");

    const slowest = this.getSlowestComponents(10);
    slowest.forEach((component, index) => {
      // eslint-disable-next-line no-console
      console.log(
        `${index + 1}. ${component.id}: ${component.avgDuration.toFixed(2)}ms`,
      );
    });

    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Make it available globally in development
if (process.env.NODE_ENV === "development") {
  (window as Record<string, unknown>).performanceMonitor = performanceMonitor;
}
