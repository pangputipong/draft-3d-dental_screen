import React from 'react';

export default function Dashboard({ user }) {
  // Mock data for dashboard
  const stats = {
    todayPatients: 15,
    pendingScans: 4,
    completedSyncs: 0,
    recentAlerts: 2
  };

  return (
    <div className="container" style={{ padding: '0px', width: '100%' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', backgroundColor: '#FFFFFF', padding: '24px 32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#2563EB', fontSize: '28px' }}>
            🏥
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px 0', color: '#111827', fontSize: '24px', fontWeight: '700' }}>{user?.hospital || 'หน่วยงานสาธารณสุข'}</h2>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '15px' }}>ยินดีต้อนรับ, ทพ. {user?.name || 'แพทย์'} | เข้าสู่ระบบล่าสุด: วันนี้ 08:30 น.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', borderRadius: '24px', fontWeight: '600', fontSize: '14px' }}>
            <span style={{ display: 'block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
            API เชื่อมต่อปกติ
          </span>
          <button className="apple-btn" style={{ padding: '8px 16px', fontSize: '14px' }}>ตั้งค่าระบบ</button>
        </div>
      </div>

      {/* 4 Stats Cards (Horizontal Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px', width: '100%' }}>
        
        {/* Card 1 */}
        <div className="apple-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1, color: '#3B82F6' }}>
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#3B82F6', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
            <div style={{ color: '#4B5563', fontSize: '13px', fontWeight: '600' }}>ประชาชนที่ได้รับการ scan ช่องปาก</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <div style={{ fontSize: '40px', fontWeight: '800', color: '#111827', lineHeight: '1' }}>{stats.todayPatients}</div>
            <div style={{ color: '#10B981', fontSize: '14px', fontWeight: '600' }}>↑ 12%</div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="apple-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1, color: '#F59E0B' }}>
             <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm1 16h-2v-2h2v2zm0-4h-2v-5h2v5z"/></svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div style={{ color: '#4B5563', fontSize: '14px', fontWeight: '600' }}>รอตรวจสอบผล</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <div style={{ fontSize: '40px', fontWeight: '800', color: '#111827', lineHeight: '1' }}>{stats.pendingScans}</div>
            <div style={{ color: '#D97706', fontSize: '14px', fontWeight: '600' }}>เคสฉุกเฉิน 1</div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="apple-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.2, color: 'white' }}>
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>ประชาชนที่ได้รับการยืนยันผล</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <div style={{ fontSize: '40px', fontWeight: '800', lineHeight: '1' }}>{stats.completedSyncs}</div>
            <div style={{ fontSize: '14px', fontWeight: '500', opacity: 0.9 }}>เคส</div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="apple-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1, color: '#EF4444' }}>
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F3E8FF', color: '#9333EA', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
            </div>
            <div style={{ color: '#4B5563', fontSize: '14px', fontWeight: '600' }}>จำนวนส่งข้อมูล PHR</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <div style={{ fontSize: '40px', fontWeight: '800', color: '#111827', lineHeight: '1' }}>{stats.recentAlerts}</div>
            <div style={{ color: '#9333EA', fontSize: '14px', fontWeight: '600' }}>รายการส่งสำเร็จ</div>
          </div>
        </div>
      </div>

      <div style={{ width: '100%' }}>
        {/* Main Chart Area - Full Width */}
        <div className="apple-card" style={{ padding: '0', overflow: 'hidden', width: '100%' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>สถิติการตรวจรักษา (รายสัปดาห์)</h3>
            <select style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', background: 'white', color: '#374151' }}>
              <option>สัปดาห์นี้</option>
              <option>เดือนนี้</option>
            </select>
          </div>
          <div style={{ padding: '32px 24px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '40px', left: '24px', right: '24px', bottom: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 0 }}>
              {[1,2,3,4,5].map(i => <div key={i} style={{ width: '100%', height: '1px', backgroundColor: '#F3F4F6' }}></div>)}
            </div>
            
            <div style={{ width: '100%', height: '320px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', position: 'relative', zIndex: 1, paddingBottom: '10px' }}>
               {[
                 { day: 'จันทร์', val1: 40, val2: 20 },
                 { day: 'อังคาร', val1: 60, val2: 35 },
                 { day: 'พุธ', val1: 45, val2: 25 },
                 { day: 'พฤหัสบดี', val1: 80, val2: 50 },
                 { day: 'ศุกร์', val1: 65, val2: 40 },
                 { day: 'เสาร์', val1: 30, val2: 15 },
                 { day: 'อาทิตย์', val1: 20, val2: 10 }
               ].map((data, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '280px', width: '40px', justifyContent: 'center' }}>
                      <div style={{ width: '24px', height: `${data.val1}%`, background: 'linear-gradient(to top, #3B82F6, #93C5FD)', borderRadius: '6px 6px 0 0', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)' }}></div>
                      <div style={{ width: '24px', height: `${data.val2}%`, background: 'linear-gradient(to top, #10B981, #6EE7B7)', borderRadius: '6px 6px 0 0', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}></div>
                    </div>
                    <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500' }}>{data.day}</span>
                  </div>
               ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '24px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#4B5563', fontWeight: '500' }}>
                 <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#3B82F6' }}></div>
                 ผู้ป่วยทั้งหมด
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#4B5563', fontWeight: '500' }}>
                 <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#10B981' }}></div>
                 เคสทำฟัน (Odontogram)
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
