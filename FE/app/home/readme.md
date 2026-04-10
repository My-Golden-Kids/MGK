# Home/Pet API 연동 메모

## 목적
온보딩 업로드 이후 `public/images/pet`에 저장된 이미지 경로를 Spring DB(`pets.image`)에 반영하고, 홈(`/home`)에서 해당 경로를 사용해 실제 이미지를 렌더링한다.

## PetController 메서드 역할

대상 파일: `BE/src/main/java/com/mgk/bemgk/controller/PetController.java`

### 1) `GET /api/pets` (`getPets`)
- 현재 로그인 유저 ID를 `CurrentUserService`로 조회한다.
- 해당 유저의 펫 목록을 `PetService.getPets(userId)`로 가져온다.
- 홈 화면에서 펫 리스트(이름, 이미지 등)를 불러올 때 사용하는 기본 조회 API다.

### 2) `PATCH /api/pets/{petId}/image` (`updatePetImage`)
- 현재 로그인 유저 ID를 조회한다.
- 지정한 `petId`의 `image` 필드를 요청 값으로 업데이트한다.
- 이미 펫 레코드가 있는 경우, 이미지 경로만 교체할 때 사용한다.

### 3) `PATCH /api/pets/onboarding-image` (`syncOnboardingPetImage`)
- 현재 로그인 유저 ID를 조회한다.
- 온보딩에서 넘어온 `name`, `image`를 기준으로 서비스 업서트 로직을 수행한다.
- 일반적으로:
  - 유저의 기존 펫이 있으면 해당 펫 이미지 업데이트
  - 유저 펫이 없으면 기본값으로 펫 생성 후 이미지 저장
- 즉, 온보딩 첫 업로드 시 “레코드 자동 생성 + 이미지 저장” 진입점이다.

## FE에서 이 컨트롤러를 쓰는 흐름

### 업로드 단계
1. `FE/components/onboarding/OnboardingStepPage.tsx`
   - 이미지 선택 후 `POST /api/pet-upload` 호출
2. `FE/app/api/pet-upload/route.ts`
   - 파일을 `public/images/pet`에 저장
   - 세션 토큰으로 Spring 호출
   - 필요 시 `GET /api/pets` -> `PATCH /api/pets/{petId}/image` 또는 `PATCH /api/pets/onboarding-image`

### 홈 화면 단계
1. `FE/app/home/page.tsx`
   - `fetch('/api/pet', { cache: 'no-store' })`
2. `FE/app/api/pet/route.ts`
   - Spring `GET /api/pets` 호출
   - `imageUrl` 필드 정규화 후 반환
3. 홈 컴포넌트
   - `PetProfileImage`에 `imageUrl` 전달
   - 이미지 경로가 비어 있으면 `"/images/onboarding/byeolsong.png"` fallback 사용

## 왜 홈에서 이미지가 안 보일 수 있는가

1. 업로드는 성공했지만 `dbUpdated`가 `false`인 경우  
   (세션 없음, 토큰 문제, Spring 호출 실패)

2. Spring DB의 `pets.image`가 비어 있거나 잘못된 상대 경로인 경우  
   (예: `/images/pet/...` 형식 불일치)

3. 홈 조회 API(`/api/pet`)가 401/500 등으로 실패한 경우

4. 다른 유저로 로그인되어 있어 업로드한 유저와 조회 유저가 다른 경우

## 점검 우선순위
1. `POST /api/pet-upload` 응답에서 `dbUpdated` 확인
2. Spring DB `pets.image` 값 확인
3. `GET /api/pet` 응답의 `pets[].imageUrl` 확인
4. 홈에서 fallback 대신 실제 `/images/pet/...`가 내려오는지 확인
