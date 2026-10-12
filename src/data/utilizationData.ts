import { ResourceUtilizationPoint } from '../types';

/**
 * Generates realistic 24-hour time-series data for a tenant's resource utilization
 * reflecting compute (CPU cores, pods, limit), memory (used MB, limit MB),
 * and storage (used GB, quota GB, IOPS, network Mbps).
 */
export function generateTenantUtilizationHistory(
  tenantId: string,
  storageQuotaMb: number,
  storageUsedMb: number,
  currentPods: number = 3,
  baseCpuPercent: number = 45
): ResourceUtilizationPoint[] {
  const points: ResourceUtilizationPoint[] = [];
  const hoursCount = 24;
  const now = new Date();
  
  // Seed random variation based on tenantId
  let seed = 0;
  for (let i = 0; i < tenantId.length; i++) {
    seed += tenantId.charCodeAt(i);
  }

  const pseudoRandom = (step: number) => {
    const x = Math.sin(seed + step * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  const storageQuotaGb = Math.round((storageQuotaMb / 1024) * 10) / 10;
  const initialStorageUsedGb = Math.round((storageUsedMb / 1024) * 100) / 100;
  const maxCpuCores = currentPods * 2; // e.g., 2 vCPU per pod limit

  for (let i = hoursCount - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = time.getHours();
    const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
    
    // Day vs Night traffic multiplier (peak between 11:00 and 17:00)
    const isPeakHour = hour >= 9 && hour <= 18;
    const peakFactor = isPeakHour ? 1.45 : 0.75;
    const noise = pseudoRandom(i) * 0.4 - 0.2; // -20% to +20%
    
    // Compute metrics
    const simulatedCpuPct = Math.min(
      95,
      Math.max(15, Math.round((baseCpuPercent * peakFactor + noise * 30)))
    );
    const cpuCoresUsed = Math.round(((simulatedCpuPct / 100) * maxCpuCores) * 100) / 100;

    // Memory metrics (e.g. 4096MB per pod)
    const memoryLimitMb = currentPods * 4096;
    const baseMemoryPct = 0.55 + (isPeakHour ? 0.25 : 0.05) + (noise * 0.1);
    const memoryUsedMb = Math.round(memoryLimitMb * Math.min(0.92, Math.max(0.2, baseMemoryPct)));

    // Storage slow growth over 24 hours
    const growthProgress = (hoursCount - i) / hoursCount;
    const storageUsedGb = Math.round((initialStorageUsedGb * (0.96 + growthProgress * 0.04)) * 100) / 100;

    // Dynamic Pods autoscaling fluctuation during peak
    let activePods = currentPods;
    if (simulatedCpuPct > 70) {
      activePods = currentPods + 1;
    } else if (simulatedCpuPct < 30 && currentPods > 2) {
      activePods = currentPods - 1;
    }

    const iops = Math.round(180 * peakFactor + pseudoRandom(i * 3) * 150);
    const bandwidthMbps = Math.round(45 * peakFactor + pseudoRandom(i * 7) * 40);

    points.push({
      timestamp: time.toISOString(),
      timeLabel,
      cpuCoresUsed,
      cpuLimitCores: maxCpuCores,
      cpuPercent: simulatedCpuPct,
      memoryUsedMb,
      memoryLimitMb,
      storageUsedGb,
      storageLimitGb: storageQuotaGb,
      activePods,
      iops,
      bandwidthMbps,
    });
  }

  return points;
}
