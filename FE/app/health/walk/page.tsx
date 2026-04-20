'use client';

import {
  Capacitor,
  type PluginListenerHandle,
  registerPlugin,
} from '@capacitor/core';
import { type LucideIcon, Pause, Play, Square } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import BackButton from '@/components/common/BackButton';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import MoneyBadge from '@/components/health/walk/MoneyBadge';
import WalkSummaryPanel, {
  type WalkHistoryRecord,
} from '@/components/health/walk/WalkSummaryPanel';
import PetProfileImage from '@/components/home/pet/PetProfileImage';
import { clientFetch } from '@/lib/client-fetch';
import { getStoredMedicalPetId } from '@/lib/medical-record';

const STEP_REWARD_UNIT = 3000;
const LIVE_WALK_SYNC_INTERVAL_MS = 500;
const LIVE_WALK_ACTIVE_STALE_MS = 3000;
const TEST_STEP_COUNT = 4200;
const TEST_WALK_TIME_SECONDS = 1800;
const isHealthTestFallbackEnabled =
  process.env.NEXT_PUBLIC_MGK_HEALTH_TEST_FALLBACK === 'true';

type WalkSaveResponse = {
  totalRewardAmount: number | string;
};

type WalkStatus = 'idle' | 'walking' | 'paused';
type NativeWalkStatus = 'IDLE' | 'WALKING' | 'PAUSED' | 'COMPLETED';
type MGKHealthStatus = 'WALKING' | 'PAUSED' | 'COMPLETED';

type MGKHealthStepResult = {
  stepCount: number;
  walkTimeSeconds?: number;
  measuredAt?: string;
  distanceKm?: number;
  source?: string;
  status?: MGKHealthStatus;
};

type MGKHealthWalkUpdate = MGKHealthStepResult & {
  sessionId: string;
};

declare global {
  interface Window {
    MGKHealth?: {
      getTodaySteps?: () => MGKHealthStepResult | Promise<MGKHealthStepResult>;
      startWalk?: () => MGKHealthWalkUpdate | Promise<MGKHealthWalkUpdate>;
      pauseWalk?: () => MGKHealthWalkUpdate | Promise<MGKHealthWalkUpdate>;
      stopWalk?: () => MGKHealthWalkUpdate | Promise<MGKHealthWalkUpdate>;
      addWalkUpdateListener?: (
        listener: (update: MGKHealthWalkUpdate) => void,
      ) => Promise<{ remove: () => Promise<void> }>;
    };
  }
}

type WalkMetrics = {
  stepCount: number;
  walkTimeSeconds: number;
  distanceKm: number;
  rewardAmount: number;
};

const EMPTY_WALK_METRICS: WalkMetrics = {
  stepCount: 0,
  walkTimeSeconds: 0,
  distanceKm: 0,
  rewardAmount: 0,
};

type WalkRecordResponse = {
  id: number;
  walkedAt: string;
  createdAt?: string | null;
  stepCount: number;
  walkTimeSeconds: number;
  distanceKm: number;
  rewardAmount: number;
};

type LiveWalkResponse = {
  stepCount?: number | null;
  walkTimeSeconds?: number | null;
  distanceKm?: number | null;
  completed?: boolean | null;
  status?: NativeWalkStatus | null;
  totalRewardAmount?: number | string | null;
  updatedAt?: string | null;
};

type WalkMetricInput = {
  stepCount?: number | null;
  walkTimeSeconds?: number | null;
  distanceKm?: number | null;
};

type MGKHealthPlugin = {
  getTodaySteps: () => Promise<MGKHealthStepResult>;
  startWalk: () => Promise<MGKHealthWalkUpdate>;
  pauseWalk: () => Promise<MGKHealthWalkUpdate>;
  stopWalk: () => Promise<MGKHealthWalkUpdate>;
  addListener: (
    eventName: 'walkUpdate',
    listenerFunc: (update: MGKHealthWalkUpdate) => void,
  ) => Promise<PluginListenerHandle>;
};

const nativeMGKHealth = registerPlugin<MGKHealthPlugin>('MGKHealth');

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}시간 ${String(minutes).padStart(2, '0')}분 ${String(seconds).padStart(2, '0')}초`;
}

function formatWalkDateTime(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${year}/${month}/${day} ${hours}시 ${minutes}분`;
}

function isFreshLiveWalk(updatedAt?: string | null) {
  if (!updatedAt) {
    return false;
  }

  const updatedAtTime = new Date(updatedAt).getTime();

  return (
    Number.isFinite(updatedAtTime) &&
    Date.now() - updatedAtTime <= LIVE_WALK_ACTIVE_STALE_MS
  );
}

function normalizeWalkMetrics(input: WalkMetricInput): WalkMetrics {
  const stepCount = Math.max(0, Math.floor(Number(input.stepCount) || 0));
  const walkTimeSeconds = Math.max(
    0,
    Math.floor(Number(input.walkTimeSeconds) || 0),
  );
  const distanceKm = Math.max(
    0,
    Number(input.distanceKm) || stepCount * 0.0007,
  );

  return {
    stepCount,
    walkTimeSeconds,
    distanceKm,
    rewardAmount: Math.floor(stepCount / STEP_REWARD_UNIT),
  };
}

function isEmptyWalkMetrics(metrics: WalkMetrics) {
  return (
    metrics.stepCount <= 0 &&
    metrics.walkTimeSeconds <= 0 &&
    metrics.distanceKm <= 0
  );
}

function toWalkHistoryRecord(record: WalkRecordResponse): WalkHistoryRecord {
  return {
    id: String(record.id),
    date: formatWalkDateTime(new Date(record.createdAt ?? record.walkedAt)),
    duration: formatDuration(record.walkTimeSeconds ?? 0),
    steps: `${(record.stepCount ?? 0).toLocaleString()}걸음`,
    distance: `${(record.distanceKm ?? 0).toFixed(2)}km`,
    point: String(record.rewardAmount ?? 0),
  };
}

function getWalkSource(update: MGKHealthWalkUpdate) {
  return update.source ?? `CORE_MOTION_${update.sessionId}`.slice(0, 50);
}

function splitLabel(label: string) {
  const characterCounts = new Map<string, number>();

  return Array.from(label, (character) => {
    const count = characterCounts.get(character) ?? 0;
    characterCounts.set(character, count + 1);

    return {
      id: `${character}-${count}`,
      character,
    };
  });
}

export default function WalkPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [walkStatus, setWalkStatus] = useState<WalkStatus>('idle');
  const [walkMetrics, setWalkMetrics] =
    useState<WalkMetrics>(EMPTY_WALK_METRICS);
  const [accountRewardAmount, setAccountRewardAmount] = useState(0);
  const [showLiveWalk, setShowLiveWalk] = useState(false);
  const [walkHistoryRecords, setWalkHistoryRecords] = useState<
    WalkHistoryRecord[]
  >([]);
  const [walkDate, setWalkDate] = useState('오늘 산책');
  const latestLiveWalkRef = useRef<MGKHealthWalkUpdate | null>(null);
  const lastLiveWalkSaveAtRef = useRef(0);
  const isWalking = walkStatus === 'walking';
  const primaryControlLabel = isWalking ? '일시정지' : '시작';
  const primaryControlIcon = isWalking ? Pause : Play;
  const currentRecord: WalkHistoryRecord = {
    id: 'current',
    date: walkDate,
    duration: formatDuration(walkMetrics.walkTimeSeconds),
    steps: `${walkMetrics.stepCount.toLocaleString()}걸음`,
    distance: `${walkMetrics.distanceKm.toFixed(2)}km`,
    point: String(walkMetrics.rewardAmount),
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || window.MGKHealth?.getTodaySteps) {
      return;
    }

    window.MGKHealth = {
      getTodaySteps: async () => {
        try {
          return await nativeMGKHealth.getTodaySteps();
        } catch (error) {
          console.error('MGKHealth native bridge failed.', error);

          if (!isHealthTestFallbackEnabled) {
            throw error;
          }

          return {
            stepCount: TEST_STEP_COUNT,
            walkTimeSeconds: TEST_WALK_TIME_SECONDS,
            measuredAt: new Date().toISOString(),
            source: 'CAPACITOR_TEST',
          };
        }
      },
      startWalk: () => nativeMGKHealth.startWalk(),
      pauseWalk: () => nativeMGKHealth.pauseWalk(),
      stopWalk: () => nativeMGKHealth.stopWalk(),
      addWalkUpdateListener: (listener) =>
        nativeMGKHealth.addListener('walkUpdate', listener),
    };
  }, []);

  useEffect(() => {
    setWalkDate(formatWalkDateTime(new Date()));
  }, []);

  const loadWalkRecords = useCallback(async () => {
    const response = await clientFetch(
      `/api/pets/${getStoredMedicalPetId()}/walk-records`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      return;
    }

    const records = (await response.json()) as WalkRecordResponse[];

    setWalkHistoryRecords(records.map(toWalkHistoryRecord));
  }, []);

  useEffect(() => {
    void loadWalkRecords();
  }, [loadWalkRecords]);

  const saveLiveWalkUpdate = useCallback(
    async (update: MGKHealthWalkUpdate, force = false, completed = false) => {
      const now = Date.now();
      const metrics = normalizeWalkMetrics(update);

      if (isEmptyWalkMetrics(metrics)) {
        return;
      }

      if (
        !force &&
        now - lastLiveWalkSaveAtRef.current < LIVE_WALK_SYNC_INTERVAL_MS
      ) {
        return;
      }

      lastLiveWalkSaveAtRef.current = now;

      const response = await clientFetch(
        `/api/pets/${getStoredMedicalPetId()}/walk`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            stepCount: metrics.stepCount,
            walkTimeSeconds: metrics.walkTimeSeconds,
            distanceKm: metrics.distanceKm,
            walkedAt: update.measuredAt ?? new Date().toISOString(),
            source: getWalkSource(update),
            completed,
            status: completed ? 'COMPLETED' : (update.status ?? 'WALKING'),
          }),
        },
      );

      if (!response.ok) {
        throw new Error('산책 기록 저장에 실패했습니다.');
      }

      return (await response.json()) as WalkSaveResponse;
    },
    [],
  );

  const applyLiveWalkUpdate = useCallback(
    (update: MGKHealthWalkUpdate, saveUpdate = true) => {
      latestLiveWalkRef.current = update;
      setWalkMetrics(normalizeWalkMetrics(update));
      setShowLiveWalk(true);

      if (saveUpdate) {
        void saveLiveWalkUpdate(update).catch(() => undefined);
      }
    },
    [saveLiveWalkUpdate],
  );

  useEffect(() => {
    let isMounted = true;

    const loadStoredWalkSummary = async () => {
      try {
        const response = await clientFetch(
          `/api/pets/${getStoredMedicalPetId()}/walk/live`,
          { cache: 'no-store' },
        );

        if (!response.ok) {
          return;
        }

        const liveWalk = (await response.json()) as LiveWalkResponse;

        setAccountRewardAmount(Number(liveWalk.totalRewardAmount ?? 0));

        if (!isMounted || latestLiveWalkRef.current) {
          return;
        }

        if (liveWalk.completed) {
          setShowLiveWalk(false);
          setWalkStatus('idle');
          void loadWalkRecords();
          return;
        }

        const metrics = normalizeWalkMetrics(liveWalk);

        if (isEmptyWalkMetrics(metrics)) {
          setShowLiveWalk(false);
          return;
        }

        const nextWalkStatus =
          liveWalk.status === 'WALKING' && isFreshLiveWalk(liveWalk.updatedAt)
            ? 'walking'
            : 'paused';

        setWalkMetrics(metrics);
        setShowLiveWalk(true);
        setWalkStatus(nextWalkStatus);
      } catch {}
    };

    loadStoredWalkSummary();
    const intervalId = window.setInterval(
      loadStoredWalkSummary,
      LIVE_WALK_SYNC_INTERVAL_MS,
    );

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [loadWalkRecords]);

  useEffect(() => {
    let listenerHandle: { remove: () => Promise<void> } | null = null;

    const addListener = async () => {
      listenerHandle =
        (await window.MGKHealth?.addWalkUpdateListener?.(
          applyLiveWalkUpdate,
        )) ?? null;
    };

    void addListener();

    return () => {
      void listenerHandle?.remove();
    };
  }, [applyLiveWalkUpdate]);

  const startLiveWalk = async () => {
    const startWalk = window.MGKHealth?.startWalk;

    if (!startWalk) {
      return false;
    }

    if (walkStatus === 'idle') {
      latestLiveWalkRef.current = null;
      lastLiveWalkSaveAtRef.current = 0;
      setWalkMetrics({ ...EMPTY_WALK_METRICS });
    }

    setShowLiveWalk(true);
    setWalkStatus('walking');

    const started = await startWalk();
    applyLiveWalkUpdate(started);
    return true;
  };

  const pauseLiveWalk = async () => {
    const pauseWalk = window.MGKHealth?.pauseWalk;

    if (!pauseWalk) {
      return;
    }

    setIsSyncing(true);

    const paused = await pauseWalk();
    const pausedUpdate =
      paused.stepCount > 0 ? paused : latestLiveWalkRef.current;

    if (pausedUpdate) {
      applyLiveWalkUpdate(pausedUpdate, false);
      await saveLiveWalkUpdate(pausedUpdate, true);
    }

    setWalkStatus('paused');
  };

  const stopLiveWalk = async () => {
    const stopWalk = window.MGKHealth?.stopWalk;

    if (!stopWalk) {
      return;
    }

    setIsSyncing(true);

    const stopped = await stopWalk();
    const finalUpdate =
      stopped.stepCount > 0 ? stopped : latestLiveWalkRef.current;

    if (finalUpdate) {
      applyLiveWalkUpdate(finalUpdate, false);
      const saved = await saveLiveWalkUpdate(finalUpdate, true, true);

      if (saved) {
        setAccountRewardAmount(Number(saved.totalRewardAmount ?? 0));
      }
    }

    latestLiveWalkRef.current = null;
    setShowLiveWalk(false);
    setWalkStatus('idle');
    await loadWalkRecords();
  };

  const handlePrimaryControlClick = async () => {
    if (isSyncing) {
      return;
    }

    if (walkStatus === 'walking') {
      try {
        await pauseLiveWalk();
      } catch {
      } finally {
        setIsSyncing(false);
      }

      return;
    }

    try {
      await startLiveWalk();
    } catch {
      if (walkStatus === 'idle') {
        setWalkStatus('idle');
      }
    }
  };

  const handleStopControlClick = async () => {
    if (isSyncing) {
      return;
    }

    if (walkStatus === 'idle') {
      return;
    }

    try {
      await stopLiveWalk();
    } catch {
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <main className="relative flex-1 overflow-hidden">
        <section className="relative">
          <Image
            src="/images/health/health_bg.png"
            alt="산책 배경"
            width={1440}
            height={720}
            priority
            sizes="100vw"
            className="h-auto w-full object-cover"
          />
          <div className="absolute top-6 left-6 z-20">
            <BackButton />
          </div>
          <div className="absolute top-6 right-6 z-20">
            <MoneyBadge amount={accountRewardAmount} />
          </div>
          <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
            <div className="relative flex h-[220px] w-[390px] items-center justify-center gap-6 md:h-[280px] md:w-[540px] md:gap-10 lg:h-[320px] lg:w-[620px] lg:gap-12">
              <div className="-top-15 -translate-x-1/2 md:-top-18 lg:-top-22 absolute left-1/2 w-[200px] md:w-[230px] lg:w-[260px]">
                <Image
                  src="/images/health/byeols.png"
                  alt=""
                  width={264}
                  height={264}
                  className="h-auto w-full object-contain"
                />
              </div>
              <WalkControlButton
                icon={primaryControlIcon}
                label={isSyncing ? '저장중' : primaryControlLabel}
                onClick={handlePrimaryControlClick}
              />
              <WalkControlButton
                icon={Square}
                label={isSyncing ? '저장중' : '정지'}
                onClick={handleStopControlClick}
              />
            </div>
          </div>
        </section>

        <div className="absolute right-0 bottom-0 left-0 z-30 h-[60%] overflow-hidden sm:h-[60%] md:h-[52%] lg:h-[40%]">
          <WalkSummaryPanel
            currentRecord={showLiveWalk ? currentRecord : undefined}
            records={walkHistoryRecords}
          />
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}

type WalkControlButtonProps = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
};

function WalkControlButton({
  icon: Icon,
  label,
  onClick,
}: WalkControlButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className="pointer-events-auto relative z-40 h-[150px] w-[150px] cursor-pointer md:h-[220px] md:w-[220px] lg:h-[250px] lg:w-[250px]"
      onClick={onClick}
    >
      <PetProfileImage className="h-[150px] w-[150px] cursor-pointer md:h-[220px] md:w-[220px] lg:h-[250px] lg:w-[250px]" />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 text-center font-bold text-[28px] text-white sm:text-[28px] md:text-[34px] lg:text-[40px]">
        <span className="flex items-center justify-center gap-[5px] sm:gap-[5px] md:gap-[10px] lg:gap-[12px]">
          {splitLabel(label).map(({ id, character }) => (
            <span key={id}>{character}</span>
          ))}
        </span>
        <Icon className="mt-3 h-12 w-12 fill-white stroke-white md:h-15 md:w-15 lg:h-18 lg:w-18" />
      </div>
    </button>
  );
}
