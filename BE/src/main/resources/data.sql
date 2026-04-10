SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE users;
TRUNCATE TABLE products;
SET FOREIGN_KEY_CHECKS = 1;

    -- pet nullable 평탄화 프로세스
ALTER TABLE pets MODIFY COLUMN species VARCHAR(100) NULL;
ALTER TABLE pets MODIFY COLUMN age DOUBLE NULL;
ALTER TABLE pets MODIFY COLUMN size ENUM('대형','소형','중형') NULL;
ALTER TABLE pets MODIFY COLUMN walk_count INT NULL;
ALTER TABLE pets MODIFY COLUMN walk_time INT NULL;
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

-- 상품
INSERT INTO products
(name, product_type, description, url, benefit_rate, benefit_amount, benefit_limit_amount, benefit_limit_count, benefit_period, target_category, source_type, is_active, created_at, updated_at)
VALUES
    ('하나 펫사랑보험', 'INSURANCE', '반려동물 의료비 보장을 제공하는 보험 상품', 'https://www.hanabank.com', NULL, 100000, NULL, 20, 'YEAR', '병원', 'ACCOUNT_BOOK', true, NOW(), NOW()),
    ('하나 펫카드', 'CARD', '병원 및 쇼핑 혜택을 제공하는 카드 상품', 'https://www.hanacard.co.kr', 10.00, NULL, 40000, NULL, 'MONTH', '병원,쇼핑', 'ACCOUNT_BOOK', true, NOW(), NOW()),
    ('하나 펫적금', 'SAVINGS', '반려동물을 위한 적금 상품', 'https://www.hanabank.com', 2.80, NULL, NULL, NULL, NULL, NULL, 'ACCOUNT', true, NOW(), NOW());

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
