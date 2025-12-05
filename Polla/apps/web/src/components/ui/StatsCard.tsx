import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  children: React.ReactNode;
}

export function StatsCard({ title, children }: StatsCardProps) {
  return (
    <Card className="bg-carbon border border-gray-700 rounded-lg p-6 hover:border-signal hover:-translate-y-0.5 transition-transform">
      <CardHeader>
        <CardTitle className="text-tactical uppercase">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
