import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from '@/components/ui/sonner';
import { matchPath, Route, Routes, useLocation } from 'react-router-dom';

// Dashboard
import { DashboardPage } from '@/pages/DashboardPage';

// Materials
import { MaterialSetListPage } from '@/pages/materials/MaterialSetListPage';
import { MaterialSetCreatePage } from '@/pages/materials/MaterialSetCreatePage';
import { MaterialSetDetailPage } from '@/pages/materials/MaterialSetDetailPage';
import { QuestionManagementPage } from '@/pages/materials/QuestionManagementPage';

// Review Tests (Questions & Kanji)
import { ExamQuestionListPage } from '@/pages/review/ExamQuestionListPage';
import { ExamKanjiListPage } from '@/pages/review/ExamKanjiListPage';
import { ExamQuestionCreatePage } from '@/pages/review/ExamQuestionCreatePage';
import { ExamKanjiCreatePage } from '@/pages/review/ExamKanjiCreatePage';
import { ExamQuestionDetailPage } from '@/pages/review/ExamQuestionDetailPage';
import { ExamKanjiDetailPage } from '@/pages/review/ExamKanjiDetailPage';
import { ExamQuestionGradingPage } from '@/pages/review/ExamQuestionGradingPage';
import { ExamKanjiGradingPage } from '@/pages/review/ExamKanjiGradingPage';
import { ExamQuestionPdfPage } from '@/pages/review/ExamQuestionPdfPage';
import { ExamKanjiPdfPage } from '@/pages/review/ExamKanjiPdfPage';

// Kanji Management
import { KanjiListPage } from '@/pages/kanji/KanjiListPage';
import { KanjiCreatePage } from '@/pages/kanji/KanjiCreatePage';
import { KanjiImportPage } from '@/pages/kanji/KanjiImportPage';

// Search
import { QuestionSearchPage } from '@/pages/search/QuestionSearchPage';

// Settings
import { PdfSettingsPage } from '@/pages/settings/PdfSettingsPage';

export const App = () => {
  const location = useLocation();

  const sidebarItems = [
    { label: 'ダッシュボード', to: '/' },
    { label: '復習テスト', to: '/exam/questions' },
    { label: '漢字テスト', to: '/exam/kanji' },
    { label: '教材管理', to: '/materials' },
    { label: '漢字管理', to: '/kanji' },
    { label: '問題検索', to: '/search/questions' },
    { label: '設定', to: '/settings/pdf' },
  ];

  const pageTitle = (() => {
    const rules: Array<{ pattern: string; title: string }> = [
      { pattern: '/', title: 'ダッシュボード' },

      { pattern: '/materials', title: '教材管理' },
      { pattern: '/materials/new', title: '教材セット登録' },
      { pattern: '/materials/:id/questions', title: '教材問題管理' },
      { pattern: '/materials/:id', title: '教材詳細管理' },

      { pattern: '/exam/questions', title: '復習テスト一覧' },
      { pattern: '/exam/questions/new', title: '復習テスト作成' },
      { pattern: '/exam/questions/:id/grading', title: '復習テスト採点' },
      { pattern: '/exam/questions/:id/pdf', title: '復習テスト印刷' },
      { pattern: '/exam/questions/:id', title: '復習テスト詳細' },

      { pattern: '/exam/kanji', title: '漢字テスト一覧' },
      { pattern: '/exam/kanji/new', title: '漢字テスト作成' },
      { pattern: '/exam/kanji/:id/grading', title: '復習テスト採点' },
      { pattern: '/exam/kanji/:id/pdf', title: '復習テスト印刷' },
      { pattern: '/exam/kanji/:id', title: '復習テスト詳細' },

      { pattern: '/kanji', title: '漢字管理' },
      { pattern: '/kanji/new', title: '漢字登録' },
      { pattern: '/kanji/import', title: '漢字一括登録' },
      { pattern: '/kanji/:id', title: '漢字編集' },

      { pattern: '/search/questions', title: '問題検索' },
      { pattern: '/settings/pdf', title: 'PDF設定' },
    ];

    const matched = rules.find((rule) => matchPath({ path: rule.pattern, end: true }, location.pathname));
    return matched?.title;
  })();

  return (
    <AppLayout title="Smart Exam" pageTitle={pageTitle} sidebarItems={sidebarItems}>
      <Toaster />
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<DashboardPage />} />

        {/* Materials */}
        <Route path="/materials" element={<MaterialSetListPage />} />
        <Route path="/materials/new" element={<MaterialSetCreatePage />} />
        <Route path="/materials/:id" element={<MaterialSetDetailPage />} />
        <Route path="/materials/:id/questions" element={<QuestionManagementPage />} />

        {/* Exam (Questions) */}
        <Route path="/exam/questions" element={<ExamQuestionListPage />} />
        <Route path="/exam/questions/new" element={<ExamQuestionCreatePage />} />
        <Route path="/exam/questions/:id" element={<ExamQuestionDetailPage />} />
        <Route path="/exam/questions/:id/grading" element={<ExamQuestionGradingPage />} />
        <Route path="/exam/questions/:id/pdf" element={<ExamQuestionPdfPage />} />

        {/* Exam (Kanji) */}
        <Route path="/exam/kanji" element={<ExamKanjiListPage />} />
        <Route path="/exam/kanji/new" element={<ExamKanjiCreatePage />} />
        <Route path="/exam/kanji/:id" element={<ExamKanjiDetailPage />} />
        <Route path="/exam/kanji/:id/grading" element={<ExamKanjiGradingPage />} />
        <Route path="/exam/kanji/:id/pdf" element={<ExamKanjiPdfPage />} />

        {/* Kanji Management */}
        <Route path="/kanji" element={<KanjiListPage />} />
        <Route path="/kanji/new" element={<KanjiCreatePage />} />
        <Route path="/kanji/import" element={<KanjiImportPage />} />
        <Route path="/kanji/:id" element={<KanjiCreatePage />} />

        {/* Search */}
        <Route path="/search/questions" element={<QuestionSearchPage />} />

        {/* Settings */}
        <Route path="/settings/pdf" element={<PdfSettingsPage />} />
      </Routes>
    </AppLayout>
  );
};
