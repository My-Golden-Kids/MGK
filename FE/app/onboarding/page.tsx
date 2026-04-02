import Image from "next/image";

export default function OnboardingPage() {
  return (
    <main
      className="relative min-h-dvh overflow-hidden bg-[#A7E9E1] animate-screen-dissolve-in"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          animation: "breathing-circle 4.8s ease-in-out infinite",
          transformOrigin: "center",
          willChange: "transform",
        }}
      >
        <Image
          src="/images/onboarding/circle2.png"
          alt=""
          fill
          priority
          className="object-contain object-center opacity-90"
        />
      </div>
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-10 md:px-8 md:py-12 lg:px-10 lg:py-14">
        <div className="absolute top-[5.5rem] left-1/2 flex w-[calc(100%-3rem)] max-w-[22rem] -translate-x-1/2 flex-col items-center md:top-[6.25rem] md:max-w-[24rem] lg:top-[7rem] lg:max-w-[26rem]">
          <div className="w-full rounded-[2rem] bg-[#75A39D] px-6 py-4 text-start text-2xl leading-[1.35] font-semibold whitespace-pre-line break-keep text-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] md:rounded-[2.25rem] md:px-7 md:py-5 md:text-3xl lg:rounded-[2.5rem] lg:px-8 lg:py-6 lg:text-4xl">
            {"안녕하세요\n저는 어르신을\n도와드릴 별송이에요!"}
          </div>
        </div>
        <Image
          src="/images/onboarding/byeolsong.png"
          alt="Byeolsong"
          width={1035}
          height={1035}
          priority
          className="absolute top-1/2 left-1/2 h-[min(23dvh,68vw)] w-auto max-w-[94vw] -translate-x-1/2 -translate-y-1/2 md:h-[min(26dvh,72vw)] lg:h-[min(30dvh,76vw)]"
        />
        <p className="absolute bottom-[10%] left-1/2 -translate-x-1/2 text-center text-2xl leading-[1.4] font-normal whitespace-pre-line text-black md:bottom-[9%] md:text-[1.7rem] lg:bottom-[8%] lg:text-[1.9rem]">
          {"핸드폰\n옆의 버튼을 눌러\n소리를 키워주세요!"}
        </p>
      </div>
    </main>
  );
}
