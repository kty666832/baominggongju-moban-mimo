const express = require('express');
const cors = require('cors');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const db = require('./database');

const configPath = path.join(__dirname, 'config.yaml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));
db.initDatabase(config.fields);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/config', (req, res) => {
  res.json({ event: config.event, fields: config.fields, grouping: config.grouping });
});

app.post('/api/register', (req, res) => {
  try {
    if (config.event.deadline) {
      if (new Date() > new Date(config.event.deadline)) {
        return res.status(400).json({ error: '报名已截止' });
      }
    }
    for (const field of config.fields) {
      if (field.required && !req.body[field.name]) {
        return res.status(400).json({ error: `${field.label} 为必填项` });
      }
    }
    const result = db.insertRegistration(req.body, config.fields);
    res.json({ success: true, id: result.id, message: '报名成功！' });
  } catch (err) {
    console.error('报名失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/api/admin/login', (req, res) => {
  if (req.body.password === config.admin.password) res.json({ success: true });
  else res.status(401).json({ error: '密码错误' });
});

app.get('/api/admin/registrations', (req, res) => {
  if (req.query.password !== config.admin.password) return res.status(401).json({ error: '未授权' });
  const data = db.getAllRegistrations();
  const count = db.getCount();
  let groupStats = config.grouping?.enabled ? db.getGroupStats(config.grouping.field) : null;
  res.json({ total: count, groupStats, groupLabel: config.grouping?.label, records: data, fields: config.fields });
});

app.delete('/api/admin/registrations/:id', (req, res) => {
  if (req.query.password !== config.admin.password) return res.status(401).json({ error: '未授权' });
  db.deleteRegistration(req.params.id);
  res.json({ success: true });
});

const PORT = config.server?.port || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 ${config.event.name} 系统已启动`);
  console.log(`📋 报名页面: http://localhost:${PORT}`);
  console.log(`🔧 管理后台: http://localhost:${PORT}/admin.html`);
});
