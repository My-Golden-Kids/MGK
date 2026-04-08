import { BottomNavigation } from '@/components/common/BottomNavigation';

export default async function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 px-4 py-4">
        <div className="mx-auto flex h-dvh w-full max-w-[420px] flex-col md:max-w-[500px] lg:max-w-[640px]">
          {/* 상단 고정 */}
          <section className="px-8 pt-5 md:px-10 lg:px-12">
            <h1 className="text-center font-bold text-[28px] text-[var(--color-main-green)] md:text-[32px] lg:text-[36px]">
              상품
            </h1>
          </section>

          <section className="min-h-0 flex-1 overflow-y-auto">
            {/* {children} */}
          </section>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
