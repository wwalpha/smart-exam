export type DashboardData = {
  todayTestCount: number;
  topIncorrectQuestions: {
    id: string;
    displayLabel: string;
    incorrectRate: number;
    subject: string;
  }[];
  topIncorrectKanji: {
    id: string;
    kanji: string;
    subject: string;
    lastIncorrectAt: string;
  }[];
  lockedCount: number;
  inventoryCount: number;
};
