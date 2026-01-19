import type { Repositories } from '@/repositories/createRepositories';
import * as BedrockDomain from '@/services/bedrock';
import * as DashboardDomain from '@/services/dashboard';
import * as KanjiDomain from '@/services/kanji';
import * as MaterialsDomain from '@/services/materials';
import * as QuestionsDomain from '@/services/questions';
import * as ReviewTestsDomain from '@/services/reviewTests';

export type Services = {
  bedrock: typeof BedrockDomain;
  dashboard: typeof DashboardDomain;
  kanji: typeof KanjiDomain;
  materials: typeof MaterialsDomain;
  questions: typeof QuestionsDomain;
  reviewTests: typeof ReviewTestsDomain;
};

// 現時点では既存のドメイン関数が module import で依存を解決しているため、
// DI の骨格だけ先に導入し、段階的に依存注入へ移行する。
export const createServices = (_repositories: Repositories): Services => {
  return {
    bedrock: BedrockDomain,
    dashboard: DashboardDomain,
    kanji: KanjiDomain,
    materials: MaterialsDomain,
    questions: QuestionsDomain,
    reviewTests: ReviewTestsDomain,
  };
};
