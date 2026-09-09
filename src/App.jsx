import React, { useState } from 'react';
import DatasetGenerator from './DatasetGenerator';
import DiagnosticViewer from './DiagnosticViewer';
import Login from './Login';
import PatientRegistration from './PatientRegistration';
import DataArchive from './DataArchive';
import Dashboard from './Dashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'register', 'dataset', 'diagnostic', 'archive'
  const [sharedData, setSharedData] = useState(null);
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  

  const handleLogin = (userData) => {
    setUser(userData);
    setActiveTab('dashboard');
  };

  const handlePatientRegister = (patientData) => {
    setPatient(patientData);
    setActiveTab('dataset');
  };

  const handleCaptureComplete = (data) => {
    setSharedData(data);
    setActiveTab('diagnostic');
  };

  const handleLogout = () => {
    setUser(null); 
    setPatient(null); 
    setSharedData(null); 
    setActiveTab('login');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🦷</span>
          <div className="logo-text">
            <span style={{ fontSize: '15px' }}>Oral Health Data Center</span>
            <span style={{ fontSize: '11px', color: '#3B82F6', fontWeight: '600' }}>OHDC</span>
          </div>
        </div>
        
        <nav className="sidebar-menu">
          <button 
            className={`sidebar-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            หน้าหลัก (Dashboard)
          </button>
          
          <button 
            className={`sidebar-menu-item ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            ลงทะเบียนผู้ป่วย
          </button>

          <button 
            className={`sidebar-menu-item ${activeTab === 'dataset' ? 'active' : ''}`}
            onClick={() => setActiveTab('dataset')}
            disabled={!patient}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            ถ่ายภาพช่องปาก 3D
          </button>

          <button 
            className={`sidebar-menu-item ${activeTab === 'diagnostic' ? 'active' : ''}`}
            onClick={() => setActiveTab('diagnostic')}
            disabled={!sharedData}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            บันทึกเวชระเบียน (Odontogram)
          </button>

          <button 
            className={`sidebar-menu-item ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => setActiveTab('archive')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>
            คลังข้อมูล (Export)
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
             <div className="user-avatar">{user.name.charAt(0)}</div>
             <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
             </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F3F4F6' }}>
        {activeTab === 'dashboard' && <Dashboard user={user} />}
        {activeTab === 'register' && <PatientRegistration onRegister={handlePatientRegister} />}
        {activeTab === 'dataset' && <DatasetGenerator onComplete={handleCaptureComplete} patient={patient} />}
        {activeTab === 'diagnostic' && (
          <DiagnosticViewer 
            sharedData={sharedData} 
            patient={patient} 
            onSaveRecord={(record) => {
              alert('บันทึกข้อมูลผลการตรวจลงในฐานข้อมูลสำเร็จเรียบร้อยแล้ว');
              setActiveTab('archive');
            }} 
          />
        )}
        {activeTab === 'archive' && <DataArchive  />}
      </main>
    </div>
  );
}
