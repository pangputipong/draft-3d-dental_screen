import React, { useState } from 'react';

export default function PatientRegistration({ onRegister }) {
  const [patientData, setPatientData] = useState({
    nationalId: '',
    fullName: '',
    dob: '',
    gender: '',
    bloodPressure: '',
    chiefComplaint: '',
    underlyingDisease: ''
  });
  
  const [isReadingCard, setIsReadingCard] = useState(false);
  const [readerStatus, setReaderStatus] = useState('idle'); // idle, reading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [useTestMode, setUseTestMode] = useState(false); // Toggle for presentation without real reader

  const parseThaiDate = (thaiDateStr) => {
    // Thai ID usually returns YYYYMMDD in Buddhist era, e.g., 25330515
    if (!thaiDateStr || thaiDateStr.length !== 8) return '';
    const year = parseInt(thaiDateStr.substring(0, 4)) - 543;
    const month = thaiDateStr.substring(4, 6);
    const day = thaiDateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  };

  const readSmartCard = async () => {
    setIsReadingCard(true);
    setReaderStatus('reading');
    setErrorMessage('');

    if (useTestMode) {
      // Simulate for presentation
      setTimeout(() => {
        setPatientData(prev => ({
          ...prev,
          nationalId: '1100200300400',
          fullName: 'นาย รักษา ฟันดี',
          dob: '1990-05-15',
          gender: 'Male'
        }));
        setIsReadingCard(false);
        setReaderStatus('success');
      }, 1500);
      return;
    }

    try {
      // Attempt to connect to a Local Smart Card Agent (Standard integration for Thai HIS)
      // Usually runs on localhost via a lightweight C#/Node/Python background service
      const response = await fetch('http://localhost:8080/smc/read', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลจากเครื่องอ่านได้ (Card reading failed)');
      }

      const data = await response.json();
      
      // Map standard Thai ID JSON format to our patient data
      setPatientData(prev => ({
        ...prev,
        nationalId: data.pid || data.nationalId || '',
        fullName: `${data.titleNameTh || ''} ${data.firstNameTh || ''} ${data.lastNameTh || ''}`.trim(),
        dob: parseThaiDate(data.birthDate) || data.dob || '',
        gender: data.gender === '1' ? 'Male' : (data.gender === '2' ? 'Female' : '')
      }));

      setIsReadingCard(false);
      setReaderStatus('success');

    } catch (error) {
      console.error('Smart Card Error:', error);
      setIsReadingCard(false);
      setReaderStatus('error');
      setErrorMessage('ไม่พบโปรแกรม Smart Card Agent (localhost:8080) หรือไม่ได้เสียบบัตร กรุณาตรวจสอบการเชื่อมต่อ');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatientData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientData.nationalId) {
      alert("กรุณาระบุเลขประจำตัวประชาชนหรือกดอ่านจากบัตร");
      return;
    }
    
    // POST to API
    try {
       const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
       const response = await fetch(`${apiUrl}/api/patients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             hn: patientData.nationalId,
             firstName: patientData.fullName.split(' ')[0] || '',
             lastName: patientData.fullName.split(' ').slice(1).join(' ') || '',
             dob: patientData.dob,
             gender: patientData.gender,
             phone: '', // Not collected in UI yet
             address: '' // Not collected in UI yet
          })
       });
       
       if (response.ok) {
          const savedPatient = await response.json();
          onRegister({ ...patientData, id: savedPatient.id });
       } else {
          // If HN already registered, we can fetch them or just alert
          const errData = await response.json();
          if (errData.detail === "HN already registered") {
             alert("คนไข้ท่านนี้มีในระบบแล้ว จะใช้ข้อมูลเดิม");
             // Ideally we should GET the patient, but for prototype we just pass along
             onRegister({ ...patientData, id: patientData.nationalId }); 
          } else {
             alert("Error saving patient: " + errData.detail);
          }
       }
    } catch (err) {
       console.error(err);
       alert("Cannot connect to Database Server.");
       // Fallback for prototype if server is down
       onRegister({ ...patientData, id: patientData.nationalId });
    }
  };

  return (
    <div className="registration-container container">
      <div className="apple-card" style={{ padding: '32px', textAlign: 'left', position: 'relative' }}>
        
        {/* Test Mode Toggle for Presentation */}
        <div style={{ position: 'absolute', top: '32px', right: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={useTestMode} 
              onChange={(e) => setUseTestMode(e.target.checked)} 
            />
            เปิดโหมดจำลอง (Test Mode)
          </label>
        </div>

        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>ลงทะเบียนผู้ป่วย / คัดกรอง (Screening)</h2>
        
        <div className="smartcard-section apple-card" style={{ padding: '24px', background: '#F8FAFC', marginBottom: '32px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
          <h4 style={{ margin: '0 0 20px 0', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', color: '#0F172A' }}>
            การดึงข้อมูลและยืนยันตัวตนคนไข้ (Patient Authentication)
          </h4>
          
          <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>
            
            {/* Option 1: Smart Card */}
            <div style={{ flex: 1, padding: '20px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative', overflow: 'hidden' }}>
              {readerStatus === 'reading' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#3B82F6', animation: 'loading 1.5s infinite' }}></div>}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: '#EFF6FF', color: '#3B82F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>1</div>
                <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '16px' }}>เครื่องอ่านบัตร (Smart Card)</div>
              </div>
              
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>เสียบบัตรประชาชนเข้าเครื่องอ่านบนโต๊ะ แล้วกดปุ่มดึงข้อมูล</p>
              
              <button 
                type="button" 
                className="apple-btn" 
                style={{ width: '100%', background: readerStatus === 'success' ? '#10B981' : '#F1F5F9', color: readerStatus === 'success' ? 'white' : '#334155', border: '1px solid #CBD5E1', transition: 'all 0.3s' }}
                onClick={readSmartCard}
                disabled={isReadingCard}
              >
                {isReadingCard ? 'กำลังอ่านข้อมูลสมาร์ทการ์ด...' : (readerStatus === 'success' ? 'ดึงข้อมูลสำเร็จ ✓' : 'ดึงข้อมูลจากเครื่องอ่านบัตร')}
              </button>

              {readerStatus === 'error' && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#EF4444', backgroundColor: '#FEF2F2', padding: '8px', borderRadius: '6px', width: '100%' }}>
                  {errorMessage}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', color: '#94A3B8', fontWeight: 'bold', fontSize: '14px' }}>OR</div>

            {/* Option 2: ThaID */}
            <div style={{ flex: 1, padding: '20px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: '#1E3A8A', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>2</div>
                <div style={{ fontWeight: '600', color: '#1E3A8A', fontSize: '16px' }}>แอปพลิเคชัน ThaID</div>
              </div>
              
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#3B82F6' }}>ให้คนไข้สแกน QR Code เพื่อดึงข้อมูลดิจิทัล</p>
              
              <button 
                type="button" 
                className="apple-btn" 
                style={{ width: '100%', background: '#1E3A8A', color: 'white' }}
                onClick={readSmartCard}
                disabled={isReadingCard}
              >
                {isReadingCard ? 'รอคนไข้ยืนยัน...' : 'สร้าง QR Code ให้คนไข้สแกน'}
              </button>
            </div>

          </div>
        </div>

        <form onSubmit={handleSubmit} className="clinical-form">
          <div className="form-row">
            <div className="form-group">
              <label>เลขประจำตัวประชาชน 13 หลัก</label>
              <input type="text" name="nationalId" value={patientData.nationalId} onChange={handleChange} required className={readerStatus === 'success' ? 'highlight-input' : ''} />
            </div>
            <div className="form-group">
              <label>ชื่อ-นามสกุล</label>
              <input type="text" name="fullName" value={patientData.fullName} onChange={handleChange} required className={readerStatus === 'success' ? 'highlight-input' : ''} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>วันเกิด (DOB)</label>
              <input type="date" name="dob" value={patientData.dob} onChange={handleChange} className={readerStatus === 'success' ? 'highlight-input' : ''} />
            </div>
            <div className="form-group">
              <label>เพศ</label>
              <select name="gender" value={patientData.gender} onChange={handleChange} className={readerStatus === 'success' ? 'highlight-input' : ''}>
                <option value="">-- เลือก --</option>
                <option value="Male">ชาย (Male)</option>
                <option value="Female">หญิง (Female)</option>
              </select>
            </div>
          </div>

          <hr className="divider" style={{ margin: '24px 0' }} />
          <h4 style={{ margin: '0 0 16px 0' }}>ข้อมูลทางคลินิก (Clinical Screening)</h4>

          <div className="form-row">
            <div className="form-group">
              <label>ความดันโลหิต (BP) mmHg</label>
              <input type="text" name="bloodPressure" placeholder="ex. 120/80" value={patientData.bloodPressure} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>โรคประจำตัว (Underlying Disease)</label>
              <input type="text" name="underlyingDisease" placeholder="ถ้าไม่มีให้เว้นว่าง" value={patientData.underlyingDisease} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>อาการสำคัญที่มาพบแพทย์ (Chief Complaint - CC)</label>
            <textarea 
              name="chiefComplaint" 
              rows="3" 
              value={patientData.chiefComplaint} 
              onChange={handleChange}
              style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border)', padding: '12px', fontFamily: 'inherit' }}
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
             <button type="submit" className="apple-btn primary">บันทึกและดำเนินการสแกนฟัน (Next)</button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .highlight-input {
          background-color: #F0FDF4 !important;
          border-color: #10B981 !important;
          color: #064E3B !important;
        }
      `}</style>
    </div>
  );
}
