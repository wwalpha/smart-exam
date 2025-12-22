import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import { SUBJECT_LABEL } from '@/lib/Consts';
import { getUploadUrl, uploadFileToS3 } from '@/services/examApi';

type FormValues = {
  grade: string;
  subject: string;
  category: string;
  name: string;
  title: string;
  test_date: string;
  gradedFile: FileList;
  details: { number: number; is_correct: boolean }[];
};

export function ExamResultsPage() {
  const { results, papers } = useWordTestStore((s) => s.exam);
  const fetchExamResults = useWordTestStore((s) => s.fetchExamResults);
  const fetchExamPapers = useWordTestStore((s) => s.fetchExamPapers);
  const createExamResult = useWordTestStore((s) => s.createExamResult);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      details: Array.from({ length: 10 }).map((_, i) => ({ number: i + 1, is_correct: false })),
    },
  });

  const { fields, append } = useFieldArray({
    control,
    name: 'details',
  });

  useEffect(() => {
    fetchExamResults();
    fetchExamPapers();
  }, [fetchExamResults, fetchExamPapers]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      let gradedPdfKey = undefined;
      if (data.gradedFile && data.gradedFile.length > 0) {
        const file = data.gradedFile[0];
        const upload = await getUploadUrl(file.name, file.type);
        await uploadFileToS3(upload.url, file);
        gradedPdfKey = upload.key;
      }

      await createExamResult({
        ...data,
        graded_pdf_key: gradedPdfKey,
        details: data.details.map((d) => ({ ...d, is_correct: Boolean(d.is_correct) })),
      });
      reset();
    } catch (e) {
      console.error(e);
      alert('登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPaperLink = (result: (typeof results)[0]) => {
    const paper = papers.find(
      (p) =>
        p.grade === result.grade &&
        p.subject === result.subject &&
        p.category === result.category &&
        p.name === result.name
    );
    return paper;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">試験結果管理</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border border-amber-200 rounded bg-white">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">タイトル</label>
            <input
              {...register('title', { required: true })}
              className="mt-1 block w-full border p-2 rounded"
              placeholder="例: 初回挑戦"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">実施日</label>
            <input
              type="date"
              {...register('test_date', { required: true })}
              className="mt-1 block w-full border p-2 rounded"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-stone-700">採点済み回答用紙 (PDF)</label>
            <input
              type="file"
              accept="application/pdf"
              {...register('gradedFile')}
              className="mt-1 block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">学年</label>
            <input
              {...register('grade', { required: true })}
              className="mt-1 block w-full border p-2 rounded"
              placeholder="例: 4年"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">科目</label>
            <select {...register('subject', { required: true })} className="mt-1 block w-full border p-2 rounded">
              {Object.entries(SUBJECT_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">カテゴリ</label>
            <input
              {...register('category', { required: true })}
              className="mt-1 block w-full border p-2 rounded"
              placeholder="例: Daily"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">回数/名前</label>
            <input
              {...register('name', { required: true })}
              className="mt-1 block w-full border p-2 rounded"
              placeholder="例: No.10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-stone-700">解答状況</label>
          <div className="grid grid-cols-5 gap-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2 border p-2 rounded">
                <span className="text-sm font-bold">{index + 1}.</span>
                <label className="flex items-center space-x-1">
                  <input type="checkbox" {...register(`details.${index}.is_correct`)} />
                  <span className="text-sm">正解</span>
                </label>
                <input type="hidden" {...register(`details.${index}.number`)} value={index + 1} />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => append({ number: fields.length + 1, is_correct: false })}
            className="text-sm text-blue-600 hover:underline">
            + 問題を追加
          </button>
        </div>

        <button
          disabled={isSubmitting}
          type="submit"
          className="bg-rose-700 text-white px-4 py-2 rounded hover:bg-rose-800 disabled:opacity-50">
          {isSubmitting ? '送信中...' : '登録'}
        </button>
      </form>

      <div className="bg-white rounded border border-amber-200 overflow-hidden">
        <table className="min-w-full divide-y divide-amber-200">
          <thead className="bg-amber-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                実施日/タイトル
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                テスト情報
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                正答率
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                リンク
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-amber-200">
            {results.map((result) => {
              const paper = getPaperLink(result);
              const correctCount = result.details.filter((d) => d.is_correct).length;
              const totalCount = result.details.length;
              const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

              return (
                <tr key={result.result_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-stone-900">{result.title}</div>
                    <div className="text-sm text-stone-500">{result.test_date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                    {result.grade} / {SUBJECT_LABEL[result.subject as keyof typeof SUBJECT_LABEL]}
                    <br />
                    {result.category} - {result.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                    {correctCount}/{totalCount} ({percentage}%)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    {paper && (
                      <div className="flex flex-col space-y-1">
                        {paper.question_pdf_key && <span>問題用紙(あり)</span>}
                        {paper.answer_pdf_key && <span>解答用紙(あり)</span>}
                      </div>
                    )}
                    {result.graded_pdf_key && (
                      <div className="mt-1">
                        <span className="text-rose-600 font-medium">採点済回答(あり)</span>
                      </div>
                    )}
                    {!paper && !result.graded_pdf_key && <span className="text-stone-400">リンクなし</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
