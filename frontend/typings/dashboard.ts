export type DashboardData = {
  todayTestCount: number;
  topIncorrectQuestions: {
    id: string;
    displayLabel: string;
    incorrectRate: number;
    subject: string;
  }[];
  lockedCount: number;
  inventoryCount: number;
};
