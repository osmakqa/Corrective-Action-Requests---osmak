import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Role } from './types';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { CARForm } from './components/CARForm';
import { Registry } from './components/Registry';
import { DataAnalysis } from './components/DataAnalysis';
import { RecentActivity } from './components/RecentActivity';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userDepartment, setUserDepartment] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  const handleLogin = (role: Role, department?: string, name?: string) => {
    setUserRole(role);
    setUserDepartment(department || '');
    setUserName(name || '');
  };

  const handleLogout = () => {
    setUserRole(null);
    setUserDepartment('');
    setUserName('');
  };

  if (!userRole) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <Layout userRole={userRole} userDepartment={userDepartment} userName={userName} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Active Dashboard (Open/Ongoing) */}
          <Route path="/dashboard" element={<Dashboard userRole={userRole} currentDepartment={userDepartment} viewMode="active" userName={userName} />} />
          
          {/* Closed CARs (Archive) */}
          <Route path="/closed-cars" element={<Dashboard userRole={userRole} currentDepartment={userDepartment} viewMode="closed" userName={userName} />} />
          
          {/* Section: All CARs View */}
          <Route path="/section/all-cars" element={
            userRole === Role.SECTION 
              ? <Dashboard userRole={userRole} currentDepartment={userDepartment} viewMode="all" userName={userName} />
              : <Navigate to="/dashboard" />
          } />

          {/* Section: Pending Action Plans */}
          <Route path="/section/pending-plans" element={
            userRole === Role.SECTION
              ? <Dashboard userRole={userRole} currentDepartment={userDepartment} viewMode="pending-plans" userName={userName} />
              : <Navigate to="/dashboard" />
          } />
          
          {/* Recent Activity - QA and Section */}
          <Route path="/recent-activity" element={
            (userRole === Role.QA || userRole === Role.SECTION) 
              ? <RecentActivity userRole={userRole} userDepartment={userDepartment} /> 
              : <Navigate to="/dashboard" />
          } />
          
          {/* QA Monitoring Redirect */}
          <Route path="/monitor/:department" element={<Navigate to="dashboard" replace relative="path" />} />
          
          {/* QA Monitoring Suite - READ ONLY */}
          <Route path="/monitor/:department/dashboard" element={<Dashboard userRole={userRole} viewMode="monitor" userName={userName} />} />
          <Route path="/monitor/:department/closed" element={<Dashboard userRole={userRole} viewMode="monitor" userName={userName} />} />
          <Route path="/monitor/:department/registry" element={<Registry userRole={userRole} isMonitorMode={true} />} />

          <Route path="/car/new" element={userRole === Role.QA ? <CARForm userRole={userRole} userName={userName} /> : <Navigate to="/dashboard" />} />
          <Route path="/car/:id" element={<CARForm userRole={userRole} userName={userName} />} />
          <Route path="/registry" element={<Registry userRole={userRole} currentDepartment={userDepartment} />} />
          
          {/* Data Analysis - Main QA Only OR Section Users */}
          <Route path="/data-analysis" element={
            (userRole === Role.QA && userName === 'Main QA Account') || userRole === Role.SECTION
              ? <DataAnalysis userRole={userRole} userDepartment={userDepartment} /> 
              : <Navigate to="/dashboard" />
          } />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;