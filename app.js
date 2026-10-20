/* ============================================================
   自媒体创作工作台 - app.js
   ============================================================ */

// ========================
// Storage Module
// ========================
const Store = {
  get(key, defaultVal) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : defaultVal;
    } catch (e) { return defaultVal; }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },
  remove(key) { localStorage.removeItem(key); }
};

// ========================
// Utils
// ========================
const Utils = {
  today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },
  now() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  },
  fmtDate(d) {
    return `${d.getMonth()+1}月${d.getDate()}日`;
  },
  fmtMoney(n) {
    return '¥' + (Number(n) || 0).toFixed(2);
  },
  fmtNum(n) {
    n = Number(n) || 0;
    if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    return n.toString();
  },
  genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  },
  monthKey(d) {
    d = d || new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  },
  weekNum(d) {
    d = new Date(d);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  },
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// ========================
// WMO Weather Code Map
// ========================
const WMO_CODES = {
  0:  { icon: '☀️', desc: '晴' },
  1:  { icon: '🌤️', desc: '晴间多云' },
  2:  { icon: '⛅', desc: '多云' },
  3:  { icon: '☁️', desc: '阴' },
  45: { icon: '🌫️', desc: '雾' },
  48: { icon: '🌫️', desc: '雾凇' },
  51: { icon: '🌦️', desc: '小毛毛雨' },
  53: { icon: '🌦️', desc: '毛毛雨' },
  55: { icon: '🌧️', desc: '大毛毛雨' },
  56: { icon: '🌧️', desc: '冻毛毛雨' },
  57: { icon: '🌧️', desc: '冻雨' },
  61: { icon: '🌧️', desc: '小雨' },
  63: { icon: '🌧️', desc: '中雨' },
  65: { icon: '🌧️', desc: '大雨' },
  66: { icon: '🌧️', desc: '冻雨' },
  67: { icon: '🌧️', desc: '大冻雨' },
  71: { icon: '🌨️', desc: '小雪' },
  73: { icon: '🌨️', desc: '中雪' },
  75: { icon: '❄️', desc: '大雪' },
  77: { icon: '🌨️', desc: '米雪' },
  80: { icon: '🌧️', desc: '小阵雨' },
  81: { icon: '🌧️', desc: '阵雨' },
  82: { icon: '⛈️', desc: '暴雨' },
  85: { icon: '🌨️', desc: '小阵雪' },
  86: { icon: '❄️', desc: '大阵雪' },
  95: { icon: '⛈️', desc: '雷雨' },
  96: { icon: '⛈️', desc: '雷雨冰雹' },
  99: { icon: '⛈️', desc: '大雷暴' }
};

// ========================
// Desktop Module
// ========================
const Desktop = {
  calDate: new Date(),

  init() {
    document.getElementById('desktop-date').textContent = Utils.fmtDate(new Date());
    this.renderCalendar();
    this.renderWeather();
    this.renderSpending();
    this.renderInspirations();
    this.renderMenu();

    document.getElementById('cal-prev').onclick = () => {
      this.calDate.setMonth(this.calDate.getMonth() - 1);
      this.renderCalendar();
    };
    document.getElementById('cal-next').onclick = () => {
      this.calDate.setMonth(this.calDate.getMonth() + 1);
      this.renderCalendar();
    };
  },

  renderCalendar() {
    const d = this.calDate;
    const year = d.getFullYear();
    const month = d.getMonth();
    document.getElementById('cal-month-label').textContent = `${year}年${month + 1}月`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    const today = Utils.today();
    const recordDates = this.getRecordDates();

    for (let i = 0; i < startWeekday; i++) {
      const day = prevMonthDays - startWeekday + i + 1;
      grid.appendChild(this.makeDayCell(day, 'other-month'));
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
      const classes = [];
      if (dateStr === today) classes.push('today');
      if (recordDates.includes(dateStr)) classes.push('has-record');
      grid.appendChild(this.makeDayCell(i, classes.join(' ')));
    }
    const totalCells = startWeekday + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      grid.appendChild(this.makeDayCell(i, 'other-month'));
    }
  },

  makeDayCell(day, classes) {
    const cell = document.createElement('div');
    cell.className = 'cal-day ' + classes;
    cell.textContent = day;
    return cell;
  },

  getRecordDates() {
    const dates = [];
    const expenses = Store.get('wb_expenses', []);
    expenses.forEach(e => dates.push(e.date));
    const inspirations = Store.get('wb_inspirations', []);
    inspirations.forEach(i => dates.push(i.date));
    return [...new Set(dates)];
  },

  async renderWeather() {
    const coords = Store.get('wb_weather_coords', null);
    let cityName = Store.get('wb_weather_city', '');

    let lat, lon;
    if (coords) {
      lat = coords.lat;
      lon = coords.lon;
    } else {
      // Try geolocation
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: false });
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        Store.set('wb_weather_coords', { lat, lon });
      } catch (e) {
        lat = 39.9042;
        lon = 116.4074;
        cityName = '北京';
        Store.set('wb_weather_coords', { lat, lon });
        Store.set('wb_weather_city', cityName);
      }
    }

    // Reverse geocode for city name if missing
    if (!cityName) {
      try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`);
        const data = await res.json();
        cityName = data.city || data.locality || data.principalSubdivision || '当前位置';
        Store.set('wb_weather_city', cityName);
      } catch (e) {
        cityName = '当前位置';
      }
    }

    // Fetch weather
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();
      const cw = data.current_weather;
      const wmo = WMO_CODES[cw.weathercode] || { icon: '🌡️', desc: '未知' };

      document.getElementById('weather-loading').style.display = 'none';
      document.getElementById('weather-info').style.display = 'flex';
      document.getElementById('weather-icon').textContent = wmo.icon;
      document.getElementById('weather-temp').textContent = Math.round(cw.temperature) + '°';
      document.getElementById('weather-desc').textContent = wmo.desc;
      document.getElementById('weather-city').textContent = cityName;
      const daily = data.daily;
      if (daily) {
        document.getElementById('weather-feels').textContent = `${Math.round(daily.temperature_2m_max[0])}° / ${Math.round(daily.temperature_2m_min[0])}°`;
      }
    } catch (e) {
      document.getElementById('weather-loading').textContent = '天气获取失败';
      document.getElementById('weather-loading').onclick = () => { Store.remove('wb_weather_coords'); this.renderWeather(); };
    }
  },

  renderSpending() {
    const today = Utils.today();
    const expenses = Store.get('wb_expenses', []).filter(e => e.date === today);
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    document.getElementById('spending-total').textContent = Utils.fmtMoney(total);

    const breakdown = document.getElementById('spending-breakdown');
    if (expenses.length === 0) {
      breakdown.innerHTML = '<span class="spending-empty">今日暂无消费记录</span>';
      return;
    }
    const cats = {};
    expenses.forEach(e => { cats[e.category] = (cats[e.category] || 0) + Number(e.amount); });
    breakdown.innerHTML = Object.entries(cats).map(([cat, amt]) =>
      `<span class="spending-tag">${cat} ¥${amt.toFixed(2)}</span>`
    ).join('');
  },

  // ---- Inspirations ----
  renderInspirations() {
    const list = Store.get('wb_inspirations', []).sort((a, b) => b.createdAt - a.createdAt);
    const container = document.getElementById('inspiration-list');
    if (list.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💡</div>暂无灵感记录，点击新增</div>';
      return;
    }
    container.innerHTML = list.map(item => `
      <div class="list-item">
        <div class="list-item-content">
          <div class="list-item-text">${Utils.escapeHtml(item.content)}</div>
          <div class="list-item-time">${item.date} ${item.time}</div>
        </div>
        <div class="list-item-actions">
          <button class="btn-icon edit" onclick="Desktop.showEditInspiration('${item.id}')">✎</button>
          <button class="btn-icon del" onclick="Desktop.deleteInspiration('${item.id}')">🗑</button>
        </div>
      </div>
    `).join('');
  },

  showAddInspiration() {
    App.showModal('新增灵感', `
      <textarea class="modal-form-textarea" id="modal-inspiration-text" placeholder="记录你的灵感闪现..."></textarea>
      <div class="modal-btn-row">
        <button class="modal-btn secondary" onclick="App.closeModal()">取消</button>
        <button class="modal-btn primary" onclick="Desktop.saveInspiration()">保存</button>
      </div>
    `);
    setTimeout(() => document.getElementById('modal-inspiration-text').focus(), 100);
  },

  showEditInspiration(id) {
    const list = Store.get('wb_inspirations', []);
    const item = list.find(i => i.id === id);
    if (!item) return;
    App.showModal('编辑灵感', `
      <textarea class="modal-form-textarea" id="modal-inspiration-text">${Utils.escapeHtml(item.content)}</textarea>
      <div class="modal-btn-row">
        <button class="modal-btn secondary" onclick="App.closeModal()">取消</button>
        <button class="modal-btn primary" onclick="Desktop.saveInspiration('${id}')">保存</button>
      </div>
    `);
  },

  saveInspiration(id) {
    const text = document.getElementById('modal-inspiration-text').value.trim();
    if (!text) { App.toast('请输入内容'); return; }
    const list = Store.get('wb_inspirations', []);
    if (id) {
      const item = list.find(i => i.id === id);
      if (item) { item.content = text; item.updatedAt = Date.now(); }
    } else {
      list.push({ id: Utils.genId(), content: text, date: Utils.today(), time: Utils.now(), createdAt: Date.now() });
    }
    Store.set('wb_inspirations', list);
    App.closeModal();
    this.renderInspirations();
    this.renderCalendar();
    App.toast(id ? '已更新' : '已记录');
  },

  deleteInspiration(id) {
    App.confirm('确定删除这条灵感？', () => {
      const list = Store.get('wb_inspirations', []).filter(i => i.id !== id);
      Store.set('wb_inspirations', list);
      this.renderInspirations();
      this.renderCalendar();
      App.toast('已删除');
    });
  },

  // ---- Daily Menu ----
  renderMenu() {
    const today = Utils.today();
    const list = Store.get('wb_menus', []).filter(m => m.date === today).sort((a, b) => (a.order || 0) - (b.order || 0));
    const container = document.getElementById('menu-list');
    if (list.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🍽️</div>今日暂无菜单记录</div>';
      return;
    }
    container.innerHTML = list.map(item => `
      <div class="list-item">
        <div class="list-item-content">
          <span class="list-item-tag">${item.mealType}</span>
          <span class="list-item-text">${Utils.escapeHtml(item.content)}</span>
        </div>
        <div class="list-item-actions">
          <button class="btn-icon edit" onclick="Desktop.showEditMenu('${item.id}')">✎</button>
          <button class="btn-icon del" onclick="Desktop.deleteMenu('${item.id}')">🗑</button>
        </div>
      </div>
    `).join('');
  },

  showAddMenu() {
    App.showModal('新增菜单', `
      <select class="modal-form-select" id="modal-menu-type">
        <option value="早餐">早餐</option>
        <option value="午餐">午餐</option>
        <option value="晚餐">晚餐</option>
        <option value="加餐">加餐</option>
      </select>
      <textarea class="modal-form-textarea" id="modal-menu-content" placeholder="今天吃什么..."></textarea>
      <div class="modal-btn-row">
        <button class="modal-btn secondary" onclick="App.closeModal()">取消</button>
        <button class="modal-btn primary" onclick="Desktop.saveMenu()">保存</button>
      </div>
    `);
  },

  showEditMenu(id) {
    const list = Store.get('wb_menus', []);
    const item = list.find(i => i.id === id);
    if (!item) return;
    App.showModal('编辑菜单', `
      <select class="modal-form-select" id="modal-menu-type">
        <option value="早餐" ${item.mealType==='早餐'?'selected':''}>早餐</option>
        <option value="午餐" ${item.mealType==='午餐'?'selected':''}>午餐</option>
        <option value="晚餐" ${item.mealType==='晚餐'?'selected':''}>晚餐</option>
        <option value="加餐" ${item.mealType==='加餐'?'selected':''}>加餐</option>
      </select>
      <textarea class="modal-form-textarea" id="modal-menu-content">${Utils.escapeHtml(item.content)}</textarea>
      <div class="modal-btn-row">
        <button class="modal-btn secondary" onclick="App.closeModal()">取消</button>
        <button class="modal-btn primary" onclick="Desktop.saveMenu('${id}')">保存</button>
      </div>
    `);
  },

  saveMenu(id) {
    const mealType = document.getElementById('modal-menu-type').value;
    const content = document.getElementById('modal-menu-content').value.trim();
    if (!content) { App.toast('请输入内容'); return; }
    const list = Store.get('wb_menus', []);
    if (id) {
      const item = list.find(i => i.id === id);
      if (item) { item.mealType = mealType; item.content = content; }
    } else {
      list.push({ id: Utils.genId(), mealType, content, date: Utils.today(), order: Date.now() });
    }
    Store.set('wb_menus', list);
    App.closeModal();
    this.renderMenu();
    this.renderCalendar();
    App.toast(id ? '已更新' : '已记录');
  },

  deleteMenu(id) {
    App.confirm('确定删除这条菜单？', () => {
      const list = Store.get('wb_menus', []).filter(i => i.id !== id);
      Store.set('wb_menus', list);
      this.renderMenu();
      this.renderCalendar();
      App.toast('已删除');
    });
  }
};

// ========================
// Hot Videos Module
// ========================
const Hot = {
  currentTrack: 'pet',
  currentPlatform: 'all',

  // Sample data pool - each track has multiple videos
  dataPool: {
    pet: [
      {
        id: 'p1', platform: 'douyin', track: 'pet', emoji: '🐱', thumbColor: '#fbc4ab',
        title: '猫咪第一次见到小主人，反应太暖了',
        plays: 12800000, likes: 856000, comments: 23000, shares: 45000,
        analysis: '情感共鸣+反差萌。宠物与婴儿初次见面的温情瞬间，触发观众保护欲和治愈感。猫咪从警惕到亲近的情绪变化制造了天然的故事弧线，无需刻意设计就有戏剧性。',
        idea: '翻拍思路：用自家宠物与新生儿/小主人的初次互动，重点捕捉宠物表情的微表情变化。配慢节奏治愈BGM，标题用"XX第一次见到小主人"制造好奇心。开头3秒用宠物最萌的瞬间做前置钩子。结尾可加"你家宠物第一次见到宝宝是什么反应？"',
        videoUrl: 'https://www.douyin.com/search/猫咪第一次见到小主人'
      },
      {
        id: 'p2', platform: 'xhs', track: 'pet', emoji: '🐱', thumbColor: '#ffafcc',
        title: '布偶猫从小养到大，毛量惊人变化全过程',
        plays: 950000, likes: 120000, comments: 5600, shares: 8900,
        analysis: '养成系内容+视觉冲击。从幼猫到成猫的对比展示满足了观众的养成心理，毛量的视觉变化是天然的"前后对比"钩子。小红书用户尤其喜欢收藏此类养育参考，收藏率极高。',
        idea: '翻拍思路：记录自家宠物从幼年到成年的变化，分3-4个阶段展示，每个阶段配年龄标签。开头直接放对比图做钩子。结尾抛出"你家主子几个月了？晒晒照片"引导评论互动。',
        videoUrl: 'https://www.xiaohongshu.com/search_result/布偶猫养成'
      },
      {
        id: 'p3', platform: 'douyin', track: 'pet', emoji: '🐶', thumbColor: '#ffd6a5',
        title: '教狗狗按铃铛吃饭，第三天就学会了',
        plays: 8200000, likes: 560000, comments: 18000, shares: 32000,
        analysis: '教程类+成就感。宠物训练教程天然有"我也能做到"的代入感，"第三天学会"制造了进度感降低了门槛，观众有收藏跟练的冲动。训练过程的意外反应增加趣味性。',
        idea: '翻拍思路：做一个3-5天的宠物训练日记，每天记录进步。开头直接放学会后的成品效果做钩子，再倒叙过程。结尾引导"评论区晒你家狗狗学会了什么技能"。',
        videoUrl: 'https://www.douyin.com/search/教狗狗按铃铛'
      },
      {
        id: 'p4', platform: 'xhs', track: 'pet', emoji: '🍲', thumbColor: '#caffbf',
        title: '自制猫饭｜低成本高蛋白配方分享',
        plays: 680000, likes: 89000, comments: 4200, shares: 12000,
        analysis: '实用干货+成本对比。自制猫饭兼具"省钱"和"健康"双重价值点，配方可复制性强，收藏价值极高。小红书用户对宠物饮食内容有高互动意愿，评论区会自发讨论配方改良。',
        idea: '翻拍思路：分享自制宠物粮配方，列出材料成本对比商品粮价格。拍摄制作过程+成品展示。配详细图文笔记方便收藏。标题用"XX元vs XX元"制造价值对比。',
        videoUrl: 'https://www.xiaohongshu.com/search_result/自制猫饭配方'
      },
      {
        id: 'p5', platform: 'douyin', track: 'pet', emoji: '🐱', thumbColor: '#bdb2ff',
        title: '橘猫偷开冰箱被抓包，表情绝了',
        plays: 15600000, likes: 980000, comments: 45000, shares: 67000,
        analysis: '意外搞笑+表情包潜力。宠物"犯罪现场"天然有喜剧效果，被抓包时的表情变化是情绪高潮点，极易被截取做成表情包二次传播。橘猫自带"吃货"标签强化了喜剧效果。',
        idea: '翻拍思路：设置一个"陷阱场景"让宠物做出搞笑行为（偷吃/拆家/迷路），用监控视角记录。重点捕捉宠物"被发现"的瞬间表情。配搞笑音效。结尾"你家主子干过最离谱的事是什么？"',
        videoUrl: 'https://www.douyin.com/search/橘猫偷开冰箱'
      }
    ],
    sewing: [
      {
        id: 's1', platform: 'xhs', track: 'sewing', emoji: '✂️', thumbColor: '#a0c4ff',
        title: '旧牛仔裤改成帆布包，零成本出街',
        plays: 1200000, likes: 156000, comments: 8900, shares: 23000,
        analysis: '旧物改造+零成本。旧物改造天然有环保和省钱标签，"零成本"是强力钩子。成品展示和过程对比满足成就感，小红书手作赛道最易爆的品类。牛仔裤材质结实适合做包，成品有质感。',
        idea: '翻拍思路：选择一件旧衣物改造为实用物品（包/围裙/宠物衣服），开头展示成品，倒叙制作过程。配材料清单和工具清单方便跟做。标题突出"零成本"或"旧物改造"。',
        videoUrl: 'https://www.xiaohongshu.com/search_result/旧牛仔裤改造'
      },
      {
        id: 's2', platform: 'xhs', track: 'sewing', emoji: '🧵', thumbColor: '#caffbf',
        title: '手缝零钱包教程｜新手也能10分钟完成',
        plays: 890000, likes: 98000, comments: 5600, shares: 15000,
        analysis: '教程类+低门槛。"10分钟"和"新手也能"是降低门槛的关键钩子，教程类内容完播率和收藏率天然高。成品小巧可爱适合展示，评论区经常有跟做返图，形成UGC传播。',
        idea: '翻拍思路：做一个新手友好的手作教程，控制时长在3分钟内。开头展示成品，按步骤分解。每步配文字标注。结尾"想学什么手作评论区告诉我"引导互动。',
        videoUrl: 'https://www.xiaohongshu.com/search_result/手缝零钱包教程'
      },
      {
        id: 's3', platform: 'douyin', track: 'sewing', emoji: '🎨', thumbColor: '#ffd6a5',
        title: '用碎布头拼了一幅艺术挂毯，太美了',
        plays: 5600000, likes: 420000, comments: 12000, shares: 28000,
        analysis: '视觉冲击+变废为宝。碎布头到艺术品的转变是天然的"丑小鸭变天鹅"叙事，视觉对比强烈。抖音用户对这类手工过程有极高的完播率，延时拍摄效果尤其好。',
        idea: '翻拍思路：用零碎材料制作大型作品，重点拍前后对比。用延时摄影压缩制作过程。配艺术感BGM。标题用"碎XX竟然做出了XX"制造反差。',
        videoUrl: 'https://www.douyin.com/search/碎布头艺术挂毯'
      },
      {
        id: 's4', platform: 'xhs', track: 'sewing', emoji: '👘', thumbColor: '#bdb2ff',
        title: '汉服制作全过程｜从裁剪到成衣30天',
        plays: 950000, likes: 125000, comments: 6800, shares: 18000,
        analysis: '国风+长线养成。汉服自带文化属性和审美吸引力，"30天"制造了追更动力。过程展示满足好奇心，成品展示有极强的种草效果。汉服圈层用户粘性高，转发率高。',
        idea: '翻拍思路：做一个耗时较长的手作项目，分多期发布。每期展示一个阶段。开头展示成品做钩子。配详细图文笔记。标题突出时间跨度制造好奇。',
        videoUrl: 'https://www.xiaohongshu.com/search_result/汉服制作过程'
      },
      {
        id: 's5', platform: 'douyin', track: 'sewing', emoji: '🧶', thumbColor: '#ffafcc',
        title: '旧毛衣改造成宠物窝，保暖又环保',
        plays: 3200000, likes: 280000, comments: 9500, shares: 21000,
        analysis: '跨界组合+实用主义。旧毛衣+宠物窝的组合既解决旧衣处理又解决宠物用品，双重价值点。冬季季节性内容搜索流量高，宠物和手作双圈层覆盖扩大了受众。',
        idea: '翻拍思路：将旧衣物改造成宠物用品（窝/衣服/玩具），展示宠物使用成品的画面。开头展示宠物和新窝的互动。标题突出"旧XX改造成XX"。',
        videoUrl: 'https://www.douyin.com/search/旧毛衣改宠物窝'
      }
    ],
    fun: [
      {
        id: 'f1', platform: 'douyin', track: 'fun', emoji: '🎮', thumbColor: '#ffadad',
        title: '挑战24小时只花10元生存，差点饿晕',
        plays: 22000000, likes: 1200000, comments: 56000, shares: 89000,
        analysis: '挑战类+极限设定。"10元24小时"是极强力的设定钩子，观众天然有"看他怎么做到"的好奇心。挑战过程充满未知和戏剧性，完播率极高。"差点饿晕"增加了悬念。',
        idea: '翻拍思路：设计一个有极限感的挑战（省钱/限时/限定条件），全程记录。开头直接抛出挑战条件做钩子。中间设置困难和高潮。结尾公布结果并引导"你觉得这个挑战难吗？"',
        videoUrl: 'https://www.douyin.com/search/24小时10元生存挑战'
      },
      {
        id: 'f2', platform: 'xhs', track: 'fun', emoji: '🏠', thumbColor: '#a0c4ff',
        title: '90后夫妻的极简生活日常，东西少到惊人',
        plays: 1100000, likes: 156000, comments: 8900, shares: 19000,
        analysis: '生活方式+价值观共鸣。极简生活引发价值观讨论和向往感，小红书用户对生活方式类内容有高收藏和分享率。"东西少到惊人"制造了好奇心，满足窥探欲。',
        idea: '翻拍思路：展示一种有特点的生活方式（极简/断舍离/慢生活），用vlog形式记录。开头抛出核心理念做钩子。中间展示具体做法。结尾引导"你的生活理念是什么？"',
        videoUrl: 'https://www.xiaohongshu.com/search_result/极简生活日常'
      },
      {
        id: 'f3', platform: 'douyin', track: 'fun', emoji: '🥩', thumbColor: '#ffd6a5',
        title: '用微波炉做出米其林级牛排，这也行？',
        plays: 8900000, likes: 680000, comments: 23000, shares: 45000,
        analysis: '反常识+美食。"微波炉+米其林"制造了强烈的反差感，观众天然有"这可能吗？"的好奇心。美食成品展示有视觉吸引力，过程简单可复制，分享和收藏率高。',
        idea: '翻拍思路：用非传统工具/方法做出高级感的食物，制造反差。开头展示成品做钩子，再揭示做法。配详细步骤。标题用"XX竟然做出了XX"或"这也行？"。',
        videoUrl: 'https://www.douyin.com/search/微波炉牛排'
      },
      {
        id: 'f4', platform: 'xhs', track: 'fun', emoji: '👗', thumbColor: '#ffafcc',
        title: '一周穿搭不重样｜微胖女生版',
        plays: 680000, likes: 89000, comments: 5200, shares: 12000,
        analysis: '精准人群+实用价值。"微胖女生"精准切入了特定人群的需求，穿搭类内容收藏率天然高。一周7套提供了大量参考价值，用户有收藏作为穿搭参考的习惯。',
        idea: '翻拍思路：针对特定人群（身材/年龄/职业）做系列内容，每期展示多个方案。开头展示全部成品做钩子。配详细图文笔记。标题突出人群标签。',
        videoUrl: 'https://www.xiaohongshu.com/search_result/微胖女生穿搭'
      },
      {
        id: 'f5', platform: 'douyin', track: 'fun', emoji: '🧋', thumbColor: '#caffbf',
        title: '在家做出网红奶茶，成本只要3元',
        plays: 6200000, likes: 450000, comments: 15000, shares: 38000,
        analysis: '省钱+复刻。"3元成本"vs"网红奶茶"制造了价值对比，复刻热门品类天然有流量。教程简单可操作，分享和收藏率高。冬季热饮/夏季冷饮都有季节性搜索流量。',
        idea: '翻拍思路：复刻一个热门网红饮品/食物，重点突出成本对比。开头展示成品vs原版对比做钩子。配详细配方。标题用"成本只要X元"做钩子。',
        videoUrl: 'https://www.douyin.com/search/自制网红奶茶'
      }
    ]
  },

  init() {
    this.checkAutoCollect();
    this.renderVideos();
  },

  checkAutoCollect() {
    const today = Utils.today();
    const lastCollect = Store.get('wb_last_hot_collect', '');
    const now = new Date();
    const collectTime = new Date();
    collectTime.setHours(8, 0, 0, 0);

    if (lastCollect !== today && now >= collectTime) {
      this.collectNew();
      Store.set('wb_last_hot_collect', today);
    }
    this.updateCollectTime();
  },

  collectNew() {
    // Simulate collecting new data by shuffling the pool
    Store.set('wb_last_hot_collect', Utils.today());
    Store.set('wb_hot_collect_time', Date.now());
    this.updateCollectTime();
    App.toast('爆款素材已更新');
  },

  updateCollectTime() {
    const lastCollect = Store.get('wb_last_hot_collect', '');
    const el = document.getElementById('hot-collect-time');
    if (lastCollect) {
      el.textContent = '更新于 ' + lastCollect;
    } else {
      el.textContent = '待采集';
    }
  },

  filterTrack(track) {
    this.currentTrack = track;
    document.querySelectorAll('.track-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.track === track);
    });
    this.renderVideos();
  },

  filterPlatform(platform) {
    this.currentPlatform = platform;
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.platform === platform);
    });
    this.renderVideos();
  },

  getVideos() {
    let videos = Store.get('wb_hot_videos', null);
    if (!videos) {
      // Build from data pool
      videos = [];
      Object.values(this.dataPool).forEach(track => {
        videos = videos.concat(track);
      });
      Store.set('wb_hot_videos', videos);
    }
    return videos;
  },

  renderVideos() {
    let videos = this.getVideos();
    videos = videos.filter(v => v.track === this.currentTrack);
    if (this.currentPlatform !== 'all') {
      videos = videos.filter(v => v.platform === this.currentPlatform);
    }

    const container = document.getElementById('video-list');
    if (videos.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔥</div>暂无爆款素材</div>';
      return;
    }

    container.innerHTML = videos.map(v => {
      const platformName = v.platform === 'douyin' ? '抖音' : '小红书';
      return `
        <div class="video-card">
          <div class="video-thumb" style="background:${v.thumbColor}">
            ${v.emoji}
            <span class="video-platform ${v.platform}">${platformName}</span>
          </div>
          <div class="video-body">
            <div class="video-title">${Utils.escapeHtml(v.title)}</div>
            <div class="video-stats">
              <span class="video-stat">▶ ${Utils.fmtNum(v.plays)}</span>
              <span class="video-stat">❤ ${Utils.fmtNum(v.likes)}</span>
              <span class="video-stat">💬 ${Utils.fmtNum(v.comments)}</span>
              <span class="video-stat">🔗 ${Utils.fmtNum(v.shares)}</span>
            </div>
            <div class="video-actions">
              <button class="video-btn analyze" onclick="Hot.showDetail('${v.id}')">查看爆款分析</button>
              <button class="video-btn link" onclick="Hot.openVideo('${v.id}')">跳转原视频</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  showDetail(id) {
    const videos = this.getVideos();
    const v = videos.find(x => x.id === id);
    if (!v) return;
    const platformName = v.platform === 'douyin' ? '抖音' : '小红书';

    App.showModal('爆款分析 · ' + platformName, `
      <div class="vd-section">
        <div class="vd-label">视频标题</div>
        <div class="vd-content" style="font-weight:600">${Utils.escapeHtml(v.title)}</div>
      </div>
      <div class="video-stats" style="margin-bottom:14px;padding:10px 12px;background:var(--border-light);border-radius:8px">
        <span class="video-stat">▶ 播放 ${Utils.fmtNum(v.plays)}</span>
        <span class="video-stat">❤ 点赞 ${Utils.fmtNum(v.likes)}</span>
        <span class="video-stat">💬 评论 ${Utils.fmtNum(v.comments)}</span>
        <span class="video-stat">🔗 转发 ${Utils.fmtNum(v.shares)}</span>
      </div>
      <div class="vd-section">
        <div class="vd-label">🔥 爆款核心原因</div>
        <div class="vd-content">${Utils.escapeHtml(v.analysis)}</div>
      </div>
      <div class="vd-section">
        <div class="vd-label">💡 原创创作思路</div>
        <div class="vd-content idea">${Utils.escapeHtml(v.idea)}</div>
      </div>
      <div class="modal-btn-row">
        <button class="modal-btn primary" onclick="Hot.openVideo('${v.id}')">跳转查看原视频</button>
      </div>
    `);
  },

  openVideo(id) {
    const videos = this.getVideos();
    const v = videos.find(x => x.id === id);
    if (!v || !v.videoUrl) { App.toast('视频链接不可用'); return; }
    window.open(v.videoUrl, '_blank');
  }
};

// ========================
// Todo Module
// ========================
const Todo = {
  currentTab: 'daily',

  FIXED_TASKS: [
    { id: 'weight', label: '体重记录', icon: '⚖️', placeholder: '今日体重，如 65.2kg' },
    { id: 'skincare', label: '基础护肤', icon: '🧴', placeholder: '今日护肤情况...' },
    { id: 'package', label: '收发快递', icon: '📦', placeholder: '收X个 / 发X个' },
    { id: 'contact', label: '亲友沟通', icon: '💬', placeholder: '和谁、聊了什么...' },
    { id: 'reading', label: '阅读学习', icon: '📖', placeholder: '读了/学了什么...' }
  ],

  init() {
    this.checkReset();
    this.renderDaily();
    this.renderWeekly();
    this.renderMonthly();
  },

  checkReset() {
    const today = Utils.today();
    const lastReset = Store.get('wb_last_todo_reset', '');
    const now = new Date();
    const resetTime = new Date();
    resetTime.setHours(6, 0, 0, 0);

    if (lastReset !== today && now >= resetTime) {
      const data = this.getDailyData();
      if (data.personal) {
        data.personal.fixed = data.personal.fixed.map(t => ({ ...t, done: false, content: '' }));
        data.personal.temp = (data.personal.temp || []).map(t => ({ ...t, done: false }));
      }
      if (data.work) {
        data.work.pet = (data.work.pet || []).map(t => ({ ...t, done: false }));
        data.work.handcraft = (data.work.handcraft || []).map(t => ({ ...t, done: false }));
      }
      Store.set('wb_todos_daily', data);
      Store.set('wb_last_todo_reset', today);
    }
  },

  getDailyData() {
    let data = Store.get('wb_todos_daily', null);
    if (!data) {
      data = {
        personal: {
          fixed: this.FIXED_TASKS.map(t => ({ id: t.id, label: t.label, icon: t.icon, done: false, content: '', fixed: true })),
          temp: []
        },
        work: { pet: [], handcraft: [] }
      };
      Store.set('wb_todos_daily', data);
    }
    // Ensure structure
    if (!data.personal) data.personal = { fixed: [], temp: [] };
    if (!data.personal.fixed) data.personal.fixed = [];
    if (!data.personal.temp) data.personal.temp = [];
    if (!data.work) data.work = { pet: [], handcraft: [] };
    if (!data.work.pet) data.work.pet = [];
    if (!data.work.handcraft) data.work.handcraft = [];

    // Migration: remove deleted 'meals' task
    data.personal.fixed = data.personal.fixed.filter(t => t.id !== 'meals');

    // Ensure content field exists on all fixed tasks
    data.personal.fixed.forEach(t => {
      if (t.content === undefined) t.content = '';
    });

    // Ensure all current FIXED_TASKS exist (in case config changed)
    this.FIXED_TASKS.forEach(ft => {
      if (!data.personal.fixed.find(t => t.id === ft.id)) {
        data.personal.fixed.push({ id: ft.id, label: ft.label, icon: ft.icon, done: false, content: '', fixed: true });
      }
    });

    // Sync labels/icons with current config
    data.personal.fixed.forEach(t => {
      const ft = this.FIXED_TASKS.find(f => f.id === t.id);
      if (ft) { t.label = ft.label; t.icon = ft.icon; }
    });

    return data;
  },

  switchTab(period) {
    this.currentTab = period;
    document.querySelectorAll('.sub-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.period === period);
    });
    document.getElementById('todo-daily').style.display = period === 'daily' ? 'block' : 'none';
    document.getElementById('todo-weekly').style.display = period === 'weekly' ? 'block' : 'none';
    document.getElementById('todo-monthly').style.display = period === 'monthly' ? 'block' : 'none';
  },

  renderDaily() {
    const data = this.getDailyData();

    // Fixed tasks
    const fixedEl = document.getElementById('todo-fixed');
    fixedEl.innerHTML = data.personal.fixed.map(t => {
      const ft = this.FIXED_TASKS.find(f => f.id === t.id);
      const ph = ft ? ft.placeholder : '输入内容...';
      return `
      <div class="todo-item todo-item-input ${t.done ? 'done' : ''}">
        <div class="todo-check" onclick="Todo.toggle('daily','fixed','${t.id}')">${t.done ? '✓' : ''}</div>
        <span class="todo-label">${t.icon} ${Utils.escapeHtml(t.label)}</span>
        <input type="text" class="todo-input" data-task-id="${t.id}" placeholder="${ph}"
               value="${Utils.escapeHtml(t.content || '')}"
               onchange="Todo.saveFixedContent('${t.id}', this)"
               onclick="event.stopPropagation()">
      </div>`;
    }).join('');

    // Temp tasks
    const tempEl = document.getElementById('todo-temp');
    if (data.personal.temp.length === 0) {
      tempEl.innerHTML = '<div class="empty-state" style="padding:12px">暂无临时任务</div>';
    } else {
      tempEl.innerHTML = data.personal.temp.map(t => `
        <div class="todo-item ${t.done ? 'done' : ''}">
          <div class="todo-check" onclick="Todo.toggle('daily','temp','${t.id}')">${t.done ? '✓' : ''}</div>
          <span class="todo-text" onclick="Todo.toggle('daily','temp','${t.id}')">${Utils.escapeHtml(t.text)}</span>
          <button class="todo-delete" onclick="Todo.delete('daily','temp','${t.id}')">✕</button>
        </div>
      `).join('');
    }

    // Work - pets
    const petEl = document.getElementById('todo-work-pet');
    if (data.work.pet.length === 0) {
      petEl.innerHTML = '<div class="empty-state" style="padding:12px">暂无宠物工作任务</div>';
    } else {
      petEl.innerHTML = data.work.pet.map(t => `
        <div class="todo-item ${t.done ? 'done' : ''}">
          <div class="todo-check" onclick="Todo.toggle('daily','pet','${t.id}')">${t.done ? '✓' : ''}</div>
          <span class="todo-text" onclick="Todo.toggle('daily','pet','${t.id}')">${Utils.escapeHtml(t.text)}</span>
          <button class="todo-delete" onclick="Todo.delete('daily','pet','${t.id}')">✕</button>
        </div>
      `).join('');
    }

    // Work - handcraft
    const hcEl = document.getElementById('todo-work-handcraft');
    if (data.work.handcraft.length === 0) {
      hcEl.innerHTML = '<div class="empty-state" style="padding:12px">暂无手作工作任务</div>';
    } else {
      hcEl.innerHTML = data.work.handcraft.map(t => `
        <div class="todo-item ${t.done ? 'done' : ''}">
          <div class="todo-check" onclick="Todo.toggle('daily','handcraft','${t.id}')">${t.done ? '✓' : ''}</div>
          <span class="todo-text" onclick="Todo.toggle('daily','handcraft','${t.id}')">${Utils.escapeHtml(t.text)}</span>
          <button class="todo-delete" onclick="Todo.delete('daily','handcraft','${t.id}')">✕</button>
        </div>
      `).join('');
    }

    this.updateProgress();
  },

  updateProgress() {
    const data = this.getDailyData();
    let total = 0, done = 0;
    data.personal.fixed.forEach(t => { total++; if (t.done) done++; });
    data.personal.temp.forEach(t => { total++; if (t.done) done++; });
    data.work.pet.forEach(t => { total++; if (t.done) done++; });
    data.work.handcraft.forEach(t => { total++; if (t.done) done++; });

    const pct = total > 0 ? Math.round(done / total * 100) : 0;
    document.getElementById('daily-progress-fill').style.width = pct + '%';
    document.getElementById('daily-progress-text').textContent = `${done} / ${total}`;
  },

  toggle(period, section, id) {
    if (period !== 'daily') {
      const list = Store.get(period === 'weekly' ? 'wb_todos_weekly' : 'wb_todos_monthly', []);
      const item = list.find(t => t.id === id);
      if (item) { item.done = !item.done; Store.set(period === 'weekly' ? 'wb_todos_weekly' : 'wb_todos_monthly', list); }
      if (period === 'weekly') this.renderWeekly(); else this.renderMonthly();
      return;
    }
    // Flush any unsaved fixed task inputs before re-rendering
    if (section === 'fixed') this.flushFixedInputs();
    const data = this.getDailyData();
    let list;
    if (section === 'fixed') list = data.personal.fixed;
    else if (section === 'temp') list = data.personal.temp;
    else if (section === 'pet') list = data.work.pet;
    else if (section === 'handcraft') list = data.work.handcraft;
    const item = list.find(t => t.id === id);
    if (item) { item.done = !item.done; Store.set('wb_todos_daily', data); }
    this.renderDaily();
  },

  flushFixedInputs() {
    const data = this.getDailyData();
    document.querySelectorAll('#todo-fixed .todo-input').forEach(input => {
      const taskId = input.dataset.taskId;
      const item = data.personal.fixed.find(t => t.id === taskId);
      if (item) item.content = input.value.trim();
    });
    Store.set('wb_todos_daily', data);
  },

  saveFixedContent(id, el) {
    const data = this.getDailyData();
    const item = data.personal.fixed.find(t => t.id === id);
    if (item) {
      item.content = el.value.trim();
      Store.set('wb_todos_daily', data);
    }
  },

  showAdd(period, section) {
    const titleMap = {
      'daily-temp': '新增临时任务',
      'daily-pet': '新增宠物工作任务',
      'daily-handcraft': '新增手作工作任务',
      'weekly': '新增每周待办',
      'monthly': '新增每月待办'
    };
    const key = section ? `daily-${section}` : period;
    App.showModal(titleMap[key] || '新增任务', `
      <input type="text" class="modal-form-input" id="modal-todo-text" placeholder="输入任务内容...">
      <div class="modal-btn-row">
        <button class="modal-btn secondary" onclick="App.closeModal()">取消</button>
        <button class="modal-btn primary" onclick="Todo.save('${period}','${section || ''}')">添加</button>
      </div>
    `);
    setTimeout(() => document.getElementById('modal-todo-text').focus(), 100);
  },

  save(period, section) {
    const text = document.getElementById('modal-todo-text').value.trim();
    if (!text) { App.toast('请输入任务内容'); return; }
    const task = { id: Utils.genId(), text, done: false, createdAt: Date.now() };

    if (period === 'daily') {
      const data = this.getDailyData();
      if (section === 'temp') data.personal.temp.push(task);
      else if (section === 'pet') data.work.pet.push(task);
      else if (section === 'handcraft') data.work.handcraft.push(task);
      Store.set('wb_todos_daily', data);
      this.renderDaily();
    } else if (period === 'weekly') {
      const list = Store.get('wb_todos_weekly', []);
      list.push(task);
      Store.set('wb_todos_weekly', list);
      this.renderWeekly();
    } else if (period === 'monthly') {
      const list = Store.get('wb_todos_monthly', []);
      list.push(task);
      Store.set('wb_todos_monthly', list);
      this.renderMonthly();
    }
    App.closeModal();
    App.toast('已添加');
  },

  delete(period, section, id) {
    App.confirm('确定删除这个任务？', () => {
      if (period === 'daily') {
        const data = this.getDailyData();
        if (section === 'temp') data.personal.temp = data.personal.temp.filter(t => t.id !== id);
        else if (section === 'pet') data.work.pet = data.work.pet.filter(t => t.id !== id);
        else if (section === 'handcraft') data.work.handcraft = data.work.handcraft.filter(t => t.id !== id);
        Store.set('wb_todos_daily', data);
        this.renderDaily();
      } else if (period === 'weekly') {
        const list = Store.get('wb_todos_weekly', []).filter(t => t.id !== id);
        Store.set('wb_todos_weekly', list);
        this.renderWeekly();
      } else {
        const list = Store.get('wb_todos_monthly', []).filter(t => t.id !== id);
        Store.set('wb_todos_monthly', list);
        this.renderMonthly();
      }
      App.toast('已删除');
    });
  },

  renderWeekly() {
    const list = Store.get('wb_todos_weekly', []);
    const el = document.getElementById('todo-weekly-list');
    if (list.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div>暂无每周待办</div>';
      return;
    }
    el.innerHTML = list.map(t => `
      <div class="todo-item ${t.done ? 'done' : ''}">
        <div class="todo-check" onclick="Todo.toggle('weekly','','${t.id}')">${t.done ? '✓' : ''}</div>
        <span class="todo-text" onclick="Todo.toggle('weekly','','${t.id}')">${Utils.escapeHtml(t.text)}</span>
        <button class="todo-delete" onclick="Todo.delete('weekly','','${t.id}')">✕</button>
      </div>
    `).join('');
  },

  renderMonthly() {
    const list = Store.get('wb_todos_monthly', []);
    const el = document.getElementById('todo-monthly-list');
    if (list.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div>暂无每月待办</div>';
      return;
    }
    el.innerHTML = list.map(t => `
      <div class="todo-item ${t.done ? 'done' : ''}">
        <div class="todo-check" onclick="Todo.toggle('monthly','','${t.id}')">${t.done ? '✓' : ''}</div>
        <span class="todo-text" onclick="Todo.toggle('monthly','','${t.id}')">${Utils.escapeHtml(t.text)}</span>
        <button class="todo-delete" onclick="Todo.delete('monthly','','${t.id}')">✕</button>
      </div>
    `).join('');
  }
};

// ========================
// Account Module
// ========================
const Account = {
  CATEGORY_ICONS: {
    '餐饮': '🍔', '交通': '🚌', '购物': '🛍️', '娱乐': '🎮',
    '居家': '🏠', '医疗': '💊', '其他': '📦'
  },
  CATEGORY_COLORS: {
    '餐饮': '#fde68a', '交通': '#bfdbfe', '购物': '#fbcfe8',
    '娱乐': '#c7d2fe', '居家': '#d9f99d', '医疗': '#fecaca', '其他': '#e5e7eb'
  },

  init() {
    document.getElementById('expense-date').value = Utils.today();
    this.renderSummary();
    this.renderList();
  },

  add() {
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const note = document.getElementById('expense-note').value.trim();
    const date = document.getElementById('expense-date').value || Utils.today();

    if (!amount || amount <= 0) { App.toast('请输入有效金额'); return; }

    const expenses = Store.get('wb_expenses', []);
    expenses.push({
      id: Utils.genId(), amount, category, note, date, createdAt: Date.now()
    });
    Store.set('wb_expenses', expenses);

    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-note').value = '';

    this.renderSummary();
    this.renderList();
    Desktop.renderSpending();
    Desktop.renderCalendar();
    App.toast('已记录 ' + Utils.fmtMoney(amount));
  },

  renderSummary() {
    const monthKey = Utils.monthKey();
    const expenses = Store.get('wb_expenses', []).filter(e => e.date.startsWith(monthKey));
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const d = new Date();
    document.getElementById('account-month').textContent = `${d.getFullYear()}年${d.getMonth()+1}月`;
    document.getElementById('account-total').textContent = Utils.fmtMoney(total);

    const cats = {};
    expenses.forEach(e => { cats[e.category] = (cats[e.category] || 0) + Number(e.amount); });
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);

    const el = document.getElementById('account-breakdown');
    if (sorted.length === 0) {
      el.innerHTML = '<div style="font-size:12px;opacity:0.8">本月暂无消费记录</div>';
      return;
    }
    const maxVal = sorted[0][1];
    el.innerHTML = sorted.map(([cat, amt]) => {
      const pct = maxVal > 0 ? (amt / maxVal * 100) : 0;
      return `
        <div class="sb-row">
          <span class="sb-label">${cat}</span>
          <div class="sb-bar"><div class="sb-bar-fill" style="width:${pct}%"></div></div>
          <span class="sb-amount">¥${amt.toFixed(2)}</span>
        </div>
      `;
    }).join('');
  },

  renderList() {
    const expenses = Store.get('wb_expenses', []).sort((a, b) => b.createdAt - a.createdAt);
    const el = document.getElementById('expense-list');
    if (expenses.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💰</div>暂无消费记录</div>';
      return;
    }
    el.innerHTML = expenses.slice(0, 100).map(e => {
      const icon = this.CATEGORY_ICONS[e.category] || '📦';
      const color = this.CATEGORY_COLORS[e.category] || '#e5e7eb';
      return `
        <div class="expense-item">
          <div class="expense-cat" style="background:${color}">${icon}</div>
          <div class="expense-info">
            <div class="expense-note-text">${e.category}${e.note ? ' · ' + Utils.escapeHtml(e.note) : ''}</div>
            <div class="expense-date">${e.date}</div>
          </div>
          <span class="expense-amount-text">-${Number(e.amount).toFixed(2)}</span>
          <button class="btn-icon del" onclick="Account.delete('${e.id}')">🗑</button>
        </div>
      `;
    }).join('');
  },

  delete(id) {
    App.confirm('确定删除这笔消费记录？', () => {
      const expenses = Store.get('wb_expenses', []).filter(e => e.id !== id);
      Store.set('wb_expenses', expenses);
      this.renderSummary();
      this.renderList();
      Desktop.renderSpending();
      Desktop.renderCalendar();
      App.toast('已删除');
    });
  }
};

// ========================
// Review Module
// ========================
const Review = {
  TRACK_NAMES: { pet: '宠物赛道', sewing: '缝纫手作赛道', fun: '泛娱乐' },
  TRAFFIC_NAMES: { recommend: '推荐流', search: '搜索', follow: '关注页', personal: '个人主页', live: '直播' },

  init() {
    document.getElementById('review-date').value = Utils.today();
    this.renderHistory();
  },

  submit() {
    const track = document.getElementById('review-track').value;
    const title = document.getElementById('review-title').value.trim();
    const date = document.getElementById('review-date').value || Utils.today();
    const plays = parseInt(document.getElementById('review-plays').value) || 0;
    const likes = parseInt(document.getElementById('review-likes').value) || 0;
    const comments = parseInt(document.getElementById('review-comments').value) || 0;
    const shares = parseInt(document.getElementById('review-shares').value) || 0;
    const completionRate = parseFloat(document.getElementById('review-completion').value) || 0;
    const trafficSource = document.getElementById('review-traffic').value;

    if (!title) { App.toast('请输入作品标题'); return; }
    if (plays === 0) { App.toast('请输入播放量'); return; }

    const data = { id: Utils.genId(), track, title, date, plays, likes, comments, shares, completionRate, trafficSource, createdAt: Date.now() };
    const analysis = this.analyze(data);
    data.analysis = analysis;

    const reviews = Store.get('wb_reviews', []);
    reviews.push(data);
    Store.set('wb_reviews', reviews);

    // Clear form
    document.getElementById('review-title').value = '';
    document.getElementById('review-plays').value = '';
    document.getElementById('review-likes').value = '';
    document.getElementById('review-comments').value = '';
    document.getElementById('review-shares').value = '';
    document.getElementById('review-completion').value = '';
    document.getElementById('review-traffic').value = '';

    this.renderAnalysis(data);
    this.renderHistory();
    App.toast('复盘分析完成');
    // Scroll to analysis
    setTimeout(() => {
      document.getElementById('review-analysis').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  },

  analyze(data) {
    const { plays, likes, comments, shares, completionRate, trafficSource, track } = data;
    const likeRate = plays > 0 ? (likes / plays * 100) : 0;
    const commentRate = plays > 0 ? (comments / plays * 100) : 0;
    const shareRate = plays > 0 ? (shares / plays * 100) : 0;

    const issues = [];
    const suggestions = [];

    // Completion rate
    if (completionRate < 25) {
      issues.push({ metric: '完播率', level: 'bad', value: completionRate + '%', target: '>40%' });
      suggestions.push({ type: 'general', title: '🔴 完播率严重偏低 — 最优先解决', content: '前3秒必须设置强力钩子：悬念/冲突/反差/数字/提问。快速切入主题，不要任何铺垫。每15秒设置一个小高潮保持注意力。删除所有与主题无关的画面。' });
      if (track === 'pet') {
        suggestions.push({ type: 'track', title: '🐱 宠物赛道专项', content: '开头用宠物最可爱/搞笑的瞬间或意外行为做钩子，如表情包级画面。避免缓慢开场，直接上高能画面。可以用"被发现"的瞬间做开头。' });
      } else if (track === 'sewing') {
        suggestions.push({ type: 'track', title: '🧵 缝纫手作赛道专项', content: '开头直接展示精美成品效果做钩子，再倒叙制作过程。成品展示是手作内容的最强吸引力，切忌从材料介绍开始。' });
      } else {
        suggestions.push({ type: 'track', title: '🎮 泛娱乐赛道专项', content: '开头3秒制造悬念或冲突，直接抛出核心看点。可以用挑战条件/反差画面/提问开场，让观众必须看下去。' });
      }
    } else if (completionRate < 40) {
      issues.push({ metric: '完播率', level: 'warn', value: completionRate + '%', target: '>40%' });
      suggestions.push({ type: 'general', title: '🟡 完播率偏低', content: '优化视频节奏，减少冗余画面。加快剪辑节奏，每3-5秒切换镜头。删减与主题无关的内容。检查是否有"拖沓段落"导致观众流失。' });
    } else {
      issues.push({ metric: '完播率', level: 'good', value: completionRate + '%', target: '>40%' });
    }

    // Like rate
    if (likeRate < 3) {
      issues.push({ metric: '点赞率', level: 'bad', value: likeRate.toFixed(2) + '%', target: '>5%' });
      suggestions.push({ type: 'general', title: '🔴 点赞率偏低', content: '提升内容价值感：增加干货信息、情感共鸣或娱乐性。在视频中自然引导"觉得有用点个赞"。确保内容有"值得收藏"的元素，如教程步骤、配方清单等。' });
    } else if (likeRate < 5) {
      issues.push({ metric: '点赞率', level: 'warn', value: likeRate.toFixed(2) + '%', target: '>5%' });
      suggestions.push({ type: 'general', title: '🟡 点赞率有提升空间', content: '可以在结尾增加价值总结或"双击屏幕"引导，让观众意识到内容值得点赞。' });
    } else {
      issues.push({ metric: '点赞率', level: 'good', value: likeRate.toFixed(2) + '%', target: '>5%' });
    }

    // Comment rate
    if (commentRate < 0.1) {
      issues.push({ metric: '评论率', level: 'bad', value: commentRate.toFixed(3) + '%', target: '>0.3%' });
      suggestions.push({ type: 'general', title: '🔴 评论数偏少', content: '结尾抛出互动问题引导留言，如"你觉得呢？""你遇到过吗？""评论区说说你的看法"。可以在评论区置顶一条引导性评论。制造争议性或开放性话题让观众有表达欲。' });
    } else if (commentRate < 0.3) {
      issues.push({ metric: '评论率', level: 'warn', value: commentRate.toFixed(3) + '%', target: '>0.3%' });
      suggestions.push({ type: 'general', title: '🟡 评论率有提升空间', content: '增加开放性话题或"你会怎么选？"类互动设计，让观众有表达欲。' });
    } else {
      issues.push({ metric: '评论率', level: 'good', value: commentRate.toFixed(3) + '%', target: '>0.3%' });
    }

    // Share rate
    if (shareRate < 0.5) {
      issues.push({ metric: '转发率', level: 'bad', value: shareRate.toFixed(2) + '%', target: '>1%' });
      suggestions.push({ type: 'general', title: '🔴 转发率偏低', content: '增加实用干货或情绪共鸣，让用户有分享给朋友的动机。内容要有"这个我要发给XX看看"的价值。可以在结尾自然引导"分享给需要的人"。' });
    } else if (shareRate < 1) {
      issues.push({ metric: '转发率', level: 'warn', value: shareRate.toFixed(2) + '%', target: '>1%' });
    } else {
      issues.push({ metric: '转发率', level: 'good', value: shareRate.toFixed(2) + '%', target: '>1%' });
    }

    // Traffic source analysis
    if (trafficSource === 'search') {
      suggestions.push({ type: 'general', title: '🔍 搜索流量为主', content: '说明标题和话题标签起了关键作用。继续优化SEO：标题包含核心关键词，使用热门话题标签。研究同类爆款标题的关键词布局。注意标题前10个字包含核心关键词。' });
    } else if (trafficSource === 'follow') {
      suggestions.push({ type: 'general', title: '👥 关注页流量为主', content: '说明粉丝粘性较强。继续保持更新频率，强化人设和IP记忆点，让粉丝有持续追更的理由。可以增加系列内容培养追更习惯。' });
    } else if (trafficSource === 'personal') {
      suggestions.push({ type: 'general', title: '📱 个人主页流量为主', content: '说明主页引流效果好但推荐流量不足。优化封面统一风格、标题模板，让新访客一眼记住你的内容特色。检查主页排版和精选作品设置。' });
    } else if (trafficSource === 'recommend') {
      suggestions.push({ type: 'general', title: '🚀 推荐流为主', content: '说明内容被算法认可，继续当前方向。重点优化前3秒完播率和互动率，推荐流量会进一步放大。可以适当增加发布频率测试更多选题。' });
    } else if (trafficSource === 'live') {
      suggestions.push({ type: 'general', title: '📺 直播流量为主', content: '短视频引流到直播效果好，建议保持短视频+直播联动策略。优化短视频的直播预告设计。' });
    }

    // Track-specific overall suggestions
    const trackSugs = {
      pet: '🐱 宠物赛道建议：1. 打造宠物IP人设，让观众记住具体的宠物名字和性格标签；2. 结合日常+知识科普，如养护技巧、行为解读增加价值感；3. 紧跟宠物热点BGM和挑战；4. 拍摄宠物与主人的互动增加情感线；5. 评论区引导晒宠物照片形成UGC。',
      sewing: '🧵 缝纫手作赛道建议：1. 永远开头展示成品效果做钩子再倒叙过程；2. 加入材料成本和工具清单提升收藏价值；3. 做系列内容（如"30天手作挑战"）培养追更习惯；4. 展示成品的实际使用场景增强代入感；5. 标题突出"零成本""旧物改造""新手也能"等降低门槛的关键词。',
      fun: '🎮 泛娱乐赛道建议：1. 蹭热点但必须加入独特视角或反转；2. 挑战类/盘点类/对比类内容天然有高完播率；3. 强情绪输出（搞笑/感动/愤怒）是传播核心；4. 控制时长在30-60秒，节奏紧凑；5. 标题用反差/数字/提问制造好奇心。'
    };
    suggestions.push({ type: 'track', title: '赛道专属改进方案', content: trackSugs[track] });

    // Overall summary
    const badCount = issues.filter(i => i.level === 'bad').length;
    let summary;
    if (badCount >= 3) {
      summary = '⚠️ 整体数据偏低，建议从选题方向重新审视。优先解决完播率问题——这是算法最看重的指标。建议暂时降低发布频率，集中精力打磨单条内容质量。';
    } else if (badCount >= 1) {
      summary = '📊 部分指标需要优化，重点改善标红的指标。保持优势指标的同时补齐短板。建议下一条作品针对性改善最弱的1-2个指标。';
    } else {
      summary = '✅ 整体数据表现良好！继续保持当前内容方向。可以尝试提升内容产量或拓展新选题，趁势扩大影响力。';
    }

    return { issues, suggestions, summary, rates: { likeRate, commentRate, shareRate } };
  },

  renderAnalysis(data) {
    const a = data.analysis;
    const trackName = this.TRACK_NAMES[data.track] || '';
    const trafficName = this.TRAFFIC_NAMES[data.trafficSource] || '未指定';

    const metricsHtml = a.issues.map(i => `
      <div class="metric-box">
        <div class="metric-val ${i.level}">${i.value}</div>
        <div class="metric-label">${i.metric}<br><span style="font-size:9px;color:var(--text-lighter)">目标${i.target}</span></div>
      </div>
    `).join('');

    const sugHtml = a.suggestions.map(s => `
      <div class="analysis-section">
        <div class="as-label">${s.type === 'track' ? '🎯' : '⚡'} ${Utils.escapeHtml(s.title)}</div>
        <div class="as-content ${s.type === 'track' ? 'track' : ''}">${Utils.escapeHtml(s.content)}</div>
      </div>
    `).join('');

    document.getElementById('review-analysis').innerHTML = `
      <div class="analysis-card">
        <div class="analysis-header">
          <div class="analysis-title">${Utils.escapeHtml(data.title)}</div>
          <div class="analysis-sub">${trackName} · ${data.date} · 流量来源：${trafficName}</div>
        </div>
        <div class="analysis-body">
          <div class="analysis-metrics">${metricsHtml}</div>
          <div class="analysis-section">
            <div class="as-label">📋 综合诊断</div>
            <div class="as-content">${Utils.escapeHtml(a.summary)}</div>
          </div>
          ${sugHtml}
        </div>
      </div>
    `;
  },

  renderHistory() {
    const reviews = Store.get('wb_reviews', []).sort((a, b) => b.createdAt - a.createdAt);
    const el = document.getElementById('review-history');
    if (reviews.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div>暂无复盘记录，发布作品后录入数据即可开始</div>';
      return;
    }
    el.innerHTML = reviews.map(r => {
      const trackName = this.TRACK_NAMES[r.track] || '';
      const trafficName = this.TRAFFIC_NAMES[r.trafficSource] || '未指定';
      const likeRate = r.plays > 0 ? (r.likes / r.plays * 100).toFixed(2) : 0;
      const a = r.analysis;
      const topSugs = a.suggestions.slice(0, 2).map(s => s.title.replace(/^[^\s]+\s*/, '')).join('；');
      return `
        <div class="review-item" onclick="Review.viewDetail('${r.id}')">
          <div class="review-item-header">
            <span class="review-item-title">${Utils.escapeHtml(r.title)}</span>
            <span class="review-item-date">${r.date}</span>
          </div>
          <div class="review-item-metrics">
            <span class="rim-tag">${trackName}</span>
            <span class="rim-tag">▶ ${Utils.fmtNum(r.plays)}</span>
            <span class="rim-tag">完播 ${r.completionRate}%</span>
            <span class="rim-tag">点赞率 ${likeRate}%</span>
            <span class="rim-tag">流量：${trafficName}</span>
          </div>
          <div class="review-item-suggestion">⚡ ${Utils.escapeHtml(topSugs)}</div>
        </div>
      `;
    }).join('');
  },

  viewDetail(id) {
    const reviews = Store.get('wb_reviews', []);
    const r = reviews.find(x => x.id === id);
    if (!r) return;
    this.renderAnalysis(r);
    setTimeout(() => {
      document.getElementById('review-analysis').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }
};

// ========================
// App Controller
// ========================
const App = {
  currentPage: 'desktop',

  init() {
    Desktop.init();
    Hot.init();
    Todo.init();
    Account.init();
    Review.init();

    // Check for daily resets and auto-collects on load
    Todo.checkReset();
    Hot.checkAutoCollect();

    // Update desktop spending when switching to desktop
    // (already handled in module init)
  },

  navigate(page) {
    this.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.page === page);
    });

    // Refresh data on page switch
    if (page === 'desktop') {
      Desktop.renderSpending();
      Desktop.renderInspirations();
      Desktop.renderMenu();
    }
    if (page === 'account') {
      Account.renderSummary();
      Account.renderList();
    }
    if (page === 'todo') {
      Todo.checkReset();
      if (Todo.currentTab === 'daily') Todo.renderDaily();
    }
  },

  showModal(title, bodyHTML) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    document.getElementById('modal-overlay').classList.add('show');
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
  },

  toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  },

  confirm(message, onConfirm) {
    this.showModal('确认操作', `
      <p style="font-size:14px;line-height:1.6;margin-bottom:16px">${Utils.escapeHtml(message)}</p>
      <div class="modal-btn-row">
        <button class="modal-btn secondary" onclick="App.closeModal()">取消</button>
        <button class="modal-btn primary" style="background:linear-gradient(135deg,#f5576c,#fda085)" id="modal-confirm-btn">确定</button>
      </div>
    `);
    document.getElementById('modal-confirm-btn').onclick = () => {
      App.closeModal();
      onConfirm();
    };
  }
};

// ========================
// Initialize
// ========================
document.addEventListener('DOMContentLoaded', () => App.init());

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') App.closeModal();
  });
});