import { Outlet } from 'react-router-dom';
import { Waves, CheckCircle2 } from 'lucide-react';
import './AuthLayout.css';

export function AuthLayout() {
  return (
    <div className="auth-container animate-fade-in">
      {/* Left Side: Branding / Company Info */}
      <div className="auth-brand-side">
        <div className="auth-brand-content">
          <div className="auth-logo-large">
            <Waves size={48} />
            <span>PeopleFlow</span>
          </div>
          <h1 className="auth-tagline">
            The modern way to manage your workforce
          </h1>
          <p className="auth-description">
            Streamline your HR processes, manage attendance, handle payroll, and track team performance all in one beautiful, intuitive platform.
          </p>
          
          <div className="auth-features">
            <div className="auth-feature">
              <CheckCircle2 size={24} className="feature-icon" />
              <span>Automated Payroll & Payslip Generator</span>
            </div>
            <div className="auth-feature">
              <CheckCircle2 size={24} className="feature-icon" />
              <span>Recruitment & Onboarding Portal</span>
            </div>
            <div className="auth-feature">
              <CheckCircle2 size={24} className="feature-icon" />
              <span>AI Voice Calling Agent</span>
            </div>
            <div className="auth-feature">
              <CheckCircle2 size={24} className="feature-icon" />
              <span>Project, Task & Team Collaboration</span>
            </div>
          </div>
        </div>
        <div className="auth-brand-bg-pattern"></div>
      </div>

      {/* Right Side: Form */}
      <div className="auth-form-side">
        <div className="auth-form-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
