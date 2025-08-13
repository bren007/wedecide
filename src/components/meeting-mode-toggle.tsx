
'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScreenShare } from 'lucide-react';

export function MeetingModeToggle({
  isEnabled,
  onToggle,
}: {
  isEnabled: boolean;
  onToggle: (isEnabled: boolean) => void;
}) {
  return (
    <div className="flex items-center space-x-2">
      <ScreenShare className="h-5 w-5 text-muted-foreground" />
      <Label htmlFor="meeting-mode-toggle">Meeting Mode</Label>
      <Switch
        id="meeting-mode-toggle"
        checked={isEnabled}
        onCheckedChange={onToggle}
        aria-label="Toggle meeting mode"
      />
    </div>
  );
}
