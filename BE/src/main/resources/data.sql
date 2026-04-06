-- 이메일 resend 확인용 기본 사용자 seed 데이터
INSERT IGNORE INTO users (
    name,
    email,
    password,
    email_verified_at,
    deleted_at,
    created_at,
    updated_at
) VALUES (
    '정그린',
    'th2gr22n@gmail.com',
    '12345678',
    NULL,
    NULL,
    NOW(),
    NOW()
);
