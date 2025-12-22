import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useWordTestStore } from '@/stores';
import { getUploadUrl, uploadFileToS3 } from '@/services/examApi';
import { SUBJECT_LABEL } from '@/lib/Consts';

type FormValues = {
  grade: string;
  subject: string;
  category: string;
  name: string;
  questionFile: FileList;
  answerFile: FileList;
};

export function ExamPapersPage() {
  const { papers } = useWordTestStore((s) => s.exam);
  const fetchExamPapers = useWordTestStore((s) => s.fetchExamPapers);
  const createExamPaper = useWordTestStore((s) => s.createExamPaper);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    fetchExamPapers();
  }, [fetchExamPapers]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Upload Question PDF
      const qFile = data.questionFile[0];
      const qUpload = await getUploadUrl(qFile.name, qFile.type);
      await uploadFileToS3(qUpload.url, qFile);

      // Upload Answer PDF
      const aFile = data.answerFile[0];
      const aUpload = await getUploadUrl(aFile.name, aFile.type);
      await uploadFileToS3(aUpload.url, aFile);

      // Create Paper Record
      await createExamPaper({
        grade: data.grade,
        subject: data.subject,
        category: data.category,
        name: data.name,
        question_pdf_key: qUpload.key,
        answer_pdf_key: aUpload.key,
      });
      reset();
    } catch (e) {
      console.error(e);
      alert('登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">試験問題管理</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border border-amber-200 rounded bg-white">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">学年</label>
            <input
              {...register('grade', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              placeholder="例: 4年"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">科目</label>
            <select
              {...register('subject', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              placeholder="例: Daily"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">回数/名前</label>
            <input
              {...register('name', { required: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              placeholder="例: No.10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">問題用紙 (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              {...register('questionFile', { required: true })}
              className="mt-1 block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">解答用紙 (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              {...register('answerFile', { required: true })}
              className="mt-1 block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            />
          </div>
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
                学年/科目
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                カテゴリ/回
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                登録日
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-amber-200">
            {papers.map((paper) => (
              <tr key={paper.paper_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                  {paper.grade} / {SUBJECT_LABEL[paper.subject as keyof typeof SUBJECT_LABEL]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                  {paper.category} - {paper.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                  {new Date(paper.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
