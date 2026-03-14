const express = require('express');
const router = express.Router();
const pool = require('../db'); 
const bcrypt = require('bcrypt');
const puppeteer = require('puppeteer');

// --- Middlewares ---
function requireRole(roles) {
    return (req, res, next) => {
        const user = req.session?.user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        if (!roles.includes(user.role)) return res.status(403).json({ error: 'Forbidden' });
        next();
    };
}

function requireSection(section) {
    return (req, res, next) => {
        const user = req.session?.user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        if (user.role === 'super_admin') return next();
        if (user.role === 'analyst' && (user.permissions || []).includes(section)) return next();
        return res.status(403).json({ error: `Forbidden: No access to ${section}` });
    };
}

function parseUA(ua) {
    if (!ua || ua === 'Unknown') return 'Unknown';
    let browser = 'Other', os = 'Unknown OS';
    if (ua.includes('Win')) os = 'Windows'; else if (ua.includes('Mac')) os = 'MacOS';
    if (ua.includes('Firefox')) browser = 'Firefox'; else if (ua.includes('Chrome')) browser = 'Chrome'; else if (ua.includes('Safari')) browser = 'Safari';
    return `${browser} (${os})`;
}

// --- Auth Routes ---
router.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length === 0 || !(await bcrypt.compare(password, rows[0].password_hash))) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        const user = rows[0];
        req.session.user = { id: user.id, email: user.email, displayName: user.display_name, role: user.role || 'viewer', permissions: user.permissions || [] };
        req.session.save((err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true, data: req.session.user });
        });
    } catch (err) { res.status(500).json({ success: false }); }
});

router.post('/api/logout', (req, res) => {
    req.session.destroy(() => { res.clearCookie('connect.sid'); res.json({ success: true }); });
});

// --- Dashboard Routes ---
router.get('/api/dashboard', requireRole(['super_admin', 'analyst']), async (req, res) => {
    const start = req.query.start || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const end = req.query.end || new Date().toISOString().slice(0, 10);
    try {
        const mainQuery = `SELECT COUNT(*) FILTER (WHERE event_type = 'pageview')::int AS total_pageviews, COUNT(DISTINCT session_id)::int AS total_sessions, COUNT(*) FILTER (WHERE event_type = 'error')::int AS total_errors, COALESCE(ROUND(AVG(load_time_ms)), 0)::int AS avg_load_time_ms FROM events WHERE received_at >= $1::date AND received_at < $2::date + interval '1 day'`;
        const uaQuery = `SELECT COALESCE(user_agent, payload->>'userAgent', 'Unknown') AS raw_ua FROM events WHERE event_type = 'pageview' AND received_at >= $1::date AND received_at < $2::date + interval '1 day'`;
        const [mainResult, uaRawResult, recentResult] = await Promise.all([ pool.query(mainQuery, [start, end]), pool.query(uaQuery, [start, end]), pool.query(`SELECT event_type, url, received_at FROM events ORDER BY received_at DESC LIMIT 5`) ]);
        
        const uaCounts = {};
        uaRawResult.rows.forEach(row => { const cleanName = parseUA(row.raw_ua); uaCounts[cleanName] = (uaCounts[cleanName] || 0) + 1; });
        
        res.json({ success: true, user: req.session.user, ...mainResult.rows[0], user_agents: Object.entries(uaCounts).map(([browser, count]) => ({ browser, count })).sort((a, b) => b.count - a.count).slice(0, 5), recent_events: recentResult.rows });
    } catch (err) { res.status(500).json({ error: 'db_error' }); }
});

router.get('/api/pageviews', requireRole(['super_admin', 'analyst']), async (req, res) => {
    const start = req.query.start || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const end = req.query.end || new Date().toISOString().slice(0, 10);
    try {
        const byDayResult = await pool.query(`SELECT TO_CHAR(received_at, 'YYYY-MM-DD') AS day, COUNT(*)::int AS views FROM events WHERE event_type = 'pageview' AND received_at >= $1::date AND received_at < $2::date + interval '1 day' GROUP BY day ORDER BY day ASC`, [start, end]);
        res.json({ byDay: byDayResult.rows });
    } catch (err) { res.status(500).json({ error: 'db_error' }); }
});

router.get('/api/performance', requireSection('performance'), async (req, res) => {
    const start = req.query.start || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const end = req.query.end || new Date().toISOString().slice(0, 10);
    try {
        const byPageQuery = `SELECT url, COUNT(*)::int AS samples, ROUND(AVG(load_time_ms))::int AS avg_load_ms, ROUND(AVG(ttfb_ms))::int AS avg_ttfb_ms, ROUND(AVG(lcp_ms))::int AS avg_lcp, ROUND(AVG(cls), 3) AS avg_cls, ROUND(AVG(inp_ms))::int AS avg_inp FROM events WHERE event_type = 'pageview' AND (load_time_ms IS NOT NULL OR ttfb_ms IS NOT NULL OR lcp_ms IS NOT NULL) AND received_at >= $1::date AND received_at < $2::date + interval '1 day' GROUP BY url ORDER BY avg_load_ms DESC NULLS LAST LIMIT 50`;
        const byDayQuery = `SELECT TO_CHAR(received_at, 'YYYY-MM-DD HH24:00') AS day, ROUND(AVG(load_time_ms))::int AS avg_load_ms, ROUND(AVG(ttfb_ms))::int AS avg_ttfb_ms FROM events WHERE event_type = 'pageview' AND load_time_ms IS NOT NULL AND received_at >= $1::date AND received_at < $2::date + interval '1 day' GROUP BY TO_CHAR(received_at, 'YYYY-MM-DD HH24:00') ORDER BY day ASC`;
        const [pageResult, dayResult] = await Promise.all([pool.query(byPageQuery, [start, end]), pool.query(byDayQuery, [start, end])]);
        res.json({ success: true, data: { byPage: pageResult.rows, byDay: dayResult.rows } });
    } catch (err) { res.status(500).json({ error: 'db_error' }); }
});

router.get('/api/errors', requireSection('errors'), async (req, res) => {
    const start = req.query.start || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const end = req.query.end || new Date().toISOString().slice(0, 10);
    try {
        const tableQuery = `SELECT received_at, url, payload FROM events WHERE event_type = 'error' AND received_at >= $1::date AND received_at < $2::date + interval '1 day' ORDER BY received_at DESC LIMIT 50`;
        const timeQuery = `SELECT TO_CHAR(received_at, 'YYYY-MM-DD') AS time_bucket, COUNT(*)::int as count FROM events WHERE event_type = 'error' AND received_at >= $1::date AND received_at < $2::date + interval '1 day' GROUP BY time_bucket ORDER BY time_bucket ASC`;
        const topErrorsQuery = `SELECT COALESCE(payload->'error'->>'message', payload->>'message', 'Unknown Error') AS error_message, COUNT(*)::int as count FROM events WHERE event_type = 'error' AND received_at >= $1::date AND received_at < $2::date + interval '1 day' GROUP BY error_message ORDER BY count DESC LIMIT 5`;
        const [tableRes, timeRes, topRes] = await Promise.all([pool.query(tableQuery, [start, end]), pool.query(timeQuery, [start, end]), pool.query(topErrorsQuery, [start, end])]);
        res.json({ success: true, recent: tableRes.rows, overTime: timeRes.rows, topErrors: topRes.rows });
    } catch (err) { res.status(500).json({ error: 'db_error' }); }
});

router.get('/api/sessions', requireSection('sessions'), async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT session_id, COUNT(*)::int as event_count, MAX(received_at) as last_event FROM events GROUP BY session_id ORDER BY last_event DESC LIMIT 20`);
        res.json({ success: true, sessions: rows });
    } catch (err) { res.status(500).json({ error: 'db_error' }); }
});

router.get('/api/session/:id', requireSection('sessions'), async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT event_type, url, received_at, payload, user_agent, load_time_ms, ttfb_ms FROM events WHERE session_id = $1 ORDER BY received_at ASC`, [req.params.id]);
        res.json({ success: true, events: rows });
    } catch (err) { res.status(500).json({ error: 'db_error' }); }
});

// --- Reports API ---
router.get('/api/reports', requireRole(['super_admin', 'analyst', 'viewer']), async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT r.id, r.title, r.category, r.created_at, u.display_name as author FROM reports r JOIN users u ON r.created_by = u.id ORDER BY r.id DESC`);
        res.json({ success: true, reports: rows });
    } catch (err) { res.status(500).json({ error: 'db_error' }); }
});

router.post('/api/reports', requireRole(['super_admin', 'analyst']), async (req, res) => {
    const { title, category, table_data, analyst_comments } = req.body;
    try {
        await pool.query(`INSERT INTO reports (title, category, table_data, analyst_comments, created_by) VALUES ($1, $2, $3, $4, $5)`, [title, category, JSON.stringify(table_data), analyst_comments, req.session.user.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'db_error' }); }
});

router.get('/api/reports/:id/export', requireRole(['super_admin', 'analyst', 'viewer']), async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT r.*, u.display_name FROM reports r JOIN users u ON r.created_by = u.id WHERE r.id = $1', [req.params.id]);
        if (!rows.length) return res.status(404).send('Report not found');
        const report = rows[0];

        const categoryRouteMap = {
            'Performance': '#/performance',
            'Errors': '#/errors',
            'Sessions': '#/sessions',
            'Overview': '#/overview',
        };
        const hash = categoryRouteMap[report.category] || '#/overview';

        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1.5 });

        // Forward session cookie
        const sessionCookie = req.headers.cookie;
        if (sessionCookie) {
            const cookies = sessionCookie.split(';').map(c => {
                const [name, ...rest] = c.trim().split('=');
                return { name: name.trim(), value: rest.join('='), domain: 'localhost' };
            });
            await page.setCookie(...cookies);
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        await page.goto(`${baseUrl}/dashboard.html${hash}`, { waitUntil: 'networkidle0', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2500));

        // Fix layout + inject analyst insights banner
        await page.evaluate((reportData) => {
            // Hide header and sidebar using correct Bootstrap dashboard class names
            const header = document.querySelector('.app-header');
            const sidebar = document.querySelector('.app-sidebar');
            if (header) header.style.display = 'none';
            if (sidebar) sidebar.style.display = 'none';

            // Reset the grid layout so content fills full width
            const layout = document.querySelector('.dashboard-layout');
            if (layout) {
                layout.style.display = 'block';
                layout.style.gridTemplateColumns = '1fr';
                layout.style.gridTemplateRows = '1fr';
            }

            // Expand main content area to full width
            const mainContent = document.querySelector('.app-main');
            if (mainContent) {
                mainContent.style.marginLeft = '0';
                mainContent.style.width = '100%';
                mainContent.style.padding = '24px';
            }

            const content = document.getElementById('content');
            if (content) {
                content.style.width = '100%';
                content.style.maxWidth = '100%';
            }

            // Inject analyst insights banner (plain text, no marked dependency in Puppeteer)
            const banner = document.createElement('div');
            banner.style.cssText = [
                'background:#f8f9fc',
                'border-left:5px solid #1cc88a',
                'padding:16px 20px',
                'margin-bottom:24px',
                'border-radius:4px',
                'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif'
            ].join(';');

            const label = document.createElement('div');
            label.style.cssText = 'font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#1cc88a;font-weight:700;margin-bottom:6px';
            label.textContent = 'Analyst Insights — ' + reportData.title;

            const body = document.createElement('div');
            body.style.cssText = 'font-size:13px;color:#555;line-height:1.6;white-space:pre-wrap';
            body.textContent = reportData.analyst_comments || '';

            const meta = document.createElement('div');
            meta.style.cssText = 'font-size:11px;color:#aaa;margin-top:8px';
            meta.textContent = reportData.category + ' Report | Author: ' + reportData.display_name + ' | ' + new Date(reportData.created_at).toLocaleDateString();

            banner.appendChild(label);
            banner.appendChild(body);
            banner.appendChild(meta);

            if (content) content.insertBefore(banner, content.firstChild);

        }, {
            title: report.title,
            analyst_comments: report.analyst_comments,
            display_name: report.display_name,
            category: report.category,
            created_at: report.created_at
        });

        // Wait a moment for layout to reflow
        await new Promise(r => setTimeout(r, 500));

        const pdfBuffer = await page.pdf({
            format: 'A3',
            landscape: true,
            printBackground: true,
            margin: { top: '15px', right: '15px', bottom: '15px', left: '15px' }
        });

        await browser.close();

        const filename = report.title.replace(/[^a-z0-9_\-\s]/gi, '').trim();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);

    } catch (err) {
        console.error('PDF export error:', err);
        res.status(500).send('Failed to generate PDF');
    }
});

router.post('/api/reports/delete/:id', requireRole(['super_admin', 'analyst']), async (req, res) => {
    try {
        const { rowCount } = await pool.query('DELETE FROM reports WHERE id = $1', [req.params.id]);
        if (!rowCount) return res.status(404).json({ error: 'Report not found' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'db_error' }); }
});

// --- User Management ---
router.get('/api/users', requireRole(['super_admin']), async (req, res) => {
    try { const { rows } = await pool.query('SELECT id, email, display_name, role, permissions FROM users ORDER BY id ASC'); res.json({ success: true, users: rows }); } catch (err) { res.status(500).json({ error: 'db_error' }); }
});
router.post('/api/users', requireRole(['super_admin']), async (req, res) => {
    const { email, password, display_name, role, permissions } = req.body;
    try { const hash = await bcrypt.hash(password, 10); await pool.query('INSERT INTO users (email, password_hash, display_name, role, permissions) VALUES ($1, $2, $3, $4, $5)', [email, hash, display_name || 'User', role, JSON.stringify(permissions || [])]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: 'db_error' }); }
});
router.post('/api/users/edit/:id', requireRole(['super_admin']), async (req, res) => {
    const { email, display_name, role, password, permissions } = req.body;
    try {
        if (password) { const hash = await bcrypt.hash(password, 10); await pool.query('UPDATE users SET email=$1, display_name=$2, role=$3, permissions=$4, password_hash=$5 WHERE id=$6', [email, display_name, role, JSON.stringify(permissions || []), hash, req.params.id]); } 
        else { await pool.query('UPDATE users SET email=$1, display_name=$2, role=$3, permissions=$4 WHERE id=$5', [email, display_name, role, JSON.stringify(permissions || []), req.params.id]); }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Update failed' }); }
});
router.post('/api/users/delete/:id', requireRole(['super_admin']), async (req, res) => {
    try { await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: 'db_error' }); }
});

module.exports = router;