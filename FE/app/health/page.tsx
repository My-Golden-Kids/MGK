'use client';

import { Footprints, NotebookPen, Syringe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import { HealthButton } from '@/components/health/HealthButton';

export default function HealthPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <main className="flex flex-1 items-center justify-center px-6 py-6">
        <section className="grid w-full max-w-[596px] grid-cols-2 gap-[20px]">
          <HealthButton
            className="col-span-2"
            onClick={() => router.push('/health/walk')}
            variant="green"
            size="wide"
            icon={<Footprints />}
            label="산책"
          />
          <HealthButton
            onClick={() => router.push('/health/vaccinations')}
            variant="mint"
            size="square"
            icon={<Syringe />}
            label="접종"
          />
          <HealthButton
            variant="yellow"
            size="square"
            onClick={() => router.push('/health/medical-records')}
            icon={<NotebookPen />}
            label="병원기록"
          />
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
