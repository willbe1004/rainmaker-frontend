// src/api/client.js

// .env에 있는 주소를 그대로 가져옵니다. (프록시/우회 로직 제거)
const API_URL = import.meta.env.VITE_API_URL;

/**
 * 수집된 입찰 공고 목록을 가져옵니다.
 * @returns {Promise<Array>} 공고 목록
 */
export async function fetchBids() {
  // URL이 없는 경우 방어 코드
  if (!API_URL) {
    console.error("[fetchBids] API URL이 설정되지 않았습니다 (.env 확인 필요)");
    return [];
  }

  try {
    // method: 'GET'은 생략 가능하지만 명시, 기타 헤더는 제거 (CORS 방지)
    const response = await fetch(API_URL);

    if (!response.ok) {
      // 에러 발생 시 로그 출력
      const text = await response.text();
      console.error('[fetchBids] HTTP 에러:', {
        status: response.status,
        url: API_URL,
        body: text?.slice(0, 500), // 에러 내용 확인용
      });
      return [];
    }

    const data = await response.json();
    
    // 데이터 구조에 따라 유연하게 배열 추출
    // { status: "success", data: [...] } 또는 그냥 [...] 형태 모두 대응
    const list = data?.data ?? data ?? [];
    
    return Array.isArray(list) ? list : [];

  } catch (err) {
    console.error('[fetchBids] 요청 실패 (네트워크/CORS):', err);
    return [];
  }
}

/**
 * 영업 활동 보고 (통합 저장)
 * @param {Object} activityData 입력 폼 데이터
 */
export async function saveActivity(activityData) {
  const API_URL = import.meta.env.VITE_API_URL;

  const payload = {
    type: 'SALES_LOG',
    data: activityData,
  };

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    console.error('저장 실패:', err);
    return false;
  }
}

/**
 * 정책 과업 보고 (별도 저장)
 * @param {Object} policyData 정책 과업 데이터
 */
export async function savePolicy(policyData) {
  const API_URL = import.meta.env.VITE_API_URL;

  const payload = {
    type: 'POLICY',
    data: policyData,
  };

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    console.error('정책 저장 실패:', err);
    return false;
  }
}