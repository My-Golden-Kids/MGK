import BackButton from '@/components/common/BackButton';

type PetDetailPageProps = {
  params: Promise<{
    petId: string;
  }>;
};

const text = {
  title: '반려동물 수정',
  description:
    '현재는 펫 ID를 기준으로 상세 페이지까지 이동되도록 연결된 상태입니다.',
  petNumber: '펫 ID',
} as const;

export default async function PetDetailPage({ params }: PetDetailPageProps) {
  const { petId } = await params;

  return (
    <div className="flex min-h-dvh flex-col bg-transparent">
      <main className="flex flex-1 flex-col px-5 pt-3 sm:px-6 sm:pt-4 md:px-8 md:pt-5 lg:px-10 lg:pt-6">
        <div className="pb-4 sm:pb-5 md:pb-6">
          <BackButton />
        </div>

        <section className="rounded-[28px] border border-[#D9D9D9] bg-white px-5 py-6 shadow-sm md:px-7 md:py-8 lg:px-8 lg:py-10">
          <h1 className="font-bold text-[1.6rem] text-black md:text-[2rem] lg:text-[2.25rem]">
            {text.title}
          </h1>
          <p className="mt-3 text-[#4B4B4B] text-base leading-relaxed md:text-lg lg:text-xl">
            {text.description}
          </p>
          <p className="mt-6 font-semibold text-[#00A389] text-lg md:text-xl lg:text-2xl">
            {text.petNumber}: {petId}
          </p>
        </section>
      </main>
    </div>
  );
}
