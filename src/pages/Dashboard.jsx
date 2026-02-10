import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  TrendingUp,
  Clock,
  Building2,
  Calendar,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { fetchBids } from '../api/client';

/** 시트 컬럼: AI_Rating. 비어있으면(undefined) '분석대기' */
function RatingBadge({ rating }) {
  const isPending = rating === undefined || rating === null || String(rating).trim() === '';
  if (isPending) return <span className="rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">분석대기</span>;
  const styles = {
    S: 'bg-violet-100 text-violet-800 border-violet-200',
    A: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    B: 'bg-slate-200 text-slate-700 border-slate-300',
    C: 'bg-slate-200 text-slate-600 border-slate-300',
  };
  const cls = styles[rating] || 'bg-slate-200 text-slate-600 border-slate-300';
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {rating}급
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: bids = [], isLoading, isError, error } = useQuery({
    queryKey: ['bids'],
    queryFn: fetchBids,
  });

  const total = bids.length;
  const saCount = bids.filter((b) => b.AI_Rating === 'S' || b.AI_Rating === 'A').length;
  const pendingCount = bids.filter((b) => b.AI_Rating === undefined || b.AI_Rating === null || String(b.AI_Rating).trim() === '' || !['S', 'A'].includes(String(b.AI_Rating).trim())).length;

  const stats = [
    { label: '전체 공고', value: total, icon: FileText, color: 'bg-slate-50 border-slate-200 text-slate-800' },
    { label: 'S/A급 기회', value: saCount, icon: TrendingUp, color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    { label: '분석 대기', value: pendingCount, icon: Clock, color: 'bg-amber-50 border-amber-200 text-amber-800' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">공고 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
          <p className="font-medium">데이터를 불러오지 못했습니다.</p>
          <p className="mt-1 text-sm text-red-600">{error?.message || 'API 연결을 확인해 주세요.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <h1 className="text-xl font-semibold text-slate-800">Rainmaker 대시보드</h1>
          <p className="mt-0.5 text-sm text-slate-500">수집된 입찰 공고와 AI 분석 결과</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`rounded-xl border p-5 ${color}`}>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/80 p-2">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium opacity-90">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-800">공고 목록</h2>
          {bids.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              수집된 공고가 없습니다.
            </div>
          ) : (
            <ul className="space-y-4">
              {bids.map((bid, index) => {
                const id = bid.bidNtceNo != null && String(bid.bidNtceNo).trim() !== '' ? encodeURIComponent(String(bid.bidNtceNo)) : String(index);
                const hasAiReason = bid.AI_Reason !== undefined && bid.AI_Reason !== null && String(bid.AI_Reason).trim() !== '';
                return (
                  <li key={bid.bidNtceNo ?? bid.link ?? `bid-${index}`}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/bids/${id}`, { state: { bid } })}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/bids/${id}`, { state: { bid } })}
                      className="block cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <RatingBadge rating={bid.AI_Rating} />
                            {bid.bidNtceNo && <span className="text-xs text-slate-500">#{bid.bidNtceNo}</span>}
                            {bid.link && (
                              <a
                                href={bid.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-sky-600"
                                title="원문 보기"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                          <h3 className="font-medium text-slate-900 line-clamp-2">{bid.bidNtceNm ?? '—'}</h3>
                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4 shrink-0" />
                              {bid.procMethod ?? '—'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 shrink-0" />
                              {bid.bidNtceDt ?? '—'}
                            </span>
                          </div>
                          {hasAiReason ? (
                            <div className="mt-3 flex gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                              <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{bid.AI_Reason}</span>
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-amber-700">분석대기</p>
                          )}
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
