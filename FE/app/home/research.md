# MGK Full Project Research Report

Date: 2026-04-10  
Workspace root: `C:\Users\campus2H062\Desktop\MGK`  
Authoring scope: FE + BE source and runtime configs

## 1. Scope and method

This report is based on a deep read of the active source directories and runtime config files.

Included:
- `FE/app`, `FE/components`, `FE/features`, `FE/lib`, `FE/hooks`, `FE/types`
- `FE/public` asset layout
- `FE` project configs (`package.json`, `tsconfig`, `next.config`, `proxy`, lint/test config, env)
- `BE/src/main/java` (controllers, services, repositories, entities, auth, config, exceptions, DTOs)
- `BE/src/main/resources` (`application.yml`, `security.yml`, `data.sql`)
- `BE` build/runtime files (`build.gradle`, Docker files)

Excluded from deep line-level analysis:
- Generated/vendor/runtime outputs such as `FE/.next`, `FE/node_modules`, `BE/build`, `.gradle`

## 2. High-level architecture

### 2.1 FE

- Framework: Next.js App Router (`next@16.2.1`), React 19, TypeScript strict mode.
- Auth session: `next-auth` JWT strategy with Spring token delegation.
- FE structure is feature-route oriented:
  - `app/` routes
  - `components/` UI composition
  - `features/` route-domain API wrappers/types
  - `lib/` cross-domain helpers (`auth`, OCR mapping, validators)
- FE has two API layers:
  1. Next route handlers (`FE/app/api/*`) used as server-side proxy/adapters
  2. Direct client calls to Spring (`clientFetch`) for many domain endpoints

### 2.2 BE

- Framework: Spring Boot 4, Java 21, JPA/Hibernate, MySQL.
- Security model:
  - JWT parsed by custom filter
  - `SecurityConfig` currently permits all requests at matcher level, but many services/controllers still require authenticated principal to resolve `userId`.
- Domain modules:
  - auth, pet, finance(account books), medical OCR/documents, vaccination schedules, products, talk AI

## 3. Runtime and environment behavior

## 3.1 FE environment

Core FE env vars:
- `SPRING_API_URL`, `NEXT_PUBLIC_SPRING_API_URL` for backend base URL
- `AUTH_SECRET`, `NEXTAUTH_URL`
- DB credentials also present in FE `.env` (used by some tooling but FE itself mostly delegates to Spring)

## 3.2 BE runtime config

`application.yml`:
- `spring.sql.init.mode: always`
- `ddl-auto: update`
- imports `security.yml`

`data.sql`:
- runs on startup
- truncates at least `users` and `products`
- inserts seed users/pets/products

Result:
- startup can recreate deterministic seed records repeatedly
- this directly explains repeated default data appearance if server restarts

## 4. Authentication and request chain

### 4.1 Login and session

- FE `next-auth` credentials providers:
  - `email-password` -> Spring `/api/auth/login`
  - `magic-link` -> Spring `/api/auth/verify`
- Session stores `accessToken`, `refreshToken`, `userId`.
- JWT callback performs token refresh via `/api/auth/refresh` when nearing expiry.

### 4.2 Protected routing

- FE `proxy.ts` protects `/finance`, `/home`, `/health` in non-dev mode.
- Public prefixes include `/`, `/login`, `/signup`, `/onboarding`, `/api/auth`.

### 4.3 API call styles

- Style A: `clientFetch('/api/...')` -> direct Spring call with bearer token from session.
- Style B: `fetch('/api/...')` -> Next route handler proxy -> Spring.
- Both are present in codebase (mixed strategy).

## 5. Onboarding image upload flow (current implementation)

Primary files:
- `FE/components/onboarding/OnboardingStepPage.tsx`
- `FE/app/api/pet-upload/route.ts`
- `BE/controller/PetController.java`
- `BE/service/PetService.java`

### 5.1 Step 9 UI action

- User selects image in onboarding.
- `handleUploadConfirm` builds `FormData(file, petName)` and posts to `/api/pet-upload`.

### 5.2 FE API route: `/api/pet-upload`

Flow:
1. Parse multipart form data via `request.formData()`.
2. Save file immediately to `public/images/pet`.
3. Build relative path `/images/pet/<generated-name>`.
4. If no session token:
   - return success with `path`, `dbUpdated: false`.
5. If token exists:
   - call Spring `GET /api/pets` to find target pet (name match first, else first pet).
   - if target pet found: `PATCH /api/pets/{petId}/image`.
   - else fallback upsert-like call: `PATCH /api/pets/onboarding-image` with image + name.
6. If Spring sync fails, file save is still treated as successful; returns `dbUpdated: false`.

### 5.3 BE pet sync behavior

`PetService.syncOnboardingPetImage`:
- find pet by `(userId, name)` first
- fallback to first pet by user
- if none exists, create default pet record then set image
- finally returns pet DTO with `imageUrl` mapped from entity `image`

This gives an effective upsert path for onboarding image sync when no pet exists.

## 6. Home screen pet data binding flow

Primary files:
- `FE/app/api/pet/route.ts`
- `FE/app/home/page.tsx`
- `FE/components/home/SelectedPetProfile.tsx`
- `FE/components/home/pet/PetProfileImage.tsx`

### 6.1 Data fetch

- `home/page.tsx` runs `fetch('/api/pet', { cache: 'no-store' })` in `useEffect`.
- FE API route `/api/pet`:
  - validates session token
  - fetches Spring `/api/pets` with bearer
  - normalizes field: `imageUrl = imageUrl ?? image ?? null`
  - returns no-store headers

### 6.2 Rendering logic

- Home maps each pet to `{ id, name, imageUrl }`.
- Fallback used when no image path: `/images/onboarding/byeolsong.png`.
- `SelectedPetProfile`:
  - no pets -> renders single centered profile image (fallback path from `PetProfileImage`)
  - 1+ pets -> carousel-like positions based on count and selected index
- `PetProfileImage` final fallback is also `/images/onboarding/byeolsong.png`.

## 7. Why 3 default pet images can appear

Observed root causes in current repository:

1. Seed data behavior:
- `BE/data.sql` inserts default pets with `/images/pet/dolmeng*.jpeg` for seed users.
- `spring.sql.init.mode=always` causes seed scripts to run on startup.

2. Existing public assets:
- `FE/public/images/pet` already contains `dolmeng1.jpeg` ... `dolmeng7.jpeg`.

3. Home rendering model:
- For users with at least 3 pet rows, carousel displays multiple real pet cards.
- If seeded pets are attached to the resolved user, multiple default images show.

## 8. Domain module status by area

## 8.1 Finance

- Expense list (`/finance/expense`) is connected to Spring `/api/account-books`.
- Add expense flow:
  - image upload -> OCR processing -> add-expense form -> POST account-book
- Report page (`/finance/report`) is mostly static/preset visualization.

## 8.2 Health

- Medical records:
  - OCR pipeline uses shared `OcrProcessingPage`.
  - Final save posts to `/api/medical-records`.
- Vaccination:
  - connected to `/api/vaccinations/schedules` and `/summary`.
  - summary depends on pet and medical document aggregates.
- Walk page currently appears UI-first with static mock walk history.

## 8.3 Product

- Product list/detail loads from Spring `/api/products`.
- Layout prefetches product list server-side and renders category tabs.

## 8.4 Settings

- Significant mock/static behavior remains:
  - pets list currently local state with generated demo names
  - delete account page validates literal password `1234` client-side
  - settings API helper for delete account is incomplete

## 9. Backend API inventory (as implemented)

Auth:
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/send-otp`
- `POST /api/auth/verify`
- `POST /api/auth/refresh`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`
- `POST /api/auth/delete-account`

Pets:
- `GET /api/pets`
- `PATCH /api/pets/{petId}/image`
- `PATCH /api/pets/onboarding-image`

Finance:
- `GET /api/account-books?year&month`
- `POST /api/account-books`
- `DELETE /api/account-books/{id}`

Medical:
- `POST /api/medical-records/ocr`
- `POST /api/medical-records`
- `GET /api/medical-records?petId&type`

Vaccination:
- `GET /api/vaccinations/schedules?year&month`
- `POST /api/vaccinations/schedules`
- `GET /api/vaccinations/summary`

Products:
- `GET /api/products`
- `GET /api/products/{productId}`

Talk:
- `POST /api/talk`

## 10. Data model notes relevant to FE binding

Key entity-to-DTO mappings:
- `Pet.image` -> `PetResponse.imageUrl`
- FE normalizes either `imageUrl` or `image` from API response
- Medical document stores `imageUrl` separately from pet profile image

Main relationships:
- `User 1:N Pet`
- `User 1:N AccountBook`
- `Pet 1:N MedicalDocument`
- `Pet 1:N CalendarEvent`

## 11. Critical risks and defects found

Severity: Critical
- Secrets committed in repo:
  - API keys and JWT secrets in `BE/src/main/resources/security.yml`
  - service account private key in `BE/secrets/vision-key.json`
  - mail/API credentials in FE env

Severity: High
- Startup seeding reset behavior:
  - `sql.init.mode=always` + `TRUNCATE` in `data.sql` causes recurring seed state.
- Encoding corruption across many files (mojibake text):
  - visible in FE/BE source strings and constants.
  - high risk of malformed literals and maintenance failure.
- Security policy too permissive:
  - `authorizeHttpRequests(...anyRequest().permitAll())` relies on downstream checks.

Severity: Medium
- Repository/service mismatch risk:
  - `VaccinationService` calls `petRepository.findByUser_Id(userId)`, but current `PetRepository` methods shown do not include this signature.
  - potential compile/runtime failure depending on actual branch state.
- Inconsistent fetch base strategy:
  - mix of Next API proxy and direct Spring calls.
  - `home/talk/page.tsx` uses hardcoded `http://localhost:8080`.
- Settings delete-account flow incomplete/inconsistent with BE contract.

Severity: Low to Medium
- Significant mock data remains in settings/walk/report areas.
- Some route links appear inconsistent (example: `/reports` path usage in home while finance report route is `/finance/report`).

## 12. Root-cause analysis for image-not-showing incidents

From current codebase history and structure, the most likely failure points are:

1. API route not reached or returned HTML error page
- usually route path mismatch or server-side exception before JSON response.

2. File saved but DB sync not updated
- token missing/expired
- Spring `PATCH` failure
- FE route currently returns success anyway if file save succeeded.

3. Home receives pets but image field mismatch
- mitigated by normalization in `/api/pet`.

4. Stale response cache
- mitigated by `cache: no-store` and response no-cache headers.

5. Seed/default data dominates user perception
- seed pets can override expected "newly uploaded only" behavior.

## 13. Recommended remediation plan (priority order)

P0 (immediate):
- Remove all secrets from Git history and rotate credentials.
- Stop automatic destructive seeding in non-local environments.
- Enforce UTF-8 end-to-end and repair mojibake source strings.

P1:
- Standardize one data access strategy (prefer Next API proxy for auth-sensitive FE flows, or fully direct with strict shared helper).
- Harden Spring security matcher rules (authenticated by default, explicit public whitelist).
- Fix repository/service signature inconsistencies and run full compile/test.

P2:
- Replace remaining mock settings/walk/report data with API-backed models.
- Add e2e checks:
  - onboarding image upload -> db image set -> home render validation
  - new user/no pet -> upsert path validation

## 14. Home-specific conclusion

Current home image pipeline is structurally correct when all conditions are met:
- physical file exists in `public/images/pet`
- Spring pet record for logged-in user has `image` updated to `/images/pet/<file>`
- `/api/pet` returns normalized `imageUrl`
- home fetch runs with no-store and maps into `SelectedPetProfile`

When images still do not appear, the issue is usually not UI. It is usually one of:
- DB sync did not happen for the authenticated user
- seed data and user mapping are masking expectations
- auth/token path failed during patch call
- encoding corruption introduced hidden string or parsing defects

