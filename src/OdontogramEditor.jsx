import React from 'react';

export const STATUS_OPTIONS = [
  { id: 'Healthy', label: 'Healthy teeth', color: '#10B981', category: 'normal' },
  { id: 'Normal', label: 'Normal teeth', color: '#9CA3AF', category: 'normal' },
  { id: 'Caries-Superficial', label: 'Caries-Superficial', color: '#34D399', category: 'caries' },
  { id: 'Caries-Deep', label: 'Caries-Deep', color: '#047857', category: 'caries' },
  { id: 'Filling', label: 'Filling', color: '#3B82F6', category: 'treated' },
  { id: 'Missing', label: 'Loss of teeth', color: '#EF4444', category: 'missing' },
  { id: 'Calculus', label: 'Dental calculus', color: '#6366F1', category: 'perio' },
  { id: 'Gingivitis', label: 'Gingivitis', color: '#2563EB', category: 'perio' },
  { id: 'Periodontitis', label: 'Periodontitis', color: '#DC2626', category: 'perio' },
  { id: 'Malocclusion', label: 'Malocclusion', color: '#F87171', category: 'other' },
  { id: 'Pigmentation', label: 'Pigmentation', color: '#92400E', category: 'other' },
  { id: 'Defect', label: 'Teeth defect', color: '#111827', category: 'other' },
  { id: 'Others', label: 'Others', color: '#14B8A6', category: 'other' }
];

const ToothIcon = ({ toothId, color, opacity, isSelected, onClick }) => {
  const isPrimary = [5,6,7,8].includes(Math.floor(toothId / 10));
  const isMaxilla = [1,2,5,6].includes(Math.floor(toothId / 10));
  
  // Custom tooth shapes using SVG paths to resemble actual dental chart
  const molarPath = isMaxilla 
    ? "M 4 8 Q 12 0 20 8 L 24 20 Q 24 32 12 32 Q 0 32 0 20 Z" 
    : "M 0 12 Q 0 0 12 0 Q 24 0 24 12 L 20 24 Q 12 32 4 24 Z";
  
  const incisorPath = isMaxilla
    ? "M 2 12 Q 12 0 22 12 L 18 28 Q 12 32 6 28 Z"
    : "M 6 4 Q 12 0 18 4 L 22 20 Q 12 32 2 20 Z";
    
  const getPath = () => {
     const digit = toothId % 10;
     if (digit >= 4) return molarPath;
     return incisorPath;
  };

  const scale = isPrimary ? 0.75 : 1;

  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: isMaxilla ? 'column' : 'column-reverse',
        alignItems: 'center',
        cursor: 'pointer',
        transform: 'scale(' + scale + ')',
        opacity: opacity,
        position: 'relative'
      }}
    >
      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
        {toothId}
      </span>
      <svg width="24" height="32" viewBox="0 0 24 32" style={{ 
         filter: isSelected ? 'drop-shadow(0px 0px 4px #2563EB)' : 'drop-shadow(0px 1px 2px rgba(0,0,0,0.2))',
         transform: (isSelected ? 'scale(1.1) ' : 'scale(1) ') + (isMaxilla ? '' : 'scaleY(-1)'),
         transition: 'all 0.2s'
      }}>
        <path d={getPath()} fill={color} stroke={color !== '#E5E7EB' ? '#111827' : '#9CA3AF'} strokeWidth="1" />
        <path d="M 12 8 L 12 24 M 4 16 L 20 16" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      </svg>
    </div>
  );
};

export default function OdontogramEditor({ findings, setFindings, selectedTooth, setSelectedTooth, patient, onSaveRecord }) {
  
  const toggleStatus = (toothId, statusId) => {
    setFindings(prev => {
      const toothData = prev[toothId] || { conditions: [], note: '' };
      const currentConditions = toothData.conditions;
      
      if (currentConditions.includes(statusId)) {
        const newConditions = currentConditions.filter(s => s !== statusId);
        if (newConditions.length === 0 && !toothData.note) {
          const newFindings = { ...prev };
          delete newFindings[toothId];
          return newFindings;
        }
        return { ...prev, [toothId]: { ...toothData, conditions: newConditions } };
      } else {
        return { ...prev, [toothId]: { ...toothData, conditions: [...currentConditions, statusId] } };
      }
    });
  };

  const updateNote = (toothId, noteText) => {
    setFindings(prev => {
      const toothData = prev[toothId] || { conditions: [], note: '' };
      if (toothData.conditions.length === 0 && noteText.trim() === '') {
          const newFindings = { ...prev };
          delete newFindings[toothId];
          return newFindings;
      }
      return { ...prev, [toothId]: { ...toothData, note: noteText } };
    });
  };

  const renderArch = (teethArray, isMaxilla, isPrimary) => {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: isPrimary ? '4px' : '2px',
        marginTop: isPrimary ? (isMaxilla ? '-10px' : '10px') : '0',
        marginBottom: isPrimary ? (isMaxilla ? '10px' : '-10px') : '0',
      }}>
        {teethArray.map(toothId => {
          const conditions = findings[toothId]?.conditions || [];
          let color = '#E5E7EB'; // default
          let opacity = 1;
          
          if (conditions.includes('Healthy')) color = '#10B981';
          else if (conditions.includes('Caries-Deep')) color = '#047857';
          else if (conditions.includes('Caries-Superficial')) color = '#34D399';
          else if (conditions.includes('Filling')) color = '#3B82F6';
          else if (conditions.includes('Missing')) { color = '#EF4444'; opacity = 0.3; }
          
          return (
            <div key={toothId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <div>
                  <ToothIcon 
                    toothId={toothId} 
                    color={color} 
                    opacity={opacity} 
                    isSelected={selectedTooth === toothId}
                    onClick={() => setSelectedTooth(toothId === selectedTooth ? null : toothId)}
                  />
               </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
         <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Odontogram Chart</h2>
         {onSaveRecord && (
           <button onClick={() => onSaveRecord(findings)} style={{ padding: '8px 16px', background: '#0071e3', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
             Save Record
           </button>
         )}
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
        {/* Left: Interactive Chart */}
        <div style={{ flex: 2, background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
          
          {/* Maxilla */}
          <div style={{ marginBottom: '40px' }}>
             <h3 style={{ textAlign: 'center', color: '#6B7280', marginBottom: '20px' }}>Maxilla (Upper)</h3>
             {renderArch([18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28], true, false)}
             <div style={{ height: '20px' }}></div>
             {renderArch([55,54,53,52,51, 61,62,63,64,65], true, true)}
          </div>

          {/* Mandible */}
          <div>
             {renderArch([85,84,83,82,81, 71,72,73,74,75], false, true)}
             <div style={{ height: '20px' }}></div>
             {renderArch([48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38], false, false)}
             <h3 style={{ textAlign: 'center', color: '#6B7280', marginTop: '40px' }}>Mandible (Lower)</h3>
          </div>

        </div>

        {/* Right: Details Panel */}
        <div style={{ flex: 1, background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
          {selectedTooth ? (
            <>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                Tooth {selectedTooth}
              </h3>
              
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {STATUS_OPTIONS.map(status => {
                    const isActive = findings[selectedTooth]?.conditions?.includes(status.id);
                    return (
                      <button
                        key={status.id}
                        onClick={() => toggleStatus(selectedTooth, status.id)}
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          border: isActive ? '2px solid ' + status.color : '1px solid #e5e7eb',
                          background: isActive ? '#f3f4f6' : 'white',
                          color: '#374151',
                          fontSize: '12px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: status.color }}></span>
                        {status.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Clinical Notes</label>
                <textarea
                  value={findings[selectedTooth]?.note || ''}
                  onChange={(e) => updateNote(selectedTooth, e.target.value)}
                  style={{
                    width: '100%',
                    height: '100px',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    resize: 'none',
                    fontSize: '14px'
                  }}
                  placeholder="Enter specific notes for this tooth..."
                />
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', textAlign: 'center' }}>
              <p>Select a tooth from the odontogram<br/>to edit findings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


