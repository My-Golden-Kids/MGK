SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE account_books;
TRUNCATE TABLE accounts;
TRUNCATE TABLE medical_documents;
TRUNCATE TABLE calendars;
TRUNCATE TABLE feeding_schedules;
TRUNCATE TABLE pet_walk_records;
TRUNCATE TABLE pets;
TRUNCATE TABLE refresh_tokens;
TRUNCATE TABLE users;
TRUNCATE TABLE products;
SET FOREIGN_KEY_CHECKS = 1;

    -- pet nullable 평탄화 프로세스
ALTER TABLE pets MODIFY COLUMN species VARCHAR(100) NULL;
ALTER TABLE pets MODIFY COLUMN image VARCHAR(2048) NULL;
ALTER TABLE pets MODIFY COLUMN age DOUBLE NULL;
ALTER TABLE pets MODIFY COLUMN size ENUM('대형','소형','중형') NULL;
ALTER TABLE pets MODIFY COLUMN walk_count INT NULL;
ALTER TABLE pets MODIFY COLUMN walk_time INT NULL;
UPDATE pets SET death = FALSE WHERE death IS NULL;
ALTER TABLE pets MODIFY COLUMN death BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pets MODIFY COLUMN death_date DATETIME NULL;
ALTER TABLE pets MODIFY COLUMN eat_meal ENUM('NO','YES') NULL;

-- 이메일 resend 확인용 기본 사용자 seed 데이터
INSERT IGNORE INTO users
(name, email, password, email_verified_at, deleted_at, created_at, updated_at)
VALUES
    ('정그린', 'th2gr22n@gmail.com', '$2a$10$yTtoIV74eLKVOpsvCAxQy.LD4/m2EUD4VWoiYn3zTkqg0eAE281XK', NULL, NULL, NOW(), NOW()),
    ('전유진', 'yjjeon08@gmail.com', '$2a$10$yTtoIV74eLKVOpsvCAxQy.LD4/m2EUD4VWoiYn3zTkqg0eAE281XK', NULL, NULL, NOW(), NOW());

-- 홈 화면 선택 반려동물 기본 seed 데이터
INSERT INTO pets
(user_id, name, species, image, age, size, walk_count, walk_time, last_walk_at, eat_meal, created_at, updated_at)
SELECT u.id, '돌', '강아지', '/images/pet/dolmeng1.jpeg', 3, '소형', 0, 0, NULL, 'NO', NOW(), NOW()
FROM users u
WHERE u.email = 'th2gr22n@gmail.com'
  AND NOT EXISTS (
    SELECT 1
    FROM pets
    WHERE user_id = u.id AND name = '돌'
);

INSERT INTO pets
(user_id, name, species, image, age, size, walk_count, walk_time, last_walk_at, eat_meal, created_at, updated_at)
SELECT u.id, '멩', '강아지', '/images/pet/dolmeng2.jpeg', 4, '소형', 0, 0, NULL, 'NO', NOW(), NOW()
FROM users u
WHERE u.email = 'th2gr22n@gmail.com'
  AND NOT EXISTS (
    SELECT 1
    FROM pets
    WHERE user_id = u.id AND name = '멩'
);

INSERT INTO pets
(user_id, name, species, image, age, size, walk_count, walk_time, last_walk_at, eat_meal, created_at, updated_at)
SELECT u.id, '이', '강아지', '/images/pet/dolmeng3.jpeg', 2, '소형', 0, 0, NULL, 'NO', NOW(), NOW()
FROM users u
WHERE u.email = 'th2gr22n@gmail.com'
  AND NOT EXISTS (
    SELECT 1
    FROM pets
    WHERE user_id = u.id AND name = '이'
);

INSERT INTO pets
(user_id, name, species, image, age, size, walk_count, walk_time, last_walk_at, eat_meal, created_at, updated_at)
SELECT u.id, '돌멩이이', '강아지', '/images/pet/dolmeng1.jpeg', 5, '중형', 0, 0, NULL, 'NO', NOW(), NOW()
FROM users u
WHERE u.email = 'yjjeon08@gmail.com'
  AND NOT EXISTS (
    SELECT 1
    FROM pets
    WHERE user_id = u.id AND name = '돌멩이이'
);

-- 자산 계좌 1개 추가 (총 자산 100억)
-- INSERT INTO accounts
-- (user_id, account_number, bank_name, money_amount, reward_amount, total_amount, created_at, updated_at)
-- SELECT u.id, '01085338796', '하나은행', 10000000, 10, 500000000, NOW(), NOW()
-- FROM users u
-- WHERE u.email = 'yjjeon08@gmail.com'
--   AND NOT EXISTS (
--     SELECT 1
--     FROM accounts
--     WHERE user_id = u.id AND account_number = '01085338796'
-- )

-- 상품
INSERT INTO products
(name, product_type, description, url, benefit_rate, benefit_amount, benefit_limit_amount, benefit_limit_count, benefit_period, target_category, source_type, is_active, created_at, updated_at)
VALUES
    ('하나 펫사랑보험', 'INSURANCE', '반려동물 의료비 보장을 제공하는 보험 상품', 'https://www.hanainsure.co.kr/w/product/accidentHealth/petLoveIntro', NULL, 100000, NULL, 20, 'YEAR', '병원', 'ACCOUNT_BOOK', false, NOW(), NOW()),
    ('펫 사랑 카드', 'CARD', '병원 및 쇼핑 혜택을 제공하는 카드 상품', 'https://m.hanacard.co.kr/MKCDCM1010M.web?CD_PD_SEQ=16251', 10.00, NULL, 40000, NULL, 'MONTH', '병원,쇼핑', 'ACCOUNT_BOOK', false, NOW(), NOW()),
    ('펫사랑 적금', 'SAVINGS', '반려동물을 위한 적금 상품', 'https://www.kebhana.com/cont/mall/mall08/mall0801/mall080102/1470991_115157.jsp', 2.80, NULL, 168000, NULL, 'YEAR', NULL, 'ACCOUNT', false, NOW(), NOW()),
    ('펫케어', 'SUBSCRIPTION', '반려동물을 위한 구독형 할인 상품', 'https://www.hanacard.co.kr/OPY30460017N.web?schID=pcd&mID=OPY30460017N.web', NULL, 15000, NULL, NULL, 'MONTH', 'Food', 'ACCOUNT_BOOK', false, NOW(), NOW()),
    ('펫포레스트', 'PET_FOREST', '반려동물 장례 서비스 상품', 'https://petforest.co.kr/', 20.00, NULL, NULL, NULL, NULL, NULL, 'ACCOUNT', false, NOW(), NOW());

-- 산책 기록 테이블 통합: 완료 기록은 pet_walk_records 하나만 사용
UPDATE pet_walk_records
SET started_at = COALESCE(started_at, created_at, walked_at, NOW())
WHERE started_at IS NULL;

UPDATE pet_walk_records
SET completed = TRUE
WHERE completed IS NULL;

UPDATE pet_walk_records
SET ended_at = COALESCE(ended_at, updated_at, walked_at, NOW())
WHERE completed = TRUE AND ended_at IS NULL;

UPDATE pet_walk_records
SET status = 'COMPLETED'
WHERE status IS NULL OR status = '';

UPDATE pet_walk_records
SET created_at = started_at
WHERE started_at IS NOT NULL;

UPDATE pet_walk_records
SET updated_at = ended_at
WHERE completed = TRUE AND ended_at IS NOT NULL;

DROP TABLE IF EXISTS pet_walk_syncs;

-- ──────────────────────────────────────────
-- pet_walk_records 시드 데이터
-- 최빈 산책 시간: 오전 10시 (5회) > 오전 7시 (2회) > 오후 3시 (1회)
-- source는 (pet_id, source) unique constraint로 인해 레코드마다 고유값 사용
-- ──────────────────────────────────────────
INSERT IGNORE INTO pet_walk_records
(pet_id, source, walked_at, step_count, walk_time_seconds, distance_km, reward_amount, completed, status, started_at, ended_at, created_at, updated_at)
SELECT p.id, 'SEED_20260413_1000', '2026-04-13 10:05:00', 4500, 1800, 3.2, 1, TRUE, 'COMPLETED', '2026-04-13 10:05:00', '2026-04-13 10:35:00', '2026-04-13 10:05:00', '2026-04-13 10:35:00'
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'th2gr22n@gmail.com' AND p.name = '돌';

INSERT IGNORE INTO pet_walk_records
(pet_id, source, walked_at, step_count, walk_time_seconds, distance_km, reward_amount, completed, status, started_at, ended_at, created_at, updated_at)
SELECT p.id, 'SEED_20260412_1000', '2026-04-12 10:10:00', 3900, 1560, 2.8, 1, TRUE, 'COMPLETED', '2026-04-12 10:10:00', '2026-04-12 10:36:00', '2026-04-12 10:10:00', '2026-04-12 10:36:00'
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'th2gr22n@gmail.com' AND p.name = '돌';

INSERT IGNORE INTO pet_walk_records
(pet_id, source, walked_at, step_count, walk_time_seconds, distance_km, reward_amount, completed, status, started_at, ended_at, created_at, updated_at)
SELECT p.id, 'SEED_20260411_1000', '2026-04-11 10:20:00', 5100, 2040, 3.7, 1, TRUE, 'COMPLETED', '2026-04-11 10:20:00', '2026-04-11 10:54:00', '2026-04-11 10:20:00', '2026-04-11 10:54:00'
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'th2gr22n@gmail.com' AND p.name = '돌';

INSERT IGNORE INTO pet_walk_records
(pet_id, source, walked_at, step_count, walk_time_seconds, distance_km, reward_amount, completed, status, started_at, ended_at, created_at, updated_at)
SELECT p.id, 'SEED_20260410_1000', '2026-04-10 10:00:00', 4200, 1680, 3.0, 1, TRUE, 'COMPLETED', '2026-04-10 10:00:00', '2026-04-10 10:28:00', '2026-04-10 10:00:00', '2026-04-10 10:28:00'
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'th2gr22n@gmail.com' AND p.name = '돌';

INSERT IGNORE INTO pet_walk_records
(pet_id, source, walked_at, step_count, walk_time_seconds, distance_km, reward_amount, completed, status, started_at, ended_at, created_at, updated_at)
SELECT p.id, 'SEED_20260409_1000', '2026-04-09 10:45:00', 3600, 1440, 2.6, 1, TRUE, 'COMPLETED', '2026-04-09 10:45:00', '2026-04-09 11:09:00', '2026-04-09 10:45:00', '2026-04-09 11:09:00'
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'th2gr22n@gmail.com' AND p.name = '돌';

INSERT IGNORE INTO pet_walk_records
(pet_id, source, walked_at, step_count, walk_time_seconds, distance_km, reward_amount, completed, status, started_at, ended_at, created_at, updated_at)
SELECT p.id, 'SEED_20260408_0700', '2026-04-08 07:15:00', 3000, 1200, 2.1, 1, TRUE, 'COMPLETED', '2026-04-08 07:15:00', '2026-04-08 07:35:00', '2026-04-08 07:15:00', '2026-04-08 07:35:00'
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'th2gr22n@gmail.com' AND p.name = '돌';

INSERT IGNORE INTO pet_walk_records
(pet_id, source, walked_at, step_count, walk_time_seconds, distance_km, reward_amount, completed, status, started_at, ended_at, created_at, updated_at)
SELECT p.id, 'SEED_20260407_0700', '2026-04-07 07:30:00', 2700, 1080, 1.9, 0, TRUE, 'COMPLETED', '2026-04-07 07:30:00', '2026-04-07 07:48:00', '2026-04-07 07:30:00', '2026-04-07 07:48:00'
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'th2gr22n@gmail.com' AND p.name = '돌';

INSERT IGNORE INTO pet_walk_records
(pet_id, source, walked_at, step_count, walk_time_seconds, distance_km, reward_amount, completed, status, started_at, ended_at, created_at, updated_at)
SELECT p.id, 'SEED_20260406_1500', '2026-04-06 15:00:00', 6000, 2400, 4.3, 2, TRUE, 'COMPLETED', '2026-04-06 15:00:00', '2026-04-06 15:40:00', '2026-04-06 15:00:00', '2026-04-06 15:40:00'
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'th2gr22n@gmail.com' AND p.name = '돌';

-- ──────────────────────────────────────────
-- 테스트 더미 유저 1: seonu.kim.kr@gmail.com
-- ──────────────────────────────────────────

-- 유저 추가
INSERT IGNORE INTO users
(name, email, password, email_verified_at, deleted_at, created_at, updated_at)
VALUES
    ('김선우', 'seonu.kim.kr@gmail.com', '$2a$10$yTtoIV74eLKVOpsvCAxQy.LD4/m2EUD4VWoiYn3zTkqg0eAE281XK', NULL, NULL, NOW(), NOW());

-- 펫 6마리 추가 (알람 시작 시간 6~11시, 네끼씩)
INSERT INTO pets
(user_id, name, species, image, age, size, walk_count, walk_time, last_walk_at, eat_meal, created_at, updated_at)
SELECT u.id, '코코', '강아지', NULL, 2, '소형', 0, 0, NULL, 'NO', NOW(), NOW()
FROM users u
WHERE u.email = 'seonu.kim.kr@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM pets WHERE user_id = u.id AND name = '코코');

INSERT INTO pets
(user_id, name, species, image, age, size, walk_count, walk_time, last_walk_at, eat_meal, created_at, updated_at)
SELECT u.id, '몽이', '강아지', NULL, 3, '소형', 0, 0, NULL, 'NO', NOW(), NOW()
FROM users u
WHERE u.email = 'seonu.kim.kr@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM pets WHERE user_id = u.id AND name = '몽이');

INSERT INTO pets
(user_id, name, species, image, age, size, walk_count, walk_time, last_walk_at, eat_meal, created_at, updated_at)
SELECT u.id, '솜이', '고양이', NULL, 1, '소형', 0, 0, NULL, 'NO', NOW(), NOW()
FROM users u
WHERE u.email = 'seonu.kim.kr@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM pets WHERE user_id = u.id AND name = '솜이');

INSERT INTO pets
(user_id, name, species, image, age, size, walk_count, walk_time, last_walk_at, eat_meal, created_at, updated_at)
SELECT u.id, '해피', '강아지', NULL, 4, '중형', 0, 0, NULL, 'NO', NOW(), NOW()
FROM users u
WHERE u.email = 'seonu.kim.kr@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM pets WHERE user_id = u.id AND name = '해피');

INSERT INTO pets
(user_id, name, species, image, age, size, walk_count, walk_time, last_walk_at, eat_meal, created_at, updated_at)
SELECT u.id, '두부', '고양이', NULL, 2, '소형', 0, 0, NULL, 'NO', NOW(), NOW()
FROM users u
WHERE u.email = 'seonu.kim.kr@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM pets WHERE user_id = u.id AND name = '두부');

INSERT INTO pets
(user_id, name, species, image, age, size, walk_count, walk_time, last_walk_at, eat_meal, created_at, updated_at)
SELECT u.id, '보리', '강아지', NULL, 3, '중형', 0, 0, NULL, 'NO', NOW(), NOW()
FROM users u
WHERE u.email = 'seonu.kim.kr@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM pets WHERE user_id = u.id AND name = '보리');

-- 사료 알람 설정 (네끼, 6시간 간격, 시작 시간 각각 다름)
INSERT INTO feeding_schedules
(pet_id, first_feed_time, meals_per_day, custom_amount_g, created_at, updated_at)
SELECT p.id, '06:00:00', 4, NULL, NOW(), NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '코코'
  AND NOT EXISTS (SELECT 1 FROM feeding_schedules fs WHERE fs.pet_id = p.id);

INSERT INTO feeding_schedules
(pet_id, first_feed_time, meals_per_day, custom_amount_g, created_at, updated_at)
SELECT p.id, '07:00:00', 4, NULL, NOW(), NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '몽이'
  AND NOT EXISTS (SELECT 1 FROM feeding_schedules fs WHERE fs.pet_id = p.id);

INSERT INTO feeding_schedules
(pet_id, first_feed_time, meals_per_day, custom_amount_g, created_at, updated_at)
SELECT p.id, '08:00:00', 4, NULL, NOW(), NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '솜이'
  AND NOT EXISTS (SELECT 1 FROM feeding_schedules fs WHERE fs.pet_id = p.id);

INSERT INTO feeding_schedules
(pet_id, first_feed_time, meals_per_day, custom_amount_g, created_at, updated_at)
SELECT p.id, '09:00:00', 4, NULL, NOW(), NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '해피'
  AND NOT EXISTS (SELECT 1 FROM feeding_schedules fs WHERE fs.pet_id = p.id);

INSERT INTO feeding_schedules
(pet_id, first_feed_time, meals_per_day, custom_amount_g, created_at, updated_at)
SELECT p.id, '10:00:00', 4, NULL, NOW(), NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '두부'
  AND NOT EXISTS (SELECT 1 FROM feeding_schedules fs WHERE fs.pet_id = p.id);

INSERT INTO feeding_schedules
(pet_id, first_feed_time, meals_per_day, custom_amount_g, created_at, updated_at)
SELECT p.id, '11:00:00', 4, NULL, NOW(), NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '보리'
  AND NOT EXISTS (SELECT 1 FROM feeding_schedules fs WHERE fs.pet_id = p.id);

-- seonu.kim.kr@gmail.com 계좌 (하나은행, 초기 100만원)
INSERT INTO accounts
(user_id, account_number, bank_name, money_amount, reward_amount, total_amount, created_at, updated_at)
SELECT u.id, '01085338796', '하나은행', 1000000, 0, 1000000, NOW(), NOW()
FROM users u
WHERE u.email = 'seonu.kim.kr@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM accounts WHERE user_id = u.id AND account_number = '01085338796'
);

-- ──────────────────────────────────────────
-- 캘린더 이벤트 (4월, 접종 4개 + 검진 4개)
-- Apr 10: 솜이 켄넬코프 접종 + 검진 (같은 날)
-- Apr 24: 두부 광견병 접종 + 검진 (같은 날)
-- 나머지는 각각 다른 날
-- ──────────────────────────────────────────

-- 접종 이벤트 4개
INSERT INTO calendars
(pet_id, name, date, memo, event_type, created_at, updated_at)
SELECT p.id, '광견병 예방접종', '2026-04-05', '광견병 1차 접종', '접종', NOW(), NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '코코'
  AND NOT EXISTS (SELECT 1 FROM calendars c WHERE c.pet_id = p.id AND c.name = '광견병 예방접종' AND c.date = '2026-04-05');

INSERT INTO calendars
(pet_id, name, date, memo, event_type, created_at, updated_at)
SELECT p.id, '켄넬코프 예방접종', '2026-04-10', '켄넬코프 접종', '접종', NOW(), NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '솜이'
  AND NOT EXISTS (SELECT 1 FROM calendars c WHERE c.pet_id = p.id AND c.name = '켄넬코프 예방접종' AND c.date = '2026-04-10');

INSERT INTO calendars
(pet_id, name, date, memo, event_type, created_at, updated_at)
SELECT p.id, '종합백신 예방접종', '2026-04-18', '종합백신 접종', '접종', NOW(), NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '해피'
  AND NOT EXISTS (SELECT 1 FROM calendars c WHERE c.pet_id = p.id AND c.name = '종합백신 예방접종' AND c.date = '2026-04-18');

INSERT INTO calendars
(pet_id, name, date, memo, event_type, created_at, updated_at)
SELECT p.id, '광견병 예방접종', '2026-04-24', '광견병 접종', '접종', NOW(), NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '두부'
  AND NOT EXISTS (SELECT 1 FROM calendars c WHERE c.pet_id = p.id AND c.name = '광견병 예방접종' AND c.date = '2026-04-24');

-- 검진 이벤트 4개 (Apr 10 솜이, Apr 24 두부는 접종과 같은 날)
INSERT INTO calendars
(pet_id, name, date, memo, event_type, created_at, updated_at)
SELECT p.id, '정기 건강검진', '2026-04-08', '정기 건강검진', '검진', NOW(), NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '몽이'
  AND NOT EXISTS (SELECT 1 FROM calendars c WHERE c.pet_id = p.id AND c.name = '정기 건강검진' AND c.date = '2026-04-08');

INSERT INTO calendars
(pet_id, name, date, memo, event_type, created_at, updated_at)
SELECT p.id, '정기 건강검진', '2026-04-10', '접종 당일 검진', '검진', NOW(), NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '솜이'
  AND NOT EXISTS (SELECT 1 FROM calendars c WHERE c.pet_id = p.id AND c.name = '정기 건강검진' AND c.date = '2026-04-10');

INSERT INTO calendars
(pet_id, name, date, memo, event_type, created_at, updated_at)
SELECT p.id, '정기 건강검진', '2026-04-20', '정기 건강검진', '검진', NOW(), NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '코코'
  AND NOT EXISTS (SELECT 1 FROM calendars c WHERE c.pet_id = p.id AND c.name = '정기 건강검진' AND c.date = '2026-04-20');

INSERT INTO calendars
(pet_id, name, date, memo, event_type, created_at, updated_at)
SELECT p.id, '정기 건강검진', '2026-04-24', '접종 당일 검진', '검진', NOW(), NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '두부'
  AND NOT EXISTS (SELECT 1 FROM calendars c WHERE c.pet_id = p.id AND c.name = '정기 건강검진' AND c.date = '2026-04-24');

-- ──────────────────────────────────────────
-- 메디컬 도큐먼트 시드 데이터 (이미지 없음)
-- 접종: 기본 진료비 / 해당 예방접종 / 처방약 7일분
-- 검진: 기본 진료비 / 검사 항목
-- ──────────────────────────────────────────

-- 코코 광견병 접종 (Apr 5)
INSERT INTO medical_documents
(pet_id, pet_name, date, type, hospital_name, details, total_amount, image_url, created_at)
SELECT p.id, '코코', '2026-04-05', 'VACCINATION', '행복동물병원',
       '기본 진료비  / 광견병 예방접종  / 처방약 7일분 ',
       66000, NULL, NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '코코'
  AND NOT EXISTS (SELECT 1 FROM medical_documents md WHERE md.pet_id = p.id AND md.date = '2026-04-05' AND md.type = 'VACCINATION');

-- 솜이 켄넬코프 접종 (Apr 10)
INSERT INTO medical_documents
(pet_id, pet_name, date, type, hospital_name, details, total_amount, image_url, created_at)
SELECT p.id, '솜이', '2026-04-10', 'VACCINATION', '행복동물병원',
       '기본 진료비 / 켄넬코프 예방접종  / 처방약 7일분 ',
       61000, NULL, NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '솜이'
  AND NOT EXISTS (SELECT 1 FROM medical_documents md WHERE md.pet_id = p.id AND md.date = '2026-04-10' AND md.type = 'VACCINATION');

-- 솜이 검진 (Apr 10, 접종 당일)
INSERT INTO medical_documents
(pet_id, pet_name, date, type, hospital_name, details, total_amount, image_url, created_at)
SELECT p.id, '솜이', '2026-04-10', 'CHECKUP', '행복동물병원',
       '기본 진료비  / 청진 및 촉진 검사 ',
       25000, NULL, NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '솜이'
  AND NOT EXISTS (SELECT 1 FROM medical_documents md WHERE md.pet_id = p.id AND md.date = '2026-04-10' AND md.type = 'CHECKUP');

-- 몽이 검진 (Apr 8)
INSERT INTO medical_documents
(pet_id, pet_name, date, type, hospital_name, details, total_amount, image_url, created_at)
SELECT p.id, '몽이', '2026-04-08', 'CHECKUP', '사랑동물병원',
       '기본 진료비  / 혈액검사 ',
       45000, NULL, NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '몽이'
  AND NOT EXISTS (SELECT 1 FROM medical_documents md WHERE md.pet_id = p.id AND md.date = '2026-04-08' AND md.type = 'CHECKUP');

-- 해피 종합백신 접종 (Apr 18)
INSERT INTO medical_documents
(pet_id, pet_name, date, type, hospital_name, details, total_amount, image_url, created_at)
SELECT p.id, '해피', '2026-04-18', 'VACCINATION', '사랑동물병원',
       '기본 진료비 / 종합백신 예방접종 / 처방약 7일분',
       76000, NULL, NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '해피'
  AND NOT EXISTS (SELECT 1 FROM medical_documents md WHERE md.pet_id = p.id AND md.date = '2026-04-18' AND md.type = 'VACCINATION');

-- 코코 검진 (Apr 20)
INSERT INTO medical_documents
(pet_id, pet_name, date, type, hospital_name, details, total_amount, image_url, created_at)
SELECT p.id, '코코', '2026-04-20', 'CHECKUP', '행복동물병원',
       '기본 진료비 / 정기 건강검진',
       35000, NULL, NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '코코'
  AND NOT EXISTS (SELECT 1 FROM medical_documents md WHERE md.pet_id = p.id AND md.date = '2026-04-20' AND md.type = 'CHECKUP');

-- 두부 광견병 접종 (Apr 24)
INSERT INTO medical_documents
(pet_id, pet_name, date, type, hospital_name, details, total_amount, image_url, created_at)
SELECT p.id, '두부', '2026-04-24', 'VACCINATION', '사랑동물병원',
       '기본 진료비  / 광견병 예방접종  / 처방약 7일분 ',
       66000, NULL, NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '두부'
  AND NOT EXISTS (SELECT 1 FROM medical_documents md WHERE md.pet_id = p.id AND md.date = '2026-04-24' AND md.type = 'VACCINATION');

-- 두부 검진 (Apr 24, 접종 당일)
INSERT INTO medical_documents
(pet_id, pet_name, date, type, hospital_name, details, total_amount, image_url, created_at)
SELECT p.id, '두부', '2026-04-24', 'CHECKUP', '사랑동물병원',
       '기본 진료비  / 혈액검사 ',
       45000, NULL, NOW()
FROM pets p JOIN users u ON p.user_id = u.id
WHERE u.email = 'seonu.kim.kr@gmail.com' AND p.name = '두부'
  AND NOT EXISTS (SELECT 1 FROM medical_documents md WHERE md.pet_id = p.id AND md.date = '2026-04-24' AND md.type = 'CHECKUP');
