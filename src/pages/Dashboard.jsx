import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Target,
  Banknote,
  Search,
  ExternalLink,
  MapPin,
  Calendar,
  Building2,
} from 'lucide-react';
import { fetchBids, fetchReports } from '../api/client';

/** 공고 일자 문자열 → YYYY-MM-DD (오늘 비교용) */
function toDateStr(val) {
  if (val == null || val === '') return '';
  const s = String(val).replace(/\D/g, '');
  if (s.length >= 8) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  if (s.length >= 6) return `${s.slice(0, 4)}-${s.slice(4, 6)}-01`;
  return '';
}

/** 오늘 YYYY-MM-DD */
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/** 이번 달 YYYY-MM */
function thisMonthStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

/** 월별 견적 row에서 날짜(월) 추출 */
function getMonthFromRow(row) {
  const v = row.date ?? row.일자 ?? row.월 ?? row.Date ?? '';
  const s = String(v).trim();
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-/.test(s)) return s.slice(0, 7);
  const num = s.replace(/\D/g, '');
  if (num.length >= 6) return `${num.slice(0, 4)}-${num.slice(4, 6)}`;
  return s;
}

/** 금액 숫자 추출 */
function toAmount(val) {
  if (val == null || val === '') return 0;
  const n = typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.-]/g, ''));
  return Number.isNaN(n) ? 0 : n;
}

const REGIONS = [
  '전체',
  '서울',
  '경기',
  '인천',
  '부산',
  '대구',
  '대전',
  '광주',
  '울산',
  '세종',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
];

const GRADES = ['전체', 'S', 'A', 'B', 'C'];

function RatingBadge({ rating }) {
  const r = rating == null || String(rating).trim() === '' ? null : String(rating).trim();
  if (!r) return <span className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">분석대기</span>;
  const styles = {
    S: 'border-red-300 bg-red-50 text-red-700',
    A: 'border-red-200 bg-red-50/80 text-red-600',
    B: 'border-slate-300 bg-slate-100 text-slate-700',
    C: 'border-slate-300 bg-slate-100 text-slate-600',
  };
  const cls = styles[r] ?? 'border-slate-300 bg-slate-100 text-slate-600';
  return <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${cls}`}>{r}급</span>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('전체');
  const [regionFilter, setRegionFilter] = useState('전체');

  const { data: bids = [], isLoading: bidsLoading, isError: bidsError, error: bidsErrorObj } = useQuery({
    queryKey: ['bids'],
    queryFn: fetchBids,
  });

  const { data: monthlyQuote = [], isLoading: quoteLoading } = useQuery({
    queryKey: ['reports', 'Monthly_Quote'],
    queryFn: () => fetchReports('Monthly_Quote'),
  });

  const today = todayStr();
  const thisMonth = thisMonthStr();

  const kpis = useMemo(() => {
    const todayCount = bids.filter((b) => {
      const dt = toDateStr(b.bidDt ?? b.bidNtceDt ?? '');
      return dt === today;
    }).length;
    const saCount = bids.filter((b) => {
      const r = b.AI_Rating != null ? String(b.AI_Rating).trim() : '';
      return r === 'S' || r === 'A';
    }).length;
    const monthAmount = (Array.isArray(monthlyQuote) ? monthlyQuote : [])
      .filter((row) => getMonthFromRow(row) === thisMonth)
      .reduce((sum, row) => sum + toAmount(row.amount ?? row.금액 ?? row.견적금액), 0);
    const 억 = Math.floor(monthAmount / 100000000);
    const 천만 = Math.floor((monthAmount % 100000000) / 10000000);
    let amountLabel = '';
    if (억 > 0) amountLabel += `${억}억 `;
    if (천만 > 0) amountLabel += `${천만}천만`;
    if (!amountLabel) amountLabel = '0';
    return { todayCount, saCount, monthAmount, amountLabel: amountLabel.trim() || '0' };
  }, [bids, monthlyQuote, today, thisMonth]);

  const filteredBids = useMemo(() => {
    let list = [...bids];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((b) => {
        const name = (b.bidNtceNm ?? '').toLowerCase();
        const dman = (b.dman ?? b.발주처 ?? b.procMethod ?? '').toLowerCase();
        return name.includes(q) || dman.includes(q);
      });
    }
    if (gradeFilter !== '전체') {
      list = list.filter((b) => String(b.AI_Rating ?? '').trim() === gradeFilter);
    }
    if (regionFilter !== '전체') {
      list = list.filter((b) => (b.region ?? b.지역 ?? b.area ?? '').trim() === regionFilter);
    }
    return list;
  }, [bids, search, gradeFilter, regionFilter]);

  const isLoading = bidsLoading;
  const isError = bidsError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">공고·견적 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          <p className="font-medium">데이터를 불러오지 못했습니다.</p>
          <p className="mt-1 text-sm text-red-600">{bidsErrorObj?.message || 'API 연결을 확인해 주세요.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <h1 className="text-xl font-semibold text-slate-800">영업 관제탑</h1>
          <p className="mt-0.5 text-sm text-slate-500">공고 현황·견적 요약·필터로 한눈에</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* KPI 카드 3개 */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">오늘의 공고</p>
                <p className="text-2xl font-bold text-slate-800">{kpis.todayCount}<span className="text-base font-normal text-slate-500">건</span></p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-50 p-2.5 text-red-600">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">핵심 타겟 (S/A급)</p>
                <p className="text-2xl font-bold text-red-600">{kpis.saCount}<span className="text-base font-normal text-slate-500">건</span></p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">이달의 견적왕</p>
                <p className="text-2xl font-bold text-slate-800">{kpis.amountLabel}<span className="text-base font-normal text-slate-500"> (이번 달)</span></p>
              </div>
            </div>
          </div>
        </section>

        {/* 검색·필터 바 */}
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="공고명·발주처 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">등급</span>
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGradeFilter(g)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${gradeFilter === g ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                  {g === '전체' ? '전체' : `${g}급`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 공고 리스트 카드 */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <FileText className="h-5 w-5" />
            공고 목록 <span className="text-sm font-normal text-slate-500">({filteredBids.length}건)</span>
          </h2>
          {filteredBids.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              조건에 맞는 공고가 없습니다.
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {filteredBids.map((bid, index) => {
                const id = bid.bidNtceNo != null && String(bid.bidNtceNo).trim() !== '' ? encodeURIComponent(String(bid.bidNtceNo)) : String(index);
                const isS = String(bid.AI_Rating ?? '').trim() === 'S';
                const hasReport = !!(bid.AI_Reason != null && String(bid.AI_Reason).trim() !== '');
                const cardBg = isS ? 'bg-red-50/50 border-red-200' : 'bg-white border-slate-200';
                return (
                  <li key={bid.bidNtceNo ?? bid.link ?? `bid-${index}`}>
                    <div className={`relative rounded-xl border p-5 shadow-sm transition hover:shadow-md ${cardBg}`}>
                      {hasReport && (
                        <span className="absolute right-3 top-3 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 border border-sky-200">
                          업무중
                        </span>
                      )}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 pr-20">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <RatingBadge rating={bid.AI_Rating} />
                            {bid.bidNtceNo && <span className="text-xs text-slate-500">#{bid.bidNtceNo}</span>}
                          </div>
                          <h3 className="font-medium text-slate-900 line-clamp-2">{bid.bidNtceNm ?? '—'}</h3>
                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4 shrink-0" />
                              {bid.dman ?? bid.발주처 ?? bid.procMethod ?? '—'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 shrink-0" />
                              {bid.bidDt ?? bid.bidNtceDt ?? '—'}
                            </span>
                          </div>
                          {bid.AI_Reason && (
                            <p className="mt-2 line-clamp-2 text-sm text-slate-600">{bid.AI_Reason}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {bid.link && (
                            <a
                              href={bid.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-sky-600"
                              title="원문 보기"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => navigate(`/bids/${id}`, { state: { bid } })}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
                          >
                            상세보기
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
