import React from 'react';
import { Card } from '../ui/Card';
import { Video, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, isToday } from 'date-fns';

export function MeetingWidget({ meetings }: { meetings: any[] }) {
  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-brand-50 rounded-lg">
          <Video className="w-5 h-5 text-brand-600" />
        </div>
        <h3 className="font-semibold text-heading">Today's Meetings</h3>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {meetings && meetings.length > 0 ? (
          meetings.map((m, i) => {
            const start = new Date(m.startTime);
            const end = new Date(m.endTime);
            return (
              <div key={i} className="widget-box widget-box-hoverable p-3.5 group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-heading group-hover:text-brand-600 transition-colors">{m.title}</h4>
                  {isToday(start) && (
                    <span className="flex h-2 w-2 mt-1.5">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-subtle mb-3">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {format(start, 'hh:mm a')} - {format(end, 'hh:mm a')}</span>
                </div>
                {m.meetLink && (
                  <a 
                    href={m.meetLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-full py-2 bg-brand-50 text-brand-600 rounded-lg text-xs font-medium hover:bg-brand-100 transition-colors"
                  >
                    Join Meeting
                  </a>
                )}
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-subtle">
            <CalendarIcon className="w-8 h-8 mb-3 opacity-20" />
            <p className="text-sm">No meetings scheduled for today.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
