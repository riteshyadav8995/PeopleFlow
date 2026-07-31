import React from 'react';
import { Card } from '../ui/Card';
import { Calendar, Umbrella, Plus } from 'lucide-react';
import { format } from 'date-fns';

export function LeaveWidget({ balances, holidays }: { balances: any[]; holidays: any[] }) {
  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-50 rounded-lg">
            <Umbrella className="w-5 h-5 text-brand-600" />
          </div>
          <h3 className="font-semibold text-heading">Time Off</h3>
        </div>
        <button className="text-xs font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
          <Plus className="w-3 h-3" /> Apply
        </button>
      </div>

      <div className="space-y-4 flex-1">
        <div>
          <h4 className="text-xs uppercase tracking-wider text-subtle font-semibold mb-3">Balances</h4>
          {balances && balances.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {balances.slice(0, 4).map((b, i) => (
                <div key={i} className="widget-box flex flex-col items-center justify-center text-center py-4">
                  <span className="text-xl font-bold text-heading">{b.balance}</span>
                  <span className="text-[10px] text-subtle uppercase tracking-wide mt-1">{b.leaveType?.name || 'Leave'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-subtle italic">No leave balances found.</p>
          )}
        </div>

        <div className="pt-2">
          <h4 className="text-xs uppercase tracking-wider text-subtle font-semibold mb-3 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Upcoming Holidays
          </h4>
          <div className="space-y-2">
            {holidays && holidays.length > 0 ? (
              holidays.map((h, i) => (
                <div key={i} className="flex items-center justify-between widget-box">
                  <span className="text-sm text-body">{h.name}</span>
                  <span className="text-xs text-brand-600 font-medium bg-brand-50 px-2 py-1 rounded-md">
                    {format(new Date(h.date), 'MMM dd')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-subtle italic">No upcoming holidays.</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
