import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function MatchCard() {
  return (
    <Card className="match-card bg-carbon border border-gray-700 rounded-lg p-6 hover:border-signal hover:-translate-y-0.5 transition-transform">
      <div className="match-header text-sm text-tactical mb-4">
        <span className="live-dot animate-blink inline-block w-2 h-2 bg-signal rounded-full mr-2"></span>
        En Vivo
      </div>
      <div className="score-board text-3xl font-display flex justify-between items-center mb-4">
        <span>BRA</span>
        <span className="text-signal">2 - 1</span>
        <span>ARG</span>
      </div>
      <div className="input-group">
        <Input
          type="text"
          className="input-field bg-obsidian border border-gray-700 text-white font-display text-lg text-center rounded-md focus:border-signal focus:outline-none"
        />
      </div>
    </Card>
  );
}
