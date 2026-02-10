import { Link, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Building2, Calendar, MessageSquare } from 'lucide-react';

/** 시트 컬럼: bidNtceNm, bidNtceNo, bidNtceDt, procMethod, link, AI_Rating, AI_Reason. 비어있으면 분석대기 */
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
  return <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${cls}`}>{rating}급</span>;
}

export default function BidDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const bid = state?.bid;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> 대시보드로
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {!bid ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            <p>공고 정보를 찾을 수 없습니다.</p>
            <Link to="/" className="mt-4 inline-block text-sky-600 hover:underline">목록으로</Link>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <RatingBadge rating={bid.AI_Rating} />
              {bid.link && (
                <a href={bid.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-sky-600 hover:underline">
                  <ExternalLink className="h-4 w-4" /> 원문 보기
                </a>
              )}
            </div>
            <h1 className="text-lg font-semibold text-slate-900">{bid.bidNtceNm || '—'}</h1>
            {bid.bidNtceNo && <p className="mt-1 text-sm text-slate-500">#{bid.bidNtceNo}</p>}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
              {bid.procMethod && (
                <span className="flex items-center gap-1"><Building2 className="h-4 w-4 shrink-0" />{bid.procMethod}</span>
              )}
              {bid.bidNtceDt && (
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4 shrink-0" />{bid.bidNtceDt}</span>
              )}
            </div>
            {(bid.AI_Reason !== undefined && bid.AI_Reason !== null && String(bid.AI_Reason).trim() !== '') && (
              <div className="mt-4 flex gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{bid.AI_Reason}</span>
              </div>
            )}
            {(!bid.AI_Reason || String(bid.AI_Reason).trim() === '') && (
              <p className="mt-4 text-sm text-amber-700">분석대기</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
