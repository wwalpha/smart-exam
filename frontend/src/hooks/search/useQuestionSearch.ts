import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiRequest } from '@/services/apiClient';

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
    try {
      const response = await apiRequest<SearchResult[]>({
        method: 'GET',
        path: '/api/questions/search',
      });
      setResults(response);
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  });

  return {
    results,
    isSearching,
    form,
    submit,
  };
};
