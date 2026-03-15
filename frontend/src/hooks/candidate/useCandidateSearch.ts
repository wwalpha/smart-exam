import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { EXAM_MODE, type CandidateSearchRequest, type CandidateSearchResult } from '@smart-exam/api-types';
import { candidateSearch } from '@/services/candidateApi';
import type { WordTestSubject } from '@typings/wordtest';
import { CANDIDATE_SEARCH_PAGE_SIZE, SEARCH_SUBJECT_OPTION, SUBJECT } from '@/lib/Consts';

type SearchFormValues = {
  subject: SearchSubjectValue;
  kanjiSubject: typeof SUBJECT.japanese | typeof SUBJECT.society;
  nextTime: string;
};

type SearchSubjectValue = typeof SEARCH_SUBJECT_OPTION.all | WordTestSubject | typeof SEARCH_SUBJECT_OPTION.kanji;
type KanjiSubjectValue = typeof SUBJECT.japanese | typeof SUBJECT.society;

export const useCandidateSearch = () => {
  const [results, setResults] = useState<CandidateSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const form = useForm<SearchFormValues>({
    defaultValues: {
      subject: SEARCH_SUBJECT_OPTION.all,
      kanjiSubject: SUBJECT.japanese,
      nextTime: getTodayYmd(),
    },
  });
  const { handleSubmit } = form;
  const selectedSubject = form.watch('subject');
  const selectedKanjiSubject = form.watch('kanjiSubject');
  const totalPages = Math.max(1, Math.ceil(results.length / CANDIDATE_SEARCH_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const isKanjiSelected = selectedSubject === SEARCH_SUBJECT_OPTION.kanji;

  const pagedResults = useMemo(() => {
    const start = (currentPage - 1) * CANDIDATE_SEARCH_PAGE_SIZE;
    return results.slice(start, start + CANDIDATE_SEARCH_PAGE_SIZE);
  }, [currentPage, results]);

  const submit = handleSubmit(async (data) => {
    setIsSearching(true);
    try {
      const body: CandidateSearchRequest = buildSearchRequest(data);

      const response = await candidateSearch(body);
      setPage(1);
      setResults(response.datas);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  });

  return {
    results: pagedResults,
    selectedSubject,
    selectedKanjiSubject,
    isKanjiSelected,
    currentPage,
    totalPages,
    hasResults: results.length > 0,
    goToPreviousPage: () => setPage((current) => Math.max(1, current - 1)),
    goToNextPage: () => setPage((current) => Math.min(totalPages, current + 1)),
    handleSubjectChange: (subject: SearchSubjectValue) => form.setValue('subject', subject),
    handleKanjiSubjectChange: (subject: KanjiSubjectValue) => form.setValue('kanjiSubject', subject),
    isSearching,
    form,
    submit,
  };
};

const buildSearchRequest = (data: SearchFormValues): CandidateSearchRequest => {
  if (data.subject === SEARCH_SUBJECT_OPTION.kanji) {
    return {
      mode: EXAM_MODE.KANJI,
      subject: data.kanjiSubject,
      nextTime: data.nextTime || undefined,
    };
  }

  if (data.subject === SEARCH_SUBJECT_OPTION.all) {
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
