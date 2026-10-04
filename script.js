const CATS = {
  in: ['เงินเดือน', 'โบนัส', 'งานเสริม', 'ดอกเบี้ย/ปันผล', 'อื่น ๆ'],
  out: ['อาหาร', 'เดินทาง', 'ที่อยู่อาศัย', 'สาธารณูปโภค', 'ช้อปปิ้ง', 'สุขภาพ', 'การศึกษา', 'อื่น ๆ']
};

const INITIAL_ENTRIES = [
  { id: 1, date: '2026-09-01', type: 'in', category: 'เงินเดือน', amount: 45000, note: 'เงินเดือนเดือนกันยายน' },
  { id: 2, date: '2026-09-03', type: 'out', category: 'อาหาร', amount: 1200, note: 'อาหารกลางวัน' },
  { id: 3, date: '2026-09-05', type: 'out', category: 'ที่อยู่อาศัย', amount: 7800, note: 'ค่าเช่าบ้าน' },
  { id: 4, date: '2026-09-10', type: 'in', category: 'งานเสริม', amount: 6500, note: 'งาน freelance' },
  { id: 5, date: '2026-09-14', type: 'out', category: 'สุขภาพ', amount: 1800, note: 'ซื้อยารักษา' },
  { id: 6, date: '2026-09-20', type: 'out', category: 'ช้อปปิ้ง', amount: 2300, note: 'อุปกรณ์สำนักงาน' },
  { id: 7, date: '2026-08-15', type: 'in', category: 'โบนัส', amount: 20000, note: 'โบนัสประจำปี' },
  { id: 8, date: '2026-08-12', type: 'out', category: 'การศึกษา', amount: 4500, note: 'คอร์สออนไลน์' }
];

const INITIAL_STOCKS = [
  { name: 'ตัวอย่าง A (ธนาคาร)', pe: 8, pb: 0.8, roe: 10, de: 1.5, dy: 5.5, growth: 4, rsi: 55, trend: 'a', macd: 'n', risk: ['low'] },
  { name: 'ตัวอย่าง B (เทคโนโลยี)', pe: 28, pb: 6, roe: 22, de: 0.3, dy: 1.2, growth: 18, rsi: 68, trend: 'a', macd: 'u', risk: [] },
  { name: 'ตัวอย่าง C (พลังงาน)', pe: 6, pb: 0.7, roe: 7, de: 1.8, dy: 7, growth: -3, rsi: 34, trend: 'b', macd: 'd', risk: ['debt'] }
];

const state = {
  theme: 'light',
  activeNav: 'acc',
  activeTab: 'led',
  entries: loadEntries(),
  stocks: [...INITIAL_STOCKS]
};

const moneyFormat = (value) => Math.round(value).toLocaleString('th-TH');

const byMonthKey = (dateString) => dateString.slice(0, 7);

function loadEntries() {
  const saved = localStorage.getItem('moneywise-entries');
  if (!saved) return INITIAL_ENTRIES;
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_ENTRIES;
  }
}

function saveEntries() {
  localStorage.setItem('moneywise-entries', JSON.stringify(state.entries));
}

function formatMoneyShort(value) {
  const abs = Math.abs(value);
  if (abs >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(Math.round(value));
}

function populateCategoryOptions() {
  const typeSelect = document.getElementById('entryType');
  const categorySelect = document.getElementById('entryCategory');
  const selectedType = typeSelect.value;
  const options = CATS[selectedType];

  categorySelect.innerHTML = options
    .map((category) => `<option value="${category}">${category}</option>`)
    .join('');
}

function calculateStats() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const income = state.entries
    .filter((x) => x.type === 'in' && byMonthKey(x.date) === currentMonth)
    .reduce((sum, x) => sum + Number(x.amount), 0);

  const expense = state.entries
    .filter((x) => x.type === 'out' && byMonthKey(x.date) === currentMonth)
    .reduce((sum, x) => sum + Number(x.amount), 0);

  return {
    income,
    expense,
    net: income - expense
  };
}

function renderStats() {
  const stats = calculateStats();
  document.getElementById('incomeThisMonth').textContent = `${moneyFormat(stats.income)} ฿`;
  document.getElementById('expenseThisMonth').textContent = `${moneyFormat(stats.expense)} ฿`;
  const netEl = document.getElementById('netThisMonth');
  netEl.textContent = `${stats.net >= 0 ? '+' : '-'}${moneyFormat(Math.abs(stats.net))} ฿`;
  netEl.classList.toggle('up', stats.net >= 0);
  netEl.classList.toggle('down', stats.net < 0);
}

function renderChart() {
  const months = [];
  const today = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }

  const incomeValues = months.map((month) => state.entries
    .filter((x) => x.type === 'in' && byMonthKey(x.date) === month)
    .reduce((sum, x) => sum + Number(x.amount), 0));

  const expenseValues = months.map((month) => state.entries
    .filter((x) => x.type === 'out' && byMonthKey(x.date) === month)
    .reduce((sum, x) => sum + Number(x.amount), 0));

  const maxValue = Math.max(1, ...incomeValues, ...expenseValues);

  const chart = document.getElementById('barChart');
  chart.innerHTML = months.map((month, index) => {
    const income = incomeValues[index];
    const expense = expenseValues[index];
    const incomeHeight = (income / maxValue) * 100;
    const expenseHeight = (expense / maxValue) * 100;

    return `
      <div class="bar-col">
        <div class="bar-pair">
          <span class="bar income" style="height:${incomeHeight}%"></span>
          <span class="bar outcome" style="height:${expenseHeight}%"></span>
        </div>
        <span class="bar-label">${month.slice(5)}/${month.slice(2, 4)}</span>
      </div>
    `;
  }).join('');
}

function renderEntries() {
  const table = document.getElementById('entriesTableBody');
  const entries = [...state.entries].sort((a, b) => b.date.localeCompare(a.date));

  if (!entries.length) {
    table.innerHTML = `
      <tr>
        <td colspan="5">ยังไม่มีรายการ เริ่มจากกรอกฟอร์มด้านบน แล้วกด "บันทึกรายการ"</td>
      </tr>
    `;
    return;
  }

  const rows = entries.map((entry) => `
    <tr>
      <td>${entry.date}</td>
      <td>${entry.category}</td>
      <td>${escapeHtml(entry.note || '')}</td>
      <td class="align-right ${entry.type === 'in' ? 'up' : 'down'}">
        ${entry.type === 'in' ? '+' : '−'}${moneyFormat(entry.amount)}
      </td>
      <td class="align-right"><button class="ghost-btn" data-delete-id="${entry.id}" type="button">ลบ</button></td>
    </tr>
  `).join('');

  table.innerHTML = `
    <tr>
      <th>วันที่</th>
      <th>หมวด</th>
      <th>บันทึก</th>
      <th class="align-right">จำนวน</th>
      <th></th>
    </tr>
    ${rows}
  `;

  document.querySelectorAll('[data-delete-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-delete-id'));
      state.entries = state.entries.filter((entry) => entry.id !== id);
      saveEntries();
      renderAll();
    });
  });
}

function renderStocks() {
  const table = document.getElementById('stocksTableBody');
  const filter = document.getElementById('stockFilter').value;

  const filtered = state.stocks.filter((stock) => {
    if (filter === 'div') return stock.dy >= 4;
    if (filter === 'gr') return stock.growth >= 10;
    if (filter === 'val') return stock.pe < 12 && stock.pb < 1.5;
    return true;
  });

  table.innerHTML = `
    <tr>
      <th>อันดับ</th>
      <th>หุ้น</th>
      <th class="align-right">Fundamental</th>
      <th class="align-right">Technical</th>
      <th class="align-right">ความปลอดภัย</th>
      <th class="align-right">รวม</th>
      <th>สรุป</th>
    </tr>
    ${filtered.map((stock, index) => {
      const fundamental = Math.round(stock.pe + stock.roe * 0.8);
      const technical = Math.round(stock.rsi / 2);
      const safety = Math.round((100 - stock.risk.length * 13) / 1.8);
      const total = Math.round((stock.pe || 0) + (stock.roe || 0) + (stock.dy || 0) * 6 + (stock.growth || 0) * 2);
      const label = total >= 90 ? 'น่าสนใจ' : total >= 70 ? 'พอใช้' : 'ระวัง';
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${stock.name}</td>
          <td class="align-right">${fundamental}</td>
          <td class="align-right">${technical}</td>
          <td class="align-right">${safety}</td>
          <td class="align-right"><b>${total}</b></td>
          <td><span class="status-pill">${label}</span></td>
        </tr>
      `;
    }).join('')}
  `;
}

function renderTaxEstimate() {
  const inputs = [...document.querySelectorAll('.tax-form input, .tax-form select')];
  const values = inputs.map((input) => Number(input.value || 0));
  const gross = values[0] + values[1] + values[2];
  const allowance = 60000 + (values[7] * 30000) + (values[8] * 30000) + (values[9] * 30000) + values[10] + values[11] + values[12] + values[13] + values[14] + values[15] + values[16];
  const taxable = Math.max(0, gross - allowance);
  const estimatedTax = taxable * 0.15;
  const netAfterTax = Math.max(0, gross - estimatedTax - values[5]);

  const output = document.getElementById('taxOutput');
  output.innerHTML = `
    <h3>ผลการประเมินภาษี</h3>
    <p>รายได้รวมทั้งปี: <b>${moneyFormat(gross)}</b> บาท</p>
    <p>ส่วนลด/ค่าลดหย่อน: <b>${moneyFormat(allowance)}</b> บาท</p>
    <p>เงินได้ที่ต้องเสียภาษี: <b>${moneyFormat(taxable)}</b> บาท</p>
    <p>ภาษีโดยประมาณ: <b class="down">${moneyFormat(estimatedTax)}</b> บาท</p>
    <p>เงินคงเหลือหลังหักภาษีโดยประมาณ: <b class="up">${moneyFormat(netAfterTax)}</b> บาท</p>
  `;
}

function handleThemeToggle() {
  const root = document.body;
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  root.classList.toggle('dark', state.theme === 'dark');
}

function setNav(target) {
  state.activeNav = target;
  document.querySelectorAll('.nav').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.target === target);
  });
  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.panel === target);
  });
}

function setTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('[data-tab-panel]').forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.tabPanel === tab);
  });
}

function addEntry() {
  const date = document.getElementById('entryDate').value || new Date().toISOString().slice(0, 10);
  const type = document.getElementById('entryType').value;
  const category = document.getElementById('entryCategory').value;
  const amount = Number(document.getElementById('entryAmount').value || 0);
  const note = document.getElementById('entryNote').value.trim();

  if (!amount || amount <= 0) {
    alert('กรุณาใส่จำนวนเงินที่มากกว่า 0');
    return;
  }

  state.entries.push({
    id: Date.now(),
    date,
    type,
    category,
    amount,
    note
  });

  saveEntries();
  document.getElementById('entryAmount').value = '';
  document.getElementById('entryNote').value = '';
  renderAll();
}

function backupEntries() {
  const blob = new Blob([JSON.stringify(state.entries, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'moneywise-backup.json';
  link.click();
  URL.revokeObjectURL(url);
}

function importEntries(input) {
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(String(e.target?.result || '[]'));
      if (!Array.isArray(parsed)) throw new Error('Invalid data');
      state.entries = parsed;
      saveEntries();
      renderAll();
    } catch (error) {
      alert('ไฟล์ข้อมูลไม่ถูกต้อง กรุณาใช้ไฟล์ backup ที่สร้างจากระบบนี้');
    }
  };
  reader.readAsText(file);
}

function summarizeDocument() {
  const text = document.getElementById('docInput').value.trim();
  if (!text) {
    alert('กรุณาใส่ข้อความหรืออัปโหลดไฟล์ก่อนสรุป');
    return;
  }

  const sentences = text.split(/[.!?\n]+/).map((s) => s.trim()).filter(Boolean);
  const summary = sentences.slice(0, 3).join('. ');
  const output = document.getElementById('docOutput');
  output.innerHTML = `<h3>สรุปแบบพื้นฐาน</h3><p>${escapeHtml(summary || 'ไม่มีข้อความที่สามารถสรุปได้')}</p>`;
}

function askAi() {
  const prompt = document.getElementById('aiPrompt').value.trim();
  const output = document.getElementById('aiOutput');
  if (!prompt) {
    output.innerHTML = '<p>กรุณาพิมพ์คำถามก่อน</p>';
    return;
  }

  output.innerHTML = `
    <p><b>คำถาม:</b> ${escapeHtml(prompt)}</p>
    <p><b>คำตอบ:</b> จากมุมมองการจัดการเงินส่วนบุคคล ควรเริ่มจากการจัดสรรรายรับให้เหมาะสมก่อน เช่น 50% สำหรับค่าใช้จ่ายพื้นฐาน 30% สำหรับการออม/ลงทุน และ 20% สำหรับค่าใช้จ่ายแบบยืดหยุ่นหรือความคุ้มครองทางการเงิน หากต้องการเพิ่มประสิทธิภาพ ให้ตรวจสอบค่าใช้จ่ายซ้ำและลดพื้นที่ที่ไม่จำเป็นก่อน</p>
  `;
}

function addStock() {
  const name = document.getElementById('stockName').value.trim() || 'หุ้นตัวอย่างใหม่';
  const stock = {
    name,
    pe: Number(document.getElementById('stockPe').value || 0),
    pb: Number(document.getElementById('stockPb').value || 0),
    roe: Number(document.getElementById('stockRoe').value || 0),
    de: Number(document.getElementById('stockDe').value || 0),
    dy: Number(document.getElementById('stockDy').value || 0),
    growth: Number(document.getElementById('stockGrowth').value || 0),
    rsi: Number(document.getElementById('stockRsi').value || 50),
    trend: document.getElementById('stockTrend').value,
    macd: document.getElementById('stockMacd').value,
    risk: []
  };

  state.stocks.unshift(stock);
  renderStocks();
  document.getElementById('stockName').value = '';
  document.getElementById('stockPe').value = '';
  document.getElementById('stockPb').value = '';
  document.getElementById('stockRoe').value = '';
  document.getElementById('stockDe').value = '';
  document.getElementById('stockDy').value = '';
  document.getElementById('stockGrowth').value = '';
  document.getElementById('stockRsi').value = '';
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderAll() {
  renderStats();
  renderChart();
  renderEntries();
  renderStocks();
  renderTaxEstimate();
}

function setupListeners() {
  document.getElementById('entryType').addEventListener('change', populateCategoryOptions);
  document.getElementById('addEntryBtn').addEventListener('click', addEntry);
  document.getElementById('backupBtn').addEventListener('click', backupEntries);
  document.getElementById('importDataInput').addEventListener('change', (event) => importEntries(event.target));
  document.getElementById('themeToggleBtn').addEventListener('click', handleThemeToggle);
  document.getElementById('taxCalcBtn').addEventListener('click', renderTaxEstimate);
  document.getElementById('summarizeDocBtn').addEventListener('click', summarizeDocument);
  document.getElementById('askAiBtn').addEventListener('click', askAi);
  document.getElementById('aiSetupBtn').addEventListener('click', () => alert('ตั้งค่า AI: ใส่ URL ของ AI proxy แล้วเชื่อมต่อ'));
  document.getElementById('addStockBtn').addEventListener('click', addStock);
  document.getElementById('stockFilter').addEventListener('change', renderStocks);

  document.querySelectorAll('.nav').forEach((nav) => {
    nav.addEventListener('click', () => setNav(nav.dataset.target));
  });

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => setTab(tab.dataset.tab));
  });

  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const aiPrompt = document.getElementById('aiPrompt');
      aiPrompt.value = chip.textContent.trim();
    });
  });
}

function initialize() {
  document.getElementById('entryDate').value = new Date().toISOString().slice(0, 10);
  populateCategoryOptions();
  document.body.classList.toggle('dark', state.theme === 'dark');
  setupListeners();
  renderAll();
}

initialize();
