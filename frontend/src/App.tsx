import { AppLayout } from '@/components/layout/AppLayout'
import { Route, Routes } from 'react-router-dom'
import { WordTestPage } from '@/features/wordtest/WordTestPage'
import { WordTestDetailPage } from '@/features/wordtest/WordTestDetailPage'
import { WordTestGradingPage } from '@/features/wordtest/WordTestGradingPage'

export function App() {
  const sidebarItems = [
    { label: 'ダッシュボード', to: '/' },
    { label: '単語テスト', to: '/wordtest' },
  ]

  return (
    <AppLayout title="Smart Exam" sidebarItems={sidebarItems}>
      <Routes>
        <Route
          path="/"
          element={
            <div className="space-y-2">
              <h1 className="text-lg font-semibold text-stone-900">
                ダッシュボード
              </h1>
              <p className="text-sm text-stone-700">
                左メニューから機能を選択してください。
              </p>
            </div>
          }
        />
        <Route path="/wordtest" element={<WordTestPage />} />
        <Route path="/wordtest/:wordtestid" element={<WordTestDetailPage />} />
        <Route
          path="/wordtest/:wordtestid/grading"
          element={<WordTestGradingPage />}
        />
      </Routes>
    </AppLayout>
  )
}
