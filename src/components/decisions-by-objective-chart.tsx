
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { Decision, Objective } from '@/lib/types';
import { TrendingUp } from 'lucide-react';

export function DecisionsByObjectiveChart({ decisions, objectives }: { decisions: Decision[]; objectives: Objective[] }) {
  const data = objectives.map(objective => ({
    name: objective.name,
    total: decisions.filter(d => d.objectiveId === objective.id).length,
  }));

  const chartConfig = {
    total: {
      label: 'Decisions',
      color: 'hsl(var(--chart-1))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Strategic Impact
        </CardTitle>
        <CardDescription>Number of decisions made per strategic objective.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-64 w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 20, bottom: 20 }}>
                <CartesianGrid horizontal={false} />
                 <XAxis type="number" hide />
                 <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                        fontSize: 12,
                        width: 150,
                        textAnchor: 'start',
                    }}
                    width={120}
                 />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="total" fill="var(--color-total)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
