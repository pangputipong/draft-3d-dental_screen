import React from 'react';
import { STATUS_OPTIONS } from './OdontogramEditor';

export default function OralHealthReport({ patient, findings, sharedData, onClose }) {
  const today = new Date().toLocaleDateString('en-US');

  // Calculate age from dob
  let patientAge = '35'; // default
  if (patient?.dob) {
    const birthDate = new Date(patient.dob);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference); 
    patientAge = Math.abs(ageDate.getUTCFullYear() - 1970).toString();
  } else if (patient?.age) {
    patientAge = patient.age;
  }

  // Extract real images from sharedData if available
  let scanImages = [];
  if (sharedData) {
    const archData = sharedData.upper || sharedData.lower;
    if (archData && archData.images && archData.images.length > 0) {
      scanImages = archData.images.map(img => ({
        label: img.name.replace(/_/g, ' '),
        url: img.url
      }));
    }
  }

  // Fallback to more realistic placeholders if no real images exist
  if (scanImages.length === 0) {
    scanImages = [
      { label: 'Front', url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=300&q=80' },
      { label: 'Left Side', url: 'https://images.unsplash.com/photo-1598256989800-fea5f610332a?auto=format&fit=crop&w=300&q=80' },
      { label: 'Right Side', url: 'https://images.unsplash.com/photo-1598256989800-fea5f610332a?auto=format&fit=crop&w=300&q=80' },
      { label: 'Upper Jaw', url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=300&q=80' },
      { label: 'Lower Jaw', url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=300&q=80' }
    ];
  }

  const findingsByCondition = {};
  Object.entries(findings).forEach(([tooth, data]) => {
    data.conditions.forEach(cond => {
      if (!findingsByCondition[cond]) findingsByCondition[cond] = [];
      findingsByCondition[cond].push({ tooth, note: data.note });
    });
  });

  const ToothIcon = ({ color, isUpper, isHighlighted, opacity }) => {
    return (
      <svg width="24" height="40" viewBox="0 0 24 40" style={{ transform: isUpper ? 'scaleY(-1)' : 'none', opacity: opacity, filter: isHighlighted ? 'drop-shadow(0px 0px 3px rgba(0,0,0,0.2))' : 'none' }}>
        <path 
          d="M 5,20 C 5,10 10,0 12,0 C 14,0 19,10 19,20 C 22,22 22,35 12,38 C 2,35 2,22 5,20 Z" 
          fill={color} 
          stroke={color !== '#E5E7EB' ? 'none' : '#9CA3AF'} 
          strokeWidth="1"
        />
        <path d="M 12,20 L 12,38" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
      </svg>
    );
  };

  const renderMiniOdontogram = (highlightedCondition = null) => {
    const PERMANENT_TEETH = {
      UR: [18, 17, 16, 15, 14, 13, 12, 11],
      UL: [21, 22, 23, 24, 25, 26, 27, 28],
      LR: [48, 47, 46, 45, 44, 43, 42, 41],
      LL: [31, 32, 33, 34, 35, 36, 37, 38]
    };

    const renderQuadrant = (teeth, isUpper) => (
      <div style={{ display: 'flex', gap: '4px' }}>
        {teeth.map(t => {
          const tData = findings[t] || { conditions: [] };
          let isHighlighted = false;
          let color = '#E5E7EB'; 

          if (highlightedCondition) {
             if (tData.conditions.includes(highlightedCondition)) {
                 const opt = STATUS_OPTIONS.find(o => o.id === highlightedCondition);
                 color = opt ? opt.color : color;
                 isHighlighted = true;
             }
          } else {
             if (tData.conditions.length > 0) {
                 const opt = STATUS_OPTIONS.find(o => o.id === tData.conditions[0]);
                 color = opt ? opt.color : color;
             }
          }

          const opacity = (highlightedCondition && !isHighlighted) ? 0.3 : 1;

          return (
            <div key={t} style={{ width: '24px', display: 'flex', flexDirection: isUpper ? 'column' : 'column-reverse', alignItems: 'center' }}>
              <ToothIcon color={color} isUpper={isUpper} isHighlighted={isHighlighted} opacity={opacity} />
              <div style={{ fontSize: '10px', color: '#6B7280', margin: '4px 0', width: '18px', height: '18px', borderRadius: '50%', border: '1px solid #D1D5DB', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{t}</div>
            </div>
          );
        })}
      </div>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', margin: '20px 0' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          {renderQuadrant(PERMANENT_TEETH.UR, true)}
          <div style={{ width: '2px', backgroundColor: '#E5E7EB', alignSelf: 'stretch' }}></div>
          {renderQuadrant(PERMANENT_TEETH.UL, true)}
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          {renderQuadrant(PERMANENT_TEETH.LR, false)}
          <div style={{ width: '2px', backgroundColor: '#E5E7EB', alignSelf: 'stretch' }}></div>
          {renderQuadrant(PERMANENT_TEETH.LL, false)}
        </div>
      </div>
    );
  };

  const getToothImage = (toothId) => {
     // Match tooth ID to a mock real photo if it's a specific diagnostic page
     // In a real app, we would map the 3D annotation to the 2D frame.
     return `https://images.unsplash.com/photo-1598256989800-fea5f610332a?auto=format&fit=crop&w=400&q=80`;
  };

  return (
    <div className="report-wrapper" style={{ backgroundColor: '#fff', minHeight: '100vh', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999 }}>
      
      <div className="no-print" style={{ position: 'fixed', top: '20px', right: '20px', display: 'flex', gap: '10px', zIndex: 10000 }}>
        <button className="apple-btn" onClick={onClose} style={{ backgroundColor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>Close</button>
        <button className="apple-btn primary" onClick={() => window.print()} style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>Print / Save PDF</button>
      </div>

      {/* Page 1: Cover */}
      <div className="report-page cover-page" style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', padding: '60px', overflow: 'hidden' }}>
        <div className="cover-bg"></div>
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
           <h1 style={{ fontSize: '56px', color: '#1E3A8A', fontWeight: '800', marginBottom: '20px' }}>Oral health report</h1>
           <div style={{ fontSize: '24px', color: '#374151' }}>
             <p style={{ margin: '10px 0' }}>{patient?.fullName || 'Mr คณาธิป สุวรรณรัตน์'}</p>
             <p style={{ margin: '10px 0' }}>{today}</p>
             <p style={{ marginTop: '60px', borderTop: '1px solid #9CA3AF', width: '250px', paddingTop: '10px' }}>Doctor's Signature</p>
           </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#10B981', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '30px' }}>🏥</div>
          <div style={{ fontSize: '14px', color: '#374151' }}>
            <strong>กระทรวงสาธารณสุข</strong><br/>
            Department of Health
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* Page 2: Info & Overview */}
      <div className="report-page" style={{ padding: '60px', minHeight: '100vh', position: 'relative' }}>
        <div className="page-header-bg"></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🏥</div>
             <span style={{ fontSize: '14px', color: '#6B7280' }}>Department of Health</span>
           </div>
           <h2 style={{ fontSize: '24px', color: '#1F2937', margin: 0 }}>Oral health report</h2>
        </div>

        <h3 style={{ textAlign: 'center', color: '#374151', fontSize: '22px', borderBottom: '2px solid #E5E7EB', paddingBottom: '10px', margin: '40px 0' }}>Info</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', fontSize: '16px', color: '#4B5563' }}>
          <div><strong>Patient:</strong> <span style={{ marginLeft: '10px' }}>{patient?.fullName || 'Mr คณาธิป สุวรรณรัตน์'}</span></div>
          <div><strong>Age:</strong> <span style={{ marginLeft: '10px' }}>{patientAge}</span></div>
          <div><strong>Gender:</strong> <span style={{ marginLeft: '10px' }}>{patient?.gender === 'Male' ? 'ชาย (Male)' : (patient?.gender === 'Female' ? 'หญิง (Female)' : 'Male')}</span></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', fontSize: '16px', color: '#4B5563', marginTop: '20px' }}>
          <div><strong>Doctor:</strong> <span style={{ marginLeft: '10px' }}>Department of Health</span></div>
          <div><strong>Contact:</strong> <span style={{ marginLeft: '10px' }}>{patient?.phone || '08X-XXX-XXXX'}</span></div>
          <div><strong>Date:</strong> <span style={{ marginLeft: '10px' }}>{today}</span></div>
        </div>

        <h3 style={{ textAlign: 'center', color: '#374151', fontSize: '22px', borderBottom: '2px solid #E5E7EB', paddingBottom: '10px', marginTop: '60px' }}>Overview</h3>
        
        {renderMiniOdontogram()}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '60px' }}>
          {STATUS_OPTIONS.map(opt => (
            <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: opt.color }}></div>
              <span style={{ fontSize: '13px', color: '#4B5563' }}>{opt.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="page-break"></div>

      {/* Page 3: Scanning Data */}
      <div className="report-page" style={{ padding: '60px', minHeight: '100vh', position: 'relative' }}>
        <div className="page-header-bg"></div>
        <h3 style={{ textAlign: 'center', color: '#374151', fontSize: '22px', borderBottom: '2px solid #E5E7EB', paddingBottom: '10px', marginBottom: '60px' }}>Scanning data - Intraoral Scan Model</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', justifyContent: 'center' }}>
          {scanImages.slice(0,2).map((scan, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <img src={scan.url} alt={scan.label} style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
              <span style={{ color: '#4B5563', fontWeight: '500' }}>{scan.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', justifyContent: 'center', marginTop: '40px' }}>
          {scanImages.slice(2,4).map((scan, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <img src={scan.url} alt={scan.label} style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
              <span style={{ color: '#4B5563', fontWeight: '500' }}>{scan.label}</span>
            </div>
          ))}
        </div>
        {scanImages[4] && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '40px' }}>
            <img src={scanImages[4].url} alt={scanImages[4].label} style={{ width: '48%', height: '240px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
            <span style={{ color: '#4B5563', fontWeight: '500' }}>{scanImages[4].label}</span>
          </div>
        )}
      </div>

      {/* Pages 4+: Diagnostic Details */}
      {Object.entries(findingsByCondition).map(([conditionId, items], idx) => {
        const option = STATUS_OPTIONS.find(o => o.id === conditionId);
        if (!option) return null;

        return (
          <React.Fragment key={conditionId}>
            <div className="page-break"></div>
            <div className="report-page" style={{ padding: '60px', minHeight: '100vh', position: 'relative' }}>
              <div className="page-header-bg"></div>
              <h3 style={{ textAlign: 'center', color: '#374151', fontSize: '22px', borderBottom: '2px solid #E5E7EB', paddingBottom: '10px', marginBottom: '40px' }}>Diagnostic Details</h3>
              
              <div>
                <h4 style={{ borderLeft: `6px solid ${option.color}`, paddingLeft: '16px', color: '#111827', fontSize: '24px', margin: '0 0 40px 0' }}>
                  {option.label}
                </h4>
                
                {renderMiniOdontogram(conditionId)}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '60px' }}>
                  {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '4px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', color: '#1F2937' }}>{item.tooth}</div>
                        <img src={getToothImage(item.tooth)} alt={`Tooth ${item.tooth}`} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
                      </div>
                      <div style={{ fontSize: '15px', color: '#4B5563', backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '8px' }}>
                        <strong>Notes:</strong> {item.note || 'ไม่มีบันทึกเพิ่มเติม'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
