import Image from "next/image";

export default function Home() {
  return (
    <main className="relative h-dvh overflow-hidden bg-[#018D70]">
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/images/onboarding/circle.png"
          alt=""
          fill
          priority
          className="object-cover object-center opacity-90"
        />
      </div>
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-[1vh] px-3 py-[1vh]">
        <Image
          src="/images/onboarding/logo.png"
          alt="MGK logo"
          width={300}
          height={169}
          priority
          className="h-[min(19dvh,36vw)] w-auto md:h-[min(22dvh,42vw)] lg:h-[min(26dvh,44vw)]"
        />
        <Image
          src="/images/onboarding/protagonist.png"
          alt="Main character"
          width={371}
          height={252}
          priority
          className="h-[min(26dvh,68vw)] w-auto max-w-[94vw] md:h-[min(32dvh,78vw)] lg:h-[min(37dvh,82vw)]"
        />
        <Image
          src="/images/onboarding/characters.png"
          alt="Supporting characters"
          width={358}
          height={272}
          priority
          className="h-[min(32dvh,72vw)] w-auto max-w-[94vw] md:h-[min(38dvh,82vw)] lg:h-[min(42dvh,86vw)]"
        />
      </div>
    </main>
  );
}
