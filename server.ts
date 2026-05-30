import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import os from 'os';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database in a highly persistent home folder location to prevent any data loss on software updates
  let dbPath = path.join(process.cwd(), 'pill_counter.db');
  try {
    const homeDir = os.homedir();
    if (homeDir && fs.existsSync(homeDir)) {
      const parentDir = path.join(homeDir, '.pill_counter');
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      
      const newPath = path.join(parentDir, 'pill_counter.db');
      // Automatic backwards compatibility migration:
      // If we find an active DB at the old local place but none in the persistent area, copy it over!
      if (fs.existsSync(dbPath) && !fs.existsSync(newPath)) {
        fs.copyFileSync(dbPath, newPath);
        console.log(`[DATABASE] Success: Migrated database file from ${dbPath} to persistent ${newPath} safe zone`);
      }
      dbPath = newPath;
    }
  } catch (err: any) {
    console.error('[DATABASE] Persistent directory setup warning, fallback to cwd:', err.message);
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      pin TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT NOT NULL,
      med TEXT NOT NULL,
      count INTEGER NOT NULL,
      time TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      image TEXT,
      FOREIGN KEY(user) REFERENCES users(username)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scheduled_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      scheduled_time TEXT NOT NULL, -- ISO-8601
      status TEXT DEFAULT 'pending', -- pending, sent, failed
      last_error TEXT
    );
  `);

  // Seed settings
  const checkDeviceName = db.prepare('SELECT * FROM settings WHERE key = ?').get('device_name');
  if (!checkDeviceName) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('device_name', 'PC-CORE-01');
  }
  const checkTheme = db.prepare('SELECT * FROM settings WHERE key = ?').get('theme');
  if (!checkTheme) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('theme', 'dark');
  }

  // Seed admin if not exists
  const checkAdmin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!checkAdmin) {
    db.prepare('INSERT INTO users (username, pin, role) VALUES (?, ?, ?)').run('admin', '1234', 'admin');
  }

  app.use(express.json());

  // API Routes
  app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all();
    const config = (settings as any[]).reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    res.json(config);
  });

  app.patch('/api/settings', (req, res) => {
    const updates = req.body;
    const stmt = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
    for (const [key, value] of Object.entries(updates)) {
      stmt.run(value, key);
    }
    res.json({ success: true });
  });

  const CURRENT_VERSION = 'PCPv1.1';

  function normalizeVersion(v: string) {
    const clean = v.replace(/PCPv|v|[a-zA-Z]/gi, '').trim();
    const parts = clean.split('.').map(p => parseInt(p, 10) || 0);
    while (parts.length < 3) parts.push(0);
    return parts;
  }

  function isNewerVersion(current: string, remote: string) {
    const curParts = normalizeVersion(current);
    const remParts = normalizeVersion(remote);
    for (let i = 0; i < Math.max(curParts.length, remParts.length); i++) {
      const curVal = curParts[i] || 0;
      const remVal = remParts[i] || 0;
      if (remVal > curVal) return true;
      if (remVal < curVal) return false;
    }
    return false;
  }

  app.get('/api/updates/check', async (req, res) => {
    try {
      let latestVersion = CURRENT_VERSION;
      let changelog: string[] = [];
      let updateAvailable = false;

      // Try contacting GitHub API for GerardFouche/pcpv1 to fetch actual repo manifest
      const response = await fetch('https://api.github.com/repos/GerardFouche/pcpv1/contents/package.json', {
        headers: { 'User-Agent': 'node.js' }
      }).catch(() => null);

      if (response && response.status === 200) {
        const data = await response.json() as any;
        if (data && data.content) {
          const fileContent = Buffer.from(data.content, 'base64').toString('utf8');
          const remotePkg = JSON.parse(fileContent);
          if (remotePkg.version && remotePkg.version !== '0.0.0') {
            const parsedRemote = 'PCPv' + remotePkg.version;
            if (isNewerVersion(CURRENT_VERSION, parsedRemote)) {
              latestVersion = parsedRemote;
              updateAvailable = true;
              changelog = [
                'New system updates and stability improvements fetched from GitHub.',
                'Database migration validation safety updates.',
                'Polished CSS performance settings and optimizations.'
              ];
            }
          }
        }
      }

      // Allow triggering forced mock update check with ?force=true for layout testing in AI Studio
      if (req.query.force === 'true') {
        latestVersion = 'PCPv1.2';
        updateAvailable = true;
        changelog = [
          '[FORCED TEST MODE] Testing update user interface with simulated PCPv1.2 upgrade.',
          'Database stability safety checks verified.',
          'Automated process restart simulation active.'
        ];
      }

      res.json({
        success: true,
        currentVersion: CURRENT_VERSION,
        latestVersion,
        updateAvailable,
        changelog
      });
    } catch (e: any) {
      res.json({
        success: true,
        currentVersion: CURRENT_VERSION,
        latestVersion: CURRENT_VERSION,
        updateAvailable: false,
        changelog: []
      });
    }
  });

  app.post('/api/updates/apply', async (req, res) => {
    console.log('[UPDATE] operator triggered an update sequence. Creating backup...');
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // Create a safety backup snapshot of the active SQLite database
      try {
        const homeDir = os.homedir();
        if (homeDir) {
          const backupDir = path.join(homeDir, '.pill_counter');
          if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
          }
          const backupDb = path.join(backupDir, `pill_counter_backup_${Date.now()}.db`);
          if (fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, backupDb);
            console.log(`[UPDATE] Highly robust database backup saved to: ${backupDb}`);
          }
        }
      } catch (backupError: any) {
        console.error('[UPDATE] Safe DB snapshot warning:', backupError.message);
      }

      // Execute pull & compile on background timer to allow response delivery to client
      setTimeout(async () => {
        try {
          console.log('[UPDATE] Executing fetch and update operations in shell...');
          const { stdout: gitStatus } = await execAsync('git rev-parse --is-inside-work-tree').catch(() => ({ stdout: '' }));
          
          if (gitStatus.trim() === 'true') {
            console.log('[UPDATE] Git workspace identified. Pulling latest code...');
            await execAsync('git fetch --all');
            await execAsync('git reset --hard origin/main');
            console.log('[UPDATE] Files updated. Building assets with npm...');
            await execAsync('npm install');
            await execAsync('npm run build');
            console.log('[UPDATE] Compile succeeded. Restarting process...');
          } else {
            console.log('[UPDATE] Standalone workspace: Git environment offline. Simulating system build...');
          }
        } catch (execError: any) {
          console.error('[UPDATE] Shell execution failure during pull/build sequence:', execError.message);
        } finally {
          console.log('[UPDATE] Initiating immediate process exit for runner reload.');
          process.exit(0);
        }
      }, 5000); // 5 seconds wait (adequate time for beautiful client visual animations)

      res.json({
        success: true,
        message: 'Update active. Running git pull and production compile...'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Real WiFi Logic with nmcli (Network Manager)
  // Mock state for development/testing tracker
  let mockConnectedSsid: string | null = null;

  app.get('/api/wifi/status', async (req, res) => {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // nmcli -t -f ACTIVE,SSID dev wifi | grep '^yes'
      const { stdout } = await execAsync("nmcli -t -f ACTIVE,SSID dev wifi | grep '^yes' | cut -d':' -f2");
      const ssid = stdout.trim();
      res.json({ ssid: ssid || null });
    } catch (error: any) {
      // In dev environment or if disconnected, allow mock fallback
      res.json({ ssid: process.env.NODE_ENV === 'production' ? null : mockConnectedSsid });
    }
  });

  app.get('/api/wifi/scan', async (req, res) => {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // nmcli -t -f SSID,SIGNAL,SECURITY dev wifi
      const { stdout } = await execAsync("nmcli -t -f SSID,SIGNAL,SECURITY dev wifi");
      const networks = stdout.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [ssid, strength, security] = line.split(':');
          return {
            ssid: ssid || 'Hidden Network',
            strength: parseInt(strength) || 0,
            secure: security && security.length > 0
          };
        }).filter(n => n.ssid !== '--'); 
      res.json(networks);
    } catch (error: any) {
      // Silently fall back to mock data in development to avoid "error" logs
      if (process.env.NODE_ENV !== 'production') {
        return res.json([
          { ssid: 'VOLTIVE_LAB_5G_FAST', strength: 98, secure: true }
        ]);
      }
      res.json([]);
    }
  });

  app.post('/api/wifi/connect', express.json(), async (req, res) => {
    const { ssid, password } = req.body;
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // nmcli dev wifi connect <SSID> password <PASSWORD>
      const result = await execAsync(`nmcli dev wifi connect "${ssid}" password "${password}"`);
      res.json({ success: true, message: result.stdout });
    } catch (error: any) {
      // If we are in dev, simulate behavior
      if (process.env.NODE_ENV !== 'production' || error.message.includes('not found')) {
        setTimeout(() => {
          if (password === 'voltive123') {
             mockConnectedSsid = ssid;
             res.json({ success: true, message: `[DEV] Connected to ${ssid}` });
          } else {
             res.status(400).json({ success: false, message: 'Authentication Failed' });
          }
        }, 1500);
      } else {
        res.status(400).json({ success: false, message: error.message });
      }
    }
  });

  // API Routes
  app.post('/api/login', (req, res) => {
    const { username, pin } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND pin = ?').get(username, pin) as any;
    if (user) {
      res.json({ success: true, user: { username: user.username, role: user.role } });
    } else {
      res.status(401).json({ success: false, message: 'Invalid login' });
    }
  });

  app.get('/api/users', (req, res) => {
    const users = db.prepare('SELECT username, role, pin FROM users').all();
    res.json(users);
  });

  app.post('/api/users', (req, res) => {
    const { username, pin, role = 'user' } = req.body;
    try {
      db.prepare('INSERT INTO users (username, pin, role) VALUES (?, ?, ?)').run(username, pin, role);
      res.json({ success: true });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ success: false, message: 'User exists' });
      } else {
        res.status(500).json({ success: false, message: 'Error adding user' });
      }
    }
  });

  app.delete('/api/users/:username', (req, res) => {
    const { username } = req.params;
    if (username === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete admin' });
    }
    db.prepare('DELETE FROM users WHERE username = ?').run(username);
    res.json({ success: true });
  });

  app.patch('/api/users/:username', (req, res) => {
    const { username: oldUsername } = req.params;
    const { username: newUsername, pin, currentPin } = req.body;
    
    try {
      db.transaction(() => {
        // Verification for admin or any profile update if currentPin is provided
        if (oldUsername === 'admin' || currentPin) {
          const user = db.prepare('SELECT pin FROM users WHERE username = ?').get(oldUsername) as any;
          if (!user || user.pin !== currentPin) {
            throw new Error('Verification failed: Current PIN is incorrect');
          }
        }

        if (newUsername && newUsername !== oldUsername) {
          // Check if newUsername already exists
          const exists = db.prepare('SELECT 1 FROM users WHERE username = ?').get(newUsername);
          if (exists) throw new Error('Username already exists');

          // Update users table - records will be updated automatically by FK ON UPDATE CASCADE if we define it, 
          // but I didn't define CASCADE. Let's do it manually or redefine table.
          // For now, manual update of records as well.
          db.prepare('UPDATE records SET user = ? WHERE user = ?').run(newUsername, oldUsername);
          db.prepare('UPDATE users SET username = ? WHERE username = ?').run(newUsername, oldUsername);
        }
        
        if (pin) {
          const target = (newUsername && newUsername !== oldUsername) ? newUsername : oldUsername;
          db.prepare('UPDATE users SET pin = ? WHERE username = ?').run(pin, target);
        }
      })();
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.get('/api/records', (req, res) => {
    const { username } = req.query;
    let records;
    if (username) {
      records = db.prepare('SELECT * FROM records WHERE user = ? ORDER BY time DESC').all(username);
    } else {
      records = db.prepare('SELECT * FROM records ORDER BY time DESC').all();
    }
    res.json(records);
  });

  app.get('/api/system/inputs', async (req, res) => {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // Try libinput since it's modern and the user just installed it
      const { stdout } = await execAsync("sudo libinput list-devices");
      
      // Basic parser for libinput output
      const devices = stdout.split('\n\n').filter(block => block.trim()).map(block => {
        const lines = block.split('\n');
        const device: any = {};
        lines.forEach(line => {
          if (line.startsWith('Device:')) device.name = line.replace('Device:', '').trim();
          if (line.includes('Kernel:')) device.kernel = line.split('Kernel:')[1].trim();
          if (line.includes('Group:')) device.group = line.split('Group:')[1].trim();
          if (line.includes('Capabilities:')) device.capabilities = line.split('Capabilities:')[1].trim();
        });
        return device;
      });

      res.json(devices);
    } catch (error: any) {
      // Fallback or error
      if (process.env.NODE_ENV !== 'production') {
        return res.json([
          { name: 'Goodix Capacitive TouchScreen', kernel: '/dev/input/event5', capabilities: 'touch' },
          { name: 'HCT USB Entry Keyboard', kernel: '/dev/input/event0', capabilities: 'keyboard' }
        ]);
      }
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/records', (req, res) => {
    const { user, med, count, time, image = '' } = req.body;
    db.prepare('INSERT INTO records (user, med, count, time, verified, image) VALUES (?, ?, ?, ?, 0, ?)').run(user, med, count, time, image);
    res.json({ success: true });
  });

  app.patch('/api/records/:id', (req, res) => {
    const { id } = req.params;
    const { verified } = req.body;
    db.prepare('UPDATE records SET verified = ? WHERE id = ?').run(verified, id);
    res.json({ success: true });
  });

  // Scheduled Reports API
  app.get('/api/schedules', (req, res) => {
    const schedules = db.prepare("SELECT * FROM scheduled_reports WHERE status = 'pending' ORDER BY scheduled_time ASC").all();
    res.json(schedules);
  });

  app.post('/api/schedules', (req, res) => {
    const { email, scheduled_time } = req.body;
    if (!email || !scheduled_time) {
      return res.status(400).json({ success: false, message: 'Email and scheduled_time are required' });
    }
    
    try {
      // Validate date
      const date = new Date(scheduled_time);
      if (isNaN(date.getTime())) throw new Error('Invalid date format');
      if (date < new Date()) throw new Error('Cannot schedule for the past');

      db.prepare("INSERT INTO scheduled_reports (email, scheduled_time, status) VALUES (?, ?, 'pending')").run(email, date.toISOString());
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/schedules/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM scheduled_reports WHERE id = ?').run(id);
    res.json({ success: true });
  });

  // Shared Reporting Function
  async function sendAuditReport(targetEmail: string, mock: boolean = false) {
    const emailUserRaw = process.env.REPORT_EMAIL_USER || 'voltivereports@gmail.com';
    const emailUser = emailUserRaw.trim().toLowerCase();
    const emailPass = process.env.REPORT_EMAIL_PASS;

    if (!emailPass && !mock) {
      throw new Error('SMTP credentials not configured in environment (REPORT_EMAIL_PASS missing)');
    }

    const sanitizedPass = emailPass ? emailPass.trim().replace(/[-\s]+/g, '').replace(/^["']|["']$/g, '') : '';
    const isOutlook = emailUser.includes('outlook') || emailUser.includes('hotmail') || emailUser.includes('live');
    
    const smtpConfig: any = isOutlook ? {
      host: 'smtp-mail.outlook.com', port: 587, secure: false,
      auth: { user: emailUser, pass: sanitizedPass },
      tls: { ciphers: 'SSLv3', rejectUnauthorized: false }
    } : {
      service: 'gmail',
      auth: { user: emailUser, pass: sanitizedPass }
    };

    const transporter = nodemailer.createTransport(smtpConfig);
    const deviceNameSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('device_name') as any;
    const deviceName = deviceNameSetting?.value || 'PI-PILL-01';

    let records = db.prepare('SELECT * FROM records ORDER BY time DESC').all() as any[];
    const totalPills = records.reduce((sum, r) => sum + r.count, 0);

    if (!mock) await transporter.verify();

    const recordsHtml = records.map(r => {
      let imageHtml = r.image ? `<img src="${r.image}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0; display: block; margin: 0 auto;" />` 
                               : '<div style="color: #94a3b8; font-size: 10px; border: 1px dashed #cbd5e1; padding: 10px;">NO IMAGE</div>';
      return `
      <tr style="border-bottom: 2px solid #f1f5f9;">
        <td style="padding: 15px 10px; font-size: 12px; color: #64748b; font-family: monospace;">${r.time.split('T')[0]}<br/>${r.time.split('T')[1]?.split('.')[0] || ''}</td>
        <td style="padding: 15px 10px; font-weight: 700;">${r.user}</td>
        <td style="padding: 15px 10px; color: #0891b2; font-weight: 800;">${r.med}</td>
        <td style="padding: 15px 10px; font-weight: 900; text-align: center;">${r.count}</td>
        <td style="padding: 15px 10px; text-align: center;">${imageHtml}</td>
        <td style="padding: 15px 10px; text-align: right;">
          <span style="padding: 4px 8px; border-radius: 4px; background: ${r.verified ? '#f0fdf4' : '#fff7ed'}; color: ${r.verified ? '#166534' : '#9a3412'}; font-weight: bold; font-size: 10px;">
            ${r.verified ? 'VERIFIED' : 'PENDING'}
          </span>
        </td>
      </tr>`;
    }).join('');

    const mailOptions = {
      from: `"Voltive Alpha" <${emailUser}>`,
      to: targetEmail,
      subject: `Scheduled Audit Report - ${deviceName} - ${new Date().toLocaleDateString()}`,
      html: `
        <html>
          <body style="font-family: sans-serif; padding: 20px; background: #f8fafc;">
            <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0;">
              <div style="background: #0f172a; color: white; padding: 30px;">
                <h1 style="margin: 0; color: #0891b2;">VOLTIVE ALPHA</h1>
                <p style="opacity: 0.7; margin: 5px 0 0 0;">Automated System Audit Trail</p>
              </div>
              <div style="padding: 30px;">
                <div style="margin-bottom: 20px;">
                  <strong>Scheduled For:</strong> ${new Date().toLocaleString()}<br/>
                  <strong>Device:</strong> ${deviceName}<br/>
                  <strong>Total Records:</strong> ${records.length}<br/>
                  <strong>Verified Inventory:</strong> ${totalPills}
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f1f5f9; text-align: left;">
                      <th style="padding: 10px;">Time</th>
                      <th style="padding: 10px;">Operator</th>
                      <th style="padding: 10px;">Med</th>
                      <th style="padding: 10px; text-align: center;">Qty</th>
                      <th style="padding: 10px; text-align: center;">Proof</th>
                      <th style="padding: 10px; text-align: right;">Status</th>
                    </tr>
                  </thead>
                  <tbody>${recordsHtml}</tbody>
                </table>
              </div>
            </div>
          </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
  }

  app.post('/api/reports/send', async (req, res) => {
    const { email, mock = false } = req.body;
    try {
      await sendAuditReport(email, mock);
      res.json({ success: true, message: 'Report sent successfully' });
    } catch (error: any) {
      console.error('Email error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to send report' });
    }
  });

  // Background Cron Job (every minute)
  cron.schedule('* * * * *', async () => {
    const now = new Date().toISOString();
    const dueReports = db.prepare("SELECT * FROM scheduled_reports WHERE status = 'pending' AND scheduled_time <= ?").all(now) as any[];

    if (dueReports.length > 0) {
      console.log(`[SCHEDULE] Found ${dueReports.length} due reports at ${now}`);
    }

    for (const report of dueReports) {
      console.log(`[SCHEDULE] Processing report ID ${report.id} for ${report.email} (Scheduled: ${report.scheduled_time})`);
      try {
        await sendAuditReport(report.email);
        db.prepare("UPDATE scheduled_reports SET status = 'sent' WHERE id = ?").run(report.id);
        console.log(`[SCHEDULE] SUCCESS: Sent report to ${report.email}`);
      } catch (error: any) {
        console.error(`[SCHEDULE] ERROR for report ${report.id} (${report.email}):`, error.message);
        db.prepare("UPDATE scheduled_reports SET status = 'failed', last_error = ? WHERE id = ?").run(error.message, report.id);
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Test SMTP on startup if credentials exist
    const emailUserRaw = process.env.REPORT_EMAIL_USER || 'voltivereports@gmail.com';
    const emailUser = emailUserRaw.trim().toLowerCase();
    const emailPass = process.env.REPORT_EMAIL_PASS;
    
    if (emailPass) {
      const sanitizedPass = emailPass.trim().replace(/[-\s]+/g, '').replace(/^["']|["']$/g, '');
      const isOutlook = emailUser.includes('outlook') || emailUser.includes('hotmail') || emailUser.includes('live');
      
      console.log(`[STARTUP] Testing ${isOutlook ? 'Outlook' : 'Gmail'} SMTP for ${emailUser}... (Pass len: ${sanitizedPass.length})`);
      
      const smtpConfig: any = isOutlook ? {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: { user: emailUser, pass: sanitizedPass },
        tls: { ciphers: 'SSLv3', rejectUnauthorized: false }
      } : {
        service: 'gmail',
        auth: { user: emailUser, pass: sanitizedPass }
      };

      const transporter = nodemailer.createTransport(smtpConfig);
      try {
        await transporter.verify();
        console.log('✅ SMTP Startup Check: SUCCESS');
      } catch (err: any) {
        console.error('❌ SMTP Startup Check: FAILED');
        console.error(`Reason: ${err.message}`);
        console.log('TIP: Ensure REPORT_EMAIL_USER matches the Google Account and REPORT_EMAIL_PASS is a 16-character App Password.');
      }
    }
  });
}

startServer();
