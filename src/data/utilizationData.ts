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

/**
 * Generates historical multi-day trend time-series data for tenant storage usage
 * and API request rates with linear regression trendlines.
 */
export function generateHistoricalTrendData(
  tenantId: string,
  storageQuotaMb: number,
  storageUsedMb: number,
  baseRps: number = 240,
  daysCount: number = 30
): import('../types').HistoricalTrendPoint[] {
  const points: import('../types').HistoricalTrendPoint[] = [];
  const now = new Date();
  const quotaGb = Math.round((storageQuotaMb / 1024) * 10) / 10;
  const currentStorageGb = Math.round((storageUsedMb / 1024) * 100) / 100;

  let seed = 0;
  for (let i = 0; i < tenantId.length; i++) {
    seed += tenantId.charCodeAt(i);
  }

  const pseudoRandom = (step: number) => {
    const x = Math.sin(seed + step * 19.313) * 43758.5453;
    return x - Math.floor(x);
  };

  // Historical starting storage: e.g. 60% of current storage 30 days ago
  const growthRate = 0.4 / daysCount; // gradual expansion

  for (let d = daysCount - 1; d >= 0; d--) {
    const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    const dayLabel = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    const progress = (daysCount - 1 - d) / Math.max(1, daysCount - 1);

    // Storage steadily climbs with minor fluctuations
    const baseStorage = currentStorageGb * (0.65 + progress * 0.35);
    const storageNoise = (pseudoRandom(d * 3) - 0.5) * (currentStorageGb * 0.04);
    const storageUsedGb = Math.max(0.5, Math.round((baseStorage + storageNoise) * 100) / 100);

    // API RPS shows weekly seasonality (lower on weekends) + steady growth trend
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendFactor = isWeekend ? 0.6 : 1.0;
    const rpsGrowthFactor = 1 + progress * 0.45; // +45% traffic growth
    const rpsNoise = (pseudoRandom(d * 7) - 0.5) * (baseRps * 0.25);
    const apiRps = Math.max(10, Math.round((baseRps * weekendFactor * rpsGrowthFactor + rpsNoise)));

    points.push({
      timestamp: date.toISOString(),
      dateLabel: dayLabel,
      storageUsedGb,
      storageQuotaGb: quotaGb,
      apiRps,
    });
  }

  // Calculate linear regression for storage trend and RPS trend
  const n = points.length;
  let sumX = 0, sumStorage = 0, sumRps = 0, sumXStorage = 0, sumXRps = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumStorage += points[i].storageUsedGb;
    sumRps += points[i].apiRps;
    sumXStorage += i * points[i].storageUsedGb;
    sumXRps += i * points[i].apiRps;
    sumX2 += i * i;
  }

  const denom = (n * sumX2 - sumX * sumX) || 1;
  const storageSlope = (n * sumXStorage - sumX * sumStorage) / denom;
  const storageIntercept = (sumStorage - storageSlope * sumX) / n;

  const rpsSlope = (n * sumXRps - sumX * sumRps) / denom;
  const rpsIntercept = (sumRps - rpsSlope * sumX) / n;

  return points.map((p, idx) => ({
    ...p,
    storageTrendGb: Math.round((storageIntercept + storageSlope * idx) * 100) / 100,
    rpsTrend: Math.round(rpsIntercept + rpsSlope * idx),
  }));
}
