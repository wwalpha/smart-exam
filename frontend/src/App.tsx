import { AppLayout } from '@/components/layout/AppLayout';
import { Route, Routes } from 'react-router-dom';

// Dashboard
import { DashboardPage } from '@/pages/DashboardPage';

// Materials
import { MaterialSetListPage } from '@/pages/materials/MaterialSetListPage';
import { MaterialSetCreatePage } from '@/pages/materials/MaterialSetCreatePage';
import { MaterialSetDetailPage } from '@/pages/materials/MaterialSetDetailPage';
import { QuestionManagementPage } from '@/pages/materials/QuestionManagementPage';

// Review Tests (Questions & Kanji)
import { ReviewTestListPage } from '@/pages/review/ReviewTestListPage';
import { ReviewTestCreatePage } from '@/pages/review/ReviewTestCreatePage';
import { ReviewTestDetailPage } from '@/pages/review/ReviewTestDetailPage';
import { ReviewTestGradingPage } from '@/pages/review/ReviewTestGradingPage';
import { ReviewTestPdfPage } from '@/pages/review/ReviewTestPdfPage';

// Kanji Management
import { KanjiListPage } from '@/pages/kanji/KanjiListPage';
import { KanjiCreatePage } from '@/pages/kanji/KanjiCreatePage';
import { KanjiImportPage } from '@/pages/kanji/KanjiImportPage';

// Search
import { QuestionSearchPage } from '@/pages/search/QuestionSearchPage';

// Settings
import { PdfSettingsPage } from '@/pages/settings/PdfSettingsPage';

export const App = () => {
  const sidebarItems = [
    { label: 'ダッシュボード', to: '/' },
    { label: '教材管理', to: '/materials' },
    { label: '問題復習テスト', to: '/reviewtests/questions' },
    { label: '漢字復習テスト', to: '/reviewtests/kanji' },
    { label: '漢字管理', to: '/kanji' },
    { label: '問題検索', to: '/search/questions' },
    { label: '設定', to: '/settings/pdf' },
  ];

  return (
    <AppLayout title="Smart Exam" sidebarItems={sidebarItems}>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<DashboardPage />} />

        {/* Materials */}
        <Route path="/materials" element={<MaterialSetListPage />} />
        <Route path="/materials/new" element={<MaterialSetCreatePage />} />
        <Route path="/materials/:id" element={<MaterialSetDetailPage />} />
        <Route path="/materials/:id/questions" element={<QuestionManagementPage />} />

        {/* Review Tests (Questions) */}
        <Route path="/reviewtests/questions" element={<ReviewTestListPage />} />
        <Route path="/reviewtests/questions/new" element={<ReviewTestCreatePage />} />
        <Route path="/reviewtests/questions/:id" element={<ReviewTestDetailPage />} />
        <Route path="/reviewtests/questions/:id/grading" element={<ReviewTestGradingPage />} />
        <Route path="/reviewtests/questions/:id/pdf" element={<ReviewTestPdfPage />} />

        {/* Review Tests (Kanji) */}
        <Route path="/reviewtests/kanji" element={<ReviewTestListPage />} />
        <Route path="/reviewtests/kanji/new" element={<ReviewTestCreatePage />} />
        <Route path="/reviewtests/kanji/:id" element={<ReviewTestDetailPage />} />
        <Route path="/reviewtests/kanji/:id/grading" element={<ReviewTestGradingPage />} />
        <Route path="/reviewtests/kanji/:id/pdf" element={<ReviewTestPdfPage />} />

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
}
