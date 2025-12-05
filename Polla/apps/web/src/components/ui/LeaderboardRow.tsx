import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LeaderboardRowProps {
  rank: number;
  name: string;
  score: number;
  avatarUrl?: string;
}

export function LeaderboardRow({
  rank,
  name,
  score,
  avatarUrl,
}: LeaderboardRowProps) {
  return (
    <div className="flex items-center p-4 bg-carbon border border-gray-700 rounded-lg hover:border-signal hover:-translate-y-0.5 transition-transform">
      <div className="rank-num text-2xl font-display w-12 text-center">
        {rank}
      </div>
      <div className="flex items-center flex-grow ml-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>
        <span className="ml-4 font-bold">{name}</span>
      </div>
      <div className="score text-2xl font-display text-signal">{score}</div>
    </div>
  );
}
