import React, { useState, useEffect } from 'react';
import { generate43FileDental, generateHL7FHIR } from './utils/dataExporters';
import { syncToHIS } from './services/apiClient';

export default function DataArchive() {
  const [dbRecords, setDbRecords] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAnonymized, setIsAnonymized] = useState(false);
  const [syncFormat, setSyncFormat] = useState('HL7'); // 'HL7' or '43F'
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/records`);
        if (res.ok) {
          const data = await res.json();
          // Transform to match existing UI structure
          const formattedData = data.map(record => {
             const findingsDict = {};
             record.findings.forEach(f => {
               findingsDict[f.tooth_number] = f.conditions.split(',');
             });
             return {
                id: record.id,
                date: new Date(record.timestamp).toISOString().split('T')[0],
                patientId: record.patient ? record.patient.hn : `ID-${record.patient_id}`,
                patientName: record.patient ? `${record.patient.firstName} ${record.patient.lastName}` : "Patient " + record.patient_id,
                findings: findingsDict,
                syncStatus: 'pending' // Default
             };
          });
          setDbRecords(formattedData);
        }
      } catch (err) {
        console.error("Failed to fetch records from DB:", err);
      }
    };
    fetchRecords();
  }, []);

  // Filter by date
  const filteredData = dbRecords.filter(record => {
    if (startDate && record.date < startDate) return false;
    if (endDate && record.date > endDate) return false;
    return true;
  });

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredData.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSyncOHPD = async () => {
    if (selectedIds.length === 0) return;
    
    setIsSyncing(true);
    
    try {
      // 1. Prepare Data
      const recordsToSync = dbRecords.filter(r => selectedIds.includes(r.id));
      let payload = '';
      
      if (syncFormat === 'HL7') {
        payload = generateHL7FHIR(recordsToSync);
      } else {
        payload = generate43FileDental(recordsToSync);
      }
      
      // 2. Mock API Call
      await syncToHIS(payload, syncFormat, isAnonymized);
      
      // 3. Update State on Success
      const updated = dbRecords.map(record => {
        if (selectedIds.includes(record.id)) {
          return { ...record, syncStatus: 'synced' };
        }
        return record;
      });
      setDbRecords(updated);
      setSelectedIds([]);
      alert(`[Secure] สำเร็จ! ข้อมูล ${selectedIds.length} รายการ ถูกส่งไปยัง HIS ด้วยมาตรฐาน ${syncFormat}`);
      
    } catch (error) {
      // 4. Update State on Fail
      console.error(error);
      const updated = dbRecords.map(record => {
        if (selectedIds.includes(record.id)) {
          return { ...record, syncStatus: 'failed' };
        }
        return record;
      });
      setDbRecords(updated);
      alert(`ผิดพลาด: ไม่สามารถเชื่อมต่อ HIS ได้ (${error.message})`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="archive-container">
      <div className="archive-header">
        <h2 className="archive-title">คลังข้อมูลผู้ป่วย (Data Archive)</h2>
        <div className="archive-controls">
          <div className="date-filter">
            <label>จากวันที่:</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <label>ถึงวันที่:</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          
          <select 
            value={syncFormat} 
            onChange={e => setSyncFormat(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #E5E7EB' }}
          >
            <option value="HL7">HL7 FHIR (JSON)</option>
            <option value="43F">43 แฟ้ม (DENTAL)</option>
          </select>
          
          <label className="anonymize-toggle" title="ลบชื่อและนามสกุลออก ส่งเพียงข้อมูลทางการแพทย์">
            <input type="checkbox" checked={isAnonymized} onChange={e => setIsAnonymized(e.target.checked)} />
            Send as Anonymous (PDPA)
          </label>
          
          <button 
            className="ohpd-btn" 
            onClick={handleSyncOHPD} 
            disabled={selectedIds.length === 0 || isSyncing}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            {isSyncing ? (
              <span>⏳ กำลังเข้ารหัสและส่ง...</span>
            ) : (
              <>
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '4px' }}>
                  <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                </svg>
                Sync OHPD
              </>
            )}
          </button>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === filteredData.length && filteredData.length > 0} 
                  onChange={toggleSelectAll} 
                />
              </th>
              <th>วันที่ตรวจ</th>
              <th>รหัสผู้ป่วย / ชื่อ-สกุล</th>
              <th>ผลสรุป (ฟันผุ/อุด/ถอน)</th>
              <th>สถานะ (Sync Status)</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
                  ไม่มีข้อมูลในช่วงเวลาที่เลือก
                </td>
              </tr>
            ) : (
              filteredData.map(record => (
                <tr key={record.id}>
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(record.id)}
                      onChange={() => toggleSelectRow(record.id)}
                    />
                  </td>
                  <td>{record.date}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{record.patientId}</div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>
                      {isAnonymized ? '***ปกปิดข้อมูล***' : record.patientName}
                    </div>
                  </td>
                  <td>
                    {Object.entries(record.findings).map(([tooth, status]) => (
                      <span key={tooth} style={{ marginRight: '8px', fontSize: '12px', background: '#E0F2FE', padding: '2px 6px', borderRadius: '4px', color: '#0369A1' }}>
                        ซี่ {tooth}: {status.join(', ')}
                      </span>
                    ))}
                    {Object.keys(record.findings).length === 0 && <span style={{ color: '#9CA3AF' }}>ไม่มีความผิดปกติ</span>}
                  </td>
                  <td>
                    <span className={`status-badge ${record.syncStatus}`}>
                      {record.syncStatus.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
