// 개발 시 Vite 프록시 사용 (/api -> script.google.com), CORS 회피
const fullURL = import.meta.env.VITE_API_URL || '';
const baseURL =
  import.meta.env.DEV && fullURL
    ? '/api' + new URL(fullURL).pathname
    : fullURL;

/**
 * 수집된 입찰 공고 목록을 가져옵니다.
 * fetch 사용 (CORS 회피). API 응답의 data 배열을 추출해 반환합니다.
 * @returns {Promise<Array>} 공고 목록
 */
export async function fetchBids() {
  try {
    const response = await fetch(baseURL, { method: 'GET' });

    if (!response.ok) {
      const text = await response.text();
      console.error('[fetchBids] HTTP 에러:', {
        status: response.status,
        statusText: response.statusText,
        url: baseURL,
        body: text?.slice(0, 500),
      });
      return [];
    }

    const data = await response.json();
    const list = data?.data ?? data ?? [];
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('[fetchBids] 요청 실패:', {
      message: err?.message,
      name: err?.name,
      url: baseURL,
      error: err,
    });
    return [];
  }
}
