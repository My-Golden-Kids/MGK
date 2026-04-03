import { MapPin } from "lucide-react";

interface MedicalRecord {
  petName: string;
  details: string;
}

interface MedicalRecordItemProps {
  date: string; // "2026-01-01" 형태로 들어온다고 가정
  hospitalName: string;
  records: MedicalRecord[];
  totalAmount: number;
  variant?: "green" | "mint";
}

export default function MedicalRecordItem({
  date,
  hospitalName,
  records,
  totalAmount,
  variant = "green",
}: MedicalRecordItemProps) {
  const bgColor = variant === "mint" ? "bg-[#25C8A8]" : "bg-[#00A58C]";

  // 날짜 포맷팅 함수 (예: 2026-01-01 -> 2026년 01월 01일)
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${year}년 ${month}월 ${day}일`;
  };

  return (
    <div className={`relative rounded-3xl ${bgColor} p-6 text-white shadow-lg`}>
      <div className="mb-6 flex items-center justify-between">
        {/* 1. 날짜 표시 형식 수정 */}
        <p className="text-lg font-bold">{formatDate(date)}</p>

        {/* 2. 아이콘과 병원 이름 색상 통일 및 폰트 두께 조정 */}
        <div className="flex items-center gap-1 text-black/60">
          <MapPin size={16} />
          <p className="text-sm font-light">{hospitalName}</p>
        </div>
      </div>

      <div className="mb- space-y-2">
        {records.map((record, index) => (
          <div key={index} className="flex items-start gap-3">
            {/* 반려동물 이름 배지 */}
            <div className="flex-shrink-0 rounded-full bg-white px-4 py-1 shadow-sm">
              <p className="text-lg font-bold text-black">{record.petName}</p>
            </div>
            {/* 진료 내용 */}
            <p className="mt-1 text-lg font-medium leading-relaxed">
              {record.details}
            </p>
          </div>
        ))}
      </div>

      <div className="text-right mt-4">
        <p className="text-2xl font-bold">{totalAmount.toLocaleString()}원</p>
      </div>
    </div>
  );
}
