// src/pages/Report.jsx - 탭 구조 복원 및 결재 시스템 통합

import React, { useState, useEffect } from 'react';
import { fetchReports, updateStatusAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'weekly', label: '📅 주간업무보고' },
  { id: 'monthly', label: '💰 월별견적현황' },
  { id: 'general', label: '📊 총괄(종합)' },
  { id: 'bids', label: '📌 견적예정과업' },
];

export default function Report() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('weekly');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadTabData = async () => {
    setLoading(true);
    let sheetName = '';
    switch (activeTab) {
      case 'weekly': sheetName = 'Weekly_Report'; break;
      case 'monthly': sheetName = 'Monthly_Quote'; break;
      case 'general': sheetName = 'General_Report'; break;
      case 'bids': sheetName = 'Bids'; break;
      default: sheetName = 'Weekly_Report';
    }

    const result = await fetchReports(sheetName);
    setData(Array.isArray(result) ? [...result].reverse() : []);
    setLoading(false);
  };

  const handleApproval = async (item, newStatus) => {
    const feedbackInput = document.getElementById(`feedback-${item.date}-${item.content}`);
    const feedbackText = feedbackInput ? feedbackInput.value : '';

    if (!confirm(`[${newStatus}] 처리 하시겠습니까?`)) return;

    const msg = await updateStatusAPI({
      date: item.date,
      content: item.content,
      manager: item.manager,
      status: newStatus,
      feedback: feedbackText
    });

    alert(msg);
    loadTabData();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">통합 영업 보고서</h2>
        <p className="text-sm text-gray-500">주간 업무 및 견적 현황을 통합 관리합니다.</p>
      </div>

      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">데이터를 불러오는 중입니다...</div>
      ) : (
        <>
          {activeTab === 'weekly' && (
            <div className="space-y-4">
              {data.map((item, index) => (
                <div key={index} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs text-gray-400 mr-2">{item.date} ({item.day})</span>
                      <span className="text-sm font-bold text-blue-900">{item.manager}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded font-bold ${
                      item.status === '승인' ? 'bg-green-100 text-green-700' :
                      item.status === '반려' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.status || '대기'}
                    </span>
                  </div>

                  <h3 className="text-md font-bold text-gray-800 mb-2">{item.content}</h3>
                  <div className="text-xs text-gray-500 mb-4">
                    {item.collaboration && <span className="mr-3">🤝 {item.collaboration}</span>}
                    {item.outside && <span className="mr-3">🚗 {item.outside}</span>}
                  </div>

                  <div className="bg-gray-50 p-3 rounded text-sm">
                    {item.feedback && (
                      <p className="mb-2 text-gray-700">💬 <b>피드백:</b> {item.feedback}</p>
                    )}

                    {user?.role === 'manager' && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <input
                          id={`feedback-${item.date}-${item.content}`}
                          type="text"
                          placeholder="피드백 입력..."
                          className="flex-1 min-w-[120px] border rounded px-2 py-1 text-xs"
                          defaultValue={item.feedback || ''}
                        />
                        <button onClick={() => handleApproval(item, '승인')} className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">승인</button>
                        <button onClick={() => handleApproval(item, '반려')} className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600">반려</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {data.length === 0 && (
                <div className="text-center py-12 text-gray-500">등록된 주간 업무 보고가 없습니다.</div>
              )}
            </div>
          )}

          {activeTab !== 'weekly' && (
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {data.length > 0 && Object.keys(data[0]).map((key) => (
                        <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {typeof val === 'string' && val.length > 20 ? val.substring(0, 20) + '...' : val ?? '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.length === 0 && (
                  <div className="p-10 text-center text-gray-500">데이터가 없습니다.</div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
