import { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Building2, Calendar, MessageSquare, Save } from 'lucide-react';
import { saveActivity, savePolicy, generateProposal } from '../api/client';

const ACTIVITY_CATEGORIES = ['금주실적', '차주계획', '견적제출', '계약', '실주'];

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

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function BidDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const bid = state?.bid;

  const [activeTab, setActiveTab] = useState('activity');

  // [일반 영업보고] 폼
  const [activity, setActivity] = useState({
    date: todayStr(),
    category: '금주실적',
    orderer: bid?.procMethod ?? '',
    projectName: bid?.bidNtceNm ?? '',
    mainWork: '',
    amount: '',
    capacity: '',
    manager: '',
    urgent: false,
  });

  // [정책 과업 관리] 폼
  const [policy, setPolicy] = useState({
    region: '',
    orderer: bid?.procMethod ?? '',
    projectName: bid?.bidNtceNm ?? '',
    statusReport: '',
    designerInfo: '',
    schedule: '',
    amount: '',
  });

  const [activitySaving, setActivitySaving] = useState(false);
  const [policySaving, setPolicySaving] = useState(false);
  const [activitySaved, setActivitySaved] = useState(false);
  const [policySaved, setPolicySaved] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleActivityChange = (field, value) => setActivity((prev) => ({ ...prev, [field]: value }));
  const handlePolicyChange = (field, value) => setPolicy((prev) => ({ ...prev, [field]: value }));

  const onSaveActivity = async () => {
    if (!activity.category) return;
    setActivitySaving(true);
    setActivitySaved(false);
    const ok = await saveActivity(activity);
    setActivitySaving(false);
    setActivitySaved(ok);
  };

  const onSavePolicy = async () => {
    setPolicySaving(true);
    setPolicySaved(false);
    const ok = await savePolicy(policy);
    setPolicySaving(false);
    setPolicySaved(ok);
  };

  const handleGenerateProposal = async () => {
    setIsGenerating(true);
    try {
      const text = await generateProposal({
        ...bid,
        region: bid.addr || bid.dman || bid.procMethod,
      });
      setProposal(text);
    } catch (error) {
      alert('보고서 생성 실패: ' + (error?.message || error));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!proposal) return;
    navigator.clipboard.writeText(proposal);
    alert('📋 클립보드에 복사되었습니다. 한글(HWP) 파일에 붙여넣으세요!');
  };

  const isQuote = activity.category === '견적제출';

  if (!bid) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="mx-auto max-w-5xl px-4 py-4">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" /> 대시보드로
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            <p>공고 정보를 찾을 수 없습니다.</p>
            <Link to="/" className="mt-4 inline-block text-sky-600 hover:underline">목록으로</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> 대시보드로
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
          {/* 좌측: 공고 요약 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <RatingBadge rating={bid.AI_Rating} />
              {bid.link && (
                <a href={bid.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-sky-600 hover:underline">
                  <ExternalLink className="h-4 w-4" /> 원문 보기
                </a>
              )}
            </div>
            <h1 className="text-base font-semibold text-slate-900">{bid.bidNtceNm || '—'}</h1>
            {bid.bidNtceNo && <p className="mt-1 text-xs text-slate-500">#{bid.bidNtceNo}</p>}
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
              {bid.procMethod && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-5" />{bid.procMethod}</span>}
              {bid.bidNtceDt && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-4" />{bid.bidNtceDt}</span>}
            </div>
            {bid.AI_Reason && String(bid.AI_Reason).trim() && (
              <div className="mt-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                <MessageSquare className="inline h-3.5 w-4 mr-1 align-middle" />
                {bid.AI_Reason}
              </div>
            )}
          </div>

          {/* 우측: 탭 + 폼 */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* 탭 */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'activity' ? 'bg-white text-slate-900 border-b-2 border-sky-500' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                일반 영업보고
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('policy')}
                className={`flex-1 px-4 py-3 text-sm font-medium ${activeTab === 'policy' ? 'bg-white text-slate-900 border-b-2 border-sky-500' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                정책 과업 관리
              </button>
            </div>

            <div className="p-5">
              {/* [일반 영업보고] */}
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">일자</span>
                      <input
                        type="date"
                        value={activity.date}
                        onChange={(e) => handleActivityChange('date', e.target.value)}
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">구분 <span className="text-red-500">*</span></span>
                      <select
                        value={activity.category}
                        onChange={(e) => handleActivityChange('category', e.target.value)}
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      >
                        {ACTIVITY_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">발주처</span>
                    <input
                      type="text"
                      value={activity.orderer}
                      onChange={(e) => handleActivityChange('orderer', e.target.value)}
                      placeholder="발주처"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">건명</span>
                    <input
                      type="text"
                      value={activity.projectName}
                      onChange={(e) => handleActivityChange('projectName', e.target.value)}
                      placeholder="건명"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">주요업무 (내용)</span>
                    <textarea
                      value={activity.mainWork}
                      onChange={(e) => handleActivityChange('mainWork', e.target.value)}
                      placeholder="주요 업무 내용"
                      rows={4}
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </label>
                  <div className={`grid gap-4 sm:grid-cols-2 ${isQuote ? 'rounded-lg border-2 border-amber-300 bg-amber-50/50 p-3' : ''}`}>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">금액</span>
                      <input
                        type="number"
                        value={activity.amount}
                        onChange={(e) => handleActivityChange('amount', e.target.value)}
                        placeholder="0"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">용량</span>
                      <input
                        type="number"
                        value={activity.capacity}
                        onChange={(e) => handleActivityChange('capacity', e.target.value)}
                        placeholder="0"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">담당자 (주관/협업)</span>
                    <input
                      type="text"
                      value={activity.manager}
                      onChange={(e) => handleActivityChange('manager', e.target.value)}
                      placeholder="담당자"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={activity.urgent}
                      onChange={(e) => handleActivityChange('urgent', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-slate-700">긴급여부</span>
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onSaveActivity}
                      disabled={activitySaving || !activity.category}
                      className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {activitySaving ? '저장 중...' : '저장'}
                    </button>
                    {activitySaved && <span className="text-sm text-emerald-600">저장되었습니다.</span>}
                  </div>

                  {/* 우수유출 저감대책 보고서 (AI Draft) — A4 용지 느낌 + 복사 */}
                  <div className="mt-8 border-t border-slate-200 pt-6">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                      <h2 className="text-xl font-bold text-slate-800 flex items-center">
                        📄 우수유출 저감대책 보고서 (AI Draft)
                      </h2>
                      <button
                        type="button"
                        onClick={handleGenerateProposal}
                        disabled={isGenerating}
                        className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 text-sm font-medium"
                      >
                        {isGenerating ? '법령 분석 중...' : '✨ 보고서 초안 생성'}
                      </button>
                    </div>
                    {proposal && (
                      <div className="relative bg-slate-100 p-8 rounded-lg border border-slate-300">
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="absolute top-4 right-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded shadow-sm text-sm font-medium z-10"
                        >
                          📋 전체 복사
                        </button>
                        <div className="bg-white shadow-xl max-w-4xl mx-auto p-12 min-h-[800px] rounded">
                          <textarea
                            value={proposal}
                            onChange={(e) => setProposal(e.target.value)}
                            className="w-full h-full min-h-[800px] resize-none focus:outline-none font-serif text-slate-800 leading-relaxed whitespace-pre-wrap border-0 p-0 text-sm"
                            spellCheck="false"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* [정책 과업 관리] */}
              {activeTab === 'policy' && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">지역</span>
                    <input
                      type="text"
                      value={policy.region}
                      onChange={(e) => handlePolicyChange('region', e.target.value)}
                      placeholder="지역"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">발주처</span>
                    <input
                      type="text"
                      value={policy.orderer}
                      onChange={(e) => handlePolicyChange('orderer', e.target.value)}
                      placeholder="발주처"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">사업명</span>
                    <input
                      type="text"
                      value={policy.projectName}
                      onChange={(e) => handlePolicyChange('projectName', e.target.value)}
                      placeholder="사업명"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">현황보고</span>
                    <textarea
                      value={policy.statusReport}
                      onChange={(e) => handlePolicyChange('statusReport', e.target.value)}
                      placeholder="현황 보고 내용"
                      rows={4}
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">설계사 정보</span>
                    <input
                      type="text"
                      value={policy.designerInfo}
                      onChange={(e) => handlePolicyChange('designerInfo', e.target.value)}
                      placeholder="설계사 정보"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">일정</span>
                      <input
                        type="text"
                        value={policy.schedule}
                        onChange={(e) => handlePolicyChange('schedule', e.target.value)}
                        placeholder="일정"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-600">금액</span>
                      <input
                        type="number"
                        value={policy.amount}
                        onChange={(e) => handlePolicyChange('amount', e.target.value)}
                        placeholder="0"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onSavePolicy}
                      disabled={policySaving}
                      className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {policySaving ? '저장 중...' : '저장'}
                    </button>
                    {policySaved && <span className="text-sm text-emerald-600">저장되었습니다.</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
