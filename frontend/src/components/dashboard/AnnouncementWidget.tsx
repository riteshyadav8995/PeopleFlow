import React from 'react';
import { Card } from '../ui/Card';
import { Megaphone, AlertCircle } from 'lucide-react';

export function AnnouncementWidget({ announcements }: { announcements: any[] }) {
  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-brand-50 rounded-lg">
          <Megaphone className="w-5 h-5 text-brand-600" />
        </div>
        <h3 className="font-semibold text-heading">Company Announcements</h3>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {announcements && announcements.length > 0 ? (
          announcements.map((a, i) => (
            <div key={i} className="widget-box relative overflow-hidden group">
              {a.priority === 'HIGH' && (
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
              )}
              {a.priority === 'HIGH' && (
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-red-600 mb-2">
                  <AlertCircle className="w-3 h-3" /> Urgent
                </div>
              )}
              <h4 className="font-medium text-heading mb-1">{a.title}</h4>
              <p className="text-sm text-subtle line-clamp-2">{a.content}</p>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-subtle">
            <p className="text-sm">No recent announcements.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
