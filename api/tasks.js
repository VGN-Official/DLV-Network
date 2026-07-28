export default async function handler(req, res) {
  return res.status(200).json({
    success: true,
    tasks: [
      { id: 'DLV-0841', location: 'Abuja HQ Perimeter', reward: 1.0, desc: 'Verify NFC Gate Terminal signal.' },
      { id: 'DLV-0842', location: 'Sector 4 Relay Station', reward: 2.5, desc: 'Audit biometric terminal telemetry sync.' },
    ],
  });
}
