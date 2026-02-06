export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      product,
      ram,
      username,
      password,
      duration,
      botType,
      targetNumber,
      experience,
      email,
      additionalInfo
    } = req.body;

    if (!product || !email) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return res.status(500).json({ error: 'Telegram env not set' });
    }

    const time = new Date().toLocaleString('id-ID', {
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const orderId = `ORD-${Date.now()}`;
    const maskedPassword = password ? '*'.repeat(password.length) : '-';

    const message = `
📦 ORDER BARU MASUK

🛒 Produk: ${product || '-'}

📡 RAM Panel: ${ram || '-'}
👤 Username: ${username || '-'}
🔑 Password: ${maskedPassword}
⏰ Durasi: ${duration || '-'}

🤖 Jenis Bot: ${botType || '-'}
🎯 Nomor Target: ${targetNumber || '-'}

📊 Pengalaman: ${experience || '-'}
📧 Email: ${email || '-'}
✉️ Info Tambahan: ${additionalInfo || '-'}

🆔 Order ID: ${orderId}
🕒 Waktu: ${time}
    `.trim();

    const tgRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message
        })
      }
    );

    if (!tgRes.ok) {
      throw new Error('Failed to send Telegram message');
    }

    return res.status(200).json({ success: true, orderId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
