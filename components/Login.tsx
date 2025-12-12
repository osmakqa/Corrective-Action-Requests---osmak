import React, { useState } from 'react';
import { Role, DEPARTMENTS, NURSING_UNITS, CLINICAL_DEPARTMENTS, QA_PERSONNEL } from '../types';
import { ChevronDown, Eye, EyeOff, BookOpen, CheckCircle, X, FileText, Activity, ShieldCheck, Archive, AlertTriangle, PlayCircle, HelpCircle, Monitor, BarChart2, AlertOctagon } from 'lucide-react';

interface LoginProps {
  onLogin: (role: Role, department?: string, userName?: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<Role>(Role.SECTION);
  const [selectedDept, setSelectedDept] = useState('');
  const [sectionCategory, setSectionCategory] = useState<'General' | 'Nursing' | 'Clinical'>('General');
  const [selectedQA, setSelectedQA] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showUserManual, setShowUserManual] = useState(false);

  // Fixed credentials
  const STATIC_CREDENTIALS = {
    [Role.DQMR]: 'dqmr123',
    [Role.SECTION]: 'osmak123'
  };

  const getQAPassword = (name: string) => {
    if (!name) return '';
    if (name === "Main QA Account") return 'admin123';
    const parts = name.trim().split(' ');
    const lastName = parts[parts.length - 1].toLowerCase();
    return `${lastName}123`;
  };

  const checkAuth = () => {
    setError('');
    
    if (activeTab === Role.QA) {
      if (!selectedQA) {
        setError('Please select your IQA Name');
        return;
      }
      const expectedPassword = getQAPassword(selectedQA);
      if (password === expectedPassword) {
        onLogin(Role.QA, undefined, selectedQA);
      } else {
        setError(`Invalid IQA password.`);
      }
    } else if (activeTab === Role.DQMR) {
      if (password === STATIC_CREDENTIALS[Role.DQMR]) onLogin(Role.DQMR, undefined, 'Joey Borromeo, MD');
      else setError(`Invalid DQMR password.`);
    } else if (activeTab === Role.SECTION) {
      if (password === STATIC_CREDENTIALS[Role.SECTION]) {
        if (selectedDept) onLogin(Role.SECTION, selectedDept, selectedDept); 
        else setError('Please select a department');
      } else {
        setError(`Invalid Process Owner password.`);
      }
    }
  };

  const handleTabChange = (role: Role) => {
    setActiveTab(role);
    setError('');
    setPassword('');
    setSelectedDept('');
    setSelectedQA('');
  };

  const getHint = () => {
    if (activeTab === Role.QA) return "Hint: Use Lastname + 123 (e.g. terrenal123)";
    if (activeTab === Role.DQMR) return "Hint: Use dqmr123";
    return "Hint: Use osmak123";
  };

  return (
    <div className="min-h-screen bg-[#e8f5e9] flex items-center justify-center p-4 font-sans text-gray-800 relative">
      
      {/* User Manual Modal */}
      {showUserManual && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="bg-[#009a3e] px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3 text-white">
                  <div className="bg-white/20 p-2 rounded-full">
                      <BookOpen size={20} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold tracking-wide">User Manual</h2>
              </div>
              <button onClick={() => setShowUserManual(false)} className="text-white/80 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-white">
              
              {/* Title Section */}
              <div className="text-center space-y-4 border-b border-gray-100 pb-8">
                  <img 
                     src="https://maxterrenal-hash.github.io/justculture/osmak-logo.png" 
                     alt="Logo" 
                     className="h-24 mx-auto object-contain"
                  />
                  <div>
                      <h1 className="text-2xl font-extrabold text-[#009a3e] tracking-tight">Ospital ng Makati Corrective Action Request (CAR) System</h1>
                      <p className="text-gray-600 font-medium text-lg mt-1">Quality Management System • ISO 9001:2015 Clause 10.2</p>
                  </div>
              </div>

              {/* 1. System Overview */}
              <section>
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                      <h3 className="text-xl font-bold text-green-800">System Overview</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed pl-11">
                      The Corrective Action Request (CAR) System is a centralized web-based application designed to manage the lifecycle of non-conformities in compliance with <strong>ISO 9001:2015 Clause 10.2</strong>. It utilizes a modern card-based interface and consolidated database architecture to track:
                  </p>
                  <ul className="list-disc pl-16 mt-2 text-gray-600 space-y-1">
                      <li>Audit Findings & Non-Conformities</li>
                      <li>Root Cause Analysis (5 Whys / Fishbone / Pareto)</li>
                      <li>Corrective Action Planning & Deadlines</li>
                      <li>Verification of Effectiveness (including Re-issue logic)</li>
                      <li>Automatic Logging of Non-Submissions</li>
                      <li>Official PDF Record Generation</li>
                  </ul>
              </section>

              {/* 2. Access & Login */}
              <section>
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                      <h3 className="text-xl font-bold text-green-800">Access & Login</h3>
                  </div>
                  <div className="pl-11 space-y-6">
                      <div>
                          <h4 className="font-bold text-gray-800 mb-2">2.1 Accessing the System</h4>
                          <p className="text-gray-600">
                              Navigate to the system URL provided by the IT Department. A digital copy of this User Manual can be accessed directly from the login screen by clicking the <strong>"User Manual"</strong> link.
                          </p>
                      </div>
                      
                      <div>
                          <h4 className="font-bold text-gray-800 mb-2">2.2 Logging In</h4>
                          <p className="text-gray-600 mb-4">
                              The login screen is divided into three roles. Select the tab appropriate for your position:
                          </p>
                          
                          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                              <table className="w-full text-sm text-left">
                                  <thead className="bg-gray-100 text-gray-600 font-bold">
                                      <tr>
                                          <th className="p-4 border-b">User Role</th>
                                          <th className="p-4 border-b">Password Format</th>
                                          <th className="p-4 border-b">Example</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                      <tr>
                                          <td className="p-4 font-medium text-gray-800">Process Owner (Auditee)</td>
                                          <td className="p-4 text-gray-500 italic" colSpan={2}>Please see Quality Assurance Division</td>
                                      </tr>
                                      <tr>
                                          <td className="p-4 font-medium text-gray-800">IQA Admin</td>
                                          <td className="p-4 text-gray-500 italic" colSpan={2}>Please see Quality Assurance Division</td>
                                      </tr>
                                      <tr>
                                          <td className="p-4 font-medium text-gray-800">DQMR (Validator)</td>
                                          <td className="p-4 text-gray-500 italic" colSpan={2}>Please see Quality Assurance Division</td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              </section>

              {/* 3. Workflow Guide */}
              <section>
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                      <h3 className="text-xl font-bold text-green-800">Process Owner (Category: Department Head, Nursing Unit Head, Clinical Dept. Chair)</h3>
                  </div>
                  <div className="pl-11 space-y-6">
                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                          <h4 className="font-bold text-yellow-700 text-base uppercase mb-3 flex items-center gap-2">
                             <FileText size={18}/> Phase 1: Issuance (IQA Role)
                          </h4>
                          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              <li><strong>Navigate:</strong> Go to "Issue New CAR".</li>
                              <li><strong>Fill Details:</strong> Ref No, Department, ISO Clause, Source.</li>
                              <li><strong>Define Problem:</strong> Statement, Evidence, Reference (use ISO Guide).</li>
                              <li><strong>Action:</strong> Click "Issue CAR". Status becomes <strong>OPEN</strong>.</li>
                          </ul>
                      </div>

                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                          <h4 className="font-bold text-blue-700 text-base uppercase mb-3 flex items-center gap-2">
                             <Activity size={18}/> Phase 2: Response & RCA (Process Owner)
                          </h4>
                          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              <li><strong>Access:</strong> Login as Process Owner and open the OPEN CAR.</li>
                              <li><strong>Acknowledge:</strong> Enter name and date.</li>
                              <li><strong>Root Cause Analysis:</strong> Click "Start Analysis". Use 5 Whys, Fishbone, or Pareto. Save.</li>
                              <li><strong>Action Plan:</strong> Add Remedial Actions (Immediate) and Corrective Actions (Long-term) with Target Dates.</li>
                              <li><strong>Submit:</strong> Click "Submit Response". Status becomes <strong>RESPONDED</strong>.</li>
                          </ul>
                      </div>

                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                          <h4 className="font-bold text-indigo-700 text-base uppercase mb-3 flex items-center gap-2">
                             <CheckCircle size={18}/> Phase 3: Review (IQA Role)
                          </h4>
                          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              <li><strong>Review:</strong> Check RCA and Action Plan validity.</li>
                              <li><strong>Accept:</strong> If valid, click "Accept Response". Status: <strong>ACCEPTED</strong>.</li>
                              <li><strong>Return:</strong> If insufficient, add remarks and click "Return for Revision". Status: <strong>RETURNED</strong>.</li>
                          </ul>
                      </div>
                      
                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                          <h4 className="font-bold text-purple-700 text-base uppercase mb-3 flex items-center gap-2">
                             <PlayCircle size={18}/> Phase 4: Implementation (Process Owner)
                          </h4>
                          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              <li><strong>Execute:</strong> Perform the planned corrective actions.</li>
                              <li><strong>Complete:</strong> Click "Mark as Implemented & Ready for Verification". Status: <strong>FOR VERIFICATION</strong>.</li>
                          </ul>
                      </div>

                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                          <h4 className="font-bold text-teal-700 text-base uppercase mb-3 flex items-center gap-2">
                             <ShieldCheck size={18}/> Phase 5: Verification (IQA Role)
                          </h4>
                          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              <li><strong>Verify:</strong> Check evidence of implementation and effectiveness.</li>
                              <li><strong>Effective:</strong> Mark "Implemented & Effective". Status: <strong>VERIFIED</strong>.</li>
                              <li><strong>Ineffective:</strong> Mark "Ineffective". Trigger Re-issue workflow.</li>
                          </ul>
                      </div>

                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                          <h4 className="font-bold text-green-700 text-base uppercase mb-3 flex items-center gap-2">
                             <Archive size={18}/> Phase 6: Validation (DQMR Role)
                          </h4>
                          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              <li><strong>Validate:</strong> DQMR validates the closed record.</li>
                              <li><strong>Close:</strong> Click "Validate & Close". Status: <strong>CLOSED</strong>.</li>
                          </ul>
                      </div>
                  </div>
              </section>

               {/* 4. Special Features */}
              <section>
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">4</div>
                      <h3 className="text-xl font-bold text-green-800">Special Features</h3>
                  </div>
                  <div className="pl-11 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                         <div className="bg-blue-100 p-2 rounded text-blue-600 mt-1"><Archive size={16}/></div>
                         <div>
                            <h5 className="font-bold text-gray-800 text-sm">Closed CARs & PDF Export</h5>
                            <p className="text-xs text-gray-500 mt-1">Navigate to "Closed CARs". IQAs must select a Department filter. Click the download icon for the official PDF.</p>
                         </div>
                      </div>
                      <div className="flex items-start gap-3">
                         <div className="bg-green-100 p-2 rounded text-green-600 mt-1"><Activity size={16}/></div>
                         <div>
                            <h5 className="font-bold text-gray-800 text-sm">Recent Activity</h5>
                            <p className="text-xs text-gray-500 mt-1">A global log of all actions (Created, Submitted, Accepted, Returned, Deleted) across the system.</p>
                         </div>
                      </div>
                      <div className="flex items-start gap-3">
                         <div className="bg-red-100 p-2 rounded text-red-600 mt-1"><AlertTriangle size={16}/></div>
                         <div>
                            <h5 className="font-bold text-gray-800 text-sm">Non-Submission Registry</h5>
                            <p className="text-xs text-gray-500 mt-1">Automatic logging of CARs that missed the 5-day response deadline.</p>
                         </div>
                      </div>
                      <div className="flex items-start gap-3">
                         <div className="bg-purple-100 p-2 rounded text-purple-600 mt-1"><BarChart2 size={16}/></div>
                         <div>
                            <h5 className="font-bold text-gray-800 text-sm">Data Analysis</h5>
                            <p className="text-xs text-gray-500 mt-1">Real-time charts for ISO trends, Source comparison, and Department performance.</p>
                         </div>
                      </div>
                  </div>
              </section>

               {/* 5. Troubleshooting */}
              <section>
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">5</div>
                      <h3 className="text-xl font-bold text-green-800">Troubleshooting</h3>
                  </div>
                  <div className="pl-11 space-y-6">
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                         <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                               <tr>
                                  <th className="p-3 w-1/3">Issue</th>
                                  <th className="p-3">Solution</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                               <tr>
                                  <td className="p-3 font-medium text-red-600">PDF Download Freezes</td>
                                  <td className="p-3 text-gray-600">Ensure internet connection. Retry after 5 seconds.</td>
                               </tr>
                               <tr>
                                  <td className="p-3 font-medium text-red-600">"Closed CARs" List is Empty</td>
                                  <td className="p-3 text-gray-600">As IQA, you <strong>must</strong> select a Department from the filter dropdown.</td>
                               </tr>
                               <tr>
                                  <td className="p-3 font-medium text-red-600">Cannot Submit Response</td>
                                  <td className="p-3 text-gray-600">Ensure "Acknowledged By" and "Date Acknowledged" are filled.</td>
                               </tr>
                               <tr>
                                  <td className="p-3 font-medium text-red-600">"Return" Button Disabled</td>
                                  <td className="p-3 text-gray-600">You must enter remarks in the "IQA Remarks" box before returning a CAR.</td>
                               </tr>
                            </tbody>
                         </table>
                      </div>

                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                          <h4 className="font-bold text-blue-800 text-sm flex items-center gap-2 mb-1">
                             <HelpCircle size={16}/> System Administrator Contact
                          </h4>
                          <p className="text-sm text-blue-700">
                             Quality Assurance Division <br/>
                             Extension: <strong>1234</strong>
                          </p>
                      </div>
                  </div>
              </section>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-center shrink-0">
               <button 
                 onClick={() => setShowUserManual(false)} 
                 className="bg-[#009a3e] hover:bg-[#007530] text-white font-bold py-3 px-12 rounded-lg shadow-lg shadow-green-100 transition-transform active:scale-95 text-sm uppercase tracking-wide"
               >
                 Close Manual
               </button>
            </div>

          </div>
        </div>
      )}

      {/* Workflow Modal */}
      {showWorkflowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="bg-[#009a3e] p-4 flex justify-between items-center text-white shrink-0">
                 <div className="flex items-center gap-2">
                    <BookOpen size={24}/>
                    <h2 className="text-xl font-bold">ISO 9001:2015 Corrective Action Workflow</h2>
                 </div>
                 <button onClick={() => setShowWorkflowModal(false)} className="hover:bg-[#007530] p-1 rounded-full transition-colors">
                    <X size={24}/>
                 </button>
              </div>
              
              <div className="p-8 overflow-y-auto bg-gray-50">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Step 1 */}
                    <div className="bg-white p-5 rounded-lg shadow border-t-4 border-yellow-500 relative">
                       <div className="absolute -top-3 -left-3 bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow">1</div>
                       <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><FileText size={18} className="text-yellow-600"/> Issuance</h3>
                       <p className="text-sm text-gray-600">
                          <strong>QA/IQA Auditor</strong> identifies a non-conformance and issues a CAR. Required fields (Problem, Evidence, Reference) are validated.
                       </p>
                       <div className="mt-2 text-xs font-bold text-yellow-600 bg-yellow-50 inline-block px-2 py-1 rounded">Status: OPEN</div>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-white p-5 rounded-lg shadow border-t-4 border-blue-500 relative">
                       <div className="absolute -top-3 -left-3 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow">2</div>
                       <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><Activity size={18} className="text-blue-600"/> Response & RCA</h3>
                       <p className="text-sm text-gray-600">
                          <strong>Process Owner</strong> uses the RCA Module to conduct <strong>5 Whys, Fishbone, or Pareto analysis</strong>, then submits a Corrective Action Plan.
                       </p>
                       <div className="mt-2 text-xs font-bold text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded">Status: RESPONDED</div>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-white p-5 rounded-lg shadow border-t-4 border-indigo-500 relative">
                       <div className="absolute -top-3 -left-3 bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow">3</div>
                       <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><CheckCircle size={18} className="text-indigo-600"/> IQA Review</h3>
                       <p className="text-sm text-gray-600">
                          <strong>IQA</strong> reviews the plan. If valid, accepts it. If invalid, returns it for revision with mandatory remarks.
                       </p>
                       <div className="mt-2 flex gap-2">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">ACCEPTED</span>
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">RETURNED</span>
                       </div>
                    </div>

                    {/* Step 4 */}
                    <div className="bg-white p-5 rounded-lg shadow border-t-4 border-teal-500 relative">
                       <div className="absolute -top-3 -left-3 bg-teal-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow">4</div>
                       <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><ShieldCheck size={18} className="text-teal-600"/> Verification</h3>
                       <p className="text-sm text-gray-600">
                          <strong>IQA</strong> verifies effectiveness. If <strong>Ineffective</strong>, the system triggers a "Re-issue" workflow to clone details into a new CAR.
                       </p>
                       <div className="mt-2 text-xs font-bold text-teal-600 bg-teal-50 inline-block px-2 py-1 rounded">Status: VERIFIED</div>
                    </div>

                    {/* Step 5 */}
                    <div className="bg-white p-5 rounded-lg shadow border-t-4 border-green-600 relative">
                       <div className="absolute -top-3 -left-3 bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow">5</div>
                       <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><Archive size={18} className="text-green-600"/> Validation</h3>
                       <p className="text-sm text-gray-600">
                          <strong>DQMR</strong> validates the completed process and formally closes the record (both Effective and Ineffective).
                       </p>
                       <div className="mt-2 text-xs font-bold text-green-800 bg-green-100 inline-block px-2 py-1 rounded">Status: CLOSED</div>
                    </div>

                    {/* Registry */}
                    <div className="bg-red-50 p-5 rounded-lg shadow border-t-4 border-red-500 relative flex flex-col justify-center">
                       <h3 className="font-bold text-red-800 flex items-center gap-2 mb-2"><AlertTriangle size={18} className="text-red-600"/> Non-Submission</h3>
                       <p className="text-sm text-red-700">
                          If a response is not submitted by the due date, the system automatically logs the incident in the <strong>Non-Submission Registry</strong>.
                       </p>
                    </div>

                 </div>
                 
                 <div className="mt-8 p-4 bg-gray-100 rounded border border-gray-200 text-center text-sm text-gray-500">
                    Ospital ng Makati Quality Management System • ISO 9001:2015 Compliant
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Main Card */}
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Card Header (Matched Style) */}
        <header className="bg-[#009a3e] px-7 py-3 flex items-center gap-4 shadow-md h-20">
             <img 
               src="https://maxterrenal-hash.github.io/justculture/osmak-logo.png" 
               alt="OsMak Logo" 
               className="h-14"
             />
             <div className="flex flex-col">
                <h1 className="text-white text-xl font-bold tracking-wide uppercase leading-tight">OSPITAL NG MAKATI</h1>
                <span className="text-white text-sm opacity-90 tracking-wide90">Corrective Action Request System</span>
             </div>
        </header>

        {/* Card Body */}
        <div className="p-8">
            
            {/* Tabs */}
            <div className="w-full bg-gray-100 p-1.5 rounded-lg flex mb-6">
               <button 
                 onClick={() => handleTabChange(Role.SECTION)}
                 className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${activeTab === Role.SECTION ? 'bg-white text-[#009a3e] shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 Process Owner
               </button>
               <button 
                 onClick={() => handleTabChange(Role.QA)}
                 className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${activeTab === Role.QA ? 'bg-white text-[#009a3e] shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 IQA
               </button>
               <button 
                 onClick={() => handleTabChange(Role.DQMR)}
                 className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${activeTab === Role.DQMR ? 'bg-white text-[#009a3e] shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 DQMR
               </button>
            </div>

            {/* Form Content */}
            <div className="space-y-5">
               
               {activeTab === Role.SECTION && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Select Category</label>
                    <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200 mb-3">
                      <button 
                        onClick={() => { setSectionCategory('General'); setSelectedDept(''); }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${sectionCategory === 'General' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
                      >
                        Section
                      </button>
                      <button 
                        onClick={() => { setSectionCategory('Nursing'); setSelectedDept(''); }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${sectionCategory === 'Nursing' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
                      >
                        Nursing Unit
                      </button>
                      <button 
                        onClick={() => { setSectionCategory('Clinical'); setSelectedDept(''); }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${sectionCategory === 'Clinical' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
                      >
                        Clinical Dept
                      </button>
                    </div>

                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      {sectionCategory === 'General' ? 'Section' : (sectionCategory === 'Nursing' ? 'Nursing Unit' : 'Clinical Department')}
                    </label>
                    
                    <div className="relative">
                       <select 
                         value={selectedDept} 
                         onChange={(e) => setSelectedDept(e.target.value)}
                         className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 appearance-none bg-white focus:ring-2 focus:ring-[#009a3e] focus:border-transparent outline-none transition-all cursor-pointer hover:border-gray-400 text-sm"
                        >
                          <option value="">Select...</option>
                          {sectionCategory === 'General' && DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                          {sectionCategory === 'Nursing' && NURSING_UNITS.map(d => <option key={d} value={d}>{d}</option>)}
                          {sectionCategory === 'Clinical' && CLINICAL_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 text-gray-600 pointer-events-none" size={18} />
                    </div>
                 </div>
               )}

               {activeTab === Role.QA && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Select IQA Personnel</label>
                    <div className="relative">
                       <select 
                         value={selectedQA} 
                         onChange={(e) => setSelectedQA(e.target.value)}
                         className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 appearance-none bg-white focus:ring-2 focus:ring-[#009a3e] focus:border-transparent outline-none transition-all cursor-pointer hover:border-gray-400 text-sm"
                        >
                          <option value="">Select Your Name...</option>
                          {QA_PERSONNEL.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 text-gray-600 pointer-events-none" size={18} />
                    </div>
                 </div>
               )}

               {/* Password Field */}
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Password</label>
                  <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 bg-white focus:ring-2 focus:ring-[#009a3e] focus:border-transparent outline-none transition-all pr-12 placeholder-gray-400 hover:border-gray-400 text-sm"
                        placeholder="••••••••"
                      />
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-600 hover:text-gray-800 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                      </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 italic font-medium">{getHint()}</p>
               </div>

               {error && (
                 <div className="text-red-600 text-sm font-medium text-center bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in zoom-in-95 duration-200 flex items-center justify-center gap-2">
                    {error}
                 </div>
               )}

               <button 
                 onClick={checkAuth}
                 className="w-full bg-[#009a3e] hover:bg-[#007530] text-white font-bold py-3.5 rounded-lg shadow-md transition-all active:scale-[0.98] mt-2 text-sm uppercase tracking-wide"
               >
                 Login
               </button>

            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
               <button 
                 onClick={() => setShowWorkflowModal(true)} 
                 className="flex items-center gap-2 text-[#009a3e] font-bold text-sm hover:underline hover:text-[#007530] transition-colors"
               >
                  <Activity size={18} />
                  View System Workflow
               </button>
               
               <button 
                 onClick={() => setShowUserManual(true)} 
                 className="flex items-center gap-2 text-[#009a3e] font-bold text-sm hover:underline hover:text-[#007530] transition-colors"
               >
                  <BookOpen size={18} />
                  View User Manual
               </button>
            </div>

        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-6 text-center text-green-800/40 text-xs font-medium">
        &copy; {new Date().getFullYear()} Ospital ng Makati. All rights reserved.
      </div>

    </div>
  );
};