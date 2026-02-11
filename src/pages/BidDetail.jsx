import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchBids, saveActivity, assignBidAPI } from '../api/client';
import { ExternalLink } from 'lucide-react';

function RatingBadge({ rating }) {
  const r = rating == null || String(rating).trim() === '' ? null : String(rating).trim();
  if (!r) return <span className="rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">분석대기</span>;
  const styles = { S: 'bg-violet-100 text-violet-800', A: 'bg-emerald-100 text-emerald-800', B: 'bg-slate-200 text-slate-700', C: 'bg-slate-200 text-slate-600' };
  return <span className={`rounded px-2 py-0.5 text-xs font-semibold ${styles[r] || 'bg-slate-200 text-slate-600'}`}>{r}급</span>;
}

export default function BidDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useAuth();

  const [bid, setBid] = useState(state?.bid ?? null);
  const [reportContent, setReportContent] = useState('');
  const [loading, setLoading] = useState(!state?.bid);

  useEffect(() => {
    if (state?.bid) {
      setBid(state.bid);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const list = await fetchBids();
      if (cancelled) return;
      const found = list.find((b) => {
        const no = b.bidNtceNo != null ? String(b.bidNtceNo) : '';
        return no && decodeURIComponent(id) === no;
      }) ?? list[Number(id)];
      setBid(found ?? null);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [id, state?.bid]);

  const handleAssignRequest = async () => {
    if (!confirm('이 공고의 영업 담당자로 등록하시겠습니까? (관리자 승인 필요)')) return;
    const ok = await assignBidAPI({
      bidId: id,
      bidNtceNo: bid?.bidNtceNo,
      userName: user?.name ?? user?.displayName ?? user?.email,
      userEmail: user?.email,
    });
    alert(ok ? '담당자 승인 요청되었습니다.' : '요청 실패. 다시 시도해 주세요.');
    if (ok) {
      setBid((prev) => prev ? { ...prev, assignee_email: user?.email, assignee: user?.name ?? user?.displayName ?? user?.email } : null);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportContent?.trim()) return alert('내용을 입력하세요.');

    const success = await saveActivity({
      date: new Date().toISOString().split('T')[0],
      content: reportContent.trim(),
      mainWork: reportContent.trim(),
      manager: user?.name ?? user?.displayName ?? user?.email,
      category: '영업활동',
      orderer: bid?.procMethod ?? bid?.dman ?? '발주처 미정',
      projectName: bid?.bidNtceNm ?? bid?.project,
      bidId: id,
      bidNtceNo: bid?.bidNtceNo,
    });

    if (success) {
      alert('보고서가 저장되었습니다.');
      setReportContent('');
    } else {
      alert('저장에 실패했습니다.');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">로딩중...</div>;
  if (!bid) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-gray-500 mb-4">← 뒤로가기</button>
        <div className="bg-white p-8 rounded-xl text-center text-gray-500">공고 정보를 찾을 수 없습니다.</div>
      </div>
    );
  }

  const projectName = bid.bidNtceNm ?? bid.project ?? '—';
  const isMyBid = bid.assignee_email === user?.email;
  const isAssigned = !!(bid.assignee_email ?? bid.assignee);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-gray-500 mb-4 hover:text-gray-700">← 뒤로가기</button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <RatingBadge rating={bid.AI_Rating} />
              {bid.bidNtceNo && <span className="text-xs text-gray-500">#{bid.bidNtceNo}</span>}
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{projectName}</h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
              {bid.procMethod && <span>🏢 {bid.procMethod}</span>}
              {bid.bidNtceDt && <span>📅 {bid.bidNtceDt}</span>}
            </div>
            {bid.AI_Reason && (
              <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">{bid.AI_Reason}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            {isAssigned ? (
              <div className="bg-blue-50 text-blue-800 px-3 py-1.5 rounded-lg text-sm border border-blue-100">
                <span className="font-bold">담당자: {bid.assignee ?? '—'}</span>
                {isMyBid && <span className="ml-1 text-xs">(나)</span>}
              </div>
            ) : (
              <button
                onClick={handleAssignRequest}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded text-sm font-bold border border-gray-300"
              >
                ✋ 담당자 신청
              </button>
            )}
            {bid.link && (
              <a href={bid.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                <ExternalLink className="h-4 w-4" /> 원문 보기
              </a>
            )}
          </div>
        </div>
      </div>

      {(isMyBid || !isAssigned) && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold mb-4">📝 영업 활동 보고</h3>
          <textarea
            className="w-full border border-gray-300 rounded p-3 h-32 mb-3 text-sm"
            placeholder="이 공고에 대한 영업 활동 내용을 입력하세요..."
            value={reportContent}
            onChange={(e) => setReportContent(e.target.value)}
          />
          <button
            onClick={handleReportSubmit}
            className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700"
          >
            활동 내역 저장 (족보 남기기)
          </button>
        </div>
      )}

      {isAssigned && !isMyBid && (
        <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800 text-sm border border-yellow-200">
          🔒 이 공고는 <b>{bid.assignee ?? '다른 사용자'}</b>님이 담당하고 있습니다.
        </div>
      )}
    </div>
  );
}
