import { useEffect, useRef } from 'react'
import { useWordTestStore } from '@/stores'

export function useWordTestPage() {
  const datas = useWordTestStore((s) => s.wordtest.datas)
  const status = useWordTestStore((s) => s.wordtest.status)
  const fetchWordTests = useWordTestStore((s) => s.fetchWordTests)
  const hasRequestedRef = useRef(false)

  useEffect(() => {
    // 一覧は初回表示で取得できれば十分なので、同一マウント中の再取得は避ける
    // StrictMode 等で effect が複数回走っても API を多重呼び出ししないため
    if (hasRequestedRef.current) return
    hasRequestedRef.current = true

    // 画面側で await しないため Promise を握りつぶす
    void fetchWordTests()
  }, [fetchWordTests])

  return {
    datas,
    isLoading: status.isLoading,
    error: status.error,
  }
}
