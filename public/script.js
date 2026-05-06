let appConfig = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/config');
    appConfig = await res.json();
    renderPage();
  } catch (err) {
    document.getElementById('event-name').textContent = '加载失败，请刷新页面';
  }
});

function renderPage() {
  const { event, fields } = appConfig;
  document.title = event.name;
  document.getElementById('event-name').textContent = event.name;
  document.getElementById('event-desc').textContent = event.description || '';
  if (event.deadline) {
    const dl = new Date(event.deadline);
    if (new Date() > dl) {
      document.getElementById('deadline-info').textContent = '⚠️ 报名已截止';
      document.getElementById('register-form').style.display = 'none';
      return;
    }
    document.getElementById('deadline-info').textContent = `📅 报名截止: ${dl.toLocaleString('zh-CN')}`;
  }
  const formFields = document.getElementById('form-fields');
  fields.forEach(field => {
    const group = document.createElement('div');
    group.className = 'form-group';
    const label = document.createElement('label');
    label.textContent = field.label;
    if (field.required) { const r = document.createElement('span'); r.className='required'; r.textContent=' *'; label.appendChild(r); }
    group.appendChild(label);
    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      input.name = field.name; input.required = field.required;
      const def = document.createElement('option'); def.value=''; def.textContent=field.placeholder||'请选择'; input.appendChild(def);
      (field.options||[]).forEach(o => { const opt=document.createElement('option'); opt.value=o; opt.textContent=o; input.appendChild(opt); });
    } else if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.name=field.name; input.placeholder=field.placeholder||''; input.required=field.required;
    } else {
      input = document.createElement('input');
      input.type = field.type==='phone'?'tel':(field.type||'text');
      input.name=field.name; input.placeholder=field.placeholder||''; input.required=field.required;
      if(field.type==='number') input.min='1';
    }
    group.appendChild(input);
    formFields.appendChild(group);
  });
}

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = {};
  appConfig.fields.forEach(f => { const el=document.querySelector(`[name="${f.name}"]`); formData[f.name]=el?el.value.trim():''; });
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled=true; btn.textContent='提交中...';
  try {
    const res = await fetch('/api/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(formData) });
    const result = await res.json();
    if (res.ok && result.success) {
      document.getElementById('register-form').style.display='none';
      document.getElementById('success-msg').style.display='block';
    } else { alert(result.error||'提交失败'); btn.disabled=false; btn.textContent='提交报名'; }
  } catch { alert('网络错误'); btn.disabled=false; btn.textContent='提交报名'; }
});
