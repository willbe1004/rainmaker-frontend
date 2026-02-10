import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { fetchReports } from '../api/client';

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
              {/* Tab 1: 주간업무보고 (권준오.csv) — 주요 업무 칸 가장 넓게 */}
              {activeTab === 'weekly' && (
                <table className={TABLE}>
                  <thead>
                    <tr>
                      <th className={TH}>일자</th>
                      <th className={TH}>요일</th>
                      <th className={`${TH} min-w-[220px]`}>주요 업무</th>
                      <th className={TH}>주관</th>
                      <th className={TH}>협업</th>
                      <th className={TH}>외근</th>
                      <th className={TH}>긴급</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="border border-slate-200 px-4 py-8 text-center text-slate-500">
                          데이터 없음
                        </td>
                      </tr>
                    ) : (
                      weeklyData.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className={TD}>{formatDate(getCell(row, 'date', '일자', 'Date')) || '—'}</td>
                          <td className={TD}>{getCell(row, 'day', '요일') ?? '—'}</td>
                          <td className={`${TD} min-w-[220px]`}>{getCell(row, 'content', '내용', '주요업무', '주요 업무') ?? '—'}</td>
                          <td className={TD}>{getCell(row, 'manager', '주관', '담당자') ?? '—'}</td>
                          <td className={TD}>{getCell(row, 'collaboration', '협업') ?? '—'}</td>
                          <td className={TD}>{getCell(row, 'outside', '외근') ?? '—'}</td>
                          <td className={TD}>{getCell(row, 'urgent', '긴급') ?? '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
