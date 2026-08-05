import { useState } from 'react';
import { Waves, MapPin, Briefcase, Clock, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const DUMMY_JOBS = [
  { id: 1, title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time' },
  { id: 2, title: 'Product Manager', department: 'Product', location: 'New York, NY', type: 'Full-time' },
  { id: 3, title: 'HR Generalist', department: 'Human Resources', location: 'London, UK', type: 'Contract' },
];

export function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-brand-600">
            <Waves size={28} />
            <span className="text-xl font-bold text-gray-900">PeopleFlow Careers</span>
          </div>
          <Button variant="secondary" onClick={() => window.location.href = '/login'}>
            Employee Login
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-brand-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold">Join our mission to transform HR</h1>
          <p className="text-xl text-brand-100 max-w-2xl mx-auto">
            We are building the future of workforce management. Discover your next career opportunity with us.
          </p>
        </div>
      </section>

      {/* Jobs List */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          
          <div className="w-full md:w-2/3 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Open Positions</h2>
            
            {DUMMY_JOBS.map(job => (
              <div 
                key={job.id} 
                onClick={() => setSelectedJob(job)}
                className={`card p-6 cursor-pointer transition-all hover:border-brand-300 hover:shadow-md ${selectedJob?.id === job.id ? 'border-brand-500 ring-1 ring-brand-500' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-brand-900">{job.title}</h3>
                    <p className="text-sm font-medium text-brand-600 mb-4">{job.department}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} /> {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase size={14} /> {job.type}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} /> Posted 2d ago
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>

          <div className="w-full md:w-1/3">
            {selectedJob ? (
              <div className="card p-6 sticky top-6 ">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedJob.title}</h3>
                <div className="flex gap-2 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
                  <span>{selectedJob.location}</span>
                  <span>•</span>
                  <span>{selectedJob.type}</span>
                </div>
                
                <div className="prose prose-sm mb-8">
                  <h4 className="font-semibold text-gray-900">About the role</h4>
                  <p className="text-gray-600">
                    We are looking for a passionate {selectedJob.title} to join our growing team. 
                    You will be responsible for building scalable solutions...
                  </p>
                </div>
                
                <Button className="w-full justify-center text-base py-3">
                  Apply Now
                </Button>
              </div>
            ) : (
              <div className="card p-6 sticky top-6 text-center text-gray-500 py-12">
                Select a job to view details and apply.
              </div>
            )}
          </div>

        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} PeopleFlow Inc. All rights reserved.
      </footer>
    </div>
  );
}
