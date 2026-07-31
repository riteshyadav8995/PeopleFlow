import { MoreVertical, Calendar } from 'lucide-react';

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];

const DUMMY_CANDIDATES = [
  { id: 1, name: 'Alice Smith', role: 'Frontend Engineer', stage: 'Applied', date: '2d ago' },
  { id: 2, name: 'Bob Jones', role: 'Backend Engineer', stage: 'Screening', date: '1d ago' },
  { id: 3, name: 'Charlie Brown', role: 'Product Manager', stage: 'Interview', date: '3h ago' },
  { id: 4, name: 'Diana Prince', role: 'UX Designer', stage: 'Offer', date: '1w ago' }
];

export function CandidateKanban() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[600px]">
      {STAGES.map(stage => {
        const candidates = DUMMY_CANDIDATES.filter(c => c.stage === stage);
        return (
          <div key={stage} className="flex-1 min-w-[280px] bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">{stage}</h3>
              <span className="bg-gray-200 text-gray-700 text-xs py-1 px-2 rounded-full font-medium">
                {candidates.length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {candidates.map(candidate => (
                <div key={candidate.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-brand-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{candidate.role}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={12} />
                    <span>Applied {candidate.date}</span>
                  </div>
                </div>
              ))}
              {candidates.length === 0 && (
                <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                  Drag candidates here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
