// routes/collect.js — Collection Router
const express = require('express');
const router = express.Router();
const pool = require('../db'); // Shared DB connection

router.post('/collect', async (req, res) => {
    let payload = req.body;

    // --- 1. Robust Body Parsing ---
    // Handles cases where browser sends data as 'text/plain' string
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            console.error('JSON Parse Error from string body:', e.message);
            return res.status(400).json({ error: 'invalid_json_format' });
        }
    }

    // Basic validation
    if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'missing_payload' });
    }

    // --- 2. Data Extraction & Enrichment ---
    const event_type = payload.event_type || payload.type || (payload.error ? 'error' : 'unknown');
    const session_id = payload.session_id || null;
    
    // IP Logic: Use the header provided by Apache/Proxy, or fall back to req.ip
    const ip = req.headers['x-forwarded-for'] 
               ? req.headers['x-forwarded-for'].split(',')[0].trim() 
               : req.ip;

    const url = payload.url || null;
    const referrer = payload.referrer || null;
    const ts_client = payload.timestamp ? new Date(payload.timestamp) : null;
    const reason = payload.reason || null;

    // Static Data (Browser Info)
    const static_data = payload.static || {};
    const user_agent = static_data.userAgent || req.headers['user-agent'] || null;
    const language = static_data.language || null;

    // Performance Metrics
    const perf = payload.performance || {};
    const vitals = perf.vitals || {};
    
    const load_time_ms = typeof perf.totalLoadTime === 'number' ? perf.totalLoadTime : null;
    const ttfb_ms = typeof vitals.ttfb === 'number' ? vitals.ttfb : null;
    const lcp_ms = typeof vitals.lcp === 'number' ? vitals.lcp : null;
    const cls = typeof vitals.cls === 'number' ? vitals.cls : null;
    const inp_ms = typeof vitals.inp === 'number' ? vitals.inp : null;

    // --- 3. Database Insertion ---
    try {
        const query = `
            INSERT INTO events (
                event_type, session_id, ip, url, referrer, payload,
                load_time_ms, ttfb_ms, lcp_ms, cls, inp_ms,
                user_agent, language, ts_client, reason
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING id
        `;
        
        const values = [
            event_type, session_id, ip, url, referrer, payload,
            load_time_ms, ttfb_ms, lcp_ms, cls, inp_ms,
            user_agent, language, ts_client, reason
        ];

        const { rows } = await pool.query(query, values);
        
        // Log to console so you can see it in 'pm2 logs'
        console.log(`[Success] Event: ${event_type} | URL: ${url} | ID: ${rows[0].id}`);
        
        res.status(200).json({ success: true, id: rows[0].id });

    } catch (err) {
        console.error('Database Insert Error:', err.message);
        res.status(500).json({ error: 'internal_db_error' });
    }
});

module.exports = router;