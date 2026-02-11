// src/api/client.js
// Rainmaker API Client (Final Stable Version)

/**
 * 1. 공고 목록 조회 (GET) - ★ CORS 해결 핵심 적용
 */
export async function fetchBids() {
  const API_URL = import.meta.env.VITE_API_URL;

  try {
    // GAS doGet은 sheet 파라미터가 없으면 HTML을 반환하므로 반드시 지정해야 함
    // Bids 시트가 없다면 Weekly_Report 등으로 테스트
    const url = `${API_URL}?sheet=Bids`;

    console.log(`[fetchBids] 요청 시작: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      redirect: "follow"
      // headers: {} <--- ★ 절대 금지! GET 요청에 헤더 있으면 CORS 에러남
    });

    const result = await response.json();

    if (result.status === 'success') {
      console.log(`[fetchBids] 로드 성공: ${result.data.length}건`);
      return result.data;
    } else {
      console.warn(`[fetchBids] 데이터 없음:`, result);
      return [];
    }
  } catch (error) {
    console.error(`[fetchBids] 요청 실패:`, error);
    return [];
  }
}

/**
 * 2. 리포트 데이터 조회 (GET)
 */
export async function fetchReports(sheetName) {
  const API_URL = import.meta.env.VITE_API_URL;

  try {
    const url = `${API_URL}?sheet=${sheetName}`;

    const response = await fetch(url, {
      method: 'GET',
      redirect: "follow"
      // headers 삭제됨
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
 * 3. 영업보고 저장 (POST)
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
        "Content-Type": "text/plain;charset=utf-8", // POST는 이 헤더 필수
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
 * 4. AI 제안서/보고서 생성 (POST)
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
 * 5. 정책 과업 저장 (POST)
 */
export async function savePolicy(policyData) {
  const API_URL = import.meta.env.VITE_API_URL;
  const payload = { type: 'POLICY', data: policyData };
  try {
    await fetch(API_URL, {
      method: 'POST',
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.error('정책 저장 실패:', err);
    return false;
  }
}
