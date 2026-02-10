import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, DollarSign, Calendar } from 'lucide-react';
import { fetchReports } from '../api/client';

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금'];

/** 이번 주 월요일 00:00 ~ 일요일 23:59 (로컬) */
function getThisWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return { mon, sun };
}

function toDateOnly(d) {
  if (!d) return '';
  const x = new Date(d);
  if (isNaN(x.getTime())) return String(d);
  return x.toISOString().slice(0, 10);
}

function getWeekdayIndex(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  return day === 0 ? 6 : day - 1;
}

export default function Report() {
  const [activeTab, setActiveTab] = useState('weekly');
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchReports('Weekly_Report'),
      fetchReports('Monthly_Quote'),
    ]).then(([weekly, monthly]) => {
      if (!cancelled) {
        setWeeklyData(Array.isArray(weekly) ? weekly : []);
        setMonthlyData(Array.isArray(monthly) ? monthly : []);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const { mon: weekStart, sun: weekEnd } = getThisWeekRange();
  const weekStartStr = toDateOnly(weekStart);
  const weekEndStr = toDateOnly(weekEnd);

  const thisWeekItems = weeklyData.filter((row) => {
    const dateStr = toDateOnly(row.date ?? row.일자 ?? row.Date);
    if (!dateStr) return false;
    return dateStr >= weekStartStr && dateStr <= weekEndStr;
  });

  const byWeekday = WEEKDAY_LABELS.map((_, i) =>
    thisWeekItems.filter((row) => {
      const dateStr = toDateOnly(row.date ?? row.일자 ?? row.Date);
      return dateStr && getWeekdayIndex(dateStr) === i;
    })
  );

  const totalQuotes = monthlyData.length;
  const totalAmount = monthlyData.reduce((sum, row) => {
    const v = row.금액 ?? row.amount ?? row.Amount ?? 0;
    const num = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.-]/g, '')) || 0;
    return sum + num;
  }, 0);
  const totalAmountOk = (totalAmount / 100000000).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> 대시보드
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-slate-800">리포트</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* 탭 */}
        <div className="mb-6 flex border-b border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'weekly' ? 'border-b-2 border-sky-500 text-sky-600' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            주간 업무 보고
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'monthly' ? 'border-b-2 border-sky-500 text-sky-600' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            월별 견적 현황
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            데이터를 불러오는 중...
          </div>
        ) : activeTab === 'weekly' ? (
          <>
            <p className="mb-4 text-sm text-slate-600">
              이번 주 ({weekStartStr} ~ {weekEndStr}) 자동 필터
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WEEKDAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <h3 className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2 text-sm font-semibold text-slate-700">
                    <Calendar className="h-4 w-4" /> {label}요일
                  </h3>
                  <ul className="space-y-2">
                    {byWeekday[i].length === 0 ? (
                      <li className="text-sm text-slate-400">—</li>
                    ) : (
                      byWeekday[i].map((row, j) => (
                        <li key={j} className="rounded border border-slate-100 bg-slate-50/50 p-2 text-sm">
                          <p className="font-medium text-slate-800">
                            {row.내용 ?? row.content ?? row.주요업무 ?? row.mainWork ?? '—'}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            발주처: {row.발주처 ?? row.orderer ?? row.procMethod ?? '—'}
                          </p>
                          <p className="text-xs text-slate-500">
                            담당자: {row.담당자 ?? row.manager ?? '—'}
                          </p>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* 요약 카드 */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="rounded-lg bg-slate-100 p-3">
                  <FileText className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">총 견적 건수</p>
                  <p className="text-2xl font-bold text-slate-800">{totalQuotes}건</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="rounded-lg bg-emerald-100 p-3">
                  <DollarSign className="h-6 w-6 text-emerald-700" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">총 금액 (억)</p>
                  <p className="text-2xl font-bold text-slate-800">{totalAmountOk}억</p>
                </div>
              </div>
            </div>

            {/* 테이블 */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">일자</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">발주처</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">사업명</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">금액</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          데이터가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      monthlyData.map((row, i) => (
                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="px-4 py-2 text-slate-700">
                            {toDateOnly(row.일자 ?? row.date ?? row.Date) || '—'}
                          </td>
                          <td className="px-4 py-2 text-slate-700">
                            {row.발주처 ?? row.orderer ?? '—'}
                          </td>
                          <td className="px-4 py-2 text-slate-700">
                            {row.사업명 ?? row.projectName ?? row.bidNtceNm ?? '—'}
                          </td>
                          <td className="px-4 py-2 text-right font-medium text-slate-800">
                            {row.금액 != null ? Number(row.금액).toLocaleString() : row.amount ?? '—'}
                          </td>
                          <td className="px-4 py-2 text-slate-600">
                            {row.비고 ?? row.note ?? '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
