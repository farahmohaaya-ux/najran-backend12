require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const cron = require('node-cron');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const clientRoutes = require('./routes/clients');
const taskRoutes = require('./routes/tasks');
const contentRoutes = require('./routes/content');
const financeRoutes = require('./routes/finance');
const { syncAllContent } = require('./services/metaSync');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/finance', financeRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// نفس السيرفر بيخدم الواجهة الأمامية كمان — يعني السيرفر الواحد هاد هو
// كل "البرنامج": الرابط الرئيسي بيفتح الداشبورد، و/api/* هو الـAPI.
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Pulls fresh Meta numbers for every tracked Reel/Post/Story every 6 hours.
// This ONLY adds new rows to analytics_history — nothing is ever deleted here.
cron.schedule('0 */6 * * *', () => {
  console.log('⏳ مزامنة دورية مع Meta...');
  syncAllContent().catch((e) => console.error('فشلت المزامنة الدورية:', e.message));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Najran Agency شغال بالكامل (واجهة + API) على المنفذ ${PORT}`));
