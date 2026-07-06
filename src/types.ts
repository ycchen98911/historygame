export interface HistoricalEvent {
  id: string;
  title: string;
  period: string;
  year: number;
  yearText: string;
  description: string;
  iconName: 'Castle' | 'Flag' | 'Scroll' | 'Train';
  color: {
    bg: string;
    border: string;
    text: string;
    accent: string;
    lightBg: string;
  };
  keyFacts: string[];
}
