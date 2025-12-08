import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PlusCircle, AlertTriangle, LogOut, LayoutDashboard, Archive, Eye, ArrowLeftCircle, PieChart, Briefcase, FileText, List, CheckSquare, ChevronDown, ChevronRight, Activity, Menu, X } from 'lucide-react';
import { Role, DEPARTMENTS } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  userRole: Role;
  userDepartment?: string;
  userName?: string;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, userRole, userDepartment, userName, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSectionsOpen, setIsSectionsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Check if we are in monitor mode
  const isMonitorMode = location.pathname.includes('/monitor/');
  const pathParts = location.pathname.split('/');
  const monitoredDepartment = isMonitorMode ? decodeURIComponent(pathParts[2]) : null;

  // Helper to determine active state
  const isLinkActive = (path: string) => location.pathname === path;

  // Badge/Role Display Logic
  let displayRole = "User";
  let badgeText = "User";
  let badgeColor = "bg-gray-200 text-gray-700";

  if (userRole === Role.QA) {
    displayRole = "IQA (Internal Quality Auditor)";
    badgeText = "Command Center";
    badgeColor = "bg-blue-600 text-white";
  } else if (userRole === Role.SECTION) {
    displayRole = userDepartment || "Section";
    badgeText = "Auditee Account";
    badgeColor = "bg-orange-500 text-white";
  } else if (userRole === Role.DQMR) {
    displayRole = userName || "DQMR";
    badgeText = "Validator";
    badgeColor = "bg-purple-600 text-white";
  }

  // Override display name if specific user
  if (userName && userName !== "Main QA Account" && userRole === Role.QA) {
     displayRole = userName;
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">
      
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#009a3e] flex items-center justify-between px-4 z-50 shadow-md">
         <div className="flex items-center gap-3">
            <img 
               src="https://maxterrenal-hash.github.io/justculture/osmak-logo.png" 
               alt="Logo" 
               className="h-10 w-auto object-contain"
            />
            <div className="flex flex-col">
                <span className="text-white font-extrabold text-sm tracking-wide leading-none">OSPITAL NG MAKATI</span>
                <span className="text-green-50 text-[0.65rem] font-medium tracking-wider opacity-90 mt-0.5">Corrective Action Request System</span>
            </div>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white flex flex-col shadow-xl border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Sidebar Header - Consistent with Mobile Header */}
        <header className="flex bg-[#009a3e] h-16 px-4 items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img 
              src="https://maxterrenal-hash.github.io/justculture/osmak-logo.png" 
              alt="Logo" 
              className="h-10 w-auto object-contain"
            />
            <div className="flex flex-col">
              <h1 className="text-white text-sm font-extrabold tracking-wide uppercase leading-none">OSPITAL NG MAKATI</h1>
              <span className="text-green-50 text-[0.65rem] font-medium opacity-90 tracking-wider mt-0.5">Corrective Action Request System</span>
            </div>
          </div>
          <button onClick={closeMobileMenu} className="lg:hidden text-white p-1 hover:bg-green-700 rounded-full transition-colors">
             <X size={24} />
          </button>
        </header>

        {/* 2. Logged In As Section */}
        <div className="px-6 py-6 shrink-0">
             <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">LOGGED IN AS</div>
             <div className="text-lg font-bold text-[#007530] leading-tight mb-2">
               {displayRole}
             </div>
             <div className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wide shadow-sm ${badgeColor}`}>
                {badgeText}
             </div>
        </div>

        {/* 3. Navigation Content */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-6 space-y-6 pb-6">
          
          {/* Main Dashboard Button */}
          <div>
             <button 
               onClick={() => {
                 navigate(isMonitorMode ? `/monitor/${encodeURIComponent(monitoredDepartment || '')}/dashboard` : '/dashboard');
                 closeMobileMenu();
               }}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 shadow-md group ${
                 location.pathname.includes('dashboard') 
                   ? 'bg-[#009a3e] text-white hover:bg-[#007530] ring-2 ring-green-200' 
                   : 'bg-white border border-gray-200 text-gray-600 hover:border-green-500 hover:text-green-600'
               }`}
             >
                <LayoutDashboard size={22} />
                <span className="font-bold text-base tracking-wide">Dashboard</span>
             </button>
          </div>

          {/* Monitor Mode Navigation */}
          {isMonitorMode ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">VIEWING SECTION</span>
                 <button onClick={() => navigate('/dashboard')} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                    <ArrowLeftCircle size={12}/> EXIT
                 </button>
              </div>
              <div className="mb-4">
                 <h3 className="font-bold text-gray-800 text-sm border-l-4 border-orange-400 pl-2">{monitoredDepartment}</h3>
              </div>

              <div className="space-y-1">
                 <NavItem 
                   to={`/monitor/${encodeURIComponent(monitoredDepartment || '')}/dashboard`} 
                   icon={<LayoutDashboard size={20}/>} 
                   label="Overview" 
                   active={location.pathname.endsWith('/dashboard')}
                   onClick={closeMobileMenu}
                 />
                 <NavItem 
                   to={`/monitor/${encodeURIComponent(monitoredDepartment || '')}/closed`} 
                   icon={<Archive size={20}/>} 
                   label="Closed Records" 
                   active={location.pathname.includes('/closed')}
                   onClick={closeMobileMenu}
                 />
                 <NavItem 
                   to={`/monitor/${encodeURIComponent(monitoredDepartment || '')}/registry`} 
                   icon={<AlertTriangle size={20}/>} 
                   label="Registry Logs" 
                   active={location.pathname.includes('/registry')}
                   onClick={closeMobileMenu}
                 />
              </div>
            </div>
          ) : (
            <>
              {/* Menu Category */}
              <div className="space-y-2">
                 <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {userRole === Role.QA ? 'IQA OVERVIEW' : (userRole === Role.DQMR ? 'DQMR MENU' : 'MENU')}
                 </div>

                 {/* QA Actions */}
                 {userRole === Role.QA && (
                   <>
                     <NavItem 
                       to="/car/new" 
                       icon={<PlusCircle size={20}/>} 
                       label="Issue New CAR" 
                       active={location.pathname === '/car/new'}
                       onClick={closeMobileMenu}
                     />
                     <NavItem 
                       to="/closed-cars" 
                       icon={<Archive size={20}/>} 
                       label="Closed CARs" 
                       active={location.pathname === '/closed-cars'}
                       onClick={closeMobileMenu}
                     />
                     <NavItem 
                       to="/recent-activity" 
                       icon={<Activity size={20}/>} 
                       label="Recent Activity" 
                       active={location.pathname === '/recent-activity'}
                       onClick={closeMobileMenu}
                     />
                   </>
                 )}
                
                 {/* DQMR Actions */}
                 {userRole === Role.DQMR && (
                   <NavItem 
                     to="/closed-cars" 
                     icon={<Archive size={20}/>} 
                     label="Closed CARs" 
                     active={location.pathname === '/closed-cars'}
                     onClick={closeMobileMenu}
                   />
                 )}

                 {/* Section Actions */}
                 {userRole === Role.SECTION && (
                   <>
                     <NavItem 
                       to="/section/all-cars" 
                       icon={<List size={20}/>} 
                       label="All CARs" 
                       active={location.pathname === '/section/all-cars'}
                       onClick={closeMobileMenu}
                     />
                     <NavItem 
                       to="/closed-cars" 
                       icon={<Archive size={20}/>} 
                       label="Closed CARs" 
                       active={location.pathname === '/closed-cars'}
                       onClick={closeMobileMenu}
                     />
                     <NavItem 
                       to="/recent-activity" 
                       icon={<Activity size={20}/>} 
                       label="Recent Activity" 
                       active={location.pathname === '/recent-activity'}
                       onClick={closeMobileMenu}
                     />
                   </>
                 )}

                 <NavItem 
                   to="/registry" 
                   icon={<AlertTriangle size={20}/>} 
                   label="Non-Submission" 
                   active={location.pathname === '/registry'}
                   onClick={closeMobileMenu}
                 />

                 {/* Data Analysis - Main QA & Section Users */}
                 {((userRole === Role.QA && userName === "Main QA Account") || userRole === Role.SECTION) && (
                   <NavItem 
                     to="/data-analysis" 
                     icon={<PieChart size={20}/>} 
                     label="Data Analysis" 
                     active={location.pathname === '/data-analysis'}
                     onClick={closeMobileMenu}
                   />
                 )}
              </div>

              {/* QA Monitor List */}
              {userRole === Role.QA && (
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => setIsSectionsOpen(!isSectionsOpen)}
                    className="w-full flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 hover:text-gray-600 transition-colors focus:outline-none"
                  >
                     <span>HOSPITAL SECTIONS</span>
                     {isSectionsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  
                  {isSectionsOpen && (
                    <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                      {DEPARTMENTS.map(dept => (
                        <Link 
                          key={dept}
                          to={`/monitor/${encodeURIComponent(dept)}/dashboard`}
                          className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#009a3e] hover:bg-green-50 transition-colors group"
                          onClick={closeMobileMenu}
                        >
                          <Briefcase size={18} className="text-gray-400 group-hover:text-[#009a3e] transition-colors"/>
                          <span className="truncate">{dept}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <button 
            onClick={() => { onLogout(); closeMobileMenu(); }} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#f8fafc] relative mt-16 lg:mt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-20">
          {children}
        </div>
      </main>
    </div>
  );
};

// Helper Component for List Items
const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> = ({ to, icon, label, active, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center gap-4 px-2 py-2.5 rounded-lg text-base font-medium transition-all duration-200 group ${
      active 
        ? 'text-[#009a3e] bg-green-50' 
        : 'text-gray-600 hover:text-[#009a3e] hover:bg-gray-50'
    }`}
  >
    <div className={`${active ? 'text-[#009a3e]' : 'text-gray-500 group-hover:text-[#009a3e]'} transition-colors`}>
      {icon}
    </div>
    <span>{label}</span>
  </Link>
);