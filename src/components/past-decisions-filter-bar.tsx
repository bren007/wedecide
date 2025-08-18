
'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Objective } from '@/lib/types';
import { Calendar as CalendarIcon } from 'lucide-react';

export function PastDecisionsFilterBar({ objectives }: { objectives: Objective[] }) {
    const decisionTypes = ['Approved', 'Endorsed', 'Noted', 'Not Approved'];

    return (
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <Select>
                <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter by objective..." />
                </SelectTrigger>
                <SelectContent>
                    {objectives.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by type..." />
                </SelectTrigger>
                <SelectContent>
                    {decisionTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
            </Select>
            <Button variant="outline" className="w-full md:w-auto" disabled>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Filter by date
            </Button>
        </div>
    );
}
