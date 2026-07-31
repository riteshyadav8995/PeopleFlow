import React from 'react';
import { Card } from '../ui/Card';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function NotificationWidget({ 
  notifications, 
  onMarkRead 
}: { 
  notifications: any[];
  onMarkRead: (id: string) => void;
}) {
  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-brand-50 rounded-lg relative">
          <Bell className="w-5 h-5 text-brand-600" />
          {notifications?.length > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </div>
        <h3 className="font-semibold text-heading">Notifications</h3>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {notifications && notifications.length > 0 ? (
          notifications.map((n, i) => (
            <div key={i} className="widget-box flex gap-3 group">
              <div className="mt-0.5">
                <div className={`w-2 h-2 rounded-full ${n.type === 'SUCCESS' ? 'bg-green-500' : n.type === 'WARNING' ? 'bg-yellow-500' : n.type === 'ALERT' ? 'bg-red-500' : 'bg-brand-500'}`}></div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-heading mb-0.5 truncate">{n.title}</h4>
                <p className="text-xs text-subtle line-clamp-2">{n.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-subtle font-medium">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                  <div className="flex gap-2">
                    {n.link && (
                      <button className="text-[10px] text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                        View <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    <button 
                      onClick={() => onMarkRead(n.id)}
                      className="text-[10px] text-subtle hover:text-heading font-medium flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-subtle">
            <Bell className="w-8 h-8 mb-3 opacity-20" />
            <p className="text-sm">You're all caught up!</p>
          </div>
        )}
      </div>
    </Card>
  );
}
