# MGK 프로젝트 상세 분석 보고서

작성일: 2026-04-10  
분석 범위: `README.md`, `FE`, `BE`의 1차 소스 코드와 설정 파일 전반  
제외 범위: `node_modules`, `.next`, `build`, `bin`, `ios`, `capacitor-web`, `.gradle`, `secrets` 같은 생성물/의존성/비공개 바이너리 디렉터리

## 1. 전체 요약

이 저장소는 반려동물 생활 관리 앱 `MGK`의 프론트엔드와 백엔드를 함께 담고 있다.

- 프론트엔드(`FE`): Next.js 16 App Router, React 19, NextAuth v5 beta, Tailwind CSS v4, Capacitor iOS 브리지
- 백엔드(`BE`): Spring Boot 4, Spring Security, Spring Data JPA, MySQL, JWT, Google Vision OCR, Spring AI Gemini

앱이 풀고자 하는 문제는 크게 4개다.

1. 반려동물 온보딩과 로그인
2. 의료 기록과 예방접종 일정 관리
3. 산책 기록과 리워드 적립
4. 지출 기록과 금융 상품 연결

다만 현재 구현은 완성형 제품이라기보다 “실제 백엔드에 붙은 기능”과 “목업/데모 UI”가 섞여 있는 상태다.

- 실제로 백엔드와 왕복하는 영역
  - 회원가입/로그인/토큰 갱신/비밀번호 재설정
  - 홈 재진입 온보딩의 반려동물 생성
  - 의료 영수증 OCR
  - 의료 기록 저장/조회
  - 예방접종 캘린더/요약 조회 및 일정 추가
  - 지출 내역 등록/조회/삭제
  - 산책 실시간 동기화/기록 저장/리워드 합산
  - 상품 목록/상세 조회
  - 음성 대화 API
- 아직 목업 성격이 강한 영역
  - 홈 화면의 반려동물 카드와 소비 요약
  - 금융 메인 대시보드와 리포트 화면
  - 금융 리포트 백엔드 계산층은 생겼지만 공개 API/FE 연결은 아직 없다.
  - 설정의 반려동물 목록/수정
  - 일부 네비게이션/버튼 라우팅

## 2. 저장소 구조

### 루트

- `README.md`: 브랜치 운영 방식과 FE/BE 별 초기 실행 안내
- `FE`: Next.js 앱
- `BE`: Spring Boot API 서버

### FE 구조

- `app`: App Router 페이지와 Next server route
- `components`: 공통 컴포넌트와 도메인 UI
- `features`: 도메인별 API 래퍼와 타입
- `lib`: 인증, 검증, OCR 데이터 변환 유틸
- `public`: 정적 이미지
- `capacitor.config.ts`: Capacitor 네이티브 연결 설정
- `proxy.ts`: 라우트 보호용 프록시

### BE 구조

- `controller`: REST 엔드포인트
- `service`: 비즈니스 로직
- `repository`: JPA Repository
- `entity`: DB 모델
- `dto`: 요청/응답 모델
- `config`: 보안, CORS, OCR, AI, JPA Auditing, 부팅 시 정리 로직
- `src/main/resources`: 애플리케이션 설정과 시드 데이터

## 3. 전체 동작 구조

### 3.1 사용자 흐름

1. 사용자는 `/`에서 캐릭터 화면을 보고 `/onboarding`으로 들어간다.
2. 첫 진입 온보딩의 앞부분은 서비스 소개 흐름이고, `health-guide` 단계에서 `/login`으로 이동한다.
3. 로그인은 NextAuth `Credentials` provider를 통해 Spring `/api/auth/login`에 위임된다.
4. 로그인 후 `/home`, `/finance`, `/health`는 Next proxy에서 토큰이 없는 경우 차단된다.
5. 홈 화면의 말풍선은 사용자를 `/onboarding/7`로 다시 보내 반려동물 이름/사진 등록 흐름을 이어간다.
6. 온보딩 마지막 단계의 “시작하기”는 인증된 `clientFetch('/api/pets')`를 호출해 반려동물 이름과 이미지 URL을 실제 DB에 저장한 뒤 `/home`으로 이동한다.
7. 이후 건강, 가계부, 상품, 대화 기능이 각각 Spring API와 연결된다.

### 3.2 프론트-백엔드 연결 방식

- 인증이 필요한 일반 API 호출
  - `clientFetch()`가 `next-auth` 세션에서 `accessToken`을 꺼내 `Authorization: Bearer ...`로 전달
- 서버 컴포넌트/서버 액션 호출
  - `serverFetch()`가 `auth()`로 세션을 읽어 동일하게 토큰 전달
- 이메일 OTP 발송/비밀번호 재설정 링크 생성
  - FE의 `app/api/auth/*` route가 Resend와 Spring Auth API를 중개
- 이미지 업로드
  - 반려동물 사진과 의료 이미지 파일 저장은 FE의 Next route가 `public/images/...` 아래에 로컬 저장
- OCR
  - 실제 OCR 인식은 FE가 Spring `/api/medical-records/ocr`로 파일을 보내 Google Vision에서 수행

## 4. 프론트엔드 상세 분석

### 4.1 전역 셸과 스타일

- `app/layout.tsx`
  - Pretendard Variable 로컬 폰트를 로드한다.
  - 화면 폭을 모바일 폭 기준(`420px`, `500px`, `640px`)으로 강하게 제한한다.
  - 전체 앱을 세로 모바일 뷰처럼 고정해놓은 구조다.
- `app/providers.tsx`
  - `SessionProvider`만 제공한다.
- `app/globals.css`
  - Tailwind v4와 shadcn 스타일 토큰을 함께 쓴다.
  - 브랜드 컬러(`main-green`, `mint-green`, `hana-pink`, `main-yellow`)를 CSS variable로 선언한다.
  - 온보딩용 ripple, dissolve, modal animation이 정의되어 있다.

### 4.2 라우트 보호

- `proxy.ts`
  - 보호 경로: `/finance`, `/home`, `/health`
  - 공개 경로: `/`, `/login`, `/signup`, `/onboarding`, `/api/auth`
  - 개발 환경에서는 `NODE_ENV === development`일 때 인증 우회를 허용한다.
  - 토큰은 `next-auth/jwt`의 `getToken()`으로 읽는다.

주의점:

- `/settings`는 프론트 프록시 보호 경로에 포함되지 않는다.
- `/product`도 비보호다. 상품은 공개 조회로 의도된 것으로 보이지만 `/settings`는 보호 누락에 가깝다.

### 4.3 인증 구조

- `app/api/auth/[...nextauth]/route.ts`
  - `email-password` provider
    - Spring `/api/auth/login` 호출
  - `magic-link` provider
    - Spring `/api/auth/verify` 호출
  - 세션 전략
    - JWT 기반
  - 토큰 갱신
    - access token 만료를 FE에서 1시간으로 가정하고 `/api/auth/refresh` 호출
  - refresh 실패
    - 세션에 `RefreshTokenError`를 심고 클라이언트는 강제 로그아웃 처리

- `lib/auth.ts`
  - `clientFetch()`는 세션 access token을 자동 첨부한다.
  - `signup()`, `sendOtp()`, `resetPasswordByToken()` 같은 인증 보조 함수가 있다.

- `lib/auth.action.ts`
  - 서버 액션에서 비밀번호 변경을 처리한다.

### 4.4 로그인/회원가입/비밀번호 복구

- `/login`
  - 이메일/비밀번호 로그인
  - 성공 시 `/home`
- `/login/findpasswd`
  - 이메일 입력 후 FE route `/api/auth/send-otp`
  - 해당 route가 Spring OTP 생성 + Resend 이메일 발송을 처리
- `/login/verify`
  - magic link token을 읽어 NextAuth `magic-link` provider 로그인
- `/login/changepasswd`
  - 메일 링크 token으로 비밀번호 재설정
- `/signup`
  - 다단계 입력 UI
  - 마지막 단계에서 이용약관 모달 확인
  - 성공 시 Spring `/api/auth/signup` 후 즉시 자동 로그인

검증 규칙:

- 비밀번호 최소 8자
- 영문 포함
- 특수문자 `^ ! * -` 중 하나 포함
- 비밀번호 확인 일치
- 현재 비밀번호와 새 비밀번호 동일 금지

### 4.5 온보딩

- `/`
  - 애니메이션된 캐릭터 랜딩
  - 클릭 후 `/onboarding`
- `/onboarding/[step]`
  - 총 11단계지만 실제 역할은 두 갈래다.
  - 1~6단계는 서비스 소개 중심이고, `health-guide` 단계의 확인 버튼은 `/login`으로 보낸다.
  - 7~11단계는 홈 화면에서 재진입하는 반려동물 등록 흐름이다.
  - `react-speech-recognition`으로 반려동물 이름을 음성 입력
  - Web Speech TTS로 말풍선 내용을 읽어준다.
  - 반려동물 사진은 `/api/pet-upload`를 통해 FE `public/images/pet`에 저장한다.
  - 상태는 query string(`petName`, `petImage`, `retryPetName`, `photoSkipped`)으로 다음 단계에 넘긴다.
  - `sessionStorage`에 “온보딩 내부 진입”과 “TTS unlocked” 상태를 저장한다.
  - 마지막 `handleStartClick()`은 `POST /api/pets`로 `{ name, imageUrl }`를 전송한다.

특징:

- 온보딩은 이제 “로그인 전 소개”와 “로그인 후 반려동물 생성”이 섞인 구조다.
- 반려동물 생성 자체는 실제 DB 저장과 연결됐다.
- 다만 생성 시 저장되는 값은 이름과 이미지뿐이라 `species`, `age`, `size`, 식사 상태, 산책 누적값은 모두 `null`로 시작한다.
- 저장 성공 후 `/home`으로 돌아가지만, 홈 화면 자체는 아직 `GET /api/pets`를 쓰지 않아서 새 반려동물이 바로 화면에 보이지는 않는다.

### 4.6 홈

- `/home`
  - 상단 설정 이동
  - 온보딩 재진입 유도 버블
  - 반려동물 캐러셀
  - 대화 이동 버튼
  - 지출 요약 카드

현재 상태:

- 홈은 반려동물 추가 온보딩(`/onboarding/7`)으로 진입시키는 역할은 한다.
- 하지만 `pets` 배열이 여전히 비어 있고 `spendingData`도 하드코딩이다.
- 즉, 홈은 아직 백엔드 실데이터 화면이 아니다.

### 4.7 홈 대화

- `/home/talk`
  - 음성 입력 시작/정지
  - 특정 키워드 감지 시 가계부 이동 확인 UI 노출
  - 일반 질문은 `/api/talk`에 POST

주의점:

- 이 페이지만 `clientFetch()`가 아니라 `const API_BASE_URL = 'http://localhost:8080'`를 직접 사용한다.
- 환경 변수 기반이 아니므로 배포/모바일 환경에서 깨질 가능성이 높다.

### 4.8 건강

#### 건강 메인 `/health`

- 세 기능 진입 버튼만 제공
  - 산책
  - 예방접종
  - 병원기록

#### 의료 기록 `/health/medical-records`

실제 구현이 많이 진행된 화면이다.

흐름:

1. `/add-image`
   - 이미지 파일을 Data URL로 읽어 `sessionStorage`에 저장
2. `/processing`
   - 저장된 Data URL을 `File`로 변환해 Spring `/api/medical-records/ocr` 호출
   - OCR 결과를 `sessionStorage`에 저장
3. `/add-record`
   - OCR 결과를 폼 초깃값으로 채움
   - 필요하면 수정 후 저장
   - 이미지가 있으면 FE `/api/medical-record-upload`로 업로드
   - 이후 Spring `/api/medical-records`로 레코드 저장
4. `/health/medical-records`
   - petId + type(CHECKUP/VACCINATION) 기준 조회

저장 키:

- `medical-record-image-data-url`
- `medical-record-ocr-result`
- `selected-pet-id`

#### 예방접종 `/health/vaccinations`

- Spring `/api/vaccinations/schedules`
  - 월별 캘린더 점 표시
- Spring `/api/vaccinations/summary`
  - 반려동물별 최근 일정 + 접종 히스토리 카드
- 모달로 일정 추가 가능

구조상 좋은 점:

- 캘린더 이벤트와 의료 기록을 합쳐 “마지막 접종 / 다음 접종” 뷰를 만든다.

#### 산책 `/health/walk`

가장 네이티브 연동이 강한 화면이다.

- Capacitor plugin `MGKHealth`를 호출한다.
- 지원 함수
  - `getTodaySteps`
  - `startWalk`
  - `pauseWalk`
  - `stopWalk`
  - `addWalkUpdateListener`
- live update를 `/api/pets/{petId}/walk`로 `PATCH`
- 현재 세션 상태는 `/api/pets/{petId}/walk/live`
- 완료된 기록은 `/api/pets/{petId}/walk-records`
- 3000걸음마다 리워드 1 단위로 계산한다.

특징:

- `NEXT_PUBLIC_MGK_HEALTH_TEST_FALLBACK=true`면 네이티브 브리지 실패 시 테스트 데이터로 동작 가능
- 기본 petId는 저장값이 없으면 1번 반려동물이다.

### 4.9 금융

#### `/finance`

- 완전한 대시보드형 디자인 화면이지만 데이터는 전부 목업이다.
- 계좌번호, 잔액, 요약 카드, 파이차트, 혜택 문구 모두 하드코딩이다.

#### `/finance/expense`

- 실제 백엔드 연결 화면
- 월별 지출 조회: `GET /api/account-books?year=&month=`
- 검색, 그룹핑, 삭제 지원
- 항목 삭제: `DELETE /api/account-books/{id}`

#### `/finance/expense/add-image` -> `/processing` -> `/add-expense`

의료 기록과 같은 OCR 파이프라인을 사용한다.

- OCR은 동일하게 Spring `/api/medical-records/ocr`를 호출한다.
- 단, 결과를 `mapOcrResultToExpenseDraft()`로 지출 초안으로 변환한다.
- 병원 키워드면 `Hospital`, 음식 키워드면 `Food`, 그 외 `Etc`

#### `/finance/report`

- 프론트 화면의 리포트, 그래프, 상품 연결, 뱃지 모달은 여전히 목업 데이터다.
- 다만 백엔드에는 별도의 `FinanceReportService` 계산 계층이 생겼다.
- 현재는 이 계산 결과를 노출하는 controller가 없고, FE도 해당 값을 호출하지 않는다.

### 4.10 상품

- `/product`
  - Spring `/api/products` 조회 후 첫 상품 상세로 redirect
- `/product/[productId]`
  - Spring `/api/products/{id}` 조회
- 상단 카테고리 섹션
  - 상품 목록을 탭처럼 보여준다.

현재 상태:

- “상품 목록/상세 조회”는 실제 연결
- “개인화 추천 결과”는 FE에서 아직 쓰지 않는다.

### 4.11 설정

- `/settings`
  - 반려동물 목록, 알림 토글, 비밀번호 변경, 로그아웃, 탈퇴
- `/settings/changePassword`
  - 실제 API 연결
- `/settings/deleteAccount`
  - 실제 API 연결
- `/settings/pets/[petId]`
  - 편집 UI는 있으나 저장은 `console.log`만 한다.

현재 상태:

- 반려동물 목록은 하드코딩
- 알림 토글은 로컬 state만 변경
- 편집 페이지는 백엔드 미연결

### 4.12 프론트의 로컬 저장 전략

- `sessionStorage`
  - OCR 이미지/결과
  - 온보딩 내부 상태
  - TTS 활성화 여부
- `localStorage + sessionStorage`
  - 선택된 pet id

장점:

- 새로고침 없는 단일 플로우에서는 간단하다.

제약:

- 큰 이미지 Data URL 저장은 브라우저 스토리지 한계를 쉽게 넘길 수 있다.
- pet 선택 상태가 전역 서버 상태가 아니라 로컬 저장이라 기기/세션 동기화가 없다.

## 5. 백엔드 상세 분석

### 5.1 런타임과 설정

- 포트: `8080`
- DB: MySQL (`docker-compose.yml` 기준 `localhost:3330`)
- JPA
  - `ddl-auto: update`
  - `defer-datasource-initialization: true`
  - `sql.init.mode: always`
- 파일 업로드 제한: 10MB
- OCR: Google Vision credentials 파일 경로 사용
- AI: Gemini chat model 사용

### 5.2 보안 구조

- `SecurityConfig`
  - CSRF 비활성화
  - Stateless session
  - JWT filter 주입
  - 하지만 `authorizeHttpRequests(auth -> auth.anyRequest().permitAll())`

즉, Spring Security 레벨에서 URL 차단을 거의 하지 않는다.  
실제 보호는 다음 두 방식이 섞여 있다.

1. 일부 컨트롤러가 `SecurityContextHolder`를 직접 확인해 401 반환
2. 일부 서비스가 `CurrentUserService.getCurrentUserIdOrDefault()`로 현재 사용자 또는 “첫 번째 사용자”를 사용

이 설계는 현재 프로젝트에서 가장 중요한 구조적 리스크다.

### 5.3 JWT 인증

- `JwtProvider`
  - access token: `userId` + `email`
  - refresh token: `userId`
- `JwtAuthenticationFilter`
  - `Authorization: Bearer ...`를 읽어 principal에 `Long userId`를 넣는다.

### 5.4 Auth 도메인

`/api/auth`

- `POST /login`
- `POST /signup`
- `POST /send-otp`
- `POST /refresh`
- `POST /verify`
- `POST /reset-password`
- `POST /change-password`
- `POST /delete-account`

동작:

- 회원가입
  - 중복 이메일 체크
  - 기본 이름 `김돌멩`
  - 계좌 자동 생성
  - 초기 account book 한 건 생성
- 로그인
  - soft delete 계정 차단
- OTP
  - `Verification` 엔티티에 15분 토큰 저장
- 비밀번호 재설정/매직링크 검증
  - `Verification` 토큰 기반
- 탈퇴
  - hard delete가 아니라 `deleted_at` 업데이트

### 5.5 금융 도메인

`/api/account-books`

- `GET`: 월별 지출 요약 + 항목 목록
- `POST`: 지출 생성
- `DELETE /{id}`: 지출 삭제

엔티티:

- `Account`
  - 계좌번호, 예금, 리워드, 총액
- `AccountBook`
  - 지출 제목, 금액, 카테고리, 메모, 일시
  - 선택적 `pet` 연관관계가 추가되어 특정 반려동물 지출을 구분하려는 방향으로 확장 중

비즈니스 규칙:

- 월별 합계와 오늘 합계를 별도로 계산
- 회원가입 시 생성되는 `"첫 계좌연결"` 항목은 월 지출 합계에서 제외

추가 구현 중인 내부 리포트 계층:

- `FinanceReportService.getRetirementReport(userId)`
  - 사용자 반려동물 목록
  - `AccountBook.pet is not null` 조건의 반려동물 지출 합계/첫 지출일/최근 1년 지출
  - 계좌 총자산(`Account.moneyAmount`) 합계
  - 반려동물 종/크기/나이를 기준으로 한 기대수명 및 연간 의료비 추정
  - 위 값을 합쳐 `retirementPercent`, `totalPetCost`, `averageExpense`, `totalAsset`을 계산
- 응답 DTO `FinanceReportResponse`
  - `retirementPercent`
  - `totalPetCost`
  - `averageExpense`
  - `totalAsset`
  - `remainingLife`
- 단, 이 리포트 계층은 아직 공개 API로 노출되지 않았고 `remainingLife` 필드도 실제 빌드 시 채워지지 않는다.

### 5.6 반려동물/산책 도메인

`/api/pets`

- `POST /api/pets`
- `GET /api/pets`
- `PATCH /api/pets/{petId}/walk`
- `GET /api/pets/{petId}/walk/live`
- `GET /api/pets/{petId}/walk-records`

엔티티:

- `Pet`
  - 이름, 종, 이미지, 나이, 크기, 누적 걸음수, 누적 산책 시간
  - `user` 소유자와 연결되며, 최근 변경으로 종/나이/크기 같은 일부 컬럼은 nullable 상태를 허용한다.
- `PetWalkRecord`
  - 소스, 현재 걸음수, 산책시간, 거리, 보상, 완료 여부, 상태, 시작/종료 시각

반려동물 생성/조회 방식:

- `CreatePetRequest`
  - 현재는 `name`, `imageUrl`만 받는다.
- `PetService.createPet()`
  - 현재 인증 사용자(`getCurrentUserId`)를 조회한다.
  - `Pet`를 생성해 저장한다.
  - 이때 `species`, `age`, `size`, `walkCount`, `walkTime`, `lastWalkAt`, `eatMeal`은 `null`로 둔다.
- `PetResponse`
  - `id`, `name`, `imageUrl`, `age`, `species`를 반환한다.
- `PetService.getPets()`
  - 더 이상 전체 목록이 아니라 `petRepository.findByUser_Id(userId)`로 현재 사용자 반려동물만 반환한다.
- `findOwnedPet()`
  - 산책 저장/조회 시 `findByIdAndUser_Id`로 소유권을 확인한다.

산책 저장 방식:

- `CORE_MOTION_*` source
  - 실시간 live session 취급
  - 완료 전에는 진행 상황만 덮어쓴다.
  - 완료 시에만 누적 걸음/리워드 반영
- 그 외 source
  - 즉시 완료 산책으로 처리

### 5.7 의료 기록/OCR 도메인

`/api/medical-records`

- `POST /ocr`
- `POST /`
- `GET /`

엔티티:

- `MedicalDocument`
  - pet, petName, date, type, hospitalName, details, totalAmount, imageUrl

OCR 처리:

- Google Vision `DOCUMENT_TEXT_DETECTION`
- 정규식과 키워드로 다음 항목을 추출
  - 날짜
  - 시간
  - 문서 유형(`VACCINATION` 또는 `CHECKUP`)
  - 반려동물 이름
  - 병원명
  - 진료 내역
  - 총금액

특징:

- 의료 영수증 OCR을 지출 OCR에도 재사용하고 있다.
- 프론트는 이 결과를 의료 기록 초안 또는 지출 초안으로 각각 변환한다.

### 5.8 예방접종/캘린더 도메인

`/api/vaccinations`

- `GET /schedules`
- `POST /schedules`
- `GET /summary`

엔티티:

- `CalendarEvent`
  - pet, name, date, memo, eventType

요약 로직:

- 반려동물별 가장 가까운 미래 일정 추출
- `MedicalDocument(type=VACCINATION)`를 details 기준으로 그룹핑
- 미래 캘린더 이벤트와 문서명 유사 매칭
- 결과적으로 “마지막 접종 / 다음 접종 / 이력” 카드 생성

### 5.9 상품 도메인

`/api/products`

- `GET /`
- `GET /{productId}`

엔티티:

- `Product`
  - 상품 타입, 설명, URL, 혜택률/금액, 한도, 대상 카테고리, 소스 타입, 활성 여부

추가 구현:

- `ProductService.getActiveProductRecommendations()`
  - 카드형/적금형/보험형 혜택 추정 로직이 이미 구현됨
  - 그러나 현재 컨트롤러에서 노출되지 않고 FE도 사용하지 않는다.

### 5.10 대화 도메인

`/api/talk`

- `POST /api/talk`

동작:

- Gemini chat model에 system prompt와 transcript를 전달
- 최대 3회 재시도
- 실패 시 fallback 메시지 반환

### 5.11 공통/미사용 도메인

코드상 존재하지만 현재 API 흐름에는 연결되지 않은 것들:

- `MapLocation`, `MapRepository`
- `Transaction`, `TransactionRepository`
- `ProductRecommendationResponse`를 반환하는 추천 계산 로직
- `FinanceReportService`, `FinanceReportResponse`: 내부 계산 로직은 존재하지만 controller 엔드포인트와 FE 호출 경로가 없다.

즉, 지도/송금/추천 API는 설계 흔적은 있지만 실제 제품 경로에는 아직 연결되지 않았다.

## 6. 데이터 모델 요약

핵심 관계는 다음과 같다.

- `User`
  - `Account`
  - `AccountBook`
  - `Pet`
  - `Verification`
- `AccountBook`
  - `Account`
  - 선택적 `Pet`
- `Pet`
  - `PetWalkRecord`
  - `MedicalDocument`
  - `CalendarEvent`
- `Product`
  - 독립 테이블, 사용자의 금융/지출 데이터와 계산 단계에서만 연결

## 7. 실제 연결 관계 요약

### 실제 end-to-end 연결됨

- 회원가입/로그인/매직링크/비밀번호 변경/탈퇴
- 홈 재진입 온보딩(7~11단계)에서 반려동물 이름/이미지 저장
- 의료 기록 OCR -> 이미지 업로드 -> 의료 기록 저장 -> 목록 조회
- 의료 영수증 OCR -> 지출 초안 생성 -> 지출 저장 -> 월별 목록 조회/삭제
- 예방접종 월 캘린더 조회
- 예방접종 일정 생성
- 예방접종 요약 카드 조회
- 산책 실시간 동기화와 기록 조회
- 상품 목록/상세 조회
- 음성 대화 응답 생성

### 부분 연결 또는 목업

- 홈 반려동물 캐러셀
- 홈 소비 요약
- 금융 대시보드
- 금융 리포트 화면과 백엔드 계산층 사이 연결 부재
- 백엔드 계산층은 존재하지만 FE/API는 아직 미연결
- 설정 반려동물 목록/수정
- 상품 추천 결과 노출

## 8. 환경 변수와 외부 연동

### FE에서 기대하는 값

- `AUTH_SECRET`
- `NEXT_PUBLIC_SPRING_API_URL`
- `SPRING_API_URL`
- `NEXTAUTH_URL`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `CAPACITOR_SERVER_URL`
- `NEXT_PUBLIC_MGK_HEALTH_TEST_FALLBACK`

### BE에서 기대하는 값

- datasource URL/username/password
- JWT secret
- Google GenAI API key
- Google Vision credentials path

### 외부 서비스

- Resend: 로그인/비밀번호 재설정 메일 발송
- Google Vision API: OCR
- Google Gemini: 대화 응답
- Capacitor Native Plugin: iOS 건강 데이터/산책 이벤트

## 9. 현재 리스크와 문제점

### 9.1 인증/권한 구조가 불안정함

가장 큰 문제는 Spring에서 URL 차단을 하지 않는다는 점이다.

- `SecurityConfig`는 모든 요청을 `permitAll()` 한다.
- `CurrentUserService`는 인증이 없으면 첫 번째 사용자를 기본 사용자로 사용한다.

이 조합 때문에 다음 위험이 생긴다.

- 인증 없이도 일부 API가 첫 번째 사용자 데이터에 접근할 수 있다.
- 특히 `FinanceController`는 의도치 않은 기본 사용자 fallback 경로가 있다.

### 9.2 의료 기록 API의 사용자 소유권 검증 부족

- `MedicalService.createMedicalRecord()`는 `petId`가 존재하면 저장한다.
- 현재 로그인한 사용자의 반려동물인지 검증하지 않는다.
- `getMedicalRecords()`도 `petId`만 알면 조회 가능하다.

### 9.3 금융 리포트용 반려동물 지출 데이터가 아직 제대로 쌓이지 않음

- `FinanceReportService`는 `AccountBook.pet is not null`인 지출만 반려동물 비용으로 간주한다.
- 하지만 공개 생성 API인 `CreateAccountBookRequest`에는 `petId`가 없고, `FinanceService.create()`도 `AccountBook.pet`을 세팅하지 않는다.
- 심지어 `AccountBook` 생성자는 `Pet pet` 파라미터를 받지만 본문에서 `this.pet = pet`를 하지 않는다.

즉, 현재 공개 경로만으로는 반려동물 지출이 거의 누적되지 않으며, 리포트가 노출되더라도 실제보다 0원 혹은 과소 계산될 가능성이 높다.

### 9.4 비밀 값이 저장소에 직접 들어가 있음

현재 코드상 다음 파일들에 민감 정보가 평문으로 존재한다.

- `FE/.env`
- `BE/src/main/resources/security.yml`
- `BE/docker-compose.yml`

운영/협업 관점에서 즉시 분리 대상이다.

### 9.5 부팅 시 데이터 초기화와 스키마 수정이 공격적임

- `data.sql`이 실행될 때 `users`, `products`를 truncate 한다.
- 같은 스크립트가 `pets` 테이블 컬럼 nullability를 직접 변경한다.
- 기본 사용자 2명과 특정 사용자용 반려동물 3마리를 seed 한다.
- `pet_walk_records` 데이터를 보정하고 `pet_walk_syncs` 테이블을 drop 한다.
- `MedicalDocumentCleanupRunner`가 실행 시 테이블 rename/drop/column drop을 수행한다.

즉, 서버 재시작이 단순한 기동이 아니라 데이터 구조를 적극적으로 바꾸는 동작이 된다.

### 9.6 프론트 목업 데이터가 많음

아래 화면들은 실제 제품처럼 보이지만 데이터는 고정값이다.

- `/home`
- `/finance`
- `/finance/report`
- `/settings`
- `/settings/pets/[petId]`

보정해서 보면:

- `/home`은 반려동물 등록 온보딩 진입만 실연결이고, 정작 반려동물 목록/소비 요약은 아직 고정값이다.
- `/finance/report`도 백엔드 내부 계산 로직은 생겼지만 화면 수치와 그래프는 여전히 하드코딩이다.

### 9.7 대화 페이지의 하드코딩 URL

- `/home/talk`는 `http://localhost:8080`을 직접 사용한다.
- 나머지 API는 환경 변수와 `clientFetch()`를 사용하므로 이 페이지만 일관성이 깨진다.

### 9.8 프론트 보호 경로 누락

- `/settings`는 프록시 보호 대상이 아니다.
- 비로그인 사용자도 화면 자체는 열릴 수 있다.

### 9.9 상품 추천 로직이 죽어 있음

- 백엔드에는 혜택 추정 로직이 이미 있다.
- 그러나 API로 노출되지 않고 프론트도 사용하지 않는다.

### 9.10 온보딩으로 생성한 반려동물과 금융 리포트 계산의 전제가 맞지 않음

- `PetService.createPet()`는 온보딩 저장 시 `species`, `age`, `size`를 `null`로 둔다.
- 그런데 `FinanceReportService.getProjectedYears()`는 `pet.getAge()`를 바로 `BigDecimal`로 감싼다.
- 따라서 온보딩으로 만든 반려동물이 금융 리포트 계산 대상에 들어오면 null 처리 없이 예외가 날 가능성이 있다.
- `FinanceReportResponse`의 `remainingLife` 필드도 선언만 되어 있고 실제 응답에서는 세팅되지 않는다.

## 10. 테스트와 실행 확인

실행 결과:

- FE: `pnpm test`
  - 성공
  - 1개 파일, 17개 테스트 통과
- BE: `./gradlew.bat test`
  - 실패
  - 원인: `JAVA_HOME` 미설정으로 Java 실행 불가

즉, 프론트 검증은 일부 수행됐고 백엔드는 환경 부족으로 테스트 실행 자체를 못 했다.

## 11. 결론

현재 MGK는 “반려동물 관리 + 금융 연결”이라는 큰 방향은 분명하고, 특히 의료 OCR, 예방접종, 산책 기록, 인증 플로우는 실제 코드가 꽤 이어져 있다. 최근 변경으로 반려동물 생성도 홈 재진입 온보딩과 `/api/pets`를 통해 실제 저장되기 시작했다. 반면 홈/설정/금융 리포트는 여전히 제품용 정합성보다 데모용 UI 비중이 높고, 금융 리포트는 백엔드 계산층만 먼저 생긴 상태다.

기술적으로 가장 먼저 손봐야 할 것은 기능 추가가 아니라 권한 모델이다.

우선순위를 정리하면 다음과 같다.

1. Spring Security에서 실제 URL 권한 제어 적용
2. `CurrentUserService`의 default user fallback 제거
3. 의료 기록/반려동물 조회의 소유권 검증 추가
4. 저장소 내 평문 비밀값 분리
5. 반려동물 생성 데이터와 가계부의 `pet` 연결 규칙을 정리해 금융 리포트 계산 전제를 먼저 맞춤
6. 홈/설정/금융 메인 목업을 실제 API와 연결하고, 금융 리포트 controller를 노출
7. 죽어 있는 상품 추천 API를 노출하고 프론트 리포트와 연결

이 기준으로 보면, 이 프로젝트는 “핵심 도메인 로직은 일부 준비되어 있으나 제품 완성도와 운영 안정성은 아직 정리 중인 상태”라고 보는 것이 가장 정확하다.
