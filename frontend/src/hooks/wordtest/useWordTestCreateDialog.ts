import { useWordTestStore } from '@/stores'
import type { WordTestSubject } from '@typings/wordtest'

export function useWordTestCreateDialog() {
  const createWordTest = useWordTestStore((s) => s.createWordTest)

  const handleCreate = async (subject: WordTestSubject): Promise<void> => {
    // 作成後の一覧反映は store 側で行うため、この hook は作成だけを責務にする
    await createWordTest(subject)
  }

  return { createWordTest: handleCreate }
}
