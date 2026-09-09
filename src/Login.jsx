import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginStep, setLoginStep] = useState('methods'); // 'methods' or 'thaid-qr'

  const simulateThaIDLogin = () => {
    // Mock user data returned from ThaID
    const mockUser = {
      cid: "1100500099999",
      name: "สมชาย ใจดี",
      role: "dentist",
      hospital: "โรงพยาบาลสาธิต"
    };
    onLogin(mockUser);
  };

  return (
    <div className="hdc-login-container">
      {/* ฝั่งซ้าย: Logo */}
      <div className="hdc-left">
        <div className="hdc-logo-wrapper">
          <div className="hdc-logo-top">
            OH
            <svg className="logo-medical-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 2v4c0 1.1-.9 2-2 2H5v2h4c1.1 0 2 .9 2 2v4h2v-4c0-1.1.9-2 2-2h4V8h-4c-1.1 0-2-.9-2-2V2h-2zm2 10c-1.1 0-2 .9-2 2v2H7v-2c0-1.1-.9-2-2-2H3v6h18v-6h-2c-1.1 0-2 .9-2 2v2h-4v-2c0-1.1-.9-2-2-2z"/>
            </svg>
            C<sup>TM</sup>
          </div>
          <div className="hdc-logo-text">ORAL HEALTH DATA CENTER</div>
        </div>
      </div>

      {/* ฝั่งขวา: Content */}
      <div className="hdc-right">
        {!isRegisterMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px' }}>
            
            {loginStep === 'methods' ? (
              <>
                <h3 style={{ width: '100%', borderBottom: '1px solid #E5E7EB', paddingBottom: '16px', marginBottom: '24px' }}>เข้าสู่ระบบ</h3>
                
                <div className="app-buttons">
                  <button className="app-btn thaid" onClick={() => setLoginStep('thaid-qr')} title="เข้าสู่ระบบด้วยแอปพลิเคชัน ThaID">
                    {/* ThaID Mock Logo */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                    </svg>
                    <span>ThaID</span>
                  </button>

                  <button className="app-btn mymoph" onClick={() => alert('ฟังก์ชัน MyMOPH อยู่ระหว่างการพัฒนา')} title="เข้าสู่ระบบด้วยแอปพลิเคชัน MyMOPH">
                    {/* MyMOPH Mock Logo */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                    <span>MyMOPH</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="thaid-card">
                <div className="thaid-header">
                  <div style={{ fontSize: '18px', fontWeight: '500' }}>เข้าสู่ระบบ</div>
                  <h2>ด้วย ThaID</h2>
                  <div className="thaid-subtitle">บริการคลังข้อมูลสุขภาพ</div>
                  <p>หมดเวลาใน : 00:52</p>
                </div>

                <div className="thaid-qr-section" onClick={simulateThaIDLogin} title="คลิกเพื่อจำลองการสแกนผ่านแอป ThaID">
                  <div className="thaid-qr-box">
                    <svg className="qr-svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-3 0h2v2h-2v-2z" />
                    </svg>
                    {/* Mock Logo in center of QR */}
                    <div style={{ position: 'absolute', backgroundColor: 'white', padding: '4px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', color: '#1E3A8A' }}>Tha<span style={{color: '#FACC15'}}>ID</span></div>
                  </div>
                  <div className="scan-hint">คลิกสแกนเพื่อจำลองการเข้าสู่ระบบ</div>
                </div>

                <div className="thaid-footer">
                  <div className="thaid-ref">หมายเลขอ้างอิง : FEHWEU</div>
                  <div className="thaid-desc">คิวอาร์โค้ดนี้เป็นสิ่งยืนยันตนทางดิจิทัล ออกให้โดย<br/>กรมการปกครอง กระทรวงมหาดไทย</div>
                  <div className="thaid-version">v.1.4.0</div>
                </div>
                
                <button className="back-btn" style={{ marginTop: '16px', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => setLoginStep('methods')}>
                  ยกเลิก
                </button>
              </div>
            )}

            <div className="register-link-row" style={{ width: '100%', maxWidth: '320px', marginTop: loginStep === 'methods' ? '0' : '24px' }}>
              <div className="register-link">
                ยังไม่มีบัญชีเข้าใช้งาน ? <span onClick={() => setIsRegisterMode(true)}>ลงทะเบียน</span>
              </div>
            </div>

            <div className="info-links" style={{ width: '100%', maxWidth: '320px' }}>
              <div className="info-link">
                <div className="icon-box thaid-sm">ThaID</div>
                ThaID คืออะไร ดูรายละเอียดเพิ่มเติม
              </div>
              <div className="info-link">
                <div className="icon-box mymoph-sm">My</div>
                MyMOPH คืออะไร ดูรายละเอียดเพิ่มเติม
              </div>
            </div>
          </div>
        ) : (
          <div className="register-mode">
            <div className="map-pin-icon">
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            
            <h2>กรุณาลงทะเบียนใช้งาน<br/>ที่ <span>OHDC จังหวัด</span></h2>
            <p>โปรดระบุ URL ของจังหวัดที่ท่านต้องการลงทะเบียน เช่น<br/><strong>https://ohdc.anamai.moph.go.th/xxx</strong> (รหัสจังหวัด)</p>
            
            <div style={{ margin: '24px 0', borderBottom: '1px solid #E5E7EB', width: '60%' }}></div>

            <div className="steps-container">
              <div className="step-item">
                <div className="step-circle">1</div>
                <div className="step-text">เข้าเว็บไซต์ OHDC<br/>ประจำจังหวัดที่ต้องการ<br/>ลงทะเบียน</div>
              </div>
              <div className="step-arrow">›</div>
              <div className="step-item">
                <div className="step-circle">2</div>
                <div className="step-text">ลงทะเบียน<br/>พร้อมแนบเอกสาร</div>
              </div>
              <div className="step-arrow">›</div>
              <div className="step-item">
                <div className="step-circle">3</div>
                <div className="step-text">รอการอนุมัติสิทธิ์<br/>เข้าใช้งานระบบ</div>
              </div>
            </div>

            <button className="back-btn" onClick={() => setIsRegisterMode(false)}>
              กลับไปหน้าเข้าสู่ระบบ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
