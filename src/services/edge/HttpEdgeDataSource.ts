import type { EdgeDataSource } from '@/services/edge/EdgeDataSource';
import type {
  BinCategory,
  DisposalEvent,
  EdgeUpdate,
  SmartBin,
} from '@/types';
import { calculateFillPercentage, getStatus, isFillState } from '@/utils/bin';

type Listener = (update: EdgeUpdate) => void;
type JsonRecord = Record<string, unknown>;

const categories: BinCategory[] = ['plastic', 'metal', 'general'];

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Edge API returned an invalid ${field}.`);
  }
  return value;
}

function optionalString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function parseCategory(value: unknown): BinCategory {
  const normalized = value === 'paper' ? 'general' : value;
  if (!categories.includes(normalized as BinCategory)) {
    throw new Error(`Edge API returned an unknown bin category: ${String(value)}`);
  }
  return normalized as BinCategory;
}

function mapBin(value: unknown): SmartBin {
  if (!isRecord(value)) throw new Error('Edge API returned an invalid bin.');
  const category = parseCategory(value.category ?? value.id);
  const emptyDepthCm = requiredNumber(value.empty_depth_cm, 'empty_depth_cm');
  const distanceCm = requiredNumber(value.distance_cm, 'distance_cm');
  const reportedFill = value.fill_percent;
  const legacyFillPercent =
    typeof reportedFill === 'number' && Number.isFinite(reportedFill)
      ? Math.round(Math.min(100, Math.max(0, reportedFill)))
      : calculateFillPercentage(emptyDepthCm, distanceCm);
  const fillState = isFillState(value.fill_state)
    ? value.fill_state
    : getStatus(legacyFillPercent, true);
  const fillOnline = value.fill_online === true || value.sensor_online === true;
  const now = new Date().toISOString();

  return {
    id: category,
    category,
    name: optionalString(
      value.name,
      `${category[0].toUpperCase()}${category.slice(1)} Bin`,
    ),
    distanceCm,
    emptyDepthCm,
    status: fillOnline ? fillState : 'offline',
    fillSource: typeof value.fill_source === 'string' ? value.fill_source : null,
    fillConfidence:
      typeof value.fill_confidence === 'number' && Number.isFinite(value.fill_confidence)
        ? Math.min(1, Math.max(0, value.fill_confidence))
        : null,
    lastUpdated: optionalString(value.last_updated, now),
    lastEmptied: optionalString(value.last_emptied, now),
    itemCountToday:
      typeof value.item_count_today === 'number' &&
      Number.isFinite(value.item_count_today)
        ? Math.max(0, Math.round(value.item_count_today))
        : 0,
  };
}

function mapEvent(value: unknown): DisposalEvent {
  if (!isRecord(value)) throw new Error('Edge API returned an invalid event.');
  const category = parseCategory(value.category);
  const timestamp = optionalString(value.timestamp, new Date().toISOString());
  const detectedObject = optionalString(
    value.object ?? value.detected_object,
    `${category[0].toUpperCase()}${category.slice(1)} item`,
  );
  const rawConfidence = value.confidence;
  const confidence =
    typeof rawConfidence === 'number' && Number.isFinite(rawConfidence)
      ? Math.min(1, Math.max(0, rawConfidence))
      : undefined;

  return {
    id: optionalString(value.id, `${timestamp}-${category}-${detectedObject}`),
    detectedObject,
    category,
    confidence,
    timestamp,
    kind: value.kind === 'maintenance' ? 'maintenance' : 'disposal',
  };
}

export class HttpEdgeDataSource implements EdgeDataSource {
  private readonly baseUrl: string;
  private readonly pollIntervalMs: number;
  private readonly listeners = new Set<Listener>();
  private bins = new Map<string, SmartBin>();
  private seenEventIds = new Set<string>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private polling = false;
  private consecutiveFailures = 0;
  private connectionOnline: boolean | undefined;

  constructor(baseUrl: string, pollIntervalMs = 2_000) {
    const normalized = baseUrl.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(normalized)) {
      throw new Error('EXPO_PUBLIC_EDGE_URL must start with http:// or https://.');
    }
    if (!Number.isFinite(pollIntervalMs) || pollIntervalMs < 500) {
      throw new Error('Edge polling interval must be at least 500 ms.');
    }
    this.baseUrl = normalized;
    this.pollIntervalMs = pollIntervalMs;
  }

  async getBins(): Promise<SmartBin[]> {
    const bins = await this.fetchBins();
    this.bins = new Map(bins.map((bin) => [bin.id, bin]));
    this.connectionOnline = true;
    this.consecutiveFailures = 0;
    return bins;
  }

  async getRecentEvents(): Promise<DisposalEvent[]> {
    const events = await this.fetchEvents();
    this.seenEventIds = new Set(events.map((event) => event.id));
    return events;
  }

  subscribeToUpdates(callback: Listener): () => void {
    this.listeners.add(callback);
    if (this.listeners.size === 1) {
      this.timer = setInterval(() => void this.poll(), this.pollIntervalMs);
      void this.poll();
    }

    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0 && this.timer) {
        clearInterval(this.timer);
        this.timer = undefined;
      }
    };
  }

  async markEmptied(category: BinCategory): Promise<void> {
    const payload = await this.request<JsonRecord>(`/api/bins/${category}/emptied`, {
      method: 'POST',
    });
    const bin = mapBin(payload.bin);
    const event = mapEvent(payload.event);
    this.bins.set(bin.id, bin);
    this.seenEventIds.add(event.id);
    this.emit({ type: 'event_added', event, bin });
  }

  private async poll(): Promise<void> {
    if (this.polling) return;
    this.polling = true;
    try {
      const [nextBins, nextEvents] = await Promise.all([
        this.fetchBins(),
        this.fetchEvents(),
      ]);
      this.consecutiveFailures = 0;
      if (this.connectionOnline !== true) {
        this.connectionOnline = true;
        this.emit({ type: 'connection_changed', online: true });
      }

      const nextBinMap = new Map(nextBins.map((bin) => [bin.id, bin]));
      nextBins.forEach((bin) => {
        const previous = this.bins.get(bin.id);
        if (!previous || JSON.stringify(previous) !== JSON.stringify(bin)) {
          this.emit({ type: 'bin_updated', bin });
        }
      });

      nextEvents
        .filter((event) => !this.seenEventIds.has(event.id))
        .reverse()
        .forEach((event) => {
          this.emit({
            type: 'event_added',
            event,
            bin: nextBinMap.get(event.category),
          });
        });

      this.bins = nextBinMap;
      nextEvents.forEach((event) => this.seenEventIds.add(event.id));
      if (this.seenEventIds.size > 500) {
        this.seenEventIds = new Set(nextEvents.map((event) => event.id));
      }
    } catch {
      this.consecutiveFailures += 1;
      if (this.consecutiveFailures >= 3 && this.connectionOnline !== false) {
        this.connectionOnline = false;
        this.emit({ type: 'connection_changed', online: false });
      }
    } finally {
      this.polling = false;
    }
  }

  private async fetchBins(): Promise<SmartBin[]> {
    const payload = await this.request<JsonRecord>('/api/bins');
    if (!Array.isArray(payload.bins)) {
      throw new Error('Edge API response is missing bins.');
    }
    return payload.bins.map(mapBin);
  }

  private async fetchEvents(): Promise<DisposalEvent[]> {
    const payload = await this.request<JsonRecord>('/api/events?limit=50');
    if (!Array.isArray(payload.events)) {
      throw new Error('Edge API response is missing events.');
    }
    return payload.events.map(mapEvent);
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4_000);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: { Accept: 'application/json', ...init?.headers },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Edge API request failed with HTTP ${response.status}.`);
      }
      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private emit(update: EdgeUpdate): void {
    this.listeners.forEach((listener) => listener(update));
  }
}
