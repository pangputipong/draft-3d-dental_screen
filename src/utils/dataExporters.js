/**
 * Utility functions for exporting clinical dental data to standard formats.
 */

// ---------------------------------------------------------
// 1. มาตรฐาน 43 แฟ้ม (DENTAL File Structure - Mock)
// ---------------------------------------------------------
export const generate43FileDental = (records) => {
  // มาตรฐาน 43 แฟ้ม แฟ้ม DENTAL เป็น Text file คั่นด้วย Pipe '|'
  // โครงสร้างตัวอย่าง: HOSPCODE|PID|SEQ|DATE_SERV|DENTAL_CARIES|...
  let fileContent = 'HOSPCODE|PID|SEQ|DATE_SERV|DENTAL_CARIES|DENTAL_FILLING|DENTAL_MISSING|DENTAL_CALCULUS\n';
  
  records.forEach(record => {
    let cariesCount = 0;
    let fillingCount = 0;
    let missingCount = 0;
    let calculusCount = 0;

    // นับจำนวนจาก findings
    Object.values(record.findings).forEach(statusArray => {
      if (statusArray.includes('Caries')) cariesCount++;
      if (statusArray.includes('Filling')) fillingCount++;
      if (statusArray.includes('Missing')) missingCount++;
      if (statusArray.includes('Calculus')) calculusCount++;
    });

    const hospCode = '10999'; // รหัสสถานพยาบาลจำลอง
    const pid = record.patientId.replace(/-/g, ''); // เอาขีดออก
    const seq = '001';
    const dateServ = record.date.replace(/-/g, ''); // YYYYMMDD

    fileContent += `${hospCode}|${pid}|${seq}|${dateServ}|${cariesCount}|${fillingCount}|${missingCount}|${calculusCount}\n`;
  });

  return fileContent;
};

// ---------------------------------------------------------
// 2. มาตรฐาน HL7 FHIR (JSON Document - Mock)
// ---------------------------------------------------------
export const generateHL7FHIR = (records) => {
  // สร้าง FHIR Bundle ประกอบด้วย Patient และ Observation resources
  const bundle = {
    resourceType: "Bundle",
    type: "collection",
    entry: []
  };

  records.forEach(record => {
    // 1. Patient Resource
    bundle.entry.push({
      resource: {
        resourceType: "Patient",
        id: record.patientId,
        identifier: [{ system: "http://dopa.go.th/id", value: record.patientId }],
        name: [{ text: record.patientName }]
      }
    });

    // 2. Observation Resources (สำหรับฟันแต่ละซี่ที่มีปัญหา)
    Object.entries(record.findings).forEach(([tooth, statuses]) => {
      statuses.forEach(status => {
        let snomedCode = "";
        let display = "";

        if (status === 'Caries') { snomedCode = "109864003"; display = "Dental caries"; }
        else if (status === 'Filling') { snomedCode = "18632008"; display = "Dental restoration"; }
        else if (status === 'Missing') { snomedCode = "25540006"; display = "Missing tooth"; }
        else if (status === 'Calculus') { snomedCode = "12480004"; display = "Dental calculus"; }

        bundle.entry.push({
          resource: {
            resourceType: "Observation",
            status: "final",
            code: {
              coding: [{ system: "http://snomed.info/sct", code: snomedCode, display: display }]
            },
            subject: { reference: `Patient/${record.patientId}` },
            effectiveDateTime: record.date,
            bodySite: {
              coding: [{ system: "http://fdi.org/tooth", code: tooth, display: `Tooth ${tooth}` }]
            }
          }
        });
      });
    });
  });

  return JSON.stringify(bundle, null, 2); // Format ให้สวยงาม
};
