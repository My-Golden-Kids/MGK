import { BottomNavigation } from '@/components/common/BottomNavigation';
import { Footprints, NotebookPen, Syringe } from 'lucide-react';

const healthActions = [
  {
    label: '산책',
    icon: Footprints,
    className: 'col-span-2 bg-[#37C95A]',
  },
  {
    label: '접종',
    icon: Syringe,
    className: 'bg-[#4EC9CC]',
  },
  {
    label: '병원기록',
    icon: NotebookPen,
    className: 'bg-[#F2BC17]',
  },
];

export default function HealthPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <main className="flex flex-1 items-center justify-center px-10 py-6">
        <section className="grid w-full grid-cols-2 gap-2.5">
          {healthActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.label}
                type="button"
                className={`flex aspect-[1.9/1] flex-col items-center justify-center rounded-[8px] text-white ${action.className} ${
                  action.label === '산책' ? '' : 'aspect-square'
                }`}
              >
                <Icon className="mb-3 h-20 w-18 stroke-[1.2]" />
                <span className="font-bold text-[34px] leading-none">
                  {action.label}
                </span>
              </button>
            );
          })}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
