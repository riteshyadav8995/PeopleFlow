import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/auth.store';
import { employeeService } from '../../../services/employee.service';
import { Mail, MapPin, User as UserIcon, Phone, Calendar, Briefcase, Award, GraduationCap, Building2, FileText, CreditCard, CheckCircle, Upload } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MyProfile.css';

const TABS = [
  { id: 'personal', label: 'Personal Information', icon: UserIcon },
  { id: 'job', label: 'Job Information', icon: Briefcase },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'bank', label: 'Bank Details', icon: CreditCard },
  { id: 'emergency', label: 'Emergency Contacts', icon: Phone },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'experience', label: 'Experience', icon: Building2 },
  { id: 'skills', label: 'Skills', icon: Award },
  { id: 'certifications', label: 'Certifications', icon: Award },
];

export function MyProfile() {
  const { user } = useAuthStore();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: 'Hyderabad, Telangana, India'
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const docInputRef = React.useRef<HTMLInputElement>(null);
  const [activeUploadDoc, setActiveUploadDoc] = useState<string | null>(null);

  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: ''
  });

  const [isEditingJob, setIsEditingJob] = useState(false);
  const [jobForm, setJobForm] = useState({
    manager: '',
    employmentType: ''
  });

  const [isEditingEmergency, setIsEditingEmergency] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    name: '',
    relationship: '',
    phone: ''
  });

  const [educationList, setEducationList] = useState<any[]>([]);
  const [experienceList, setExperienceList] = useState<any[]>([]);
  const [skillsList, setSkillsList] = useState<any[]>([]);
  const [certificationsList, setCertificationsList] = useState<any[]>([]);
  
  const [addingType, setAddingType] = useState<string | null>(null);
  const [dynamicForm, setDynamicForm] = useState<any>({});

  const location = useLocation();
  const navigate = useNavigate();

  // Extract active tab from URL, e.g., /employee/profile/job -> 'job'. Default to 'personal'.
  const pathParts = location.pathname.split('/');
  const tabFromUrl = pathParts[pathParts.length - 1];
  const activeTab = TABS.find(t => t.id === tabFromUrl)?.id || 'personal';

  const handleTabChange = (tabId: string) => {
    navigate(tabId === 'personal' ? '/employee/profile' : `/employee/profile/${tabId}`);
  };

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const orgId = user?.organizationId || user?.tenantId;
        if (orgId) {
          const employees = await employeeService.getEmployees(orgId);
          const currentEmployee = employees.find((e: any) => e.userId === user?.id);
          setEmployee(currentEmployee || {});
        }
      } catch (err) {
        console.error("Failed to load employee details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeeData();

    // Load avatar from localStorage
    if (user?.id) {
      setAvatarUrl(localStorage.getItem(`profilePhoto_${user.id}`));
      
      const storedBank = localStorage.getItem(`bankDetails_${user.id}`);
      if (storedBank) {
        setBankForm(JSON.parse(storedBank));
      }
      
      const storedJob = localStorage.getItem(`jobDetails_${user.id}`);
      if (storedJob) {
        setJobForm(JSON.parse(storedJob));
      }
      
      const storedEmergency = localStorage.getItem(`emergencyDetails_${user.id}`);
      if (storedEmergency) {
        setEmergencyForm(JSON.parse(storedEmergency));
      }
      
      const storedEdu = localStorage.getItem(`education_${user.id}`);
      if (storedEdu) setEducationList(JSON.parse(storedEdu));
      
      const storedExp = localStorage.getItem(`experience_${user.id}`);
      if (storedExp) setExperienceList(JSON.parse(storedExp));
      
      const storedSkills = localStorage.getItem(`skills_${user.id}`);
      if (storedSkills) setSkillsList(JSON.parse(storedSkills));
      
      const storedCerts = localStorage.getItem(`certifications_${user.id}`);
      if (storedCerts) setCertificationsList(JSON.parse(storedCerts));
    }
  }, [user]);

  useEffect(() => {
    if (employee) {
      setPersonalForm({
        phone: employee.phone || '',
        dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : '',
        gender: employee.gender || 'Male',
        address: 'Hyderabad, Telangana, India'
      });
    }
  }, [employee]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarUrl(base64String);
        if (user?.id) {
          localStorage.setItem(`profilePhoto_${user.id}`, base64String);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePersonal = async () => {
    if (!employee?.id) return;
    try {
      setLoading(true);
      const updated = await employeeService.updateEmployee(employee.id, {
        phone: personalForm.phone,
        dateOfBirth: personalForm.dateOfBirth ? new Date(personalForm.dateOfBirth).toISOString() : null,
        gender: personalForm.gender
      });
      setEmployee(updated);
      setIsEditingPersonal(false);
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const triggerUpload = (docId: string) => {
    setActiveUploadDoc(docId);
    docInputRef.current?.click();
  };

  const handleDocUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadDoc && user?.id) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem(`doc_${user.id}_${activeUploadDoc}`, base64String);
        alert('Document uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocDownload = (docId: string, defaultName: string) => {
    if (user?.id) {
      const dataUrl = localStorage.getItem(`doc_${user.id}_${docId}`);
      if (dataUrl) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = defaultName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('No document found. Please upload one first.');
      }
    }
  };

  const handleSaveBank = () => {
    if (user?.id) {
      localStorage.setItem(`bankDetails_${user.id}`, JSON.stringify(bankForm));
    }
    setIsEditingBank(false);
  };

  const handleSaveJob = () => {
    if (user?.id) {
      localStorage.setItem(`jobDetails_${user.id}`, JSON.stringify(jobForm));
    }
    setIsEditingJob(false);
  };

  const handleSaveEmergency = () => {
    if (user?.id) {
      localStorage.setItem(`emergencyDetails_${user.id}`, JSON.stringify(emergencyForm));
    }
    setIsEditingEmergency(false);
  };

  const handleSaveDynamic = (type: string) => {
    if (!user?.id) return;
    let list, setList, key;
    if (type === 'education') { list = educationList; setList = setEducationList; key = `education_${user.id}`; }
    else if (type === 'experience') { list = experienceList; setList = setExperienceList; key = `experience_${user.id}`; }
    else if (type === 'skills') { list = skillsList; setList = setSkillsList; key = `skills_${user.id}`; }
    else if (type === 'certifications') { list = certificationsList; setList = setCertificationsList; key = `certifications_${user.id}`; }
    
    if (list && setList && key) {
      const newList = [...list, { ...dynamicForm, id: Date.now() }];
      setList(newList);
      localStorage.setItem(key, JSON.stringify(newList));
    }
    setAddingType(null);
  };

  const handleDeleteDynamic = (type: string, id: number) => {
    if (!user?.id) return;
    let list, setList, key;
    if (type === 'education') { list = educationList; setList = setEducationList; key = `education_${user.id}`; }
    else if (type === 'experience') { list = experienceList; setList = setExperienceList; key = `experience_${user.id}`; }
    else if (type === 'skills') { list = skillsList; setList = setSkillsList; key = `skills_${user.id}`; }
    else if (type === 'certifications') { list = certificationsList; setList = setCertificationsList; key = `certifications_${user.id}`; }
    
    if (list && setList && key) {
      const newList = list.filter(item => item.id !== id);
      setList(newList);
      localStorage.setItem(key, JSON.stringify(newList));
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading profile...</div>;
  }

  const formatJoinDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  };

  return (
    <div className="profile-container ">

      {/* Banner */}
      <div className="profile-banner-card">
        <div className="profile-banner-bg"></div>
        <div className="profile-header-content">
          <div
            className="profile-avatar-wrapper"
            onClick={() => fileInputRef.current?.click()}
            title="Click to update profile photo"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="profile-avatar-img" />
            ) : (
              <UserIcon size={48} color="var(--gray-400)" />
            )}
            <div className="profile-avatar-overlay">Edit</div>
          </div>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarChange} />
          <input type="file" ref={docInputRef} style={{ display: 'none' }} onChange={handleDocUploadChange} />

          <div className="profile-info-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="profile-name-row">
                  <h1 className="profile-banner-name">{user?.firstName} {user?.lastName}</h1>
                  <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={12} /> Active</span>
                </div>
                <div className="profile-banner-role">
                  {employee?.designation?.title || 'Employee'} {employee?.department?.name ? ` | ${employee.department.name}` : ''}
                </div>
              </div>
            </div>

            <div className="profile-contact-row">
              <div className="profile-contact-item">
                <Mail size={16} /> {user?.email}
              </div>
              <div className="profile-contact-item">
                <MapPin size={16} /> NxtWave - Hyderabad
              </div>
              <div className="profile-contact-item">
                <Phone size={16} /> {employee?.phone || '+91-XXXXXXXXXX'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-content-card">

        {/* PERSONAL INFORMATION */}
        {activeTab === 'personal' && (
          <div className="">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Personal Information</h2>
              {!isEditingPersonal ? (
                <button className="btn-secondary" onClick={() => setIsEditingPersonal(true)}>Edit</button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-ghost" onClick={() => setIsEditingPersonal(false)}>Cancel</button>
                  <button className="btn-primary" onClick={handleSavePersonal}>Save</button>
                </div>
              )}
            </div>

            <div className="profile-data-grid">
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Full Name</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-900)', fontWeight: 500 }}>{user?.firstName} {user?.lastName}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Email Address</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-900)', fontWeight: 500 }}>{user?.email}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Phone Number</span>
                {isEditingPersonal ? (
                  <input type="text" className="form-input" value={personalForm.phone} onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })} />
                ) : (
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-900)', fontWeight: 500 }}>{employee?.phone || 'N/A'}</span>
                )}
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Date of Birth</span>
                {isEditingPersonal ? (
                  <input type="date" className="form-input" value={personalForm.dateOfBirth} onChange={e => setPersonalForm({ ...personalForm, dateOfBirth: e.target.value })} />
                ) : (
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-900)', fontWeight: 500 }}>{employee?.dateOfBirth ? formatJoinDate(employee.dateOfBirth) : 'N/A'}</span>
                )}
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Gender</span>
                {isEditingPersonal ? (
                  <select className="form-input" value={personalForm.gender} onChange={e => setPersonalForm({ ...personalForm, gender: e.target.value })}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-900)', fontWeight: 500 }}>{employee?.gender || 'N/A'}</span>
                )}
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Current Address</span>
                {isEditingPersonal ? (
                  <input type="text" className="form-input" value={personalForm.address} onChange={e => setPersonalForm({ ...personalForm, address: e.target.value })} />
                ) : (
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-900)', fontWeight: 500 }}>{personalForm.address}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* JOB INFORMATION */}
        {activeTab === 'job' && (
          <div className="">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Job Information</h2>
              {!isEditingJob ? (
                <button className="btn-secondary" onClick={() => setIsEditingJob(true)}>Update Details</button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-ghost" onClick={() => setIsEditingJob(false)}>Cancel</button>
                  <button className="btn-primary" onClick={handleSaveJob}>Save</button>
                </div>
              )}
            </div>
            <div className="profile-data-grid">
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Employee ID</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-900)', fontWeight: 500 }}>NXW-00{employee?.id || '42'}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Date Of Joining</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-900)', fontWeight: 500 }}>{formatJoinDate(employee?.dateOfJoining)}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Designation</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-900)', fontWeight: 500 }}>{employee?.designation?.title || 'N/A'}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Department</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-900)', fontWeight: 500 }}>{employee?.department?.name || 'N/A'}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Reporting Manager</span>
                {isEditingJob ? (
                  <input type="text" className="profile-input" placeholder="e.g. John Doe" value={jobForm.manager} onChange={e => setJobForm({...jobForm, manager: e.target.value})} />
                ) : (
                  <span style={{ fontSize: '0.875rem', color: 'var(--brand-600)', fontWeight: 500 }}>{jobForm.manager || 'Not assigned'}</span>
                )}
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 600, marginBottom: '0.25rem' }}>Employment Type</span>
                {isEditingJob ? (
                  <select className="profile-input" value={jobForm.employmentType} onChange={e => setJobForm({...jobForm, employmentType: e.target.value})}>
                    <option value="">Select Type</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                ) : (
                  <span style={{ fontSize: '0.875rem', color: 'var(--gray-900)', fontWeight: 500 }}>{jobForm.employmentType || 'Not specified'}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="">
            <h2 className="profile-section-title" style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>My Documents</h2>
            <div className="profile-doc-list">
              <div className="profile-doc-card">
                <div className="profile-doc-info">
                  <div className="profile-doc-icon">
                    <FileText />
                  </div>
                  <div>
                    <div className="profile-doc-name">Appointment Letter</div>
                    <div className="profile-doc-meta">PDF • Added on {formatJoinDate(employee?.dateOfJoining)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={() => handleDocDownload('appointment', 'Appointment_Letter')}>Download</button>
                  <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => triggerUpload('appointment')}>
                    <Upload size={14} /> Upload New
                  </button>
                </div>
              </div>
              <div className="profile-doc-card">
                <div className="profile-doc-info">
                  <div className="profile-doc-icon">
                    <FileText />
                  </div>
                  <div>
                    <div className="profile-doc-name">ID Proof (Aadhaar)</div>
                    <div className="profile-doc-verified">
                      <CheckCircle size={12} /> Verified
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={() => handleDocDownload('aadhaar', 'ID_Proof_Aadhaar')}>Download</button>
                  <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => triggerUpload('aadhaar')}>
                    <Upload size={14} /> Upload New
                  </button>
                </div>
              </div>
              <div className="profile-doc-card">
                <div className="profile-doc-info">
                  <div className="profile-doc-icon">
                    <FileText />
                  </div>
                  <div>
                    <div className="profile-doc-name">PAN Card</div>
                    <div className="profile-doc-verified">
                      <CheckCircle size={12} /> Verified
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={() => handleDocDownload('pan', 'PAN_Card')}>Download</button>
                  <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => triggerUpload('pan')}>
                    <Upload size={14} /> Upload New
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BANK DETAILS */}
        {activeTab === 'bank' && (
          <div className="">
              <div className="profile-section-header">
                <h2 className="profile-section-title">Bank Details</h2>
                {!isEditingBank ? (
                  <button className="btn-secondary" onClick={() => setIsEditingBank(true)}>Update Details</button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-ghost" onClick={() => setIsEditingBank(false)}>Cancel</button>
                    <button className="btn-primary" onClick={handleSaveBank}>Save</button>
                  </div>
                )}
              </div>
              
              <div className="bank-card-container">
                <div className="bank-card">
                  <div className="bank-card-header">
                    <div className="bank-card-chip"></div>
                    <div className="bank-card-logo">{bankForm.bankName || 'YOUR BANK'}</div>
                  </div>
                  <div className="bank-card-number">
                    {bankForm.accountNumber ? bankForm.accountNumber.replace(/-/g, ' ') : 'XXXX XXXX XXXX XXXX'}
                  </div>
                  <div className="bank-card-footer">
                    <div>
                      <span className="bank-card-label">Card Holder</span>
                      <div className="bank-card-value">{user?.firstName} {user?.lastName}</div>
                    </div>
                    <div>
                      <span className="bank-card-label">Valid Thru</span>
                      <div className="bank-card-value">12/28</div>
                    </div>
                  </div>
                </div>
                
                <div className="bank-details-info">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <span className="profile-data-label">Account Holder Name</span>
                        <span className="profile-data-value">{user?.firstName} {user?.lastName}</span>
                      </div>
                      <div>
                        <span className="profile-data-label">Bank Name</span>
                        {isEditingBank ? (
                          <input type="text" className="profile-input" placeholder="e.g. HDFC Bank" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} />
                        ) : (
                          <span className="profile-data-value">{bankForm.bankName || 'Not added yet'}</span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <span className="profile-data-label">Account Number</span>
                        {isEditingBank ? (
                          <input type="text" className="profile-input" placeholder="XXXX-XXXX-XXXX-1234" value={bankForm.accountNumber} onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} />
                        ) : (
                          <span className="profile-data-value" style={{ fontFamily: 'monospace' }}>{bankForm.accountNumber || 'Not added yet'}</span>
                        )}
                      </div>
                      <div>
                        <span className="profile-data-label">IFSC Code</span>
                        {isEditingBank ? (
                          <input type="text" className="profile-input" placeholder="e.g. HDFC0001234" value={bankForm.ifscCode} onChange={e => setBankForm({...bankForm, ifscCode: e.target.value})} />
                        ) : (
                          <span className="profile-data-value">{bankForm.ifscCode || 'Not added yet'}</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <span className="profile-data-label">Branch</span>
                      {isEditingBank ? (
                        <input type="text" className="profile-input" placeholder="e.g. Madhapur, Hyderabad" value={bankForm.branch} onChange={e => setBankForm({...bankForm, branch: e.target.value})} />
                      ) : (
                        <span className="profile-data-value">{bankForm.branch || 'Not added yet'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* EMERGENCY */}
        {activeTab === 'emergency' && (
          <div className="">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Emergency Contacts</h2>
              {!isEditingEmergency ? (
                <button className="btn-secondary" onClick={() => setIsEditingEmergency(true)}>Update Details</button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-ghost" onClick={() => setIsEditingEmergency(false)}>Cancel</button>
                  <button className="btn-primary" onClick={handleSaveEmergency}>Save</button>
                </div>
              )}
            </div>
            
            <div className="profile-emergency-card">
              <div className="profile-data-grid">
                <div>
                  <span className="profile-data-label">Name</span>
                  {isEditingEmergency ? (
                    <input type="text" className="profile-input" placeholder="e.g. Jane Doe" value={emergencyForm.name} onChange={e => setEmergencyForm({...emergencyForm, name: e.target.value})} />
                  ) : (
                    <span className="profile-data-value">{emergencyForm.name || 'Not added yet'}</span>
                  )}
                </div>
                <div>
                  <span className="profile-data-label">Relationship</span>
                  {isEditingEmergency ? (
                    <input type="text" className="profile-input" placeholder="e.g. Parent" value={emergencyForm.relationship} onChange={e => setEmergencyForm({...emergencyForm, relationship: e.target.value})} />
                  ) : (
                    <span className="profile-data-value">{emergencyForm.relationship || 'Not added yet'}</span>
                  )}
                </div>
                <div>
                  <span className="profile-data-label">Phone</span>
                  {isEditingEmergency ? (
                    <input type="text" className="profile-input" placeholder="+91-XXXXXXXXXX" value={emergencyForm.phone} onChange={e => setEmergencyForm({...emergencyForm, phone: e.target.value})} />
                  ) : (
                    <span className="profile-data-value">{emergencyForm.phone || 'Not added yet'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DYNAMIC LISTS: EDUCATION, EXPERIENCE, SKILLS, CERTIFICATIONS */}
        {['education', 'experience', 'skills', 'certifications'].includes(activeTab) && (
          <div className="">
            <div className="profile-section-header">
              <h2 className="profile-section-title" style={{ textTransform: 'capitalize' }}>{activeTab}</h2>
              <button className="btn-secondary" onClick={() => { setAddingType(activeTab); setDynamicForm({}); }}>
                + Add {activeTab}
              </button>
            </div>
            
            {/* List existing items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {activeTab === 'education' && educationList.length === 0 && <div className="profile-placeholder"><p style={{ margin: 0 }}>No education records found.</p></div>}
              {activeTab === 'education' && educationList.map(item => (
                <div key={item.id} className="profile-emergency-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--gray-900)' }}>{item.degree}</h3>
                    <div style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>{item.institution} • {item.year}</div>
                  </div>
                  <button className="btn-ghost" onClick={() => handleDeleteDynamic('education', item.id)} style={{ color: 'var(--error-600)' }}>Remove</button>
                </div>
              ))}

              {activeTab === 'experience' && experienceList.length === 0 && <div className="profile-placeholder"><p style={{ margin: 0 }}>No experience records found.</p></div>}
              {activeTab === 'experience' && experienceList.map(item => (
                <div key={item.id} className="profile-emergency-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--gray-900)' }}>{item.title}</h3>
                    <div style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>{item.company} • {item.duration}</div>
                  </div>
                  <button className="btn-ghost" onClick={() => handleDeleteDynamic('experience', item.id)} style={{ color: 'var(--error-600)' }}>Remove</button>
                </div>
              ))}

              {activeTab === 'skills' && skillsList.length === 0 && <div className="profile-placeholder"><p style={{ margin: 0 }}>No skills found.</p></div>}
              {activeTab === 'skills' && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {skillsList.map(item => (
                    <div key={item.id} style={{ padding: '0.5rem 1rem', background: 'var(--brand-50)', color: 'var(--brand-700)', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {item.name} - {item.proficiency}
                      <span onClick={() => handleDeleteDynamic('skills', item.id)} style={{ cursor: 'pointer', opacity: 0.6 }}>×</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'certifications' && certificationsList.length === 0 && <div className="profile-placeholder"><p style={{ margin: 0 }}>No certifications found.</p></div>}
              {activeTab === 'certifications' && certificationsList.map(item => (
                <div key={item.id} className="profile-emergency-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--gray-900)' }}>{item.name}</h3>
                    <div style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>{item.issuer} • {item.date}</div>
                  </div>
                  <button className="btn-ghost" onClick={() => handleDeleteDynamic('certifications', item.id)} style={{ color: 'var(--error-600)' }}>Remove</button>
                </div>
              ))}
            </div>

            {/* Add Form */}
            {addingType === activeTab && (
              <div className="profile-emergency-card " style={{ border: '1px solid var(--brand-500)', background: 'white' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--gray-900)' }}>Add {activeTab}</h3>
                
                <div className="profile-data-grid" style={{ marginBottom: '1.5rem' }}>
                  {addingType === 'education' && (
                    <>
                      <div>
                        <span className="profile-data-label">Degree / Qualification</span>
                        <input type="text" className="profile-input" placeholder="e.g. B.Tech Computer Science" value={dynamicForm.degree || ''} onChange={e => setDynamicForm({...dynamicForm, degree: e.target.value})} />
                      </div>
                      <div>
                        <span className="profile-data-label">Institution / University</span>
                        <input type="text" className="profile-input" placeholder="e.g. Stanford University" value={dynamicForm.institution || ''} onChange={e => setDynamicForm({...dynamicForm, institution: e.target.value})} />
                      </div>
                      <div>
                        <span className="profile-data-label">Year of Passing</span>
                        <input type="text" className="profile-input" placeholder="e.g. 2022" value={dynamicForm.year || ''} onChange={e => setDynamicForm({...dynamicForm, year: e.target.value})} />
                      </div>
                    </>
                  )}
                  {addingType === 'experience' && (
                    <>
                      <div>
                        <span className="profile-data-label">Job Title</span>
                        <input type="text" className="profile-input" placeholder="e.g. Senior Developer" value={dynamicForm.title || ''} onChange={e => setDynamicForm({...dynamicForm, title: e.target.value})} />
                      </div>
                      <div>
                        <span className="profile-data-label">Company Name</span>
                        <input type="text" className="profile-input" placeholder="e.g. Google" value={dynamicForm.company || ''} onChange={e => setDynamicForm({...dynamicForm, company: e.target.value})} />
                      </div>
                      <div>
                        <span className="profile-data-label">Duration</span>
                        <input type="text" className="profile-input" placeholder="e.g. 2020 - 2023" value={dynamicForm.duration || ''} onChange={e => setDynamicForm({...dynamicForm, duration: e.target.value})} />
                      </div>
                    </>
                  )}
                  {addingType === 'skills' && (
                    <>
                      <div>
                        <span className="profile-data-label">Skill Name</span>
                        <input type="text" className="profile-input" placeholder="e.g. React.js" value={dynamicForm.name || ''} onChange={e => setDynamicForm({...dynamicForm, name: e.target.value})} />
                      </div>
                      <div>
                        <span className="profile-data-label">Proficiency</span>
                        <select className="profile-input" value={dynamicForm.proficiency || ''} onChange={e => setDynamicForm({...dynamicForm, proficiency: e.target.value})}>
                          <option value="">Select Level</option>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </>
                  )}
                  {addingType === 'certifications' && (
                    <>
                      <div>
                        <span className="profile-data-label">Certification Name</span>
                        <input type="text" className="profile-input" placeholder="e.g. AWS Solutions Architect" value={dynamicForm.name || ''} onChange={e => setDynamicForm({...dynamicForm, name: e.target.value})} />
                      </div>
                      <div>
                        <span className="profile-data-label">Issuing Organization</span>
                        <input type="text" className="profile-input" placeholder="e.g. Amazon Web Services" value={dynamicForm.issuer || ''} onChange={e => setDynamicForm({...dynamicForm, issuer: e.target.value})} />
                      </div>
                      <div>
                        <span className="profile-data-label">Date Acquired</span>
                        <input type="month" className="profile-input" value={dynamicForm.date || ''} onChange={e => setDynamicForm({...dynamicForm, date: e.target.value})} />
                      </div>
                    </>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button className="btn-ghost" onClick={() => setAddingType(null)}>Cancel</button>
                  <button className="btn-primary" onClick={() => handleSaveDynamic(activeTab)}>Save</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
