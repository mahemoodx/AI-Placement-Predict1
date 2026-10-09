export declare function strongTopics(
  topics: { topic: string; section: string; score: number }[],
  min?: number,
): { topic: string; section: string; score: number }[];
export declare function weakTopics(
  topics: { topic: string; section: string; score: number }[],
  max?: number,
): { topic: string; section: string; score: number }[];
export declare function sectionRank(p: any): { section: string; value: number }[];
export declare function suitableRoles(p: any): string[];
export declare function suggestedCompanies(p: any): string[];
export declare function recommendations(p: any, weak: any[], strong: any[]): string[];
