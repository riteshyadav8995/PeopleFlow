import React from 'react';
import { Card } from '../ui/Card';
import { DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';

export function PayslipWidget({ payslips }: { payslips: any[] }) {
  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-brand-50 rounded-lg">
          <DollarSign className="w-5 h-5 text-brand-600" />
        </div>
        <h3 className="font-semibold text-heading">Recent Payslips</h3>
      </div>

      <div className="flex-1 space-y-3">
        {payslips && payslips.length > 0 ? (
          payslips.slice(0, 3).map((p, i) => (
            <div key={i} className="flex items-center justify-between widget-box">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="w-4 h-4 text-subtle" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-heading">Payslip - {p.month} {p.year}</h4>
                  <p className="text-xs text-subtle font-medium">Net: ${p.netSalary}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                p.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {p.status}
              </span>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-subtle">
            <p className="text-sm">No recent payslips.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
