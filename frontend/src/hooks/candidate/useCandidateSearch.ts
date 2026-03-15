import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { EXAM_MODE, type CandidateSearchRequest, type CandidateSearchResult } from '@smart-exam/api-types';
import { candidateSearch } from '@/services/candidateApi';
import type { WordTestSubject } from '@typings/wordtest';
import { SUBJECT } from '@/lib/Consts';

type SearchFormValues = {
  subject: 'ALL' | WordTestSubject | 'KANJI';
  kanjiSubject: typeof SUBJECT.japanese | typeof SUBJECT.society;
  nextTime: string;
};

export const useCandidateSearch = () => {
  const [results, setResults] = useState<CandidateSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const form = useForm<SearchFormValues>({
    defaultValues: {
      subject: 'ALL',
      kanjiSubject: SUBJECT.japanese,
      nextTime: getTodayYmd(),
    },
  });
  const { handleSubmit } = form;

  const submit = handleSubmit(async (data) => {
    setIsSearching(true);
    try {
      const body: CandidateSearchRequest = buildSearchRequest(data);

      const response = await candidateSearch(body);
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

const buildSearchRequest = (data: SearchFormValues): CandidateSearchRequest => {
  if (data.subject === 'KANJI') {
    return {
      mode: EXAM_MODE.KANJI,
      subject: data.kanjiSubject,
      nextTime: data.nextTime || undefined,
    };
  }

  if (data.subject === 'ALL') {
    return {
      nextTime: data.nextTime || undefined,
    };
  }

  return {
    mode: EXAM_MODE.MATERIAL,
    subject: data.subject,
    nextTime: data.nextTime || undefined,
  };
};

const getTodayYmd = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
