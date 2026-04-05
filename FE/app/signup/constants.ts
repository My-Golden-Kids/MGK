import type { InputFieldProps } from '@/components/signup/InputField';

export const STEPS: Array<InputFieldProps> = [
  {
    key: 'email',
    shortLabel: '이메일',
    label: '이메일을 입력해주세요',
    placeholder: 'email@email.com',
    isActive: false,
    type: 'email',
  },
  {
    key: 'password',
    shortLabel: '비밀번호',
    label: '비밀번호을 입력해주세요',
    description: '8글자 이상 영어, 특수기호(^!*-) 혼합',
    isActive: false,
    type: 'password',
  },
  {
    key: 'passwordConfirm',
    shortLabel: '비밀번호 확인',
    label: '비밀번호를 다시 입력해주세요',
    description: '동일한 비밀번호 입력',
    isActive: false,
    type: 'password',
  },
  {
    key: 'accountNum',
    shortLabel: '계좌번호',
    label: '전용 계좌번호를 입력해주세요',
    description: '펫만을 위한 전용 계좌 번호',
    isActive: false,
    type: 'text',
  },
];

export const TERMS = [
  {
    key: 'service',
    title: '서비스 이용약관 확인하기',
    subTitle: '[필수] 서비스 이용약관 (요약)',
    content: `제1조 (목적)본 약관은 '금쪽같은 내 새끼'가 제공하는 반려동물 건강 관리 및 지출 분석 서비스의 이용 조건과 절차를 규정합니다.
제2조 (서비스의 내용)
\t1. 사용자가 기록한 반려동물의 건강 데이터(사료, 접종, 산책 등)를 바탕으로 맞춤형 관리 알림을 제공합니다.
\t 2. 금융 데이터를 분석하여 반려동물 관련 지출 리포트 및 생애주기별 비용 예측 정보를 제공합니다.
\t 3. 사용자의 동의 시, 지정된 가족 구성원과 반려동물 관리 상태 및 지출 내역을 공유할 수 있습니다.
\t 4. 제3조 (건강 정보의 한계)본 서비스가 제공하는 건강 상태 안내 및 예상 의료비 정보는 참고용이며, 질병의 진단이나 치료는 반드시 전문 수의사의 상담을 거쳐야 합니다.
  `,
  },
  {
    key: 'mydata',
    title: '마이데이터 이용 약관 확인하기',
    subTitle: '[필수] 마이데이터 개인정보 수집·이용 동의 (요약)',
    content: `1. 수집 및 이용 목적
  - 지출 분석: 은행/카드 거래 내역 중 반려동물 관련 소비(동물병원, 사료 등) 자동 분류 및 월간 리포트 생성.
  - 재정 계획: 반려동물 연령 및 종에 따른 향후 의료비/양육비 예측 및 자산 대비 지출 비중 분석.
  - 맞춤 추천: 소비 패턴 및 건강 데이터를 기반으로 하나은행의 펫 적금, 보험 등 최적의 금융 상품 추천.
  2. 수집 항목
  - 금융 정보: 계좌 잔액 및 이체 내역, 카드 결제 일시/금액/가맹점 정보, 보험 가입 현황.
  - 비금융 정보: 반려동물 이름, 종, 나이, 체중, 예방접종 및 진료 기록, 산책 경로(GPS).
  3. 보유 및 이용 기간
  - 서비스 탈퇴 시 또는 동의 철회 시까지 (단, 관계 법령에 따라 보존이 필요한 경우 해당 기간까지).
  `,
  },
];
