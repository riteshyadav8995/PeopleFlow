import { Search, Filter, RefreshCw } from 'lucide-react';

export function LeaveFilterBar({ filters, onFilterChange, onReset }: { filters: any, onFilterChange: (k: string, v: string) => void, onReset: () => void }) {
  return (
    <div className="leave-filter-bar mb-6">
      <div className="leave-search">
        <Search size={16} className="leave-search-icon" />
        <input 
          type="text" 
          placeholder="Search employee by name..." 
          className="leave-search-input"
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
      </div>
      
      <div className="flex items-center gap-3 ml-auto flex-wrap">
        <select 
          className="leave-filter-select"
          value={filters.department}
          onChange={(e) => onFilterChange('department', e.target.value)}
        >
          <option value="">Department (All)</option>
          <option value="engineering">Engineering</option>
          <option value="design">Design</option>
          <option value="hr">HR</option>
        </select>
        
        <select 
          className="leave-filter-select"
          value={filters.type}
          onChange={(e) => onFilterChange('type', e.target.value)}
        >
          <option value="">Leave Type (All)</option>
          <option value="SICK">Sick Leave</option>
          <option value="CASUAL">Casual Leave</option>
          <option value="EARNED">Earned Leave</option>
        </select>
        
        <select 
          className="leave-filter-select"
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
        >
          <option value="">Status (All)</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        
        <input 
          type="date" 
          className="leave-filter-select" 
          value={filters.date}
          onChange={(e) => onFilterChange('date', e.target.value)}
        />
        
        <div className="h-6 w-px bg-slate-200 hidden md:block mx-1"></div>
        
        <button 
          className="btn btn-secondary p-2" 
          title="Reset Filters"
          onClick={onReset}
        >
          <RefreshCw size={16} />
        </button>
        <button className="btn btn-secondary">
          <Filter size={16} />
          More
        </button>
      </div>
    </div>
  );
}
