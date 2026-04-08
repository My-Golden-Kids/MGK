import { BottomNavigation } from "@/components/common/BottomNavigation";
import Calendar from "@/components/health/vaccination/Calendar";
import VaccinationListSection from "@/components/health/vaccination/VaccinationListSection";

const sampleVaccinationItems = [
  {
    id: 1,
    title: '광견병',
    totalCount: 3,
    lastDate: '2024-01-01',
    nextDate: '2024-07-01',
    history: [
      { date: '2023-01-01', completed: true },
      { date: '2023-07-01', completed: true },
      { date: '2024-01-01', completed: true },
    ],
  },
  {
    id: 2,
    title: '종합백신',
    totalCount: 2,
    lastDate: '2023-12-01',
    nextDate: '2024-06-01',
    history: [
      { date: '2023-06-01', completed: true },
      { date: '2023-12-01', completed: true },
    ],
  },
];

export default function VaccinationPage() {
  return (
    <div>
    <div className="h-dvh overflow-y-scroll p-4.25 scrollbar-hide">
      <Calendar schedules={{"2026-04-08":["vaccine","checkup"], "2026-04-07":["vaccine"]}}
      scheduleTypes={[
    { type: 'vaccine', color: 'bg-mint-green', label: '예방접종' },
    { type: 'checkup', color: '#F5C842', label: '검진' },
  ]}/>
    <div className="flex flex-col gap-2.5">
      <VaccinationListSection petName={"돌멩쓰"} latestScheduleLabel={"켄넬코프 접종(4월 9일)"} vaccinationItems={sampleVaccinationItems}/>
      <VaccinationListSection petName={"돌멩투"} latestScheduleLabel={"켄넬코프 접종(4월 9일)"} vaccinationItems={sampleVaccinationItems}/>
    </div>
    </div>
    <BottomNavigation />
    </div>
  )
}