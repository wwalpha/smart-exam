import { useState } from 'react';
import { useForm } from 'react-hook-form';

type SearchResult = {
  id: string;
  subject: string;
  unit: string;
  questionText: string;
  sourceMaterialId: string;
  sourceMaterialName: string;
};

type SearchFormValues = {
  keyword: string;
  subject: string;
};

export const useQuestionSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const form = useForm<SearchFormValues>();
  const { handleSubmit } = form;

  const submit = handleSubmit(async (_data) => {
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setResults([
        {
          id: '1',
          subject: '算数',
          unit: '速さ',
          questionText: '時速4kmで2時間歩くと何km進みますか？',
          sourceMaterialId: 'm1',
          sourceMaterialName: '第1回 週テスト',
        },
        {
          id: '2',
          subject: '理科',
          unit: '植物',
          questionText: '光合成に必要なものは何ですか？',
          sourceMaterialId: 'm2',
          sourceMaterialName: '第2回 週テスト',
        },
      ]);
      setIsSearching(false);
    }, 500);
  });

  return {
    results,
    isSearching,
    form,
    submit,
  };
};
