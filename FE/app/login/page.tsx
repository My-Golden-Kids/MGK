'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSendMagicLink = async (e: React.FormEvent) => {
  e.preventDefault(); // 폼 제출로 인한 페이지 새로고침 방지
  setStatus('loading');

  try {
    const result = await signIn('resend', { 
      email, 
      redirect: false, 
      callbackUrl: '/', // 로그인 성공 후 이동할 곳
    });

    console.log("NextAuth Response:", result);

    if (result?.error) {
      console.error("Login Error:", result.error);
      setStatus('error');
    } else {
      setStatus('success');
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    setStatus('error');
  }
};

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h2>매직 링크로 로그인 (NextAuth)</h2>
      
      {status === 'success' ? (
        <p style={{ color: 'green' }}>✅ 이메일이 발송되었습니다. 메일함을 확인해주세요!</p>
      ) : (
        <form onSubmit={handleSendMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="email"
            placeholder="이메일 주소를 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '10px', fontSize: '16px' }}
          />
          <button 
            type="submit" 
            disabled={status === 'loading'}
            style={{ padding: '10px', fontSize: '16px', cursor: 'pointer' }}
          >
            {status === 'loading' ? '발송 중...' : '매직 링크 받기'}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p style={{ color: 'red' }}>❌ 발송에 실패했습니다. (DB 연결 설정을 확인해주세요!)</p>
      )}
    </div>
  );
}