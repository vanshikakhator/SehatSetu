const express = require('express');
const router = express.Router();
const https = require('https');

const EMERGENCY_NUMBER = '8240909835';
const FAST2SMS_KEY = process.env.FAST2SMS_KEY || '';

/**
 * Send SMS via Fast2SMS (free Indian SMS API)
 * Docs: https://docs.fast2sms.com
 */
async function sendSMS(phoneNumber, message) {
  if (!FAST2SMS_KEY) {
    // Demo mode — log to console
    console.log(`\n🚨 [SOS DEMO] SMS to ${phoneNumber}:`);
    console.log(`   Message: ${message}\n`);
    return { success: true, demo: true };
  }

  return new Promise((resolve, reject) => {
    const encodedMsg = encodeURIComponent(message);
    const path = `/api/v1/send?authorization=${FAST2SMS_KEY}&message=${encodedMsg}&language=english&route=q&numbers=${phoneNumber}`;

    const options = {
      hostname: 'www.fast2sms.com',
      path,
      method: 'GET',
      headers: { 'cache-control': 'no-cache' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch {
          resolve({ success: true, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

// @route   POST /api/sos/alert
// @desc    Send SOS emergency SMS to 8240909835
router.post('/alert', async (req, res) => {
  const { patientName, patientId, location, healthRecord } = req.body;

  const bloodGroup = healthRecord?.bloodGroup || 'Unknown';
  const conditions = healthRecord?.conditions || 'None';
  const age = healthRecord?.age || 'Unknown';

  const message = `🚨 GRAMCARE SOS ALERT! Patient: ${patientName || 'Unknown'} (Age: ${age}, Blood: ${bloodGroup}). Conditions: ${conditions}. Location: ${location || 'Unknown'}. Please respond immediately!`;

  console.log(`\n🚨 SOS Alert triggered by ${patientName || patientId}`);

  try {
    const result = await sendSMS(EMERGENCY_NUMBER, message);
    res.json({
      success: true,
      demo: result.demo || false,
      message: `Emergency alert sent to ${EMERGENCY_NUMBER}`,
      details: result
    });
  } catch (err) {
    console.error('SOS SMS failed:', err);
    // Still return success to not block emergency UI
    res.json({
      success: true,
      demo: true,
      message: `Emergency alert logged (SMS service unavailable)`,
      error: err.message
    });
  }
});

module.exports = router;
