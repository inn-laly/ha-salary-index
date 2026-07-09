// --- Admin Authentication ---
const HAAdmin = {
  // 管理员密钥 - 只有你知道这个值，访问时在URL后加 ?admin=密钥 即可激活
  SECRET_KEY: 'HASL7x9K2m',

  init() {
    const params = new URLSearchParams(window.location.search);
    const adminKey = params.get('admin');
    if (adminKey === this.SECRET_KEY) {
      localStorage.setItem('ha_admin_auth', this.SECRET_KEY);
      // Clean URL to hide the secret key from address bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    this._checkStatus();
  },

  _checkStatus() {
    const stored = localStorage.getItem('ha_admin_auth');
    if (stored === this.SECRET_KEY) {
      document.body.classList.add('admin-mode');
      HAAnalytics.trackClick('admin', 'login', 'success');
    }
  },

  isActive() {
    return localStorage.getItem('ha_admin_auth') === this.SECRET_KEY;
  },

  logout() {
    localStorage.removeItem('ha_admin_auth');
    document.body.classList.remove('admin-mode');
    HAAnalytics.trackClick('admin', 'logout', 'success');
    // Show confirmation
    const bar = document.getElementById('admin-bar');
    if (bar) {
      bar.innerHTML = '<span style="color:#4ade80">✅ 已退出管理员模式</span>';
      setTimeout(() => { bar.style.display = 'none'; }, 2000);
    }
  },

  exportLogs() {
    if (!this.isActive()) return;
    HAAnalytics.exportLogs();
  }
};

// --- Analytics & Operation Logger ---
const HAAnalytics = {
  sessionId: null,
  startTime: null,
  logs: [],
  maxLogs: 200,

  init() {
    this.sessionId = this._genId();
    this.startTime = Date.now();
    this._log('session_start', { referrer: document.referrer, url: window.location.href });
    // Track page visibility for dwell time
    window.addEventListener('beforeunload', () => this._log('session_end', { dwell: Date.now() - this.startTime }));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._log('page_hidden', {});
      else this._log('page_visible', {});
    });
  },

  trackTab(tabName) {
    this._log('tab_switch', { tab: tabName });
  },

  trackClick(category, label, value) {
    this._log('click', { category, label, value });
  },

  trackChart(chartName) {
    this._log('chart_view', { chart: chartName });
  },

  _log(event, data) {
    const entry = {
      ts: new Date().toISOString(),
      sid: this.sessionId,
      event,
      data: { ...data, page: window.location.hash || 'overview' }
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs.shift();
    // Persist to localStorage
    try {
      localStorage.setItem('ha_analytics_logs', JSON.stringify(this.logs));
      localStorage.setItem('ha_analytics_session', this.sessionId);
    } catch(e) {}
    // Also send to a lightweight endpoint (can be replaced with your own API)
    this._send(entry);
  },

  _send(entry) {
    // Beacon API — fire-and-forget, works even on page unload
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/log', JSON.stringify(entry));
    }
    // Fallback: no backend yet, logs stored in localStorage for later export
  },

  getLogs() {
    try { return JSON.parse(localStorage.getItem('ha_analytics_logs') || '[]'); }
    catch(e) { return this.logs; }
  },

  exportLogs() {
    const logs = this.getLogs();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ha-analytics-${this.sessionId}.json`; a.click();
    URL.revokeObjectURL(url);
  },

  _genId() {
    return 'ha-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }
};

// HA Salary Index - Main Application
(function() {
  'use strict';

  // Init analytics
  HAAdmin.init();
  HAAnalytics.init();

  // --- Data ---
  const DATA = {
    meta: {
      title: "家电行业薪酬指数 HA Salary Index",
      version: "2026Q3-v1",
      lastUpdate: "2026-07-09",
      dataSourceCount: 5,
      totalSamples: 3842,
      confidence: 0.85
    },
    indexOverview: {
      haSalaryIndex: 82.4,
      haSalaryIndexChange: 2.3,
      haSalaryIndexChangePercent: 2.8,
      avgTCC: 32.6,
      avgTCCChange: 1.8,
      avgTCCChangePercent: 5.5,
      talentShortageIndex: 7.2,
      talentShortageChange: 0.5,
      policyImpactScore: 8.5,
      smartPremiumIndex: 1.35,
      crossIndustryRank: 6,
      totalCompanies: 427,
      newPositions7d: 158,
      salaryRangeMin: 8,
      salaryRangeMax: 120
    },
    jobFamilies: [
      {
        id: "algo_ai", name: "算法/AI岗", icon: "🧠",
        avgTCC: 45.2, p50: 42, p25: 30, p75: 58, p90: 78,
        trend: "up", changePercent: 12.5,
        shortageLevel: "极度紧缺", shortageScore: 9.5,
        positions: ["视觉算法工程师","语音/NLP算法工程师","推荐算法工程师","大模型应用工程师","机器学习工程师"],
        topCompanies: [
          {name:"美的集团",range:"35-65万",premium:"机器人方向溢价30%"},
          {name:"海尔智家",range:"30-55万",premium:"AIoT方向溢价20%"},
          {name:"石头科技",range:"40-70万",premium:"导航算法溢价25%"},
          {name:"追觅科技",range:"38-65万",premium:"机器人方向溢价22%"}
        ],
        fixedFloatRatio: "7:3", smartPremium: 1.4
      },
      {
        id: "embedded_iot", name: "嵌入式/IoT岗", icon: "🔌",
        avgTCC: 28.5, p50: 26, p25: 20, p75: 36, p90: 46,
        trend: "up", changePercent: 8.2,
        shortageLevel: "紧缺", shortageScore: 8.0,
        positions: ["嵌入式软件工程师","IoT开发工程师","智能控制工程师","RTOS工程师","固件开发工程师"],
        topCompanies: [
          {name:"美的集团",range:"22-38万",premium:"全屋智能溢价15%"},
          {name:"格力电器",range:"18-30万",premium:"变频控制溢价12%"},
          {name:"海尔智家",range:"20-35万",premium:"AIoT溢价18%"},
          {name:"海信家电",range:"18-28万",premium:""}
        ],
        fixedFloatRatio: "7.5:2.5", smartPremium: 1.25
      },
      {
        id: "software_dev", name: "软件开发岗", icon: "💻",
        avgTCC: 30.8, p50: 28, p25: 22, p75: 40, p90: 55,
        trend: "stable", changePercent: 3.5,
        shortageLevel: "一般紧缺", shortageScore: 6.0,
        positions: ["后端开发工程师(Java/C++/Go)","前端开发工程师","移动端开发工程师","云平台开发工程师","中间件开发工程师"],
        topCompanies: [
          {name:"美的集团",range:"24-42万",premium:"美云智数溢价20%"},
          {name:"海尔智家",range:"22-38万",premium:"海纳云溢价15%"},
          {name:"TCL",range:"20-35万",premium:""},
          {name:"安克创新",range:"28-50万",premium:"出海方向溢价25%"}
        ],
        fixedFloatRatio: "7:3", smartPremium: 1.15
      },
      {
        id: "hardware_electronics", name: "硬件/电子岗", icon: "🔧",
        avgTCC: 25.4, p50: 23, p25: 17, p75: 32, p90: 42,
        trend: "up", changePercent: 6.8,
        shortageLevel: "紧缺", shortageScore: 7.5,
        positions: ["硬件工程师","PCB设计工程师","射频工程师","FPGA工程师","功率电子工程师"],
        topCompanies: [
          {name:"美的集团",range:"18-32万",premium:""},
          {name:"格力电器",range:"16-28万",premium:"变频功率溢价10%"},
          {name:"海信家电",range:"16-26万",premium:""},
          {name:"九阳股份",range:"15-24万",premium:""}
        ],
        fixedFloatRatio: "8:2", smartPremium: 1.10
      },
      {
        id: "automation_manufacturing", name: "自动化/制造岗", icon: "🏭",
        avgTCC: 22.0, p50: 20, p25: 15, p75: 28, p90: 35,
        trend: "stable", changePercent: 2.1,
        shortageLevel: "一般", shortageScore: 4.5,
        positions: ["PLC/自动化工程师","工艺工程师","智能制造工程师","MES工程师","工业视觉工程师"],
        topCompanies: [
          {name:"美的集团",range:"16-28万",premium:"灯塔工厂溢价15%"},
          {name:"海尔智家",range:"15-25万",premium:""},
          {name:"格力电器",range:"14-22万",premium:""},
          {name:"苏泊尔",range:"13-20万",premium:""}
        ],
        fixedFloatRatio: "7.5:2.5", smartPremium: 1.08
      },
      {
        id: "product_operation", name: "产品/运营岗", icon: "📱",
        avgTCC: 27.5, p50: 25, p25: 18, p75: 35, p90: 48,
        trend: "up", changePercent: 7.5,
        shortageLevel: "紧缺", shortageScore: 7.0,
        positions: ["智能硬件产品经理","全屋智能解决方案","海外运营经理","用户增长运营","品牌营销经理"],
        topCompanies: [
          {name:"美的集团",range:"22-40万",premium:"全屋智能溢价20%"},
          {name:"海尔智家",range:"20-35万",premium:"三翼鸟溢价18%"},
          {name:"安克创新",range:"25-48万",premium:"出海运营溢价30%"},
          {name:"科沃斯",range:"20-35万",premium:""}
        ],
        fixedFloatRatio: "5:5", smartPremium: 1.30
      },
      {
        id: "test_quality", name: "测试/质量岗", icon: "🔍",
        avgTCC: 19.5, p50: 18, p25: 13, p75: 25, p90: 32,
        trend: "stable", changePercent: 1.8,
        shortageLevel: "一般", shortageScore: 3.5,
        positions: ["测试开发工程师","可靠性测试工程师","质量管理工程师","自动化测试工程师","安全合规测试"],
        topCompanies: [
          {name:"美的集团",range:"14-26万",premium:""},
          {name:"海尔智家",range:"13-24万",premium:""},
          {name:"格力电器",range:"12-22万",premium:""},
          {name:"TCL",range:"13-23万",premium:""}
        ],
        fixedFloatRatio: "8:2", smartPremium: 1.05
      }
    ],
    companyTracker: [
      {id:"midea",name:"美的集团",type:"民企上市",subSector:"白电/智能家居",headquarters:"佛山",employees:160000,avgSalary:38.5,avgSalaryChange:6.2,avgSalaryChangePercent:16.1,focusArea:"AI+机器人+智能家居",hotTracks:["具身智能/服务机器人","全屋智能","工业互联网(美云智数)"],topPayingRoles:[{role:"算法/AI工程师",range:"35-65万"},{role:"产品经理(智能)",range:"22-40万"},{role:"嵌入式工程师",range:"22-38万"}],valuation:"5000亿+",category:"头部巨头",stars:5},
      {id:"haier",name:"海尔智家",type:"混合所有制上市",subSector:"白电/全屋智能",headquarters:"青岛",employees:110000,avgSalary:35.2,avgSalaryChange:5.0,avgSalaryChangePercent:14.2,focusArea:"三翼鸟全屋智能+AIoT",hotTracks:["三翼鸟全屋智能解决方案","AIoT平台(海纳云)","海外本地化运营"],topPayingRoles:[{role:"算法工程师",range:"30-55万"},{role:"IoT开发工程师",range:"20-35万"},{role:"产品经理",range:"20-35万"}],valuation:"2600亿+",category:"头部巨头",stars:5},
      {id:"gree",name:"格力电器",type:"民企上市",subSector:"白电(空调为主)",headquarters:"珠海",employees:80000,avgSalary:26.8,avgSalaryChange:2.3,avgSalaryChangePercent:8.6,focusArea:"智能家居+新能源",hotTracks:["变频控制技术","智能家居互联","钛/储能新能源"],topPayingRoles:[{role:"硬件工程师",range:"16-28万"},{role:"嵌入式工程师",range:"18-30万"},{role:"制造/工艺工程师",range:"14-22万"}],valuation:"2000亿+",category:"头部巨头",stars:4},
      {id:"hisense",name:"海信家电",type:"国企上市",subSector:"白电/黑电",headquarters:"青岛",employees:55000,avgSalary:24.5,avgSalaryChange:1.8,avgSalaryChangePercent:7.3,focusArea:"智能显示+白电",hotTracks:["激光显示技术","智能电视生态","中央空调智能控制"],topPayingRoles:[{role:"硬件工程师",range:"16-26万"},{role:"嵌入式工程师",range:"18-28万"},{role:"显示算法工程师",range:"25-40万"}],valuation:"300亿+",category:"头部传统",stars:4},
      {id:"tcl",name:"TCL",type:"民企上市",subSector:"黑电/白电",headquarters:"深圳",employees:50000,avgSalary:27.0,avgSalaryChange:3.5,avgSalaryChangePercent:13.0,focusArea:"智能显示+AIoT",hotTracks:["Mini LED显示","AIoT智能家居","海外品牌运营"],topPayingRoles:[{role:"软件开发工程师",range:"20-35万"},{role:"显示技术工程师",range:"22-38万"},{role:"海外运营",range:"18-32万"}],valuation:"600亿+",category:"头部传统",stars:4},
      {id:"roborock",name:"石头科技",type:"民企上市",subSector:"清洁电器",headquarters:"北京",employees:2500,avgSalary:48.5,avgSalaryChange:8.0,avgSalaryChangePercent:16.5,focusArea:"扫地机器人+导航算法",hotTracks:["SLAM导航算法","AI视觉避障","具身智能"],topPayingRoles:[{role:"算法工程师",range:"40-70万"},{role:"嵌入式工程师",range:"25-40万"},{role:"产品经理",range:"22-38万"}],valuation:"200亿+",category:"细分龙头",stars:4},
      {id:"ecovacs",name:"科沃斯",type:"民企上市",subSector:"清洁电器",headquarters:"苏州",employees:4000,avgSalary:35.0,avgSalaryChange:4.5,avgSalaryChangePercent:12.9,focusArea:"服务机器人",hotTracks:["家庭服务机器人","商用清洁机器人","AI交互技术"],topPayingRoles:[{role:"算法工程师",range:"30-55万"},{role:"产品经理",range:"20-35万"},{role:"机器人工程师",range:"22-38万"}],valuation:"150亿+",category:"细分龙头",stars:3},
      {id:"anker",name:"安克创新",type:"民企上市",subSector:"消费电子/充电",headquarters:"长沙",employees:3500,avgSalary:42.0,avgSalaryChange:7.5,avgSalaryChangePercent:17.9,focusArea:"出海消费电子+AI硬件",hotTracks:["海外电商运营","AI智能硬件","eufy智能家居"],topPayingRoles:[{role:"海外运营经理",range:"25-48万"},{role:"软件开发工程师",range:"28-50万"},{role:"产品经理",range:"24-42万"}],valuation:"300亿+",category:"细分龙头",stars:4},
      {id:"dreame",name:"追觅科技",type:"民企非上市",subSector:"清洁电器/智能家电",headquarters:"苏州",employees:3000,avgSalary:40.0,avgSalaryChange:9.0,avgSalaryChangePercent:22.5,focusArea:"高速马达+智能清洁",hotTracks:["高速数字马达技术","AI扫地机器人","具身智能人形机器人"],topPayingRoles:[{role:"算法工程师",range:"38-65万"},{role:"马达/电机工程师",range:"22-38万"},{role:"产品经理",range:"20-35万"}],valuation:"独角兽",category:"新兴力量",stars:5},
      {id:"joyoung",name:"九阳股份",type:"民企上市",subSector:"小家电(厨房)",headquarters:"杭州",employees:5000,avgSalary:20.0,avgSalaryChange:1.5,avgSalaryChangePercent:7.5,focusArea:"健康厨房小家电",hotTracks:["智能料理机","健康厨房生态","破壁技术升级"],topPayingRoles:[{role:"硬件工程师",range:"15-24万"},{role:"产品经理",range:"16-28万"},{role:"质量工程师",range:"13-20万"}],valuation:"80亿+",category:"细分传统",stars:2},
      {id:"supor",name:"苏泊尔",type:"民企上市(SEB控股)",subSector:"小家电(厨房)",headquarters:"杭州",employees:6000,avgSalary:18.5,avgSalaryChange:1.0,avgSalaryChangePercent:5.4,focusArea:"炊具+厨房电器",hotTracks:["智能厨房电器","IH电磁加热","健康烹饪生态"],topPayingRoles:[{role:"制造工程师",range:"13-20万"},{role:"硬件工程师",range:"14-22万"},{role:"质量工程师",range:"12-18万"}],valuation:"70亿+",category:"细分传统",stars:2}
    ],
    cityMatrix: [
      {city:"上海",multiplier:1.00,avgP5:35.0,housingPriceRatio:6.8,hotRoles:["算法","产品","海外运营"]},
      {city:"深圳",multiplier:0.95,avgP5:33.3,housingPriceRatio:7.2,hotRoles:["算法","IoT","软件开发"]},
      {city:"北京",multiplier:0.92,avgP5:32.2,housingPriceRatio:6.5,hotRoles:["算法","产品","机器人"]},
      {city:"杭州",multiplier:0.85,avgP5:29.8,housingPriceRatio:5.8,hotRoles:["软件开发","产品","嵌入式"]},
      {city:"苏州",multiplier:0.82,avgP5:28.7,housingPriceRatio:4.5,hotRoles:["算法","机器人","IoT"]},
      {city:"青岛",multiplier:0.75,avgP5:26.3,housingPriceRatio:4.0,hotRoles:["制造","嵌入式","硬件"]},
      {city:"宁波",multiplier:0.75,avgP5:26.3,housingPriceRatio:3.8,hotRoles:["制造","硬件","供应链"]},
      {city:"珠海",multiplier:0.72,avgP5:25.2,housingPriceRatio:3.6,hotRoles:["嵌入式","硬件","制造"]},
      {city:"佛山",multiplier:0.70,avgP5:24.5,housingPriceRatio:3.5,hotRoles:["制造","嵌入式","硬件"]},
      {city:"长沙",multiplier:0.65,avgP5:22.8,housingPriceRatio:2.8,hotRoles:["海外运营","软件开发","产品"]},
      {city:"成都",multiplier:0.78,avgP5:27.3,housingPriceRatio:3.2,hotRoles:["软件开发","嵌入式","测试"]}
    ],
    levelMultiplier: [
      {level:"P3(P4)",tier:"基层",median:15,multiplierToBase:1.0},
      {level:"P5",tier:"骨干",median:26,multiplierToBase:1.73},
      {level:"P6",tier:"资深",median:36,multiplierToBase:2.4},
      {level:"P7(P8)",tier:"专家/高级经理",median:52,multiplierToBase:3.47},
      {level:"P9(P10)",tier:"总监",median:75,multiplierToBase:5.0},
      {level:"P11+",tier:"VP/CXO",median:120,multiplierToBase:8.0}
    ],
    trendData: {
      quarterly: [
        {quarter:"2023Q1",avgTCC:27.5,index:74.0,newJobs:1200},
        {quarter:"2023Q2",avgTCC:28.0,index:75.5,newJobs:1350},
        {quarter:"2023Q3",avgTCC:28.2,index:76.0,newJobs:1280},
        {quarter:"2023Q4",avgTCC:28.5,index:76.5,newJobs:1100},
        {quarter:"2024Q1",avgTCC:29.0,index:78.0,newJobs:1450},
        {quarter:"2024Q2",avgTCC:29.8,index:79.5,newJobs:1580},
        {quarter:"2024Q3",avgTCC:30.2,index:80.0,newJobs:1620},
        {quarter:"2024Q4",avgTCC:30.5,index:80.5,newJobs:1350},
        {quarter:"2025Q1",avgTCC:31.0,index:81.0,newJobs:1500},
        {quarter:"2025Q2",avgTCC:31.5,index:81.5,newJobs:1650},
        {quarter:"2025Q3",avgTCC:31.8,index:82.0,newJobs:1700},
        {quarter:"2025Q4",avgTCC:32.0,index:82.5,newJobs:1400},
        {quarter:"2026Q1",avgTCC:32.2,index:82.8,newJobs:1520},
        {quarter:"2026Q2",avgTCC:32.6,index:82.4,newJobs:1580}
      ],
      jobFamilyTrends: {
        algo_ai:[{q:"2023Q1",v:38},{q:"2023Q2",v:39.5},{q:"2023Q3",v:40},{q:"2023Q4",v:40.5},{q:"2024Q1",v:41},{q:"2024Q2",v:42},{q:"2024Q3",v:43},{q:"2024Q4",v:43.5},{q:"2025Q1",v:44},{q:"2025Q2",v:44.5},{q:"2025Q3",v:45},{q:"2025Q4",v:45},{q:"2026Q1",v:45.2},{q:"2026Q2",v:45.2}],
        embedded_iot:[{q:"2023Q1",v:24.5},{q:"2023Q2",v:25},{q:"2023Q3",v:25.5},{q:"2023Q4",v:26},{q:"2024Q1",v:26.5},{q:"2024Q2",v:27},{q:"2024Q3",v:27.5},{q:"2024Q4",v:27.8},{q:"2025Q1",v:28},{q:"2025Q2",v:28.2},{q:"2025Q3",v:28.5},{q:"2025Q4",v:28.3},{q:"2026Q1",v:28.5},{q:"2026Q2",v:28.5}],
        software_dev:[{q:"2023Q1",v:28},{q:"2023Q2",v:28.5},{q:"2023Q3",v:29},{q:"2023Q4",v:29.2},{q:"2024Q1",v:29.5},{q:"2024Q2",v:30},{q:"2024Q3",v:30.5},{q:"2024Q4",v:30.5},{q:"2025Q1",v:30.5},{q:"2025Q2",v:30.8},{q:"2025Q3",v:30.8},{q:"2025Q4",v:30.5},{q:"2026Q1",v:30.8},{q:"2026Q2",v:30.8}],
        hardware_electronics:[{q:"2023Q1",v:22},{q:"2023Q2",v:22.5},{q:"2023Q3",v:23},{q:"2023Q4",v:23.5},{q:"2024Q1",v:24},{q:"2024Q2",v:24.5},{q:"2024Q3",v:25},{q:"2024Q4",v:25},{q:"2025Q1",v:25.2},{q:"2025Q2",v:25.4},{q:"2025Q3",v:25.4},{q:"2025Q4",v:25.2},{q:"2026Q1",v:25.4},{q:"2026Q2",v:25.4}],
        automation_manufacturing:[{q:"2023Q1",v:20},{q:"2023Q2",v:20.5},{q:"2023Q3",v:21},{q:"2023Q4",v:21.2},{q:"2024Q1",v:21.5},{q:"2024Q2",v:21.8},{q:"2024Q3",v:22},{q:"2024Q4",v:22},{q:"2025Q1",v:22},{q:"2025Q2",v:22},{q:"2025Q3",v:22},{q:"2025Q4",v:21.8},{q:"2026Q1",v:22},{q:"2026Q2",v:22}],
        product_operation:[{q:"2023Q1",v:23},{q:"2023Q2",v:23.5},{q:"2023Q3",v:24},{q:"2023Q4",v:24.5},{q:"2024Q1",v:25},{q:"2024Q2",v:25.5},{q:"2024Q3",v:26},{q:"2024Q4",v:26.5},{q:"2025Q1",v:27},{q:"2025Q2",v:27.2},{q:"2025Q3",v:27.5},{q:"2025Q4",v:27},{q:"2026Q1",v:27.5},{q:"2026Q2",v:27.5}],
        test_quality:[{q:"2023Q1",v:17.5},{q:"2023Q2",v:18},{q:"2023Q3",v:18.5},{q:"2023Q4",v:18.8},{q:"2024Q1",v:19},{q:"2024Q2",v:19.2},{q:"2024Q3",v:19.5},{q:"2024Q4",v:19.5},{q:"2025Q1",v:19.5},{q:"2025Q2",v:19.5},{q:"2025Q3",v:19.5},{q:"2025Q4",v:19.3},{q:"2026Q1",v:19.5},{q:"2026Q2",v:19.5}]
      }
    },
    industrySpecificMetrics: {
      policyImpact: {
        title:"以旧换新政策影响指数", score:8.5, change:1.2,
        description:"2026年以旧换新补贴政策持续扩大覆盖品类，刺激家电换新需求，带动招聘需求增长15%+",
        impactedRoles:["制造工程师","售后工程师","供应链管理"]
      },
      smartPremium: {
        title:"智能化转型薪酬溢价指数", avgPremium:1.35, change:0.08,
        description:"具备AI/IoT/智能化技能的岗位在家电行业可获得35%溢价，高于制造业平均水平",
        topPremiumRoles:[
          {role:"AI算法工程师",premium:"40%",vsInternet:"低15-30%"},
          {role:"IoT/嵌入式工程师",premium:"25%",vsInternet:"接近持平"},
          {role:"智能硬件产品经理",premium:"30%",vsInternet:"低10-20%"}
        ]
      },
      housingSalaryRatio: {
        title:"薪酬/房价比（生活质量指数）",
        cities:[
          {city:"长沙",ratio:8.1,note:"安克创新总部，性价比极高"},
          {city:"佛山",ratio:7.0,note:"美的总部，性价比最高"},
          {city:"宁波",ratio:6.9,note:"奥克斯/方太等集聚"},
          {city:"珠海",ratio:7.0,note:"格力总部"},
          {city:"青岛",ratio:6.6,note:"海尔/海信总部"},
          {city:"苏州",ratio:6.4,note:"追觅/科沃斯总部"},
          {city:"成都",ratio:8.5,note:"新兴研发中心"},
          {city:"杭州",ratio:5.1,note:"九阳/苏泊尔总部"},
          {city:"上海",ratio:5.1,note:"通用高地"},
          {city:"北京",ratio:4.9,note:"石头科技总部"},
          {city:"深圳",ratio:4.6,note:"TCL等，房价压力大"}
        ]
      },
      exportSalaryPremium: {
        title:"出海方向薪酬溢价", avgPremium:1.25, change:0.05,
        description:"具备海外市场运营/本地化/跨境电商经验的岗位溢价25%",
        topExportCompanies:[
          {name:"安克创新",premium:"30%",focus:"全球电商+DTC"},
          {name:"追觅科技",premium:"22%",focus:"欧洲+东南亚"},
          {name:"海尔智家",premium:"18%",focus:"全球化品牌运营"},
          {name:"TCL",premium:"15%",focus:"北美+新兴市场"}
        ]
      },
      fixedFloatRatio: {
        title:"固浮比分析",
        jobFamilies:[
          {name:"研发族(算法/AI)",ratio:"7:3",note:"高固低浮，稳定性强"},
          {name:"研发族(嵌入式/IoT)",ratio:"7.5:2.5",note:"固定占比更高"},
          {name:"营销族",ratio:"4:6",note:"浮动占比高，业绩驱动"},
          {name:"产品族",ratio:"5:5",note:"中等浮动，结果导向"},
          {name:"制造族",ratio:"7.5:2.5",note:"偏固定，绩效浮动小"},
          {name:"职能族",ratio:"8:2",note:"高固定，福利占比大"}
        ]
      }
    },
    crossIndustryComparison: {
      industries:[
        {name:"金融",avgP7:95,range:"60-150万",color:"#FF8C94"},
        {name:"半导体芯片",avgP7:85,range:"75-115万",color:"#4ECDC4"},
        {name:"TMT/AI互联网",avgP7:80,range:"45-120万",color:"#FF6B6B"},
        {name:"新能源车",avgP7:60,range:"40-85万",color:"#FFE66D"},
        {name:"家电制造业",avgP7:52,range:"25-78万",color:"#00d68f"},
        {name:"传统制造业",avgP7:35,range:"20-50万",color:"#DDA0DD"}
      ],
      summary:"当前家电制造业核心研发岗年薪约25-46万，整体处于市场中游水平。相比TMT/AI行业的45-120万、半导体的75-115万有明显差距；但嵌入式/IoT方向（22-40万）已接近互联网同类岗位，且工作生活平衡优于互联网996。对于看重稳定性+技术成长+生活质量的候选人，家电制造业——尤其是美的AI/机器人方向——具备不错的性价比。"
    },
    policyTracker:[
      {date:"2026-06",policy:"以旧换新补贴扩围",impact:"正面",impactLevel:4,description:"补贴品类从8类扩至12类，覆盖更多小家电和智能家居品类"},
      {date:"2026-05",policy:"智能家电新国标L1-L5",impact:"正面",impactLevel:3,description:"智能等级分类标准出台，推动企业研发投入增加"},
      {date:"2026-04",policy:"制造业人才补贴政策",impact:"正面",impactLevel:3,description:"多地出台制造业人才落户/安家补贴，佛山/青岛力度最大"},
      {date:"2026-03",policy:"绿色节能标准升级",impact:"中性",impactLevel:2,description:"新能效标准推动变频/节能技术升级，增加硬件岗位需求"},
      {date:"2025-12",policy:"家电下乡2.0",impact:"正面",impactLevel:3,description:"新一轮农村市场补贴，刺激中低端产品需求和制造岗位"}
    ]
  };

  // --- Chart.js Global Config ---
  Chart.defaults.color = '#8b95a8';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
  Chart.defaults.font.family = "'Inter','Noto Sans SC',sans-serif";
  Chart.defaults.font.size = 12;

  const chartInstances = {};

  // --- Utility ---
  function getShortageClass(score) {
    if (score >= 9) return 'extreme';
    if (score >= 7) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  }
  function getShortageIconClass(score) {
    if (score >= 9) return 'high';
    if (score >= 7) return 'medium';
    return 'low';
  }
  function getJfColor(id) {
    const colors = {
      algo_ai:'#00d68f', embedded_iot:'#0095ff', software_dev:'#7b61ff',
      hardware_electronics:'#ffaa00', automation_manufacturing:'#ff3d71',
      product_operation:'#00c9a7', test_quality:'#8b95a8'
    };
    return colors[id] || '#00d68f';
  }

  // --- Tab Navigation ---
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById('tab-' + tab.dataset.tab);
      if (target) target.classList.add('active');
      // Track tab switch
      HAAnalytics.trackTab(tab.dataset.tab);
      // Re-render charts on tab switch
      setTimeout(() => renderAllCharts(), 100);
    });
  });

  // --- Render Overview Job Family Cards ---
  function renderJfOverview() {
    const grid = document.getElementById('jfOverviewGrid');
    if (!grid) return;
    grid.innerHTML = '';
    DATA.jobFamilies.forEach(jf => {
      const color = getJfColor(jf.id);
      const shortageCls = getShortageClass(jf.shortageScore);
      const iconCls = getShortageIconClass(jf.shortageScore);
      const maxSalary = 78; // for bar width calculation
      const p25w = (jf.p25/maxSalary*100);
      const p50w = ((jf.p50-jf.p25)/maxSalary*100);
      const p75w = ((jf.p75-jf.p50)/maxSalary*100);
      const p90w = ((jf.p90-jf.p75)/maxSalary*100);
      const trendIcon = jf.trend === 'up' ? '↑' : jf.trend === 'down' ? '↓' : '→';
      const changeCls = jf.changePercent > 0 ? 'up' : jf.changePercent < 0 ? 'down' : '';

      grid.innerHTML += `
        <div class="jf-card">
          <div class="jf-header">
            <div class="jf-icon ${iconCls}">${jf.icon}</div>
            <div class="jf-name">${jf.name}</div>
            <div class="jf-shortage ${shortageCls}">${jf.shortageLevel}</div>
          </div>
          <div class="jf-salary">${jf.avgTCC}<small>万/年</small></div>
          <div class="jf-change ${changeCls}">${trendIcon} ${jf.changePercent > 0 ? '+' : ''}${jf.changePercent}%</div>
          <div class="jf-percentile-bar">
            <div class="jf-p-segment" style="left:0;width:${p25w}%;background:rgba(${hexToRgb(color)},0.3)"></div>
            <div class="jf-p-segment" style="left:${p25w}%;width:${p50w}%;background:rgba(${hexToRgb(color)},0.5)"></div>
            <div class="jf-p-segment" style="left:${p25w+p50w}%;width:${p75w}%;background:rgba(${hexToRgb(color)},0.7)"></div>
            <div class="jf-p-segment" style="left:${p25w+p50w+p75w}%;width:${p90w}%;background:rgba(${hexToRgb(color)},0.9)"></div>
          </div>
          <div class="jf-percentile-labels">
            <span>P25:${jf.p25}万</span>
            <span>P50:${jf.p50}万</span>
            <span>P75:${jf.p75}万</span>
            <span>P90:${jf.p90}万</span>
          </div>
          <div class="jf-detail-row">
            <span class="jf-detail-label">固浮比</span>
            <span class="jf-detail-value">${jf.fixedFloatRatio}</span>
          </div>
          <div class="jf-detail-row">
            <span class="jf-detail-label">智能化溢价</span>
            <span class="jf-detail-value" style="color:${color}">${jf.smartPremium}×</span>
          </div>
        </div>
      `;
    });
  }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  }

  // --- Render Job Family Detail Cards ---
  function renderJfDetail() {
    const grid = document.getElementById('jfDetailGrid');
    if (!grid) return;
    grid.innerHTML = '';
    DATA.jobFamilies.forEach(jf => {
      const color = getJfColor(jf.id);
      const shortageCls = getShortageClass(jf.shortageScore);
      const changeCls = jf.changePercent > 0 ? 'up' : 'down';
      let companyRows = '';
      jf.topCompanies.forEach(c => {
        companyRows += `<div class="company-role-row"><span class="role-name">${c.name}${c.premium ? ' <span style="color:'+color+';font-size:10px">'+c.premium+'</span>' : ''}</span><span class="role-range">${c.range}</span></div>`;
      });
      let positionTags = '';
      jf.positions.forEach(p => {
        positionTags += `<span class="hot-track-tag">${p}</span>`;
      });

      grid.innerHTML += `
        <div class="jf-card">
          <div class="jf-header">
            <div class="jf-icon ${getShortageIconClass(jf.shortageScore)}">${jf.icon}</div>
            <div class="jf-name">${jf.name}</div>
            <div class="jf-shortage ${shortageCls}">${jf.shortageLevel} (${jf.shortageScore}/10)</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div class="jf-salary">${jf.avgTCC}<small>万/年 P50:${jf.p50}万</small></div>
            <div class="jf-change ${changeCls}">${jf.changePercent > 0 ? '+' : ''}${jf.changePercent}%</div>
          </div>
          <div style="margin-bottom:12px;font-size:12px;color:var(--text-muted)">岗位方向</div>
          <div class="company-hot-tracks" style="margin-bottom:12px">${positionTags}</div>
          <div style="margin-bottom:12px;font-size:12px;color:var(--text-muted)">头部企业薪酬</div>
          <div class="company-roles">${companyRows}</div>
          <div style="margin-top:12px;padding-top:8px;border-top:1px solid var(--border)">
            <div class="jf-detail-row">
              <span class="jf-detail-label">固浮比</span>
              <span class="jf-detail-value">${jf.fixedFloatRatio}</span>
            </div>
            <div class="jf-detail-row">
              <span class="jf-detail-label">智能化溢价</span>
              <span class="jf-detail-value" style="color:${color}">${jf.smartPremium}×</span>
            </div>
          </div>
        </div>
      `;
    });
  }

  // --- Render Company Tracker ---
  function renderCompanies() {
    const grid = document.getElementById('companyGrid');
    if (!grid) return;
    grid.innerHTML = '';
    DATA.companyTracker.forEach(c => {
      const badgeCls = c.category === '头部巨头' ? 'giant' : c.category === '细分龙头' ? 'startup' : c.category === '新兴力量' ? 'startup' : 'traditional';
      const starsHtml = '★'.repeat(c.stars) + '☆'.repeat(5-c.stars);
      let hotTracks = '';
      c.hotTracks.forEach(t => { hotTracks += `<span class="hot-track-tag">${t}</span>`; });
      let roleRows = '';
      c.topPayingRoles.forEach(r => {
        roleRows += `<div class="company-role-row"><span class="role-name">${r.role}</span><span class="role-range">${r.range}</span></div>`;
      });

      grid.innerHTML += `
        <div class="company-card">
          <div class="company-header">
            <div class="company-badge ${badgeCls}">${c.category}</div>
            <div class="company-name">${c.name}</div>
            <div class="stars">${starsHtml}</div>
          </div>
          <div class="company-salary">${c.avgSalary}<span style="font-size:14px;color:var(--text-secondary)">万</span>
            <span class="company-salary-change">↑+${c.avgSalaryChangePercent}%</span>
          </div>
          <div class="company-stats">
            <span class="company-stat">📍${c.headquarters}</span>
            <span class="company-stat">👥${(c.employees/1000).toFixed(0)}K人</span>
            <span class="company-stat">💰${c.valuation}</span>
          </div>
          <div class="company-focus" style="color:var(--accent-green);font-weight:500">${c.focusArea}</div>
          <div class="company-hot-tracks">${hotTracks}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">Top薪酬岗位</div>
          <div class="company-roles">${roleRows}</div>
        </div>
      `;
    });
  }

  // --- Render City Bar ---
  function renderCityBars() {
    const container = document.getElementById('cityBarList');
    if (!container) return;
    container.innerHTML = '';
    const sorted = [...DATA.cityMatrix].sort((a,b) => b.multiplier - a.multiplier);
    sorted.forEach(c => {
      const barColor = c.multiplier >= 0.9 ? '#00d68f' : c.multiplier >= 0.8 ? '#0095ff' : c.multiplier >= 0.7 ? '#7b61ff' : '#ffaa00';
      container.innerHTML += `
        <div class="city-row">
          <div class="city-name">${c.city}</div>
          <div class="city-bar-container">
            <div class="city-bar" style="width:${c.multiplier*100}%;background:${barColor}"></div>
          </div>
          <div class="city-multiplier" style="color:${barColor}">${c.multiplier.toFixed(2)}</div>
          <div class="city-housing">${c.avgP5}万</div>
        </div>
      `;
    });
  }

  // --- Render Policy Tracker ---
  function renderPolicies() {
    const container = document.getElementById('policyList');
    if (!container) return;
    container.innerHTML = '';
    DATA.policyTracker.forEach(p => {
      const impactCls = p.impact === '正面' ? 'positive' : 'neutral';
      container.innerHTML += `
        <div class="policy-item">
          <div class="policy-date">${p.date}</div>
          <div class="policy-impact-badge ${impactCls}">${p.impact}</div>
          <div style="flex:1">
            <div class="policy-name">${p.policy}</div>
            <div class="policy-desc">${p.description}</div>
          </div>
        </div>
      `;
    });
  }

  // --- Render Export Premium ---
  function renderExportPremium() {
    const container = document.getElementById('exportPremiumList');
    if (!container) return;
    container.innerHTML = '';
    DATA.industrySpecificMetrics.exportSalaryPremium.topExportCompanies.forEach(c => {
      container.innerHTML += `
        <div class="city-row">
          <div class="city-name">${c.name}</div>
          <div class="city-bar-container">
            <div class="city-bar" style="width:${parseInt(c.premium)}%;background:#0095ff"></div>
          </div>
          <div style="width:80px;text-align:right;color:#0095ff;font-weight:600">${c.premium}</div>
          <div style="width:120px;text-align:right;color:var(--text-secondary);font-size:12px">${c.focus}</div>
        </div>
      `;
    });
  }

  // --- Render Cross Industry Bar ---
  function renderCrossBars() {
    const container = document.getElementById('crossBarList');
    if (!container) return;
    container.innerHTML = '';
    const maxVal = 95;
    DATA.crossIndustryComparison.industries.forEach(ind => {
      container.innerHTML += `
        <div class="cross-bar">
          <div class="cross-name">${ind.name}</div>
          <div class="cross-bar-container">
            <div class="cross-bar-fill" style="width:${(ind.avgP7/maxVal)*100}%;background:${ind.color}"></div>
          </div>
          <div class="cross-value" style="color:${ind.color}">${ind.avgP7}万</div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-left:120px;margin-bottom:4px">${ind.range}</div>
      `;
    });
  }

  // --- Charts ---
  function destroyChart(id) {
    if (chartInstances[id]) {
      chartInstances[id].destroy();
      chartInstances[id] = null;
    }
  }

  function renderIndexTrendChart() {
    const ctx = document.getElementById('indexTrendChart');
    if (!ctx) return;
    destroyChart('indexTrend');
    const quarters = DATA.trendData.quarterly.map(d => d.quarter);
    const indices = DATA.trendData.quarterly.map(d => d.index);
    chartInstances['indexTrend'] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: quarters,
        datasets: [{
          label: '薪酬综合指数',
          data: indices,
          borderColor: '#00d68f',
          backgroundColor: 'rgba(0,214,143,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#00d68f',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(26,32,53,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            titleColor: '#f0f2f5',
            bodyColor: '#8b95a8',
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, min: 70, max: 85, ticks: { font: { size: 10 } } }
        }
      }
    });
  }

  function renderJobFamilyTrendChart() {
    const ctx = document.getElementById('jobFamilyTrendChart');
    if (!ctx) return;
    destroyChart('jfTrend');
    const quarters = DATA.trendData.quarterly.map(d => d.quarter);
    const datasets = DATA.jobFamilies.map(jf => {
      const trendData = DATA.trendData.jobFamilyTrends[jf.id];
      return {
        label: jf.name,
        data: trendData ? trendData.map(d => d.v) : [],
        borderColor: getJfColor(jf.id),
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2
      };
    });
    chartInstances['jfTrend'] = new Chart(ctx, {
      type: 'line',
      data: { labels: quarters, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 8, font: { size: 11 } }
          },
          tooltip: {
            backgroundColor: 'rgba(26,32,53,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}万/年`
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { font: { size: 10 }, callback: v => v + '万' } }
        },
        interaction: { mode: 'index', intersect: false }
      }
    });
  }

  function renderPercentileChart() {
    const ctx = document.getElementById('percentileChart');
    if (!ctx) return;
    destroyChart('percentile');
    const labels = DATA.jobFamilies.map(jf => jf.name);
    chartInstances['percentile'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'P25', data: DATA.jobFamilies.map(jf => jf.p25), backgroundColor: 'rgba(0,214,143,0.2)', borderRadius: 2 },
          { label: 'P50', data: DATA.jobFamilies.map(jf => jf.p50 - jf.p25), backgroundColor: 'rgba(0,214,143,0.4)', borderRadius: 2 },
          { label: 'P75', data: DATA.jobFamilies.map(jf => jf.p75 - jf.p50), backgroundColor: 'rgba(0,214,143,0.6)', borderRadius: 2 },
          { label: 'P90', data: DATA.jobFamilies.map(jf => jf.p90 - jf.p75), backgroundColor: 'rgba(0,214,143,0.8)', borderRadius: 2 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 8, font: { size: 11 } }
          },
          tooltip: {
            backgroundColor: 'rgba(26,32,53,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: ctx => {
                const jf = DATA.jobFamilies[ctx.dataIndex];
                const pVals = [jf.p25, jf.p50, jf.p75, jf.p90];
                return `${ctx.dataset.label}: ${pVals[ctx.datasetIndex]}万`;
              }
            }
          }
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { stacked: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { font: { size: 10 }, callback: v => v + '万' } }
        }
      }
    });
  }

  function renderLevelMultiplierChart() {
    const ctx = document.getElementById('levelMultiplierChart');
    if (!ctx) return;
    destroyChart('levelMul');
    const labels = DATA.levelMultiplier.map(l => l.level + '\n' + l.tier);
    chartInstances['levelMul'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '年薪中位数(万)',
            data: DATA.levelMultiplier.map(l => l.median),
            backgroundColor: ['#8b95a8','#0095ff','#00c9a7','#00d68f','#ffaa00','#ff3d71'],
            borderRadius: 6,
            barThickness: 40
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(26,32,53,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              afterLabel: ctx => `倍率: ${DATA.levelMultiplier[ctx.dataIndex].multiplierToBase}× (相对P4)`
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { font: { size: 10 }, callback: v => v + '万' } }
        }
      }
    });
  }

  function renderFixedFloatChart() {
    const ctx = document.getElementById('fixedFloatChart');
    if (!ctx) return;
    destroyChart('fixedFloat');
    const ratios = DATA.industrySpecificMetrics.fixedFloatRatio.jobFamilies;
    const labels = ratios.map(r => r.name);
    const fixedPcts = ratios.map(r => parseInt(r.ratio.split(':')[0]) / (parseInt(r.ratio.split(':')[0]) + parseInt(r.ratio.split(':')[1])) * 100);
    const floatPcts = ratios.map(r => parseInt(r.ratio.split(':')[1]) / (parseInt(r.ratio.split(':')[0]) + parseInt(r.ratio.split(':')[1])) * 100);
    chartInstances['fixedFloat'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '固定薪酬占比',
            data: fixedPcts,
            backgroundColor: 'rgba(0,149,255,0.6)',
            borderRadius: 2
          },
          {
            label: '浮动薪酬占比',
            data: floatPcts,
            backgroundColor: 'rgba(255,170,0,0.6)',
            borderRadius: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 8, font: { size: 11 } }
          },
          tooltip: {
            backgroundColor: 'rgba(26,32,53,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              afterLabel: ctx => {
                const item = ratios[ctx.dataIndex];
                return `${item.ratio} · ${item.note}`;
              }
            }
          }
        },
        scales: {
          x: { stacked: true, grid: { color: 'rgba(255,255,255,0.04)' }, max: 100, ticks: { callback: v => v + '%' } },
          y: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    });
  }

  function renderHousingChart() {
    const ctx = document.getElementById('housingChart');
    if (!ctx) return;
    destroyChart('housing');
    const cities = DATA.industrySpecificMetrics.housingSalaryRatio.cities;
    const sorted = [...cities].sort((a,b) => b.ratio - a.ratio);
    chartInstances['housing'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(c => c.city),
        datasets: [{
          label: '薪酬/房价比',
          data: sorted.map(c => c.ratio),
          backgroundColor: sorted.map(c => c.ratio >= 7 ? '#00d68f' : c.ratio >= 5 ? '#0095ff' : '#ff3d71'),
          borderRadius: 6,
          barThickness: 24
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(26,32,53,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              afterLabel: ctx => sorted[ctx.dataIndex].note
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { font: { size: 10 } }, min: 2, max: 10 }
        }
      }
    });
  }

  function renderCityRoleChart() {
    const ctx = document.getElementById('cityRoleChart');
    if (!ctx) return;
    destroyChart('cityRole');
    // Create bubble chart for city vs hot roles
    const roleCategories = ['算法','产品','IoT','软件开发','嵌入式','硬件','制造','海外运营','机器人','供应链','测试'];
    const cityData = DATA.cityMatrix.map(c => {
      return {
        x: roleCategories.indexOf(c.hotRoles[0] || '算法'),
        y: c.avgP5,
        r: c.multiplier * 15,
        label: c.city
      };
    });
    chartInstances['cityRole'] = new Chart(ctx, {
      type: 'bubble',
      data: {
        datasets: [{
          label: '城市薪酬',
          data: cityData.map(d => ({ x: d.x, y: d.y, r: d.r })),
          backgroundColor: cityData.map(d => d.y >= 33 ? 'rgba(0,214,143,0.5)' : d.y >= 27 ? 'rgba(0,149,255,0.5)' : 'rgba(255,170,0,0.5)'),
          borderColor: cityData.map(d => d.y >= 33 ? '#00d68f' : d.y >= 27 ? '#0095ff' : '#ffaa00'),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(26,32,53,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: ctx => {
                const d = cityData[ctx.dataIndex];
                return `${d.label}: P5年薪${d.y}万 · 倍率${(d.r/15).toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              callback: v => roleCategories[v] || '',
              font: { size: 10 }
            },
            min: -0.5, max: 10.5
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { font: { size: 10 }, callback: v => v + '万' },
            min: 20, max: 38
          }
        }
      }
    });
  }

  function renderSmartPremiumChart() {
    const ctx = document.getElementById('smartPremiumChart');
    if (!ctx) return;
    destroyChart('smartPremium');
    const roles = DATA.industrySpecificMetrics.smartPremium.topPremiumRoles;
    chartInstances['smartPremium'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: roles.map(r => r.role),
        datasets: [
          {
            label: '家电行业溢价',
            data: roles.map(r => parseInt(r.premium)),
            backgroundColor: ['#00d68f','#0095ff','#7b61ff'],
            borderRadius: 6,
            barThickness: 36
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(26,32,53,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              afterLabel: ctx => `vs互联网: ${roles[ctx.dataIndex].vsInternet}`
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => v + '%' }, max: 50 },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    });
  }

  function renderCrossIndustryChart() {
    const ctx = document.getElementById('crossIndustryChart');
    if (!ctx) return;
    destroyChart('crossIndustry');
    const industries = DATA.crossIndustryComparison.industries;
    const sorted = [...industries].sort((a,b) => b.avgP7 - a.avgP7);
    chartInstances['crossIndustry'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(i => i.name),
        datasets: [{
          label: 'P7年薪中位数',
          data: sorted.map(i => i.avgP7),
          backgroundColor: sorted.map(i => i.color),
          borderRadius: 6,
          barThickness: 28
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(26,32,53,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              afterLabel: ctx => `区间: ${sorted[ctx.dataIndex].range}`
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => v + '万' }, max: 100 }
        }
      }
    });
  }

  // --- Render All Charts ---
  function renderAllCharts() {
    renderIndexTrendChart();
    renderJobFamilyTrendChart();
    renderPercentileChart();
    renderLevelMultiplierChart();
    renderFixedFloatChart();
    renderHousingChart();
    renderCityRoleChart();
    renderSmartPremiumChart();
    renderCrossIndustryChart();
  }

  // --- Animated Counter ---
  function animateCounters() {
    const counters = document.querySelectorAll('.kpi-value, .index-number, .metric-score');
    counters.forEach(el => {
      const text = el.textContent;
      const numMatch = text.match(/(\d+\.?\d*)/);
      if (!numMatch) return;
      const target = parseFloat(numMatch[1]);
      const suffix = text.replace(numMatch[1], '');
      let current = 0;
      const duration = 1000;
      const start = performance.now();
      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        current = target * eased;
        el.textContent = current.toFixed(target % 1 === 0 ? 0 : 1) + suffix;
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    });
  }

  // --- Init ---
  function init() {
    renderJfOverview();
    renderJfDetail();
    renderCompanies();
    renderCityBars();
    renderPolicies();
    renderExportPremium();
    renderCrossBars();
    renderAllCharts();
    setTimeout(animateCounters, 200);
    // Track all chart views
    HAAnalytics.trackChart('all_charts');
    // Add click tracking on interactive elements
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.jf-card, .company-card, .city-row, .policy-item, .cross-bar, .kpi-card');
      if (card) {
        const label = card.querySelector('.jf-name, .company-name, .city-name, .policy-name, .cross-name, .kpi-label');
        HAAnalytics.trackClick('card_click', label ? label.textContent.trim() : 'unknown', null);
      }
      const tag = e.target.closest('.hot-track-tag');
      if (tag) {
        HAAnalytics.trackClick('tag_click', 'hot_track', tag.textContent.trim());
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
