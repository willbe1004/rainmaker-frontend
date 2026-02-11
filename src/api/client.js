// src/api/client.js
// Rainmaker API Client (Final Stable Version)

/**
 * 1. 일반 영업보고 저장 (POST)
 */
export async function saveActivity(activityData) {
  const API_URL = import.meta.env.VITE_API_URL;

  const payload = {
    type: 'SALES_LOG',
    data: activityData
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // GAS CORS 회피용
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    return true;
  } catch (err) {
    console.error('저장 실패:', err);
    return false;
  }
}

/**
 * 2. 리포트 데이터 조회 (GET)
 * - 중요: GET 요청에는 headers를 붙이지 않아야 CORS 에러가 안 납니다.
 */
export async function fetchReports(sheetName) {
  const API_URL = import.meta.env.VITE_API_URL;

  try {
    // 쿼리 스트링으로 시트명 전달 (?sheet=Name)
    const url = `${API_URL}?sheet=${sheetName}`;

    console.log(`[API 요청] ${url}`); // 디버깅용 로그

    const response = await fetch(url, {
      method: 'GET',
      redirect: "follow"
      // headers: {} <-- 삭제 필수! (GET 요청 시 헤더 금지)
    });

    const result = await response.json();

    if (result.status === 'success') {
      console.log(`[${sheetName}] 데이터 로드 완료: ${result.data.length}건`);
      return result.data;
    } else {
      console.warn(`[${sheetName}] 서버 응답:`, result);
      return [];
    }
  } catch (error) {
    console.error(`[${sheetName}] 통신 에러:`, error);
    return [];
  }
}

/**
 * 3. AI 제안서/보고서 생성 (POST)
 */
export async function generateProposal(bidData) {
  const API_URL = import.meta.env.VITE_API_URL;

  const payload = {
    type: 'GENERATE_PROPOSAL',
    data: bidData
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    return result.status === 'success' ? result.data : "생성 실패";
  } catch (error) {
    console.error(error);
    return "에러 발생: " + error.message;
  }
}

/**
 * 4. 공고 목록 조회 (GET) — 헤더 없이 호출 (CORS 방지)
 */
export async function fetchBids() {
  const API_URL = import.meta.env.VITE_API_URL;
  if (!API_URL) {
    console.error("[fetchBids] API URL이 설정되지 않았습니다 (.env 확인 필요)");
    return [];
  }
  try {
    const response = await fetch(API_URL, { method: 'GET', redirect: 'follow' });
    if (!response.ok) return [];
    const data = await response.json();
    const list = data?.data ?? data ?? [];
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('[fetchBids] 요청 실패:', err);
    return [];
  }
}

/**
 * 5. 정책 과업 저장 (POST)
 */
export async function savePolicy(policyData) {
  const API_URL = import.meta.env.VITE_API_URL;
  const payload = { type: 'POLICY', data: policyData };
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    await response.json();
    return true;
  } catch (err) {
    console.error('정책 저장 실패:', err);
    return false;
  }
}
