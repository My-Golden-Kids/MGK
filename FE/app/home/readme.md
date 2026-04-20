# MGK 프로젝트 최신 상세 분석 보고서

작성일: 2026-04-15
분석 기준: 현재 워크스페이스의 `FE`, `BE` 소스 코드
중점 범위: 홈 화면, 홈 대화, 설정 반려동물 관리, 재정 홈 카드, 금융 리포트, AverageMedicalCost 신규 로직, 관련 API/서비스/저장소

## 1. 전체 결론

이 프로젝트는 반려동물 관리 앱 `MGK`의 Next.js 프론트엔드와 Spring Boot 백엔드를 한 저장소에서 함께 관리한다.

- `FE`: Next.js 16.2.1 App Router, React 19.2.4, NextAuth v5 beta, Tailwind CSS v4, Biome, Capacitor iOS 브리지
- `BE`: Spring Boot 4.0.3, Java 21, Spring Security, Spring Data JPA, MySQL, JWT, Google Vision OCR, Spring AI Gemini, AWS S3 presigned upload

최신 상태에서 가장 중요한 변화는 다음과 같다.

- 홈 반려동물 캐러셀은 현재 사용자 pet 목록을 `GET /api/pets`로 조회하고, 선택된 pet의 이미지와 이름을 실제 데이터로 렌더링한다.
- 홈에서 선택한 pet id는 `selected-pet-id`로 `localStorage`와 `sessionStorage`에 저장되고, `/home/talk`가 이 값을 읽어 선택 pet 이미지와 이름을 다시 조회한다.
- 홈 대화 화면은 음성 모드와 직접입력 텍스트 모드를 모두 지원한다. “직접입력” 버튼은 더 이상 빈 동작이 아니라 `/home/talk?mode=text`로 진입한다.
- 홈 소비 요약 카드는 더 이상 FE에서 카테고리 합산과 혜택 문구를 계산하지 않는다. FE는 `GET /api/account-books/home-summary` 응답을 받아 금액 포맷팅과 UI 매핑만 한다.
- 홈 소비 카드의 최대 카테고리 판정, 보험/적금/구독 문구, 보험 연간 한도 반영은 `BE/src/main/java/com/mgk/bemgk/service/FinanceService.java`로 이동했다.
- 설정 화면에는 반려동물 삭제 UI와 삭제 확인 모달이 있고, `DELETE /api/pets/{petId}`가 백엔드에 구현되어 있다.
- 설정 반려동물 상세 화면에는 사망 체크 버튼이 추가됐다. 체크 후 저장하면 pet record의 `isDeath`가 true로 바뀌고, 설정 목록에서는 pet 이름 옆에 흰 꽃 이미지가 표시된다.
- 사망 처리는 삭제가 아니라 `pets.death` 상태 전환이다. `death`는 nullable이 아니고 기본값은 false가 되도록 DB seed 보정과 엔티티 기본값이 정리됐다.
- 사망 pet은 설정 목록/상세 조회에서는 계속 관리 가능하지만, 홈/대화의 active pet 후보에서는 제외되고 산책 저장, 새 의료기록 등록, 새 예방접종 일정, 알림/요약/대화 대상 같은 active 기능에서 서버가 차단한다.
- 금융 리포트는 이제 백엔드 controller와 FE API 호출이 존재한다. `/finance/report`는 `GET /api/finance/report`, `GET /api/finance/report/monthly-expenses`를 호출한다.
- `AverageMedicalCost` 관련 신규 백엔드 파일이 프로젝트 패키지 구조에 맞게 정리됐고, 평균 진료비 테이블, seed config, repository, service, controller가 컴파일되는 상태다.
- 평균 진료비 seed는 42개 row로 확장됐고, `AverageMedicalCostConfig`는 전체 테이블 count가 아니라 `category/item/species/size` 조합별 `saveIfMissing` 방식으로 누락분만 보강한다.
- 홈 대화 `TalkService`에는 평균 진료비 intent가 추가됐다. “초진 진찰료 알려줘” 같은 STT 결과는 `/api/talk` 안에서 평균진료비 DB 조회로 분기된다.
- FE proxy는 공개 경로와 `/api/auth`를 제외한 거의 모든 앱 경로를 로그인 필요 경로로 본다. 이전처럼 `/settings`만 보호 누락된 구조는 아니다.

다만 아직 제품 안정성 측면의 리스크도 남아 있다.

- Spring Security 설정은 여전히 `anyRequest().permitAll()`이고, 일부 금융 API는 인증이 없으면 첫 번째 사용자를 fallback으로 사용한다.
- 금융 리포트 계산은 이름상 “pet expense”로 보이지만 현재 repository 쿼리는 `AccountBook.pet is not null` 조건이 아니라 사용자 전체 지출을 집계한다.
- `AccountBook` builder는 `Pet pet` 파라미터를 받지만 `this.pet = pet`를 하지 않고, 공개 지출 생성 요청에도 `petId`가 없다.
- 온보딩으로 만든 pet은 `age`, `species`, `size`가 `null`일 수 있는데, 금융 리포트 계산 일부는 `pet.getAge()`를 null guard 없이 사용한다.
- 상품 추천 계산 로직은 `ProductService`에 있으나 controller로 노출되지 않는다. 홈 소비 카드는 이 추천 API가 아니라 `FinanceService` 내부 규칙과 `ProductRepository` 직접 조회를 사용한다.
- 평균 진료비 조회는 현재 인증 사용자 소유권 검증, 사망 pet 제외, STT 문장 정규화, canonical item명 매칭, TalkService 연결까지 반영됐다.

## 2. 최신 엔드투엔드 연결 현황

실제로 연결된 흐름은 다음과 같다.

- 로그인/회원가입/매직링크/토큰 갱신/비밀번호 변경/로그아웃/회원탈퇴
- 온보딩 7~11단계에서 반려동물 이름과 이미지 저장
- 설정 화면의 반려동물 목록 조회, 상세 조회, 생성, 수정, 삭제
- 설정 화면의 반려동물 사망 체크 저장과 사망 pet 꽃 표시
- 홈 화면의 현재 사용자 pet 목록 조회, 캐러셀 이미지 표시, 선택 pet 이름 표시
- 홈 선택 pet id 저장과 `/home/talk`의 선택 pet 이미지/이름 재조회
- 홈 알림 말풍선: 설정 알람 토글, 산책 빈도, 오늘 캘린더 일정 반영
- 홈 소비 요약 카드: 이번 달 지출 합계, 최대 지출 카테고리, 추천 상품 라벨, 혜택 문구 백엔드 계산
- 홈 대화: 음성 인식, 텍스트 입력, 화면 이동 명령, 일정 추가 명령, 산책/접종/의료 기록 질의, Gemini fallback 답변
- 평균 진료비 조회: 홈 대화 `/api/talk` STT 분기와 별도 `/api/dashboard/average-cost?petId=&item=` endpoint
- 가계부 대시보드, 월별 지출 목록, 지출 등록, 지출 삭제
- 금융 리포트 요약 수치와 최근 12개월 지출 차트 API 연결
- 의료 영수증 OCR, 의료 기록 저장/조회
- 예방접종 캘린더 조회, 일정 추가, 요약 조회
- 산책 실시간 동기화, 완료 기록 저장, 리워드 합산
- 상품 목록/상세 조회
- S3 presigned URL 기반 pet 이미지 업로드

아직 부분 연결 또는 고정 UI 성격이 남은 영역은 다음과 같다.

- `/finance/report` 하단의 “의료비 지출 25%”, “산책 상위 10%”, 뱃지 공유 UI는 여전히 고정 문구와 고정 그래픽 비중이 크다.
- `/finance` 하단의 “펫 케어 구독하고 지출을 10% 낮춰요”는 실제 추천 API 결과가 아니다.
- 상품 추천 DTO와 계산 로직은 있지만 `ProductController`에서 추천 API로 노출되지 않는다.
- 의료 기록 이미지 업로드는 아직 FE route `/api/medical-record-upload`를 통해 로컬 `public/images/health/records`에 저장한다. pet 이미지는 S3 presigned 업로드로 이동했지만 의료 이미지는 아직 로컬 방식이 남아 있다.
- 평균 진료비 조회는 홈 대화 STT 명령과 연결됐고 seed 범위도 진찰/상담/입원/백신접종/혈액검사/영상검사/투약·조제 42개 row로 확장됐다. 다만 자연어 별칭 alias는 아직 `초진 진찰료`, `입원비` 중심이다.

## 3. FE 구조와 동작

### 3.1 인증과 API 호출

- `FE/proxy.ts`
  - 공개 경로: `/`, `/login`, `/login/findpasswd`, `/signup`, `/onboarding`, `/onboarding/1`~`/onboarding/6`
  - 공개 prefix: `/api/auth`
  - `/login/changepasswd?token=...`은 예외적으로 허용
  - 위 목록을 제외한 경로는 `next-auth/jwt`의 토큰이 없으면 `/login`으로 redirect
- `FE/lib/auth.ts`
  - `clientFetch()`가 `getSession()`으로 access token을 읽고 `Authorization: Bearer ...`를 자동 첨부
  - 세션에 `RefreshTokenError`가 있으면 로그아웃 후 401 응답 처리
- `FE/lib/auth.action.ts`
  - `serverFetch()`가 서버 액션에서 `auth()`로 세션을 읽고 Spring API를 호출
  - `logout()`은 NextAuth beta 이슈를 피하기 위해 JWT에서 refresh token을 직접 읽고 Spring `/api/auth/logout`을 먼저 호출

### 3.2 홈 화면 `FE/app/home/page.tsx`

홈 화면의 주요 state는 다음과 같다.

- `pets`: `fetchPets()` 결과로 받은 현재 사용자 반려동물 목록
- `selectedPetId`: 캐러셀에서 선택된 pet id
- `spendingData`: 백엔드 홈 소비 요약 응답을 UI 카드 데이터로 매핑한 값
- `isAlarmEnabled`: `settings-alarm-enabled` localStorage 값
- `scheduleBubbles`: `/api/alarm` 기반 산책/일정 알림 말풍선 목록

반려동물 로딩 흐름은 다음과 같다.

1. 마운트 시 `fetchPets()`가 `GET /api/pets` 호출
2. 응답 중 `isDeath !== true`인 pet만 홈 active pet으로 남긴다
3. 응답의 `id`, `name`, `imageUrl`만 `SelectedPetProfile`에 전달
4. 저장된 `selected-pet-id`가 현재 active pet 목록에 있으면 그 pet 선택
5. 저장값이 없거나 현재 active 목록에 없으면 첫 번째 active pet 선택
6. 선택이 바뀌면 `storeSelectedPetId(selectedPetId)`로 localStorage/sessionStorage 동기화

홈 UI 동작은 다음과 같다.

- 설정 링크는 `/settings`로 이동
- 등록 pet이 없고 알람이 켜져 있으면 온보딩 재진입 유도 버블 노출
- 등록 pet이 있으면 `HomeScheduleBubble`이 산책/오늘 일정 알림을 순서대로 노출
- 사망 처리된 pet은 홈 캐러셀과 대화 진입 active 후보에서 제외
- 캐러셀 중앙 pet 클릭 또는 “말하기” 버튼 클릭 시 `/home/talk`
- “직접입력” 버튼 클릭 시 `/home/talk?mode=text`
- 소비 카드의 “리포트 보러가기”는 `/finance/report`
- 소비 데이터가 없거나 204 응답이면 “아직 등록된 소비 데이터가 없어요!” fallback과 “지출 등록하기” 버튼 표시
- 소비 데이터 로드 실패면 “소비 데이터를 불러오지 못했어요.” 표시

홈 소비 카드에서 FE에 남은 계산은 다음뿐이다.

- `monthlyAmount`를 숫자 또는 문자열에서 `N원` 문자열로 포맷
- `primaryCategory`, `summary`, `savingsHint`를 백엔드 응답에서 그대로 UI 데이터로 매핑

FE에서 제거된 계산은 다음과 같다.

- `Food`, `Hospital`, `Etc` 합계 계산
- 최대 카테고리 판정
- `보험`, `적금`, `구독` 라벨 결정
- 병원 결제 횟수 계산
- 보험 한도/혜택 금액 계산
- 적금 이율 문구 계산
- `/api/products` 추가 조회

### 3.3 홈 반려동물 캐러셀 `FE/components/home/SelectedPetProfile.tsx`

- `PetProfileImage`를 사용해 pet 이미지를 원형 프로필로 렌더링
- 선택 pet을 중앙에 두고 좌우 pet을 scale/translate/z-index로 배치
- pointer drag로 이전/다음 pet 이동
- 중앙 pet 클릭 시 `onSelectedClick(pet.id)` 호출
- 중앙이 아닌 pet 클릭 시 해당 pet 선택
- pet이 하나도 없으면 기본 프로필 이미지를 보여주고 클릭 시 `onSelectedClick?.(0)` 호출

### 3.4 홈 알림 API `FE/features/home/homeApi.ts`

`fetchScheduleBubbles(todayStr, currentHour)`는 다음 방식으로 동작한다.

- `clientFetch('/api/alarm')` 호출
- 응답의 `mostFrequentWalkHour`가 현재 시각과 같으면 “산책할 시간이에요!” 버블 생성
- 응답의 `todayEvents`를 `VACCINATION`, `CHECKUP` 라벨로 변환해 “{petName}의 {label} 일정이 오늘이에요!” 버블 생성
- `home-alert-store` localStorage에 알림 hash와 dismissed 목록 저장
- 날짜나 알림 내용이 바뀌면 hash가 달라져 dismissed 목록이 리셋된다

### 3.5 홈 대화 `FE/app/home/talk/page.tsx`

대화 화면은 음성 모드와 텍스트 모드를 하나의 페이지에서 처리한다.

- 기본 진입 `/home/talk`: 중앙 pet 이미지를 누르면 음성 인식 시작/정지
- 직접입력 진입 `/home/talk?mode=text`: 하단 textarea와 전송 버튼 노출
- 선택 pet 조회: `getStoredMedicalPetId()`로 id를 읽고 `fetchPet(petId)`와 `fetchPets()`를 병렬 호출
- 저장된 pet이 사망 처리됐거나 응답의 `isDeath`가 true이면 첫 번째 생존 pet으로 fallback하고, 생존 pet이 없으면 기본값으로 처리한다
- 일정 intent 파싱용 pet 후보 목록도 `isDeath !== true`인 pet만 남긴다
- 선택 pet 이름: 안내 문구에 사용. 예: `{selectedPetName}를 한 번 눌러\n말씀해보세요.`
- 선택 pet 이미지: `OnboardingBackground`의 `centerImageUrl`로 전달
- 조회 실패 fallback: 이름은 `별송이`, 이미지는 기본 이미지
- TTS: `playTts()`가 `/api/tts`를 먼저 시도하고 실패하면 브라우저 Web Speech TTS로 fallback

대화 명령 처리 흐름은 다음과 같다.

- 음성 transcript 또는 텍스트 입력을 최대 60자 요청 문장으로 정리
- 화면 이동 intent 감지 시 확인 버튼 표시
- 이동 대상 예: `/finance`, `/finance/report`, `/finance/expense/add-image`, `/health`, `/health/walk`, `/health/vaccinations`, `/health/medical-records`, `/product`, `/settings`, `/home`
- 일정 추가 intent 감지 시 `parseCalendarIntent()`가 날짜, pet, 일정 타입을 파싱
- 일정 타입은 `VACCINATION` 또는 `CHECKUP`
- “오늘”, “내일”, “모레”, “N월 N일”을 파싱하며 지난 월일은 다음 해로 보정
- 일정 추가 확인에서 “네”를 누르면 `POST /api/vaccinations/schedules`
- 일반 질문은 `clientFetch('/api/talk')`로 `transcript`, `petId`를 전송

중요한 최신 정정 사항:

- 대화 API 호출은 더 이상 `http://localhost:8080` 하드코딩이 아니다.
- `clientFetch('/api/talk')`를 사용하므로 `SPRING_API_URL` 또는 `NEXT_PUBLIC_SPRING_API_URL` 설정을 따른다.
- `AverageMedicalCost` 별도 endpoint는 이 화면에서 직접 호출하지 않는다. 홈 대화는 계속 `/api/talk`만 호출한다.
- “초진 진찰료 알려줘” 같은 음성은 `/api/talk`로 들어간 뒤 `TalkService`의 평균 진료비 intent에서 먼저 잡혀 `AverageMedicalCostService`로 위임된다.
- 기존 일정 추가/화면 이동/산책 조회/접종 조회/병원 기록 조회 키워드 로직은 유지됐고, 평균 진료비 질문 분기만 Gemini fallback 전에 추가됐다.

### 3.6 설정 화면과 반려동물 삭제/사망 표시

`FE/app/settings/page.tsx` 최신 동작:

- 마운트 시 `fetchPets()`로 현재 사용자 반려동물 목록 조회
- 각 pet은 `PetSettingCard`에서 이름, 나이, 종류, 수정 버튼, 삭제 버튼으로 표시
- `pet.isDeath`가 true이면 이름 옆에 `/images/settings/flower.jpg` 추모 꽃 이미지를 표시
- 수정 버튼은 `/settings/pets/{petId}`로 이동
- 추가 버튼은 `/settings/pets/0`으로 이동
- 알람 토글은 `settings-alarm-enabled`를 localStorage에 저장하고 홈 말풍선에 영향을 준다
- 로그아웃은 모달 확인 후 `logout()` 서버 액션 실행
- 삭제 버튼은 삭제 확인 모달을 열고 “네”를 누르면 `deletePet(petId)` 호출

삭제 성공 후 FE 처리:

- 삭제된 pet을 `pets` state에서 제거
- 삭제된 pet이 `selected-pet-id`에 저장되어 있으면 다음 pet id로 교체
- 다음 pet이 없으면 `selected-pet-id`를 localStorage와 sessionStorage에서 제거
- 모달 닫기

`FE/components/settings/PetSettingCard.tsx`:

- 공통 `Button` 컴포넌트를 사용해 “수정”, “삭제” 버튼 렌더링
- 삭제 버튼은 빨간색 계열 UI
- `isDeath` prop이 true이면 pet 이름 옆에 흰 꽃 이미지를 렌더링

`FE/app/settings/pets/[petId]/page.tsx`:

- `petId === '0'`이면 신규 생성 모드
- 그 외는 `fetchPet(Number(petId))`로 상세 조회 후 이름/나이/종류/크기/이미지/사망 여부를 prefill
- 이미지 선택 시 `uploadPetImage(file)`로 즉시 S3 presigned upload 실행
- 업로드 성공 시 반환된 public URL을 `savedImageUrl`로 보관하고 `selectedImageFile`은 비워 중복 업로드를 피한다
- 나이 입력 오른쪽에 `AddDeath.jpg` 시안과 유사한 “사망” 체크 버튼을 표시한다
- 저장 시 `createPet()` 또는 `updatePet()`에 `isDeath`를 함께 보낸다
- 저장이 성공할 때만 `/settings`로 이동하고, 실패하면 상세 화면에 에러를 남긴다

### 3.7 pet 이미지 업로드

최신 pet 이미지 업로드 경로:

1. FE `uploadPetImage(file)`가 `GET /apis/files/upload-url/static?fileName=&contentType=` 호출
2. BE `FilesController.getStaticUploadUrl()`가 public bucket용 presigned PUT URL과 public URL 반환
3. FE가 presigned URL로 `PUT` 업로드
4. FE가 `publicUrl`을 `imageUrl`로 저장

주의:

- 기존 FE route `/api/pet-upload`는 아직 파일로 남아 있지만 현재 온보딩/설정 pet 업로드 흐름은 `uploadPetImage()`를 사용한다.
- 의료 기록 이미지는 아직 `/api/medical-record-upload` 로컬 저장 흐름을 사용한다.

## 4. BE 구조와 동작

### 4.1 인증과 사용자 식별

`SecurityConfig`:

- CSRF 비활성화
- stateless session
- JWT filter 등록
- 하지만 URL 권한은 `auth.anyRequest().permitAll()`

`CurrentUserService`:

- `getCurrentUserId()`: 인증 principal이 `Long`이면 반환, 아니면 401
- `getCurrentUserIdOrDefault()`: 인증 principal이 없으면 DB의 첫 번째 user id 반환

현재 구조의 의미:

- FE proxy는 대부분의 화면 접근을 막지만, Spring API 자체는 전역적으로 permitAll이다.
- `getCurrentUserId()`를 쓰는 서비스는 직접 API 호출에도 401을 낸다.
- `getCurrentUserIdOrDefault()`를 쓰는 금융 controller 경로는 인증 없이 직접 호출될 경우 첫 번째 사용자 데이터로 동작할 수 있다.

### 4.2 반려동물 API

`PetController` 엔드포인트:

- `POST /api/pets`
- `GET /api/pets`
- `GET /api/pets/{petId}`
- `PATCH /api/pets/{petId}`
- `DELETE /api/pets/{petId}`
- `PATCH /api/pets/{petId}/walk`
- `GET /api/pets/{petId}/walk/live`
- `GET /api/pets/{petId}/walk-records`

`PetService` 핵심:

- 조회/수정/삭제/산책 API는 `getCurrentUserId()`와 `findByIdAndUser_Id()`로 소유권 확인
- 목록 조회는 `petRepository.findByUser_Id(userId)`
- 생성은 `CreatePetRequest`의 `name`, `imageUrl`, `age`, `species`, `size`, `isDeath`를 사용
- 온보딩 생성은 `name`, `imageUrl`만 보내므로 `age`, `species`, `size`가 null일 수 있다
- 설정 생성/수정은 나이/종류/크기까지 채워 보낸다
- `PetResponse`는 `isDeath`, `deathDate`를 함께 내려 FE가 사망 표시와 active 필터링에 사용한다
- `Pet.death`는 nullable이 아닌 boolean 상태값이며 기본값은 false다
- `Pet.update()`는 `isDeath`가 true로 바뀌는 순간 `deathDate`를 현재 시각으로 기록하고, false로 되돌리면 `deathDate`를 null로 초기화한다
- `size` enum은 현재 한글 값 `소형`, `중형`, `대형`
- 생성 시 잘못된 `size`는 `400 Bad Request`
- 수정 시 잘못된 `size`는 조용히 무시된다
- 산책 저장과 실시간 산책 조회는 사망 pet이면 `409 Conflict`로 차단한다

삭제 로직:

1. 현재 사용자 소유 pet 조회
2. `AccountBook.pet` FK를 null로 정리
3. 해당 pet의 산책 기록 삭제
4. 해당 pet의 의료 문서 삭제
5. 해당 pet의 캘린더 일정 삭제
6. pet 삭제

삭제에서 중요한 점:

- 해당 pet과 연결된 `AccountBook` 지출은 삭제하지 않고 pet 연결만 끊는다.
- 산책 기록, 의료 문서, 캘린더 일정은 실제 삭제된다.

사망 처리에서 중요한 점:

- 사망은 `DELETE`가 아니라 `PATCH /api/pets/{petId}`의 `isDeath` 상태 업데이트다.
- pet record 자체와 기존 기록은 유지된다.
- 설정 목록과 상세 페이지에서는 계속 조회/수정할 수 있다.
- 홈/대화/알림/일정 생성/산책 저장/새 의료기록 등록 같은 active 기능에서는 제외하거나 서버에서 거절한다.

### 4.3 홈 소비 요약 API

`FinanceController`:

- `GET /api/account-books/home-summary?year=&month=`
- 인증 사용자 id는 `currentUserService.getCurrentUserIdOrDefault()`
- `FinanceService.getHomeSpendingSummary(userId, year, month)`가 값을 반환하면 200
- 해당 월에 홈 카드 대상 지출이 없으면 204 No Content

`HomeSpendingSummaryResponse`:

- `monthlyAmount`
- `primaryCategory`
- `summary`
- `savingsHint`

`FinanceService.getHomeSpendingSummary()` 계산 순서:

1. `YearMonth.of(year, month)` 생성
2. 해당 월의 사용자 지출 조회
3. `"첫 계좌연결"` 제목의 초기 항목 제외
4. `Hospital`, `Etc`, `Food` 합계를 계산
5. 우선순위 `Hospital > Etc > Food` 기준으로 최대 카테고리 선택
6. 최대 카테고리 합계가 0이면 `Optional.empty()` 반환
7. 월 지출 합계는 대상 월 지출 전체 합계로 계산
8. `Hospital -> 보험`, `Etc -> 적금`, `Food -> 구독`으로 `primaryCategory` 결정
9. `summary`는 `"이 가장 잘 맞아요"`
10. `savingsHint`는 카테고리에 따라 분기

홈 카드 혜택 문구:

- 병원 최대
  - 활성 보험 상품 `ProductType.INSURANCE` 조회
  - 이번 달 병원 결제 횟수 계산
  - 해당 연도 1월부터 전월까지 병원 결제 횟수 계산
  - 상품의 `benefitLimitCount` 또는 기본 20회에서 이전 사용 횟수를 뺀 남은 한도 계산
  - 이번 달 병원 횟수와 남은 한도 중 작은 값만 보장 횟수로 인정
  - 상품의 `benefitAmount` 또는 기본 100,000원을 곱하고 만원 단위로 변환
  - 문구: `하나 펫 보험 가입하면, N만원 할인 가능`
- 기타 최대
  - 활성 적금 상품 `ProductType.SAVINGS` 조회
  - `benefitRate`가 있으면 문구: `하나 펫 적금 가입하면, 연 N% 이자 가능`
  - 없으면 문구: `하나 펫 적금 가입하면, 이자 혜택 확인 가능`
- 식비 최대
  - 문구: `하나 펫 구독 가입하면, 1.5만원 절약 가능`

이 로직의 최신 의미:

- FE에서 중복 계산하던 로직은 제거됐다.
- 홈 소비 카드의 비즈니스 규칙은 Spring `FinanceService`가 단일 출처다.
- `ProductService.getActiveProductRecommendations()`는 이 카드에서 사용되지 않는다.

### 4.4 가계부 월별 조회와 대시보드

`FinanceController`:

- `GET /api/account-books/dashboard`: 계좌명, 계좌번호, 잔액
- `GET /api/account-books?year=&month=`: 월별 지출 합계, 오늘 지출, 항목 목록
- `POST /api/account-books`: 지출 생성
- `DELETE /api/account-books/{accountBookId}`: 지출 삭제

`FinanceService`:

- 월별 조회에서도 `"첫 계좌연결"` 항목 제외
- 오늘 지출은 요청한 year/month가 오늘의 year/month와 같을 때만 계산
- 삭제 시 지출의 `user.id`와 요청 사용자 id를 비교

주의:

- 이 controller도 `getCurrentUserIdOrDefault()`를 사용하므로 직접 API 호출 시 인증 fallback 리스크가 있다.
- `CreateAccountBookRequest`에는 `petId`가 없어서 공개 지출 등록 경로로는 지출과 pet을 연결하지 않는다.

### 4.5 금융 리포트

`FinanceReportController`:

- `GET /api/finance/report`
- `GET /api/finance/report/monthly-expenses`
- 이 controller는 `Authentication`을 직접 검사하고 인증이 없으면 401을 던진다.

`FE/features/finance/api/financeReportApi.ts`:

- `getFinanceRetirementReport()`가 `/api/finance/report` 호출
- 실패 시 0 값 report 반환
- `getMonthlyExpenseChart()`가 `/api/finance/report/monthly-expenses` 호출
- 실패 시 최근 12개월 0원 chart 반환

`FE/app/finance/report/page.tsx`:

- 총 예상 pet 비용, 노후자금 영향 비율, 월 평균 지출은 API 응답 기반
- 최근 12개월 막대그래프도 API 응답 기반
- 하단 카드의 `의료비 지출 25%`, `산책 상위 10%`, 뱃지 모달은 아직 정적 UI 성격이 강하다

`FinanceReportService` 계산:

- 현재 사용자 pet 목록 조회
- 사망 처리되지 않은 pet만 future cost 대상
- 계좌 총자산은 `accountRepository.sumMoneyAmountByUserId(userId)`
- 월 평균 지출은 첫 지출 월부터 현재 월까지, 최대 최근 12개월을 관찰
- 월별 지출을 해당 월의 active pet 수로 나눠 평균을 조정
- pet의 종/크기/나이를 기준으로 기대수명과 연 의료비를 추정
- 향후 생존 연차별 생활비와 의료비를 합산해 `totalPetCost` 계산
- `retirementPercent = totalPetCost / totalAsset * 100`
- 월별 차트는 최근 12개월의 월별 지출 합계 반환

금융 리포트의 주요 리스크:

- repository 메서드 이름은 `sumMonthlyPetExpenseByUserId`, `findFirstPetSpendDateByUserId`처럼 pet expense를 암시하지만 쿼리는 현재 `a.user.id = :userId`만 보고 pet 조건을 걸지 않는다.
- 따라서 현재 리포트는 “반려동물 지출”이 아니라 “사용자 전체 가계부 지출”에 가까운 값을 계산한다.
- `AccountBook` builder는 `Pet pet`을 인자로 받지만 생성자 내부에서 `this.pet = pet`를 하지 않는다.
- 공개 지출 생성 요청에는 `petId`가 없어 애초에 pet 연결 지출을 만들 수 없다.
- 온보딩 pet은 `age`가 null일 수 있는데 `getProjectedYears()`에서 `BigDecimal.valueOf(pet.getAge())`를 사용하므로 null이면 예외 가능성이 있다.

### 4.6 알림 API

`AlarmController`:

- `GET /api/alarm`

`AlarmService`:

- `getCurrentUserId()`로 인증 사용자 확인
- 완료된 산책 기록의 시간대별 빈도를 계산
- 사망 처리된 pet의 산책 기록은 빈도 계산에서 제외
- 가장 자주 산책한 시간대를 `mostFrequentWalkHour`로 반환
- 오늘 날짜의 캘린더 이벤트를 `todayEvents`로 반환
- 사망 처리된 pet의 오늘 캘린더 이벤트는 알림 응답에서 제외
- 빈도 tie-break는 빈도 내림차순, 시간 오름차순

FE 홈은 이 값을 사용해 산책 알림과 오늘 일정 알림을 만든다.

### 4.7 홈 대화 API

`TalkController`:

- `POST /api/talk`
- 요청: `transcript`, 선택적 `petId`
- 응답: `message`

`TalkService`:

- transcript 공백 제거 후 intent 판단
- 산책 질의면 오늘 완료 산책 기록을 조회해 답변
- 예방접종 질의면 해당 pet의 최신 접종 의료 문서 조회
- 병원/검진/진료 질의면 해당 pet의 최신 의료 문서 조회
- 위 세 분기와 맞지 않으면 Gemini chat model 호출
- Gemini 호출은 최대 3회 재시도하고 실패하면 fallback 문구 반환
- pet 조회는 `currentUserService.getCurrentUserId()`와 `petRepository.findByIdAndUser_Id()`를 사용해 소유권을 확인
- 선택 pet이 사망 처리됐으면 대화 대상 pet으로 사용하지 않는다
- 선택 pet id가 없을 때 첫 번째 pet을 고르는 fallback도 사망 처리되지 않은 pet만 대상으로 한다

### 4.8 의료 기록과 예방접종

`MedicalOcrController`:

- `POST /api/medical-records/ocr`: Google Vision OCR
- `POST /api/medical-records`: 의료 기록 저장
- `GET /api/medical-records?type=`: 현재 사용자 pet들의 의료 기록 조회

`MedicalService`:

- 기록 저장 시 현재 사용자 pet 목록을 조회하고 `petName` fuzzy matching으로 대상 pet 결정
- 새 의료 기록 저장 대상은 사망 처리되지 않은 pet으로 제한한다
- 등록 가능한 생존 pet이 없으면 `409 Conflict`를 반환한다
- 정확 일치, 부분 포함, Levenshtein 거리 2 이하, 첫 번째 pet fallback 순서
- 목록 조회는 `findByPet_User_Id...` 계열 repository 메서드로 현재 사용자 범위만 반환
- 기존 의료 기록 목록 조회는 히스토리 보존 성격이므로 사망 pet 기록도 데이터가 남아 있으면 조회될 수 있다

`VaccinationController`:

- `GET /api/vaccinations/schedules`
- `POST /api/vaccinations/schedules`
- `GET /api/vaccinations/summary`

`VaccinationService`:

- 일정 조회는 현재 사용자 pet의 캘린더 이벤트만 조회
- 일정 조회 결과는 사망 처리되지 않은 pet의 이벤트만 그룹핑한다
- 일정 생성은 요청 `petId`가 현재 사용자 pet인지 검증
- 일정 생성 대상 pet이 사망 처리됐으면 `409 Conflict`를 반환한다
- 요약은 의료 문서와 미래 캘린더 이벤트를 결합해 last/next vaccination 정보를 만든다
- 요약 대상 pet 목록에서도 사망 처리된 pet은 제외한다

### 4.9 AverageMedicalCost 신규 평균 진료비 로직

신규 추가된 파일:

- `BE/src/main/java/com/mgk/bemgk/entity/AverageMedicalCost.java`
- `BE/src/main/java/com/mgk/bemgk/repository/AverageMedicalCostRepository.java`
- `BE/src/main/java/com/mgk/bemgk/service/AverageMedicalCostService.java`
- `BE/src/main/java/com/mgk/bemgk/controller/AverageMedicalCostController.java`
- `BE/src/main/java/com/mgk/bemgk/config/AverageMedicalCostConfig.java`

현재 구조:

- `average_medical_cost` 테이블에 `category`, `item`, `species`, `size`, `avg_cost` 저장
- `AverageMedicalCostConfig`가 앱 시작 시 42개 seed row를 확인하고, 없는 조합만 `saveIfMissing(...)`로 삽입
- 중복 판단 기준은 `category`, `item`, `species`, `size` 네 값의 조합이다.
- `AverageMedicalCostRepository.existsByCategoryAndItemAndSpeciesAndSize(...)`가 seed 중복 여부를 판단한다.
- seed 범위는 진찰, 상담, 입원, 백신접종, 혈액검사, 영상검사, 투약·조제다.
- seed 항목은 `초진 진찰료`, `재진 진찰료`, `상담료`, `입원비`, `종합백신`, `광견병백신`, `켄넬코프백신`, `코로나바이러스백신`, `인플루엔자백신`, `전혈구 검사비`, `혈액화학 검사비`, `전해질 검사비`, `방사선촬영비`, `초음파촬영비`, `CT촬영비`, `MRI촬영비`, `심장사상충 예방비`, `외부기생충 예방비`, `광범위구충 예방비`다.
- `AverageMedicalCostRepository.findByItem(item)`으로 같은 항목 후보 목록 조회
- `AverageMedicalCostService`가 현재 로그인 사용자와 pet 소유권을 확인하고, 사망 pet은 조회 대상에서 제외
- `AverageMedicalCostService.find(petId, item)`이 pet의 species/size를 읽고 후보 중 최적 row 선택
- 우선순위는 `species+size` 정확 일치, `species+ALL`, `ALL+size`, `ALL+ALL`
- `AverageMedicalCostService.isAverageCostQuery()`가 STT 문장에 평균 진료비 질문 키워드와 항목 alias가 있는지 검사
- `초진`, `초진진찰료`, `초진료`, `첫진료`, `첫진찰`은 `초진 진찰료`로 정규화
- `입원`, `입원료`, `입원비`는 `입원비`로 정규화
- alias에 없더라도 문장 안에 canonical item명이 그대로 포함되면 `repository.findAll()`의 item 목록에서 매칭한다. 예: `재진 진찰료 알려줘`, `CT촬영비 얼마야`
- `TalkService.ask()`는 평균 진료비 intent가 감지되면 기존 Gemini fallback 전에 `AverageMedicalCostService.answer()`를 호출
- `AverageMedicalCostController`는 별도 직접 조회용으로 `POST /api/dashboard/average-cost?petId=&item=` 문자열 응답을 유지
- 응답 예: `초진 진찰료 평균은 10,332원이에요.`

남은 주의점:

- 현재 정규화 alias는 `초진 진찰료`, `입원비`의 자연어 변형 중심이다. canonical item명을 그대로 말하면 조회되지만, `엑스레이`, `피검사`, `심장사상충약` 같은 생활 표현은 아직 별도 alias가 필요하다.
- `findByItem(item)` 자체는 여전히 canonical item 완전 일치 조회다. STT 문장 정규화는 service layer가 담당한다.
- seed 중복 방지는 app layer의 `existsBy...` 검사로 처리된다. DB unique constraint는 아직 없다.
- 별도 `/api/dashboard/average-cost` endpoint는 문자열 응답을 반환하므로, 추후 FE 전용 화면에서 쓰려면 DTO 응답으로 바꾸는 편이 확장에 유리하다.

### 4.10 상품과 파일 업로드

`ProductController`:

- `GET /api/products`
- `GET /api/products/{productId}`

`ProductService`:

- 전체 상품/단일 상품 조회
- 활성 상품 추천 계산 로직은 존재
- 추천 계산은 카드/적금/보험 상품별로 예상 혜택을 계산
- 추천 계산 내부의 생존 pet 판정은 `!pet.isDead()`를 기준으로 사망 pet을 제외한다
- 하지만 추천 결과를 반환하는 controller endpoint는 아직 없다

추천 계산의 주의점:

- 보험 추천 계산에서 병원 카테고리 문자열을 `"병원"`으로 사용한다.
- 현재 `AccountBookCategory` enum 값은 `Hospital`, `Food`, `Etc`이므로 이 추천 로직을 그대로 노출하면 카테고리 매칭이 어긋날 가능성이 있다.

`FilesController`:

- `GET /apis/files/upload-url/static`: public bucket 업로드 URL과 public URL 반환
- `GET /apis/files/upload-url`: private bucket 업로드 URL 반환
- `GET /apis/files/download-url`: private bucket 다운로드 URL 반환
- `POST /apis/files/upload-urls`: 여러 파일 presigned URL 발급
- 이미지 MIME 타입만 허용
- endpoint 설정이 있으면 path-style URL을 만들고, 없으면 AWS S3 public URL을 만든다

## 5. 주요 데이터 모델

핵심 관계:

- `User`는 `Pet`, `Account`, `AccountBook`, `Verification`과 연결
- `Pet`은 `PetWalkRecord`, `MedicalDocument`, `CalendarEvent`와 연결
- `AccountBook`은 `User`, 선택적 `Pet`, 선택적 `Account`와 연결
- `Product`는 독립 테이블이고 홈 카드/추천 계산 시 조회된다
- `AverageMedicalCost`는 `average_medical_cost` 독립 테이블로 설계되어 있고 평균 진료 항목 비용 조회에 사용된다.
- `Pet.death`는 nullable이 아닌 boolean 상태값이며 기본값은 false다
- `Pet.deathDate`는 사망 체크가 true로 바뀐 시각을 저장하고, 다시 false로 바꾸면 null로 초기화된다

현재 데이터 모델에서 중요한 불일치:

- `AccountBook.pet` 필드는 존재하지만 일반 지출 생성 API가 pet을 받지 않는다.
- `AccountBook` builder에 `Pet pet` 인자가 있지만 실제 필드 대입이 빠져 있다.
- `Pet.age`, `Pet.species`, `Pet.size`는 온보딩 생성 경로에서 null이 될 수 있다.
- `FinanceReportService`는 pet의 age/species/size를 계산 전제로 사용한다.
- `AverageMedicalCost`의 package/import 정합성 문제는 해소됐다. 다만 `category/item/species/size` 조합의 DB unique constraint는 아직 없다.

## 6. 실제 동작 시퀀스

### 6.1 홈 pet 이미지/이름 표시

1. `/home` 진입
2. `fetchPets()`가 `GET /api/pets` 호출
3. BE가 현재 사용자 pet 목록 반환
4. FE가 `isDeath !== true`인 pet만 active 목록으로 필터링
5. FE가 `SelectedPetProfile`에 `id`, `name`, `imageUrl` 전달
6. 저장된 `selected-pet-id`가 active 목록에 있으면 그 pet 선택
7. 중앙 프로필에는 `imageUrl`, 캐러셀 아래에는 `selectedPet.name` 표시
8. 선택 변경 시 `selected-pet-id` localStorage/sessionStorage 갱신

### 6.2 홈 선택 pet을 `/home/talk`에서 재사용

1. 홈에서 pet 선택
2. `storeSelectedPetId(selectedPetId)` 실행
3. `/home/talk` 진입
4. `getStoredMedicalPetId()`가 저장된 id 조회
5. `fetchPet(petId)`가 `GET /api/pets/{petId}` 호출
6. `fetchPets()`가 일정 intent 파싱용 pet 후보 목록 조회
7. `fetchPet()` 결과가 사망 pet이면 첫 번째 생존 pet 또는 기본값으로 fallback 처리
8. `fetchPets()` 결과 중 사망 pet은 일정 intent 후보에서 제외
9. 선택 pet 이름은 안내 문구와 답변 context에 사용
10. 선택 pet 이미지는 `OnboardingBackground.centerImageUrl`로 렌더링

### 6.3 홈 소비 요약 카드

1. `/home` 진입
2. FE가 현재 연/월로 `/api/account-books/home-summary?year=&month=` 호출
3. BE가 월별 지출을 조회하고 `"첫 계좌연결"` 제외
4. BE가 `Hospital`, `Etc`, `Food` 중 최대 지출 카테고리 판단
5. BE가 상품 타입과 지출 횟수를 바탕으로 `savingsHint` 생성
6. BE가 200과 `HomeSpendingSummaryResponse` 반환
7. FE가 `monthlyAmount`만 `N원`으로 포맷하고 나머지 문자열은 그대로 표시
8. 대상 지출이 없으면 BE가 204 반환, FE는 지출 등록 fallback 표시

### 6.4 설정 pet 삭제

1. `/settings` 진입
2. FE가 `GET /api/pets`로 pet 목록 표시
3. 사용자가 삭제 버튼 클릭
4. 삭제 확인 모달 표시
5. “네” 클릭 시 FE가 `DELETE /api/pets/{petId}` 호출
6. BE가 소유권 확인
7. BE가 account book pet 연결 null 처리, 산책/의료/캘린더 관련 데이터 삭제, pet 삭제
8. FE가 목록 state에서 제거
9. 삭제 pet이 선택 저장소에 있으면 다음 pet으로 교체하거나 저장소 삭제

### 6.5 설정 pet 사망 처리

1. `/settings/pets/{petId}` 진입
2. FE가 `GET /api/pets/{petId}`로 기존 `isDeath` 값을 prefill
3. 사용자가 “사망” 체크 버튼을 켜고 저장
4. FE가 `PATCH /api/pets/{petId}`에 `isDeath: true` 포함
5. BE가 pet 소유권을 확인하고 `Pet.update()`로 `death=true`, `deathDate=현재 시각` 저장
6. FE가 저장 성공 시 `/settings`로 이동
7. `/settings` 목록의 `PetSettingCard`가 `isDeath`를 보고 pet 이름 옆에 꽃 이미지를 표시
8. 홈과 대화 화면은 해당 pet을 active 후보에서 제외
9. BE는 산책 저장/실시간 산책/새 의료기록/새 예방접종 일정/알림/대화/추천 계산에서 사망 pet을 제외하거나 거절

### 6.6 금융 리포트

1. `/finance/report` 진입
2. FE가 `GET /api/finance/report`와 `GET /api/finance/report/monthly-expenses` 병렬 호출
3. BE가 현재 사용자 인증 확인
4. BE가 pet 목록, 계좌 총액, 월별 지출 데이터를 사용해 리포트 계산
5. FE가 노후자금 영향 비율, 예상 비용, 월 평균 지출, 최근 12개월 차트를 표시
6. API 실패 시 FE는 0 값 fallback report/chart를 표시

### 6.7 AverageMedicalCost STT 목표 흐름 검수

사용자가 의도한 목표 흐름:

1. 사용자가 `/home/talk`에서 “초진 진찰료 알려줘”라고 말함
2. 브라우저 STT가 transcript를 생성
3. FE가 transcript와 `selectedPetId`를 서버에 전송
4. Controller가 요청을 받음
5. Service가 transcript에서 진료 항목을 추출하고 pet 종/크기 기준으로 우선순위 매칭
6. DB의 `average_medical_cost`에서 평균 비용 조회
7. 서버가 `초진 진찰료 평균은 10,332원이에요.` 같은 응답 반환
8. FE가 응답 문구를 말풍선에 표시하고 `playTts()`로 TTS 출력

현재 실제 코드 흐름:

1. 사용자가 `/home/talk`에서 말하면 `react-speech-recognition`이 transcript 생성
2. FE는 일반 질문을 `clientFetch('/api/talk')`로 전송
3. `TalkController`가 `TalkService.ask(transcript, petId)` 호출
4. `TalkService`가 평균 진료비 intent를 먼저 검사
5. `AverageMedicalCostService.isAverageCostQuery()`가 `초진`, `초진진찰료`, `초진 진찰료` 등 alias 또는 canonical item명과 `알려`, `얼마`, `평균`, `비용`, `진찰료` 같은 질문 키워드를 확인
6. 매칭되면 `AverageMedicalCostService.answer(petId, transcript)`로 위임
7. service가 현재 로그인 사용자 소유 pet인지 확인하고 사망 pet은 제외
8. service가 pet species/size를 `DOG`, `CAT`, `SMALL`, `MEDIUM`, `LARGE`, `ALL`로 매핑
9. DB 후보 중 `species+size`, `species+ALL`, `ALL+size`, `ALL+ALL` 우선순위로 선택
10. 서버가 `초진 진찰료 평균은 10,332원이에요.` 형식의 메시지를 반환
11. FE가 말풍선에 표시하고 `playTts()`가 `/api/tts` 또는 브라우저 TTS로 읽어준다

검수 결론:

- 제시한 목표 흐름 자체는 맞다.
- 현재 구현도 이 흐름에 맞게 `/api/talk` 안에서 평균진료비 intent를 먼저 판별해 `AverageMedicalCostService`로 위임한다.
- FE의 일정 추가/화면 이동/기존 질문 키워드 로직은 수정하지 않았다.
- 별도 `/api/dashboard/average-cost` endpoint는 직접 조회용으로 유지된다.

## 7. 현재 리스크와 우선 수정 후보

### 7.1 Spring Security와 default user fallback

가장 큰 구조적 리스크는 Spring Security가 모든 요청을 permit하고 일부 서비스가 default user fallback을 허용하는 점이다.

- `SecurityConfig`: `auth.anyRequest().permitAll()`
- `FinanceController`: `getCurrentUserIdOrDefault()` 사용
- 인증 없이 직접 Spring API를 호출하면 일부 금융 API가 첫 번째 사용자 기준으로 동작할 수 있다

우선 조치:

- Spring Security에서 `/api/auth/**` 등 공개 API를 제외하고 인증 필수로 전환
- `FinanceController`에서 `getCurrentUserIdOrDefault()` 제거
- 개발용 fallback이 필요하면 profile 또는 명시적 mock 설정으로 격리

### 7.2 금융 리포트의 계산 전제 불일치

현재 금융 리포트는 API 연결은 되었지만 계산 전제가 정리되지 않았다.

- `AccountBook.pet` 연결이 실제 생성 경로에서 설정되지 않는다
- repository 쿼리는 pet 조건 없이 사용자 전체 지출을 집계한다
- `FinanceReportService` 이름과 화면 문구는 반려동물 비용을 암시한다

우선 조치:

- 지출 생성 request에 `petId`를 추가할지 결정
- `AccountBook` builder에 `this.pet = pet` 추가
- 리포트 쿼리를 전체 지출로 볼지, pet 연결 지출만 볼지 명확히 결정
- 화면 문구와 계산 쿼리 기준을 일치시킬 것

### 7.3 온보딩 pet null 값과 리포트 예외 가능성

온보딩 pet은 `age`, `species`, `size`가 null일 수 있다.

- `FinanceReportService.getProjectedYears()`는 `pet.getAge()`를 null guard 없이 사용
- `getLifeExpectancyYears()`는 species/size null에 일부 guard가 있으나 age는 취약하다

우선 조치:

- 리포트 계산에서 age null fallback을 정의
- 또는 리포트 대상 pet에서 age가 없는 pet을 제외하고 FE에 보완 입력을 유도

### 7.4 설정 pet 저장 UX

현재 설정 상세 저장은 동작하지만 남은 UX 리스크가 있다.

- 이미지 선택 시 즉시 S3에 업로드되므로, 사용자가 저장하지 않고 이탈하면 미사용 업로드 객체가 남을 수 있다
- 빈 나이는 `Number(age) || 0`으로 0살이 되어 “모름”과 구분되지 않는다
- 생성과 수정의 `size` 오류 처리 방식이 다르다

우선 조치:

- 저장 확정 전 업로드 객체 정리 정책 또는 임시 업로드 정책 결정
- age empty를 null로 보내거나 필수값으로 검증
- 생성/수정의 validation 정책 통일

### 7.5 상품 추천 API 미노출과 카테고리 불일치

`ProductService.getActiveProductRecommendations()`는 구현되어 있지만 FE에서 쓰지 않는다.

- controller endpoint 없음
- 보험 추천 계산은 `"병원"` 문자열을 사용
- 현재 지출 카테고리는 enum `Hospital`, `Food`, `Etc`

우선 조치:

- 추천 API 노출 전 카테고리 타입을 enum 기반으로 정리
- 홈 카드와 상품 추천 로직의 책임 분리 또는 통합 여부 결정

### 7.6 비밀값과 저장소 관리

민감 정보가 설정 파일에 평문으로 존재한다.

- `FE/.env`
- `BE/src/main/resources/security.yml`
- `BE/docker-compose.yml`

우선 조치:

- 노출된 키는 폐기/재발급
- 로컬 예시는 `.env.example`, `security.example.yml`로 분리
- 실제 값은 환경 변수 또는 secret manager로 주입

### 7.7 업로드 방식 이원화

pet 이미지는 S3 presigned upload로 이동했지만 의료 기록 이미지는 FE 로컬 저장을 사용한다.

- pet 이미지: `/apis/files/upload-url/static` + S3 public URL
- 의료 기록 이미지: `/api/medical-record-upload` + `public/images/health/records`

우선 조치:

- 의료 기록 이미지도 S3 private/public 정책 중 하나로 통일
- 기존 FE local upload route의 유지 여부 결정

### 7.8 AverageMedicalCost 남은 확장 후보

평균 진료비 신규 코드는 STT 기본 흐름에 연결됐고, seed도 42개 row까지 확장됐다. 다음은 운영/확장 전에 정리하는 편이 좋다.

- 현재 alias map은 code 상수라 생활 표현을 늘릴 때마다 service 수정이 필요하다.
- `average_medical_cost`에 canonical item만 있고 별도 alias column/table은 없다.
- canonical item명은 `repository.findAll()`로 보조 매칭하지만, 항목이 많아지면 전체 scan보다 alias/index 구조가 더 안전하다.
- `/api/dashboard/average-cost`는 문자열 응답이므로 화면형 API로 쓰기에는 DTO가 더 적합하다.
- seed 중복 방지는 `AverageMedicalCostConfig.saveIfMissing(...)`와 repository `existsByCategoryAndItemAndSpeciesAndSize(...)`로 처리한다. 다만 DB 레벨 unique constraint는 아직 없다.

우선 조치:

- 진료 항목 alias를 DB table 또는 enum-like config로 분리
- `category/item/species/size` 조합 unique constraint 또는 migration 기반 seed 정책 결정
- 평균 진료비 직접 조회 API를 `{ item, avgCost, message }` 형태 DTO로 전환할지 결정
- 항목 추가 시 STT 테스트 문장도 같이 추가

## 8. 최신 코드 기준 정정된 과거 문장

이전 보고서에서 이제 수정되어야 하는 내용은 다음과 같다.

- “홈 소비 카드는 FE 규칙 기반이다”는 더 이상 정확하지 않다. 현재 홈 카드 계산은 BE `FinanceService.getHomeSpendingSummary()`가 담당한다.
- “홈 직접입력 버튼은 목업이다”는 더 이상 정확하지 않다. 현재 `/home/talk?mode=text`로 이동하고 텍스트 전송이 동작한다.
- “/home/talk 대화 요청이 localhost 하드코딩이다”는 더 이상 정확하지 않다. 현재 `clientFetch('/api/talk')`를 사용한다.
- “금융 리포트 백엔드 controller가 없다”는 더 이상 정확하지 않다. 현재 `FinanceReportController`가 있고 FE도 호출한다.
- “/settings가 FE proxy 보호 대상이 아니다”는 더 이상 정확하지 않다. 현재 proxy는 공개 경로 외 대부분을 보호한다.
- “반려동물 삭제 기능은 없다”는 더 이상 정확하지 않다. FE 삭제 모달과 BE `DELETE /api/pets/{petId}`가 있다.
- “사망 pet은 삭제로 처리한다”는 정확하지 않다. 현재 사망은 `pets.death` 상태 업데이트이며 기존 record는 보존된다.
- “pet 사진 업로드는 FE public 로컬 저장만 사용한다”는 현재 pet 이미지에 대해서는 정확하지 않다. pet 업로드는 S3 presigned upload를 사용한다. 단 의료 기록 이미지는 여전히 FE local route를 사용한다.
- “초진 진찰료 알려줘”가 평균 진료비 DB 조회로 이어지지 않는다는 이전 설명은 더 이상 정확하지 않다. 현재 `/api/talk`의 `TalkService`에서 평균 진료비 intent를 먼저 처리한다.

## 9. 다음 작업 우선순위

추천 우선순위는 다음과 같다.

1. Spring Security에서 실제 API 인증 정책 적용
2. `getCurrentUserIdOrDefault()`를 금융 API에서 제거
3. 금융 리포트가 전체 지출 기준인지 pet 연결 지출 기준인지 결정
4. `AccountBook.pet` 연결 누락과 `petId` 요청 모델 정리
5. 리포트 계산에서 pet age null 처리
6. 설정 pet 나이/size validation 정리
7. 사망 pet의 과거 기록 노출 정책을 화면별로 명확히 문서화
8. AverageMedicalCost alias, DB unique constraint, DTO 응답 확장 정책 정리
9. 상품 추천 API 노출 전 카테고리 타입 불일치 수정
10. 의료 기록 이미지 업로드도 S3 정책으로 통일
11. 노출된 secret 폐기와 환경 변수 분리

## 10. 최종 판단

현재 MGK는 홈, 반려동물, 설정, 대화, 가계부, 금융 리포트의 핵심 연결이 이전보다 훨씬 실제 API 중심으로 정리되어 있다. 특히 홈 소비 카드의 비즈니스 계산이 Spring으로 이동했고, FE는 표시 전용 매핑만 하도록 바뀐 점이 중요하다. 또한 사망 pet은 삭제하지 않고 상태로 보존하면서 active 기능에서는 제외하는 방향으로 정리됐다. 평균 진료비 조회도 `/api/talk` STT 흐름에 연결되어 “초진 진찰료 알려줘” 같은 질문을 DB 기반 응답으로 처리할 수 있고, seed는 42개 row를 중복 없이 보강하는 구조가 됐다.

다만 운영 안정성 관점에서는 아직 “화면 연결”보다 “권한 모델과 데이터 모델 정합성”을 먼저 잠가야 한다. Spring API 인증 정책, 금융 리포트의 지출 기준, `AccountBook.pet` 연결, null pet 속성 처리, secret 관리가 정리되면 이후 상품 추천과 리포트 고도화를 더 안전하게 진행할 수 있다.
