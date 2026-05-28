export interface ILeaderboardQuery {
  period?: 'all' | 'weekly' | 'monthly';
  limit?: number;
}

export interface ILeaderboardEntry {
  rank: number;
  _id: string;
  name: string;
  avatar?: string;
  totalPoints?: number;
  completedCourses?: number;
  totalTestsTaken?: number;
  streak?: number;
  totalScore?: number;
  testsCompleted?: number;
  avgPercentage?: number;
}

export interface ILeaderboardResponse {
  leaderboard: ILeaderboardEntry[];
  userRank: { rank: number; points: number } | null;
  period: string;
}
