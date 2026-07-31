import React from 'react';
import { Card } from '../ui/Card';
import { FileText, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function DocumentWidget({ documents }: { documents: any[] }) {
  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-50 rounded-lg">
            <FileText className="w-5 h-5 text-brand-600" />
          </div>
          <h3 className="font-semibold text-heading">Recent Documents</h3>
        </div>
        <button className="text-xs font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
          View All
        </button>
      </div>

      <div className="flex-1 space-y-3">
        {documents && documents.length > 0 ? (
          documents.map((d, i) => (
            <div key={i} className="flex items-center justify-between widget-box widget-box-hoverable group">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="w-4 h-4 text-subtle" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-heading truncate group-hover:text-brand-600 transition-colors">{d.name}</h4>
                  <p className="text-[10px] text-subtle">{d.type} • {formatDistanceToNow(new Date(d.uploadDate), { addSuffix: true })}</p>
                </div>
              </div>
              <button className="p-2 text-subtle hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-subtle">
            <p className="text-sm">No documents found.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
