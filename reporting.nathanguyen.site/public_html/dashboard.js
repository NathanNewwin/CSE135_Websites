// ─── Theme ─────────────────────────────────────────────────────────────────────
(function() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
})();

function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const update = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        btn.textContent = isDark ? '☀️' : '🌙';
        btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    };
    update();
    btn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        update();
    });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
let currentUser = null;
let currentViewData = null;

function showToast(message, color = '#1cc88a') {
    const t = document.createElement('div');
    t.className = 'toast-notify';
    t.style.background = color;
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

function makeOverlay() {
    const el = document.createElement('div');
    el.className = 'modal-overlay';
    return el;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
async function checkAuth() {
    try {
        const res = await fetch('/api/dashboard', { credentials: 'include' });
        if (res.status === 401 || res.status === 403) {
            const reportCheck = await fetch('/api/reports', { credentials: 'include' });
            if (reportCheck.status === 401) { window.location.href = '/login.html'; return null; }
            return { success: true, user: { displayName: 'Viewer', role: 'viewer', permissions: [] } };
        }
        return await res.json();
    } catch {
        window.location.href = '/login.html';
        return null;
    }
}

function getDateRange() {
    const end   = document.getElementById('date-end')?.value   || new Date().toISOString().slice(0,10);
    const start = document.getElementById('date-start')?.value || new Date(Date.now() - 30*86400000).toISOString().slice(0,10);
    return { start, end };
}

// ─── Save Report Modal ─────────────────────────────────────────────────────────
window.openReportModal = function(category) {
    const overlay = makeOverlay();
    overlay.innerHTML = `
        <div class="modal-box" style="max-width:600px;">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="mb-0">Save ${category} Report</h5>
                <button id="modal-close" class="btn-close"></button>
            </div>
            <div class="mb-3">
                <label class="form-label fw-semibold">Report Title</label>
                <input id="modal-title" type="text" class="form-control" placeholder="Enter a title for this report...">
            </div>
            <div class="mb-4">
                <label class="form-label fw-semibold">
                    Analyst Insights
                    <span class="text-muted fw-normal small ms-1">— markdown supported</span>
                </label>
                <textarea id="modal-comments" class="form-control font-monospace" rows="8"
                    placeholder="## Key Findings&#10;- Finding one&#10;- Finding two&#10;&#10;> Add your analysis here..."></textarea>
            </div>
            <div class="d-flex justify-content-end gap-2">
                <button id="modal-cancel" class="btn btn-outline-secondary">Cancel</button>
                <button id="modal-save"   class="btn btn-success">Save Report</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('modal-title').focus();

    const close = () => overlay.remove();
    document.getElementById('modal-close').onclick  = close;
    document.getElementById('modal-cancel').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('modal-save').onclick = async () => {
        const title    = document.getElementById('modal-title').value.trim();
        const comments = document.getElementById('modal-comments').value.trim();
        const titleEl  = document.getElementById('modal-title');

        if (!title) {
            titleEl.classList.add('is-invalid');
            titleEl.focus();
            return;
        }
        titleEl.classList.remove('is-invalid');

        const btn = document.getElementById('modal-save');
        btn.textContent = 'Saving…';
        btn.disabled = true;

        try {
            const res  = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title, category, table_data: currentViewData, analyst_comments: comments })
            });
            const json = await res.json();
            if (json.success) {
                close();
                showToast('✓ Report saved successfully');
            } else {
                alert('Error: ' + json.error);
                btn.textContent = 'Save Report';
                btn.disabled = false;
            }
        } catch (err) {
            alert('Network error: ' + err.message);
            btn.textContent = 'Save Report';
            btn.disabled = false;
        }
    };
};

// ─── Delete Report Modal ───────────────────────────────────────────────────────
window.deleteReport = async function(id) {
    const overlay = makeOverlay();
    overlay.innerHTML = `
        <div class="modal-box" style="max-width:420px;">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">Delete Report</h5>
                <button id="drep-close" class="btn-close"></button>
            </div>
            <p class="text-muted mb-4">
                Are you sure you want to delete this report?<br>
                <strong class="text-danger">This action cannot be undone.</strong>
            </p>
            <div class="d-flex justify-content-end gap-2">
                <button id="drep-cancel"  class="btn btn-outline-secondary">Cancel</button>
                <button id="drep-confirm" class="btn btn-danger">Delete Report</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('drep-close').onclick   = close;
    document.getElementById('drep-cancel').onclick  = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('drep-confirm').onclick = async () => {
        const btn = document.getElementById('drep-confirm');
        btn.textContent = 'Deleting…';
        btn.disabled = true;
        try {
            const res  = await fetch(`/api/reports/delete/${id}`, { method: 'POST', credentials: 'include' });
            const json = await res.json();
            if (json.success) { close(); route(); showToast('✓ Report deleted', '#e74a3b'); }
            else { alert('Error: ' + json.error); btn.textContent = 'Delete Report'; btn.disabled = false; }
        } catch (err) {
            alert('Network Error: ' + err.message);
            btn.textContent = 'Delete Report';
            btn.disabled = false;
        }
    };
};

// ─── Routing ───────────────────────────────────────────────────────────────────
async function route() {
    const hash    = window.location.hash || (currentUser?.role === 'viewer' ? '#/reports' : '#/overview');
    const content = document.getElementById('content');
    const { start, end } = getDateRange();

    document.querySelectorAll('.sidebar-link').forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === hash);
    });

    const saveBtn = currentUser && ['super_admin','analyst'].includes(currentUser.role)
        ? (cat) => `<button class="btn btn-success btn-sm" onclick="openReportModal('${cat}')">
                        <i class="bi bi-save me-1"></i>Save as Report
                    </button>`
        : () => '';

    // ── Reports ───────────────────────────────────────────────────────────────
    if (hash === '#/reports') {
        content.innerHTML = '<p class="text-muted">Loading…</p>';
        try {
            const res  = await fetch('/api/reports', { credentials: 'include' });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);

            const rows = json.reports.map(r => `
                <tr>
                    <td>${new Date(r.created_at).toLocaleDateString()}</td>
                    <td class="fw-semibold">${r.title}</td>
                    <td><span class="tag tag-blue">${r.category}</span></td>
                    <td>${r.author}</td>
                    <td>
                        <div class="d-flex gap-2">
                            <a href="/api/reports/${r.id}/export" target="_blank" class="btn btn-danger btn-sm">
                                <i class="bi bi-file-earmark-pdf me-1"></i>Export PDF
                            </a>
                            ${currentUser.role !== 'viewer' ? `
                            <button onclick="deleteReport(${r.id})" class="btn btn-outline-danger btn-sm">
                                <i class="bi bi-trash"></i>
                            </button>` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');

            content.innerHTML = `
                <div class="page-heading">
                    <h2>Saved Reports</h2>
                </div>
                <div class="panel">
                    <div class="table-responsive">
                        <table class="dash-table">
                            <thead>
                                <tr>
                                    <th>Date</th><th>Title</th><th>Category</th><th>Author</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch(err) {
            content.innerHTML = `<div class="err-box">${err.message}</div>`;
        }
    }

    // ── Overview ──────────────────────────────────────────────────────────────
    else if (hash === '#/overview' || hash === '') {
        content.innerHTML = '<p class="text-muted">Loading…</p>';
        try {
            const [dashRes, pageRes] = await Promise.all([
                fetch(`/api/dashboard?start=${start}&end=${end}`, { credentials: 'include' }),
                fetch(`/api/pageviews?start=${start}&end=${end}`,  { credentials: 'include' })
            ]);
            const dashJson = await dashRes.json();
            const pageJson = await pageRes.json();
            if (!dashJson.success) throw new Error(dashJson.error || 'Failed to load dashboard data');

            const errorRate = dashJson.total_pageviews > 0
                ? ((dashJson.total_errors / dashJson.total_pageviews) * 100).toFixed(2) : 0;
            const errorRateColor = errorRate > 2 ? 'var(--red)' : 'var(--green)';

            content.innerHTML = `
                <div class="page-heading">
                    <h2>Overview</h2>
                    ${saveBtn('Overview')}
                </div>

                <div class="row g-3 mb-4">
                    <div class="col">
                        <div class="stat-card">
                            <div class="stat-label">Total Pageviews</div>
                            <div class="stat-value" style="color:var(--blue)">${dashJson.total_pageviews || 0}</div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="stat-card">
                            <div class="stat-label">Total Sessions</div>
                            <div class="stat-value" style="color:var(--green)">${dashJson.total_sessions || 0}</div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="stat-card">
                            <div class="stat-label">Avg Load Time</div>
                            <div class="stat-value" style="color:var(--yellow)">${dashJson.avg_load_time_ms || 0} ms</div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="stat-card">
                            <div class="stat-label">Total Errors</div>
                            <div class="stat-value" style="color:var(--red)">${dashJson.total_errors || 0}</div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="stat-card" style="border-left: 4px solid ${errorRateColor}">
                            <div class="stat-label">Error Rate</div>
                            <div class="stat-value" style="color:${errorRateColor}">${errorRate}%</div>
                        </div>
                    </div>
                </div>

                <div class="panel mb-4">
                    <h6 class="panel-title">Pageviews Over Time</h6>
                    <div style="height:320px"><canvas id="trafficChart"></canvas></div>
                </div>

                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="panel h-100">
                            <h6 class="panel-title">Top User Agents</h6>
                            <div style="height:240px"><canvas id="userAgentChart"></canvas></div>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="panel h-100">
                            <h6 class="panel-title">Live Event Feed (Last 5)</h6>
                            <div class="table-responsive">
                                <table class="dash-table">
                                    <thead><tr><th>Time</th><th>Type</th><th>URL</th></tr></thead>
                                    <tbody>
                                        ${(dashJson.recent_events || []).map(ev => {
                                            const tagClass = ev.event_type === 'error' ? 'tag-red'
                                                        : ev.event_type === 'pageview' ? 'tag-blue'
                                                        : ev.event_type === 'page_exit' ? 'tag-gray'
                                                        : 'tag-yellow';
                                            return `
                                                <tr>
                                                    <td class="text-nowrap">${new Date(ev.received_at).toLocaleTimeString()}</td>
                                                    <td><span class="tag ${tagClass}">${ev.event_type}</span></td>
                                                    <td class="text-break text-muted small">${ev.url || '-'}</td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            if (pageJson.byDay) {
                new Chart(document.getElementById('trafficChart'), {
                    type: 'line',
                    data: {
                        labels: pageJson.byDay.map(r => r.day),
                        datasets: [{ label: 'Pageviews', data: pageJson.byDay.map(r => r.views),
                            borderColor: '#4e73df', backgroundColor: 'rgba(78,115,223,0.1)',
                            borderWidth: 2, fill: true, tension: 0.3, pointBackgroundColor: '#4e73df' }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
                });
            }
            if (dashJson.user_agents?.length) {
                new Chart(document.getElementById('userAgentChart'), {
                    type: 'doughnut',
                    data: {
                        labels: dashJson.user_agents.map(u => u.browser || 'Unknown'),
                        datasets: [{ data: dashJson.user_agents.map(u => u.count),
                            backgroundColor: ['#4e73df','#1cc88a','#36b9cc','#f6c23e','#e74a3b'], borderWidth: 1 }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
                });
            }
        } catch(err) {
            content.innerHTML = `<div class="err-box">Error loading overview: ${err.message}</div>`;
        }
    }

    // ── Performance ───────────────────────────────────────────────────────────
    else if (hash === '#/performance') {
        content.innerHTML = `
            <div class="page-heading">
                <h2>Performance Data</h2>
                ${saveBtn('Performance')}
            </div>
            <div id="perfContainer"><p class="text-muted">Loading…</p></div>
        `;
        try {
            const res  = await fetch(`/api/performance?start=${start}&end=${end}`, { credentials: 'include' });
            const json = await res.json();
            if (!json.success) throw new Error(json.error);

            let perfData = json.data.byPage || [];
            currentViewData = perfData.map(r => ({ url: r.url, load_time: r.avg_load_ms, lcp: r.avg_lcp, inp: r.avg_inp }));

            document.getElementById('perfContainer').innerHTML = `
                <div class="row g-3 mb-4">
                    <div class="col-md-6">
                        <div class="panel">
                            <h6 class="panel-title">Avg Load Time</h6>
                            <div style="height:280px"><canvas id="loadChart"></canvas></div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="panel">
                            <h6 class="panel-title">Avg TTFB</h6>
                            <div style="height:280px"><canvas id="ttfbChart"></canvas></div>
                        </div>
                    </div>
                </div>

                <div class="panel">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="panel-title mb-0">Performance Data Per URL</h6>
                        <small class="text-muted">Click column headers to sort ↑↓</small>
                    </div>
                    <div class="table-responsive">
                        <table class="dash-table">
                            <thead>
                                <tr>
                                    <th class="sortable" onclick="window.sortPerf('url')">URL ↕</th>
                                    <th class="sortable" onclick="window.sortPerf('avg_load_ms')">Load (ms) ↕</th>
                                    <th class="sortable" onclick="window.sortPerf('avg_ttfb_ms')">TTFB ↕</th>
                                    <th class="sortable" onclick="window.sortPerf('avg_lcp')">LCP ↕</th>
                                    <th class="sortable" onclick="window.sortPerf('avg_cls')">CLS ↕</th>
                                    <th class="sortable" onclick="window.sortPerf('avg_inp')">INP ↕</th>
                                    <th class="sortable" onclick="window.sortPerf('samples')">Samples ↕</th>
                                </tr>
                            </thead>
                            <tbody id="perfBody"></tbody>
                        </table>
                    </div>
                </div>
            `;

            const color = (val, type) => {
                if (!val || val === '-') return '#ccc';
                if (type === 'cls') return val <= 0.1 ? '#1cc88a' : val <= 0.25 ? '#f6c23e' : '#e74a3b';
                const t = { lcp:[2500,4000], load:[2000,5000], ttfb:[800,1800] }[type] || [1000,3000];
                return val <= t[0] ? '#1cc88a' : val <= t[1] ? '#f6c23e' : '#e74a3b';
            };

            const renderTable = data => {
                document.getElementById('perfBody').innerHTML = data.map(row => `
                    <tr>
                        <td class="font-monospace small text-truncate" style="max-width:280px" title="${row.url}">${row.url}</td>
                        <td style="color:${color(row.avg_load_ms,'load')}" class="fw-bold">${row.avg_load_ms||'-'}</td>
                        <td style="color:${color(row.avg_ttfb_ms,'ttfb')}">${row.avg_ttfb_ms||'-'}</td>
                        <td style="color:${color(row.avg_lcp,'lcp')}">${row.avg_lcp||'-'}</td>
                        <td style="color:${color(row.avg_cls,'cls')}">${row.avg_cls != null && !isNaN(parseFloat(row.avg_cls)) ? parseFloat(row.avg_cls).toFixed(3) : '-'}</td>
                        <td style="color:${color(row.avg_inp,'inp')}">${row.avg_inp||'-'}</td>
                        <td class="text-muted">${row.samples}</td>
                    </tr>
                `).join('');
            };

            let cs = { key: '', asc: true };
            window.sortPerf = key => {
                cs.asc = cs.key === key ? !cs.asc : false;
                cs.key = key;
                perfData.sort((a,b) => {
                    let vA = a[key]??0, vB = b[key]??0;
                    return typeof vA === 'string'
                        ? cs.asc ? vA.localeCompare(vB) : vB.localeCompare(vA)
                        : cs.asc ? vA-vB : vB-vA;
                });
                renderTable(perfData);
            };
            renderTable(perfData);

            if (json.data.byDay?.length) {
                const labels = json.data.byDay.map(r => r.day);
                new Chart(document.getElementById('loadChart'), {
                    type: 'line',
                    data: { labels, datasets: [{ label: 'Load (ms)', data: json.data.byDay.map(r=>r.avg_load_ms),
                        borderColor:'#f6c23e', backgroundColor:'rgba(246,194,62,0.1)', borderWidth:2, fill:true, tension:0.3 }] },
                    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} } }
                });
                new Chart(document.getElementById('ttfbChart'), {
                    type: 'line',
                    data: { labels, datasets: [{ label: 'TTFB (ms)', data: json.data.byDay.map(r=>r.avg_ttfb_ms),
                        borderColor:'#1cc88a', backgroundColor:'rgba(28,200,138,0.1)', borderWidth:2, fill:true, tension:0.3 }] },
                    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} } }
                });
            }
        } catch(err) {
            document.getElementById('perfContainer').innerHTML = `<div class="err-box">Error loading performance: ${err.message}</div>`;
        }
    }

    // ── Errors ────────────────────────────────────────────────────────────────
    else if (hash === '#/errors') {
        content.innerHTML = `
            <div class="page-heading">
                <h2>System Errors</h2>
                ${saveBtn('Errors')}
            </div>
            <div id="errContainer"><p class="text-muted">Loading…</p></div>
        `;
        try {
            const res  = await fetch(`/api/errors?start=${start}&end=${end}`, { credentials: 'include' });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Failed to load error data');

            currentViewData = json.topErrors.map(e => ({ error: e.error_message, instances: e.count }));

            const uniqueUrls   = [...new Set(json.recent.map(e => e.url).filter(Boolean))];
            const uniqueDays   = [...new Set(json.recent.map(e => new Date(e.received_at).toLocaleDateString()))];
            const uniqueErrors = [...new Set(json.recent.map(e => e.payload?.error?.message || e.payload?.message || 'Unknown Error'))];

            document.getElementById('errContainer').innerHTML = `
                <div class="row g-3 mb-4">
                    <div class="col-md-6">
                        <div class="panel">
                            <h6 class="panel-title">Errors Per Day</h6>
                            <div style="height:280px"><canvas id="errorsTimeChart"></canvas></div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="panel">
                            <h6 class="panel-title">Top 5 Errors</h6>
                            <div style="height:280px"><canvas id="topErrorsChart"></canvas></div>
                        </div>
                    </div>
                </div>

                <div class="panel">
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                        <h6 class="panel-title mb-0">Recent Errors</h6>
                        <div class="d-flex gap-2 flex-wrap">
                            <select id="filterUrl"   class="form-select form-select-sm" style="max-width:200px">
                                <option value="">All URLs</option>
                                ${uniqueUrls.map(u=>`<option value="${u}">${u}</option>`).join('')}
                            </select>
                            <select id="filterDay"   class="form-select form-select-sm" style="max-width:160px">
                                <option value="">All Days</option>
                                ${uniqueDays.map(d=>`<option value="${d}">${d}</option>`).join('')}
                            </select>
                            <select id="filterError" class="form-select form-select-sm" style="max-width:200px">
                                <option value="">All Errors</option>
                                ${uniqueErrors.map(e=>`<option value="${e}">${e.length>30?e.substring(0,30)+'…':e}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="dash-table">
                            <thead id="recentErrorsHead"><tr><th class="sortable" onclick="sortErrors('received_at')">Time ↕</th><th class="sortable" onclick="sortErrors('url')">URL ↕</th><th class="sortable" onclick="sortErrors('message')">Error ↕</th></tr></thead>
                            <tbody id="recentErrorsBody"></tbody>
                        </table>
                    </div>
                </div>
            `;

            if (json.overTime?.length) {
                new Chart(document.getElementById('errorsTimeChart'), {
                    type: 'line',
                    data: { labels: json.overTime.map(d=>d.time_bucket),
                        datasets: [{ label:'Errors', data: json.overTime.map(d=>d.count),
                            borderColor:'#e74a3b', backgroundColor:'rgba(231,74,59,0.1)', borderWidth:2, fill:true, tension:0.3 }] },
                    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} } }
                });
            }
            if (json.topErrors?.length) {
                new Chart(document.getElementById('topErrorsChart'), {
                    type: 'bar',
                    data: { labels: json.topErrors.map(d=>d.error_message.length>35?d.error_message.substring(0,35)+'…':d.error_message),
                        datasets: [{ label:'Instances', data: json.topErrors.map(d=>d.count),
                            backgroundColor:'#f6c23e', borderRadius:4 }] },
                    options: { responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{display:false} } }
                });
            }

            let errorData = [...json.recent];
            let errorSort = { key: 'received_at', asc: false };

            const getErrArrow = k => errorSort.key !== k ? '↕' : errorSort.asc ? '↑' : '↓';

            window.sortErrors = key => {
                errorSort.asc = errorSort.key === key ? !errorSort.asc : true;
                errorSort.key = key;
                errorData.sort((a, b) => {
                    if (key === 'received_at') {
                        return errorSort.asc
                            ? new Date(a.received_at) - new Date(b.received_at)
                            : new Date(b.received_at) - new Date(a.received_at);
                    }
                    if (key === 'url') {
                        const vA = a.url || '', vB = b.url || '';
                        return errorSort.asc ? vA.localeCompare(vB) : vB.localeCompare(vA);
                    }
                    if (key === 'message') {
                        const vA = a.payload?.error?.message || a.payload?.message || '';
                        const vB = b.payload?.error?.message || b.payload?.message || '';
                        return errorSort.asc ? vA.localeCompare(vB) : vB.localeCompare(vA);
                    }
                    return 0;
                });
                renderErrorTable();
            };

            const renderErrorTable = () => {
                const filterUrl   = document.getElementById('filterUrl').value;
                const filterDay   = document.getElementById('filterDay').value;
                const filterError = document.getElementById('filterError').value;

                const filtered = errorData.filter(e => {
                    const msg = e.payload?.error?.message || e.payload?.message || 'Unknown Error';
                    const day = new Date(e.received_at).toLocaleDateString();
                    return (!filterUrl || e.url === filterUrl) &&
                           (!filterDay || day === filterDay) &&
                           (!filterError || msg === filterError);
                });

                document.getElementById('recentErrorsHead').innerHTML = `
                    <tr>
                        <th class="sortable" onclick="sortErrors('received_at')">Time ${getErrArrow('received_at')}</th>
                        <th class="sortable" onclick="sortErrors('url')">URL ${getErrArrow('url')}</th>
                        <th class="sortable" onclick="sortErrors('message')">Error ${getErrArrow('message')}</th>
                    </tr>
                `;

                const tbody = document.getElementById('recentErrorsBody');
                tbody.innerHTML = filtered.length
                    ? filtered.map(e => {
                        const msg = e.payload?.error?.message || e.payload?.message || 'Unknown Error';
                        return `<tr>
                            <td class="text-nowrap">${new Date(e.received_at).toLocaleString()}</td>
                            <td class="small text-break">${e.url||'-'}</td>
                            <td class="font-monospace small text-danger">${msg}</td>
                        </tr>`;
                    }).join('')
                    : `<tr><td colspan="3" class="text-center text-muted py-3">No errors match the selected filters.</td></tr>`;
            };

            renderErrorTable();
            ['filterUrl','filterDay','filterError'].forEach(id =>
                document.getElementById(id).addEventListener('change', renderErrorTable)
            );
        } catch(err) {
            document.getElementById('errContainer').innerHTML = `<div class="err-box">Error loading errors: ${err.message}</div>`;
        }
    }

    // ── Sessions ──────────────────────────────────────────────────────────────
    else if (hash === '#/sessions' || hash.startsWith('#/session/')) {
        const isDetail = hash.startsWith('#/session/');

        if (!isDetail) {
            content.innerHTML = `
                <div class="page-heading">
                    <h2>User Sessions</h2>
                    ${saveBtn('Sessions')}
                </div>
                <div id="sessionList"><p class="text-muted">Loading…</p></div>
            `;
            try {
                const res  = await fetch('/api/sessions', { credentials: 'include' });
                const json = await res.json();
                if (!json.success) throw new Error(json.error);

                let sessions = json.sessions;
                currentViewData = sessions.map(s => ({ session_id: s.session_id, events: s.event_count, last_active: new Date(s.last_event).toLocaleTimeString() }));

                let cs = { key: 'last_event', asc: false };

                window.sortSessions = key => {
                    cs.asc = cs.key === key ? !cs.asc : false;
                    cs.key = key;
                    sessions.sort((a,b) => {
                        let vA=a[key], vB=b[key];
                        return typeof vA==='string' ? (cs.asc?vA.localeCompare(vB):vB.localeCompare(vA)) : (cs.asc?vA-vB:vB-vA);
                    });
                    renderSessions();
                };

                const arr = k => cs.key!==k ? '↕' : cs.asc ? '↑' : '↓';

                const renderSessions = () => {
                    document.getElementById('sessionList').innerHTML = `
                        <div class="panel">
                            <div class="table-responsive">
                                <table class="dash-table">
                                    <thead>
                                        <tr>
                                            <th class="sortable" onclick="sortSessions('session_id')">Session ID ${arr('session_id')}</th>
                                            <th class="sortable" onclick="sortSessions('event_count')">Page Visits ${arr('event_count')}</th>
                                            <th class="sortable" onclick="sortSessions('last_event')">Most Recent ${arr('last_event')}</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${sessions.map(s=>`
                                            <tr>
                                                <td class="font-monospace small">${s.session_id}</td>
                                                <td>${s.event_count} visits</td>
                                                <td class="small">${new Date(s.last_event).toLocaleString()}</td>
                                                <td>
                                                    <a href="#/session/${s.session_id}" class="btn btn-primary btn-sm">
                                                        <i class="bi bi-eye me-1"></i>View Session
                                                    </a>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                };
                renderSessions();
            } catch(err) {
                document.getElementById('sessionList').innerHTML = `<div class="err-box">${err.message}</div>`;
            }
        } else {
            const sessionId = hash.split('/')[2];
            content.innerHTML = `
                <div class="page-heading">
                    <h2>Session Details</h2>
                    <a href="#/sessions" class="btn btn-secondary btn-sm">
                        <i class="bi bi-arrow-left me-1"></i>Back to Sessions
                    </a>
                </div>
                <div id="sessionDetail"><p class="text-muted">Loading session ${sessionId}…</p></div>
            `;
            try {
                const res  = await fetch(`/api/session/${sessionId}`, { credentials: 'include' });
                const json = await res.json();
                if (!json.success) throw new Error(json.error);

                const events    = json.events;
                const pageviews = events.filter(e => e.event_type === 'pageview');
                const errors    = events.filter(e => e.event_type === 'error');

                const timelineItems = events.map(ev => {
                    const isError = ev.event_type === 'error';
                    const color   = isError ? 'var(--red)' : 'var(--blue)';
                    return `
                        <div class="timeline-item">
                            <div class="timeline-dot" style="color:${color}; background:${color}"></div>
                            <div class="timeline-body" style="color:${color}; border-left-color:${color}">
                                <div class="d-flex align-items-center gap-2 mb-1">
                                    <small class="text-muted fw-bold">${new Date(ev.received_at).toLocaleTimeString()}</small>
                                    <span class="tag ${isError?'tag-red':'tag-blue'}">${ev.event_type}</span>
                                </div>
                                <div class="small text-break"><strong>URL:</strong> ${ev.url}</div>
                                ${ev.load_time_ms ? `<div class="small text-muted mt-1">Load: ${ev.load_time_ms}ms | TTFB: ${ev.ttfb_ms||0}ms</div>` : ''}
                                ${isError && ev.payload?.error?.message ? `<div class="font-monospace small text-danger bg-danger bg-opacity-10 p-2 rounded mt-1">Error: ${ev.payload.error.message}</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');

                document.getElementById('sessionDetail').innerHTML = `
                    <div class="row g-3 mb-4">
                        <div class="col-md-4">
                            <div class="panel h-100">
                                <h6 class="panel-title">Session Info</h6>
                                <p class="mb-1"><strong>ID:</strong> <span class="font-monospace small">${sessionId}</span></p>
                                <p class="mb-1"><strong>Browser:</strong> ${events[0]?.user_agent || 'Unknown'}</p>
                                <p class="mb-0">
                                    <strong>Pages:</strong> ${pageviews.length} &nbsp;
                                    <strong>Errors:</strong> <span class="text-danger">${errors.length}</span>
                                </p>
                            </div>
                        </div>
                        <div class="col-md-8">
                            <div class="panel h-100">
                                <h6 class="panel-title">Performance Journey</h6>
                                <div style="height:220px"><canvas id="userPerfChart"></canvas></div>
                            </div>
                        </div>
                    </div>
                    <div class="panel">
                        <h6 class="panel-title">User Journey Timeline</h6>
                        <div class="timeline">${timelineItems}</div>
                    </div>
                `;

                const perfData = events.filter(e => e.load_time_ms || e.ttfb_ms);
                if (perfData.length) {
                    new Chart(document.getElementById('userPerfChart'), {
                        type: 'line',
                        data: {
                            labels: perfData.map(e => new Date(e.received_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})),
                            datasets: [
                                { label:'Load Time (ms)', data: perfData.map(e=>e.load_time_ms||0),
                                  borderColor:'#4e73df', backgroundColor:'rgba(78,115,223,0.1)', fill:true, tension:0.4 },
                                { label:'TTFB (ms)',      data: perfData.map(e=>e.ttfb_ms||0),
                                  borderColor:'#1cc88a', borderDash:[5,5], backgroundColor:'transparent', tension:0.4 }
                            ]
                        },
                        options: { responsive:true, maintainAspectRatio:false,
                            plugins:{ tooltip:{ callbacks:{ afterLabel: ctx=>`URL: ${perfData[ctx.dataIndex].url}` } } } }
                    });
                }
            } catch(err) {
                document.getElementById('sessionDetail').innerHTML = `<div class="err-box">${err.message}</div>`;
            }
        }
    }

    // ── Admin ─────────────────────────────────────────────────────────────────
    else if (hash === '#/admin') {
        content.innerHTML = '<p class="text-muted">Loading…</p>';
        try {
            const res  = await fetch('/api/users', { credentials: 'include' });
            if (res.status === 403) throw new Error('Super Admin access required.');
            const json = await res.json();
            if (!json.success) throw new Error(json.error);

            const rows = json.users.map(u => {
                const perms = Array.isArray(u.permissions) ? u.permissions.join(', ') : 'None';
                return `
                    <tr>
                        <td>${u.display_name}</td>
                        <td>${u.email}</td>
                        <td class="text-capitalize">${u.role.replace('_',' ')}</td>
                        <td class="small text-muted">${u.role==='analyst' ? perms : '-'}</td>
                        <td>
                            <div class="d-flex gap-2">
                                <button onclick='editUserModal(${JSON.stringify(u)})' class="btn btn-warning btn-sm">
                                    <i class="bi bi-pencil me-1"></i>Edit
                                </button>
                                <button onclick='deleteUser(${u.id})' class="btn btn-danger btn-sm">
                                    <i class="bi bi-trash me-1"></i>Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            content.innerHTML = `
                <div class="page-heading">
                    <h2>Manage Users &amp; Roles</h2>
                    <button onclick="editUserModal()" class="btn btn-primary btn-sm">
                        <i class="bi bi-person-plus me-1"></i>Add User
                    </button>
                </div>
                <div class="panel">
                    <div class="table-responsive">
                        <table class="dash-table">
                            <thead>
                                <tr><th>Name</th><th>Email</th><th>Role</th><th>Permissions</th><th>Actions</th></tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch(err) {
            content.innerHTML = `<div class="err-box">${err.message}</div>`;
        }
    }
}

// ─── Delete User Modal ─────────────────────────────────────────────────────────
window.deleteUser = async function(id) {
    const overlay = makeOverlay();
    overlay.innerHTML = `
        <div class="modal-box" style="max-width:420px;">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">Delete User</h5>
                <button id="duser-close" class="btn-close"></button>
            </div>
            <p class="text-muted mb-4">
                Are you sure you want to delete this user?<br>
                <strong class="text-danger">This action cannot be undone.</strong>
            </p>
            <div class="d-flex justify-content-end gap-2">
                <button id="duser-cancel"  class="btn btn-outline-secondary">Cancel</button>
                <button id="duser-confirm" class="btn btn-danger">Delete User</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    document.getElementById('duser-close').onclick  = close;
    document.getElementById('duser-cancel').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('duser-confirm').onclick = async () => {
        const btn = document.getElementById('duser-confirm');
        btn.textContent = 'Deleting…'; btn.disabled = true;
        try {
            const res  = await fetch(`/api/users/delete/${id}`, { method:'POST', credentials:'include' });
            const json = await res.json();
            if (json.success) { close(); route(); showToast('✓ User deleted', '#e74a3b'); }
            else { alert('Error: ' + json.error); btn.textContent = 'Delete User'; btn.disabled = false; }
        } catch(err) {
            alert('Network Error: ' + err.message);
            btn.textContent = 'Delete User'; btn.disabled = false;
        }
    };
};

// ─── Edit / Add User Modal ─────────────────────────────────────────────────────
window.editUserModal = async function(user = null) {
    const isEdit = !!user;
    const overlay = makeOverlay();
    overlay.innerHTML = `
        <div class="modal-box" style="max-width:500px;">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="mb-0">${isEdit ? 'Edit User' : 'Add User'}</h5>
                <button id="umodal-close" class="btn-close"></button>
            </div>

            <div class="mb-3">
                <label class="form-label fw-semibold">Display Name</label>
                <input id="umodal-name"  type="text"  class="form-control" value="${isEdit ? user.display_name : ''}" placeholder="Enter display name">
            </div>
            <div class="mb-3">
                <label class="form-label fw-semibold">Email</label>
                <input id="umodal-email" type="email" class="form-control" value="${isEdit ? user.email : ''}" placeholder="Enter email address">
            </div>
            <div class="mb-3">
                <label class="form-label fw-semibold">Role</label>
                <select id="umodal-role" class="form-select">
                    <option value="viewer"      ${isEdit && user.role==='viewer'      ? 'selected':''}>Viewer</option>
                    <option value="analyst"     ${isEdit && user.role==='analyst'     ? 'selected':''}>Analyst</option>
                    <option value="super_admin" ${isEdit && user.role==='super_admin' ? 'selected':''}>Super Admin</option>
                </select>
            </div>

            <div id="umodal-perms-section" class="mb-3" style="display:${isEdit && user.role==='analyst' ? 'block':'none'}">
                <label class="form-label fw-semibold">Permissions</label>
                <div class="d-flex gap-4">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="perm-performance" value="performance"
                            ${isEdit && user.permissions?.includes('performance') ? 'checked':''}>
                        <label class="form-check-label" for="perm-performance">Performance</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="perm-errors" value="errors"
                            ${isEdit && user.permissions?.includes('errors') ? 'checked':''}>
                        <label class="form-check-label" for="perm-errors">Errors</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="perm-sessions" value="sessions"
                            ${isEdit && user.permissions?.includes('sessions') ? 'checked':''}>
                        <label class="form-check-label" for="perm-sessions">Sessions</label>
                    </div>
                </div>
            </div>

            ${!isEdit ? `
            <div class="mb-4">
                <label class="form-label fw-semibold">Initial Password</label>
                <input id="umodal-password" type="password" class="form-control" placeholder="Enter initial password">
            </div>` : '<div class="mb-4"></div>'}

            <div class="d-flex justify-content-end gap-2">
                <button id="umodal-cancel" class="btn btn-outline-secondary">Cancel</button>
                <button id="umodal-save"   class="btn btn-primary">${isEdit ? 'Save Changes' : 'Add User'}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('umodal-name').focus();

    document.getElementById('umodal-role').addEventListener('change', function() {
        document.getElementById('umodal-perms-section').style.display = this.value === 'analyst' ? 'block' : 'none';
    });

    const close = () => overlay.remove();
    document.getElementById('umodal-close').onclick  = close;
    document.getElementById('umodal-cancel').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.getElementById('umodal-save').onclick = async () => {
        const nameEl  = document.getElementById('umodal-name');
        const emailEl = document.getElementById('umodal-email');
        const name    = nameEl.value.trim();
        const email   = emailEl.value.trim();
        const role    = document.getElementById('umodal-role').value;

        let valid = true;
        if (!name)  { nameEl.classList.add('is-invalid');  valid = false; } else nameEl.classList.remove('is-invalid');
        if (!email) { emailEl.classList.add('is-invalid'); valid = false; } else emailEl.classList.remove('is-invalid');
        if (!valid) return;

        const perms = ['performance','errors','sessions'].filter(p => document.getElementById(`perm-${p}`)?.checked);
        const payload = { display_name: name, email, role, permissions: perms };

        if (!isEdit) {
            const pwEl = document.getElementById('umodal-password');
            if (!pwEl.value) { pwEl.classList.add('is-invalid'); return; }
            payload.password = pwEl.value;
        }

        const btn = document.getElementById('umodal-save');
        btn.textContent = 'Saving…'; btn.disabled = true;

        const endpoint = isEdit ? `/api/users/edit/${user.id}` : '/api/users';
        try {
            const res  = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
            const json = await res.json();
            if (json.success) {
                close(); route();
                showToast(`✓ User ${isEdit ? 'updated' : 'added'} successfully`, '#4e73df');
            } else {
                alert('Error: ' + json.error);
                btn.textContent = isEdit ? 'Save Changes' : 'Add User';
                btn.disabled = false;
            }
        } catch(err) {
            alert('Network Error: ' + err.message);
            btn.textContent = isEdit ? 'Save Changes' : 'Add User';
            btn.disabled = false;
        }
    };
};

// ─── Init ──────────────────────────────────────────────────────────────────────
async function init() {
    const authData = await checkAuth();
    if (!authData?.success) return;

    currentUser = authData.user;
    document.getElementById('welcome-msg').textContent =
        `Welcome, ${currentUser.displayName} (${currentUser.role.replace('_',' ')})`;

    const hide = id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };
    const show = id => { const el = document.getElementById(id); if (el) el.style.display = 'block'; };

    ['nav-overview','nav-performance','nav-errors','nav-sessions','nav-reports','nav-admin'].forEach(hide);
    show('nav-reports');

    if (currentUser.role === 'super_admin') {
        ['nav-overview','nav-performance','nav-errors','nav-sessions','nav-admin'].forEach(show);
    } else if (currentUser.role === 'analyst') {
        show('nav-overview');
        if (currentUser.permissions.includes('performance')) show('nav-performance');
        if (currentUser.permissions.includes('errors'))      show('nav-errors');
        if (currentUser.permissions.includes('sessions'))    show('nav-sessions');
    }

    const dates = getDateRange();
    const ds = document.getElementById('date-start');
    const de = document.getElementById('date-end');
    if (ds) ds.value = dates.start;
    if (de) de.value = dates.end;

    window.addEventListener('hashchange', route);
    document.addEventListener('change', e => {
        if (e.target.id === 'date-start' || e.target.id === 'date-end') route();
    });

    initThemeToggle();

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch('/api/logout', { method:'POST', credentials:'include' });
        window.location.href = '/login.html';
    });

    route();
}

init();