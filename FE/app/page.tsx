import { auth, signOut } from "@/app/api/auth/[...nextauth]/route";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return (
      <div style={{ padding: "50px" }}>
        <h1>로그인이 필요합니다.</h1>
        <a href="/login">로그인 하러가기</a>
      </div>
    );
  }

  return (
    <div style={{ padding: "50px" }}>
      <h1>🎉 로그인 성공!</h1>
      <p>안녕하세요, <strong>{session.user?.email}</strong>님!</p>
      
      {/* 로그아웃 테스트 버튼 */}
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button style={{ padding: "10px 20px", cursor: "pointer" }}>
          로그아웃 하기
        </button>
      </form>
    </div>
  );
}