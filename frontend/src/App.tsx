import { AppLayout } from '@/components/layout/AppLayout';
import { Route, Routes } from 'react-router-dom';
import { WordTestPage } from '@/pages/wordtest/WordTestPage';
import { WordTestDetailPage } from '@/pages/wordtest/WordTestDetailPage';
import { WordTestGradingPage } from '@/pages/wordtest/WordTestGradingPage';
import { WordMasterPage } from '@/pages/wordmaster/WordMasterPage';
import { ExamPapersPage } from '@/pages/exam/ExamPapersPage';
import { ExamResultsPage } from '@/pages/exam/ExamResultsPage';

export function App() {
  const sidebarItems = [
    { label: 'ダッシュボード', to: '/' },
    { label: '単語テスト', to: '/wordtest' },
    { label: '単語データ管理', to: '/wordmaster' },
    { label: '試験問題管理', to: '/exam/papers' },
    { label: '試験結果管理', to: '/exam/results' },
  ];

  return (
    <AppLayout title="Smart Exam" sidebarItems={sidebarItems}>
      <Routes>
        <Route
          path="/"
          element={
            <div className="space-y-2">
              <h1 className="text-lg font-semibold text-stone-900">ダッシュボード</h1>
              <p className="text-sm text-stone-700">左メニューから機能を選択してください。</p>
            </div>
          }
        />
        <Route path="/wordtest" element={<WordTestPage />} />
        <Route path="/wordtest/:wordtestid" element={<WordTestDetailPage />} />
        <Route path="/wordtest/:wordtestid/grading" element={<WordTestGradingPage />} />
        <Route path="/wordmaster" element={<WordMasterPage />} />
        <Route path="/exam/papers" element={<ExamPapersPage />} />
        <Route path="/exam/results" element={<ExamResultsPage />} />
      </Routes>
    </AppLayout>
  );
}
