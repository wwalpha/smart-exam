import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiRequest } from '@/services/apiClient';
import type { QuestionSearchResult, SearchQuestionsRequest, SearchQuestionsResponse } from '@smart-exam/api-types';
import type { WordTestSubject } from '@typings/wordtest';

type SearchFormValues = {
  keyword: string;
  subject: 'ALL' | WordTestSubject;
};

export const useQuestionSearch = () => {
  const [results, setResults] = useState<QuestionSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const form = useForm<SearchFormValues>();
  const { handleSubmit } = form;

  const submit = handleSubmit(async (data) => {
    setIsSearching(true);
    try {
      const body: SearchQuestionsRequest = {
        keyword: data.keyword || undefined,
        subject: data.subject && data.subject !== 'ALL' ? data.subject : undefined,
      };

      const response = await apiRequest<SearchQuestionsResponse, SearchQuestionsRequest>({
        method: 'POST',
        path: '/api/questions/search',
        body,
      });
      setResults(response.datas);
    } catch (error) {
      console.error(error);
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
