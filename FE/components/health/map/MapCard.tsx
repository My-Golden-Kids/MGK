import Image from 'next/image';

type MapCardProps = {
  name: string;
  distance: string;
  walkTime: string;
  address: string;
  description?: string | null;
  onGuideClick?: () => void;
  onCallClick?: () => void;
};

export default function MapCard({
  name,
  distance,
  walkTime,
  address,
  description,
  onGuideClick,
  onCallClick,
}: MapCardProps) {
  return (
    <section className="flex items-center justify-center">
      <div className="w-full max-w-[340px] rounded-[32px] border-4 border-[#63E7AF] bg-[#DDE9E3] p-4 md:max-w-[400px] md:rounded-[36px] md:p-5 lg:max-w-[520px] lg:rounded-[40px] lg:p-6">
        <div className="flex flex-col">
          <h3 className="font-bold text-[20px] text-black leading-tight md:text-[24px] lg:text-[30px]">
            {name}
          </h3>

          <p className="mt-1 font-bold text-[16px] text-black leading-tight md:mt-1.5 md:text-[20px] lg:mt-2 lg:text-[24px]">
            {distance}
            <span className="ml-3">({walkTime})</span>
          </p>
        </div>

        <div className="mt-4 rounded-[20px] border-3 border-[#63E7AF] bg-[#F5F5F5] p-3 md:mt-5 md:rounded-[24px] md:p-4 lg:mt-6 lg:rounded-[28px] lg:p-5">
          <p className="font-bold text-[14px] text-black leading-snug md:text-[18px] lg:text-[22px]">
            {address}
          </p>
          {description && (
            <div className="mt-1 flex items-start md:mt-2 lg:mt-3">
              <span className="mr-1.5 font-extrabold text-[#6FF7BB] text-[20px] leading-none md:mr-2 md:text-[24px] lg:mr-2.5 lg:text-[30px]">
                ✓
              </span>

              <p className="font-bold text-[12px] text-black leading-snug md:text-[16px] lg:text-[20px]">
                {description}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 md:mt-5 md:gap-5 lg:mt-6 lg:gap-6">
          <button
            type="button"
            onClick={onGuideClick}
            className="flex h-[40px] w-[150px] items-center justify-center gap-2 rounded-full bg-[#009951] font-bold text-[16px] text-white transition active:scale-[0.98] md:h-[48px] md:w-[180px] md:text-[20px] lg:h-[56px] lg:min-w-[220px] lg:text-[24px]"
          >
            <Image
              src="/images/map/img_place.png"
              alt="길안내 이미지"
              width={20}
              height={20}
              className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6"
            />
            <span>길안내</span>
          </button>

          <button
            type="button"
            onClick={onCallClick}
            className="flex h-[40px] w-[150px] items-center justify-center gap-2 rounded-full bg-[#4D5C72] font-bold text-[16px] text-white transition active:scale-[0.98] md:h-[48px] md:w-[180px] md:text-[20px] lg:h-[56px] lg:min-w-[220px] lg:text-[24px]"
          >
            <Image
              src="/images/map/img_call.png"
              alt="전화기 이미지"
              width={20}
              height={20}
              className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6"
            />
            <span>전화</span>
          </button>
        </div>
      </div>
    </section>
  );
}
