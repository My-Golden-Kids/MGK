SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE users;
TRUNCATE TABLE products;
SET FOREIGN_KEY_CHECKS = 1;

-- 이메일 resend 확인용 기본 사용자 seed 데이터
INSERT IGNORE INTO users
(name, email, password, email_verified_at, deleted_at, created_at, updated_at)
VALUES
    ('정그린', 'th2gr22n@gmail.com', '12345678', NULL, NULL, NOW(), NOW()),
    ('전유진', 'yjjeon08@gmail.com', '12345678', NULL, NULL, NOW(), NOW());

-- 상품
INSERT INTO products
(name, product_type, description, url, benefit_rate, benefit_amount, benefit_limit_amount, benefit_limit_count, benefit_period, target_category, source_type, is_active, created_at, updated_at)
VALUES
    ('하나 펫사랑보험', 'INSURANCE', '반려동물 의료비 보장을 제공하는 보험 상품', 'https://www.hanabank.com', NULL, 100000, NULL, 20, 'YEAR', '병원', 'ACCOUNT_BOOK', true, NOW(), NOW()),
    ('하나 펫카드', 'CARD', '병원 및 쇼핑 혜택을 제공하는 카드 상품', 'https://www.hanacard.co.kr', 10.00, NULL, 40000, NULL, 'MONTH', '병원,쇼핑', 'ACCOUNT_BOOK', true, NOW(), NOW()),
    ('하나 펫적금', 'SAVINGS', '반려동물을 위한 적금 상품', 'https://www.hanabank.com', 2.80, NULL, NULL, NULL, NULL, NULL, 'ACCOUNT', true, NOW(), NOW());