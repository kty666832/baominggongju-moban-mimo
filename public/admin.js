let adminPassword = '';
let currentData = null;

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  adminPassword = document.getElementById('admin-password').value;
  try {
    const res = await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:adminPassword}) });
    if (res.ok) { document.getElementById('login-section').style.display='none'; document.getElementById('admin-panel').style.display='block'; await refreshData(); }
    else alert('密码错误');
  } catch { alert('登录失败'); }
});

async function refreshData() {
  const res = await fetch(`/api/admin/registrations?password=${encodeURIComponent(adminPassword)}`);
  currentData = await res.json();
  renderStats(); renderTable();
}

function renderStats() {
  document.getElementById('total-count').textContent = currentData.total;
  const gc = document.getElementById('group-stats'); gc.innerHTML='';
  if (currentData.groupStats) {
    currentData.groupStats.forEach(g => {
      const item = document.createElement('div'); item.className='stat-item';
      item.innerHTML=`<span class="stat-number">${g.count}</span><span class="stat-label">${g.group_name||'未分组'}</span>`;
      gc.appendChild(item);
    });
  }
}

function renderTable() {
  const {fields, records} = currentData;
  document.getElementById('table-header').innerHTML = '<tr><th>序号</th>'+fields.map(f=>`<th>${f.label}</th>`).join('')+'<th>报名时间</th><th>操作</th></tr>';
  document.getElementById('table-body').innerHTML = records.map((r,i) =>
    '<tr><td>'+(i+1)+'</td>'+fields.map(f=>`<td>${escapeHtml(r[f.name]||'')}</td>`).join('')+
    `<td>${formatTime(r.created_at)}</td><td><button class="btn-delete" onclick="deleteRecord(${r.id})">删除</button></td></tr>`
  ).join('');
}

function exportCSV() {
  if (!currentData||!currentData.records.length) { alert('没有数据可导出'); return; }
  const {fields, records} = currentData;
  const headers = ['序号', ...fields.map(f=>f.label), '报名时间'];
  const rows = records.map((r,i) => [i+1, ...fields.map(f=>`"${(r[f.name]||'').replace(/"/g,'""')}"`), `"${r.created_at||''}"`]);
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r=>r.join(','))].join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=`报名数据_${new Date().toISOString().slice(0,10)}.csv`; a.click();
}

async function deleteRecord(id) {
  if (!confirm('确定要删除这条记录吗？')) return;
  await fetch(`/api/admin/registrations/${id}?password=${encodeURIComponent(adminPassword)}`, {method:'DELETE'});
  await refreshData();
}

function escapeHtml(t) { const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }
function formatTime(t) { try{return new Date(t).toLocaleString('zh-CN')}catch{return t||''} }
