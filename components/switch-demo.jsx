'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';

/**
 * Switch Demo Component
 *
 * This is a CLIENT COMPONENT (notice 'use client' at top)
 * Why? Because Switch needs interactivity (onChange, state)
 *
 * Client Components:
 * - Can use React hooks (useState, useEffect, etc.)
 * - Can handle events (onClick, onChange, etc.)
 * - Run in the browser
 */
export function SwitchDemo() {
  const [enabled, setEnabled] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="space-y-4">
      {/* Example 1: Simple Switch */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <div className="font-medium">Enable Feature</div>
          <div className="text-sm text-gray-600">Turn this feature on or off</div>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {/* Example 2: Notifications Switch */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <div className="font-medium">Notifications</div>
          <div className="text-sm text-gray-600">
            {notifications ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        <Switch checked={notifications} onCheckedChange={setNotifications} />
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          💡 <strong>State:</strong> enabled = {enabled.toString()}, notifications = {notifications.toString()}
        </p>
      </div>
    </div>
  );
}
