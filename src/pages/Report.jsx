import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { fetchReports, updateStatusAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

// ——— 유틸리티 ———
/** 날짜 포맷: YYYY-MM-DD */
function formatDate(value) {
  if (value == null || value === '') return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 날짜 포맷: YYYY-MM (월별 견적용) */
function formatDateMonth(value) {
  if (value == null || value === '') return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const s = String(value).trim();
    if (/^\d{4}-\d{2}$/.test(s)) return s;
    return String(value);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** 금액 천 단위 콤마 */
function formatAmount(value) {
  if (value == null || value === '') return '—';
  const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]/g, ''));
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString();
}

/** 진행여부: 체크(√) 또는 텍스트 */
function formatStatus(value) {
  if (value == null || value === '') return '—';
  const s = String(value).toLowerCase();
  if (s === 'o' || s === '완료' || s === '완' || s === 'y' || s === 'yes' || s === 'true' || s === '1' || s === '√' || s === 'v') return '√';
  return String(value).trim() || '—';
}

// ——— 탭 정의 (엑셀 순서: 주간 → 월별 → 예정 → 총괄) ———
const TABS = [
  { id: 'weekly', label: '주간업무보고' },
  { id: 'monthly', label: '월별 견적 현황' },
  { id: 'expected', label: '견적 예정 과업' },
  { id: 'general', label: '총괄' },
];

const TAB_STYLE = 'flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors';
const TAB_ACTIVE = 'border-sky-500 text-sky-600 bg-white';
const TAB_INACTIVE = 'border-transparent text-slate-600 hover:bg-slate-50 bg-slate-50/50';

const TABLE_WRAP = 'overflow-hidden rounded-lg border border-slate-300 bg-white';
const TABLE = 'w-full min-w-[640px] border-collapse text-sm';
const TH = 'border border-slate-300 bg-gray-100 px-3 py-2 text-left font-semibold text-slate-700';
const TH_RIGHT = 'border border-slate-300 bg-gray-100 px-3 py-2 text-right font-semibold text-slate-700';
const TD = 'border border-slate-200 px-3 py-2 text-slate-800';
const TD_RIGHT = 'border border-slate-200 px-3 py-2 text-right text-slate-800';

export default function Report() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('weekly');
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [generalData, setGeneralData] = useState([]);
  const [expectedData, setExpectedData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchReports('Weekly_Report'),
      fetchReports('Monthly_Quote'),
      fetchReports('Expected_Task'),
      fetchReports('General_Report'),
    ]).then(([weekly, monthly, expected, general]) => {
      if (!cancelled) {
        setWeeklyData(Array.isArray(weekly) ? weekly : []);
        setMonthlyData(Array.isArray(monthly) ? monthly : []);
        setExpectedData(Array.isArray(expected) ? expected : []);
        setGeneralData(Array.isArray(general) ? general : []);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const getCell = (row, ...keys) => {
    for (const k of keys) {
      const v = row[k];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return null;
  };

  const handleUpdateStatus = async (item, newStatus, feedbackText) => {
    if (!confirm(`${newStatus} 처리 하시겠습니까?`)) return;
    const result = await updateStatusAPI({
      date: getCell(item, 'date', '일자', 'Date'),
      content: getCell(item, 'content', '내용', '주요업무', '주요 업무'),
      manager: getCell(item, 'manager', '주관', '담당자'),
      status: newStatus,
      feedback: feedbackText,
    });
    alert(result);
    const updatedData = await fetchReports('Weekly_Report');
    setWeeklyData(Array.isArray(updatedData) ? updatedData : []);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> 대시보드
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-slate-800">리포트</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex border-b border-slate-300 bg-slate-100/80">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`${TAB_STYLE} ${activeTab === tab.id ? TAB_ACTIVE : TAB_INACTIVE}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500">
            데이터를 불러오는 중...
          </div>
        ) : (
          <div className={TABLE_WRAP}>
            <div className="overflow-x-auto">
              {/* Tab 1: 주간업무보고 — 카드 + 상태 + 관리자 승인/반려 */}
              {activeTab === 'weekly' && (
                <div className="p-6">
                  {weeklyData.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">데이터 없음</div>
                  ) : (
                    <div className="space-y-4">
                      {weeklyData.map((item, index) => {
                        const status = getCell(item, 'status', '상태') || '대기중';
                        const feedback = getCell(item, 'feedback', '피드백');
                        return (
                          <div key={index} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <span className="text-sm text-gray-500">
                                  {formatDate(getCell(item, 'date', '일자', 'Date')) || '—'} ({getCell(item, 'day', '요일') ?? '—'})
                                </span>
                                <h3 className="text-lg font-bold text-gray-800 mt-1">
                                  {getCell(item, 'content', '내용', '주요업무', '주요 업무') ?? '—'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  담당: {getCell(item, 'manager', '주관', '담당자') ?? '—'} | 협조: {getCell(item, 'collaboration', '협업') ?? '—'}
                                  {(getCell(item, 'outside', '외근') || getCell(item, 'urgent', '긴급')) && (
                                    <> | 외근: {getCell(item, 'outside', '외근') ?? '—'} | 긴급: {getCell(item, 'urgent', '긴급') ?? '—'}</>
                                  )}
                                </p>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                status === '승인' ? 'bg-green-100 text-green-800' :
                                status === '반려' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {status}
                              </div>
                            </div>
                            {feedback && (
                              <div className="mb-4 bg-blue-50 p-3 rounded text-sm text-blue-800">
                                💬 <strong>피드백:</strong> {feedback}
                              </div>
                            )}
                            {user?.role === 'manager' && (
                              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2 items-center bg-gray-50 p-3 rounded flex-wrap">
                                <span className="text-xs font-bold text-gray-500 mr-2">관리자 메뉴:</span>
                                <input
                                  type="text"
                                  placeholder="피드백 입력..."
                                  id={`feedback-${index}`}
                                  className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 min-w-[120px]"
                                  defaultValue={feedback || ''}
                                />
                                <button
                                  onClick={() => handleUpdateStatus(item, '승인', document.getElementById(`feedback-${index}`)?.value || '')}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                >
                                  승인
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(item, '반려', document.getElementById(`feedback-${index}`)?.value || '')}
                                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                >
                                  반려
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: 월별 견적 현황 (26년 월별견적.csv) — 월, 용량(톤), YYYY-MM */}
              {activeTab === 'monthly' && (
                <table className={TABLE}>
                  <thead>
                    <tr>
                      <th className={TH}>월</th>
                      <th className={TH}>발주처</th>
                      <th className={TH}>사업명</th>
                      <th className={TH}>용량(톤)</th>
                      <th className={TH_RIGHT}>견적금액</th>
                      <th className={TH}>비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="border border-slate-200 px-4 py-8 text-center text-slate-500">
                          데이터 없음
                        </td>
                      </tr>
                    ) : (
                      monthlyData.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className={TD}>{formatDateMonth(getCell(row, 'date', '일자', '월', 'Date'))}</td>
                          <td className={TD}>{getCell(row, 'client', '발주처', 'orderer') ?? '—'}</td>
                          <td className={TD}>{getCell(row, 'project', '사업명', 'projectName') ?? '—'}</td>
                          <td className={TD}>{getCell(row, 'volume', '용량') ?? '—'}</td>
                          <td className={TD_RIGHT}>{formatAmount(getCell(row, 'amount', '금액', '견적금액'))}</td>
                          <td className={TD}>{getCell(row, 'note', '비고') ?? '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tab 3: 견적 예정 과업 (26년 견적예정과업.csv) — 진행여부 √/텍스트 */}
              {activeTab === 'expected' && (
                <table className={TABLE}>
                  <thead>
                    <tr>
                      <th className={TH}>월</th>
                      <th className={TH}>담당자</th>
                      <th className={TH}>과업명</th>
                      <th className={TH}>예상톤수</th>
                      <th className={TH}>진행여부</th>
                      <th className={TH_RIGHT}>견적금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expectedData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="border border-slate-200 px-4 py-8 text-center text-slate-500">
                          데이터 없음
                        </td>
                      </tr>
                    ) : (
                      expectedData.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className={TD}>{getCell(row, 'month', '월') ?? '—'}</td>
                          <td className={TD}>{getCell(row, 'manager', '담당자') ?? '—'}</td>
                          <td className={TD}>{getCell(row, 'project', '과업명', '사업명') ?? '—'}</td>
                          <td className={TD}>{getCell(row, 'volume', '예상톤수', '용량') ?? '—'}</td>
                          <td className={TD}>{formatStatus(getCell(row, 'status', '진행여부'))}</td>
                          <td className={TD_RIGHT}>{formatAmount(getCell(row, 'amount', '견적금액', '금액'))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tab 4: 총괄 (총괄.csv) — 과업명 */}
              {activeTab === 'general' && (
                <table className={TABLE}>
                  <thead>
                    <tr>
                      <th className={TH}>일자</th>
                      <th className={TH}>구분</th>
                      <th className={TH}>발주처</th>
                      <th className={TH}>과업명</th>
                      <th className={TH}>상담내용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generalData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="border border-slate-200 px-4 py-8 text-center text-slate-500">
                          데이터 없음
                        </td>
                      </tr>
                    ) : (
                      generalData.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className={TD}>{formatDate(getCell(row, 'date', '일자', 'Date')) || '—'}</td>
                          <td className={TD}>{getCell(row, 'category', '구분') ?? '—'}</td>
                          <td className={TD}>{getCell(row, 'client', '발주처', 'orderer') ?? '—'}</td>
                          <td className={TD}>{getCell(row, 'project', '과업명', '사업명', 'projectName') ?? '—'}</td>
                          <td className={TD}>{getCell(row, 'content', '상담내용', '내용') ?? '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
