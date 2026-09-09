/**
 * API Client for HIS Integration
 * Provides secure mock endpoints for demonstrating OHPD syncing.
 */

// Placeholder URL สำหรับ HIS API (รอ vendor ส่งให้)
const HIS_API_URL = 'https://api.hospital-demo.com/v1/his/dental';

export const syncToHIS = async (payload, standard, isAnonymized) => {
  // 1. จำลอง Network Delay (1.5 - 3 วินาที) เพื่อให้ UI ดูสมจริง
  const delay = Math.floor(Math.random() * 1500) + 1500;
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 2. จำลองการส่ง Headers ความปลอดภัย (Bearer Token)
      const mockHeaders = {
        'Content-Type': standard === 'HL7' ? 'application/fhir+json' : 'text/plain',
        'Authorization': 'Bearer xxxxx.yyyyy.zzzzz', // Secure Token
        'X-Client-ID': 'APP_DENTAL_3D'
      };

      console.log(`[API CLIENT] Sending POST to ${HIS_API_URL}`);
      console.log(`[API CLIENT] Headers:`, mockHeaders);
      console.log(`[API CLIENT] Payload Size: ${payload.length} bytes`);
      console.log(`[API CLIENT] Anonymized: ${isAnonymized}`);
      
      // 3. จำลองผลลัพธ์ (Success 90%, Fail 10%)
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        resolve({
          status: 200,
          message: 'Synced successfully to HIS',
          timestamp: new Date().toISOString()
        });
      } else {
        reject({
          status: 500,
          message: 'HIS Server Timeout or Validation Error',
          timestamp: new Date().toISOString()
        });
      }
    }, delay);
  });
};
