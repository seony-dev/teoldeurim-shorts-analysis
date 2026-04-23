// ============================================================
// DATA LOADING & INITIALIZATION
// ============================================================

let allData = null;
let allVideos = [];
let allCurrentPage = 1;
const ALL_PAGE_SIZE = 50;
let allSortKey = 'rank';
let allSortDir = 1;
let allFilterTier = 'all';
let allSearchQuery = '';

let topSortKey = 'rank';
let botSortKey = 'rank';
let topSearchQuery = '';
let botSearchQuery = '';

fetch('data.json')
  .then(r => r.json())
  .then(data => {
    allData = data;
    allVideos = data.videos;
    initDashboard(data);
    initTopTable(data);
    initBotTable(data);
    initComparison(data);
    initTransform(data);
    initStrategy(data);
    initIdeas();
    initAllTable(data);
  })
  .catch(e => console.error('Data load error:', e));

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatViews(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 10000) return Math.round(n/10000) + '만';
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatViewsFull(n) {
  if (!n) return '0';
  return n.toLocaleString() + '회';
}

function formatDuration(s) {
  if (!s) return '-';
  return s + 's';
}

function getTierBadge(tier) {
  if (tier === 'top30') return '<span class="rank-badge top">TOP</span>';
  if (tier === 'top50') return '<span class="rank-badge mid">상위</span>';
  if (tier === 'bottom30') return '<span class="rank-badge bot">BOT</span>';
  if (tier === 'bottom50') return '<span class="rank-badge mid" style="background:rgba(255,68,68,0.07);color:#FF8888;">하위</span>';
  return '';
}

function getContentTypeTags(types) {
  const colorMap = {
    '폭로/비밀': 'tag-red',
    '인물반응': 'tag-blue',
    '논란/스캔들': 'tag-red',
    '외모/뷰티': 'tag-yellow',
    '업계/기획사': 'tag-blue',
    '아이돌행동/일상': 'tag-green',
    '비교': 'tag-yellow',
    '특정인물': 'tag-red',
    '기타': 'tag-gray',
  };
  return types.map(t => `<span class="tag ${colorMap[t] || 'tag-gray'}">${t}</span>`).join('');
}

function getViewBarWidth(views, maxViews) {
  return Math.max(2, Math.min(100, (views / maxViews) * 100));
}

// ============================================================
// DASHBOARD
// ============================================================

function initDashboard(data) {
  const s = data.summary;
  const statsGrid = document.getElementById('stats-grid');
  
  const stats = [
    { label: '전체 Shorts 수', value: s.total.toLocaleString() + '개', sub: '전수 분석 완료', class: '' },
    { label: '채널 평균 조회수', value: formatViews(s.avg_views), sub: '전체 639개 기준', class: 'highlight' },
    { label: '최고 조회수', value: formatViews(s.max_views), sub: '아이돌이 노력으로 안 된다는 영역', class: 'success' },
    { label: '상위 30 평균', value: formatViews(s.top30_avg), sub: '하위 30 대비 182배', class: 'success' },
    { label: '하위 30 평균', value: formatViews(s.bot30_avg), sub: '채널 평균의 3.7%', class: 'warning' },
    { label: '한국어 제목 평균', value: formatViews(s.korean_avg), sub: `${s.korean_count}개 영상`, class: '' },
    { label: '영어 제목 평균', value: formatViews(s.english_avg), sub: `${s.english_count}개 영상 (한국어 대비 16%)`, class: 'warning' },
    { label: '100만+ 영상', value: data.view_buckets['100만+'] + '개', sub: '전체의 ' + (data.view_buckets['100만+']/s.total*100).toFixed(1) + '%', class: 'highlight' },
  ];

  statsGrid.innerHTML = stats.map(s => `
    <div class="stat-card ${s.class}">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-sub">${s.sub}</div>
    </div>
  `).join('');

  // Monthly chart
  const months = data.monthly_stats;
  const monthLabels = months.map(m => m.month.replace('2025-', "'25/").replace('2026-', "'26/"));
  const monthAvgViews = months.map(m => Math.round(m.avg_views / 10000));

  new Chart(document.getElementById('monthlyChart'), {
    type: 'bar',
    data: {
      labels: monthLabels,
      datasets: [{
        label: '평균 조회수 (만)',
        data: monthAvgViews,
        backgroundColor: months.map(m => {
          const avg = m.avg_views;
          if (avg >= 700000) return 'rgba(255,0,80,0.8)';
          if (avg >= 400000) return 'rgba(255,107,0,0.7)';
          return 'rgba(255,0,80,0.3)';
        }),
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9090A8', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9090A8', font: { size: 11 }, callback: v => v + '만' } }
      }
    }
  });

  // View distribution chart
  const buckets = data.view_buckets;
  const bucketLabels = Object.keys(buckets);
  const bucketValues = Object.values(buckets);
  
  new Chart(document.getElementById('viewDistChart'), {
    type: 'doughnut',
    data: {
      labels: bucketLabels,
      datasets: [{
        data: bucketValues,
        backgroundColor: ['#FF0050','#FF6B00','#FFD700','#00D4FF','#00C851','#9090A8'],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#9090A8', font: { size: 11 }, padding: 12 } }
      }
    }
  });

  // Language comparison chart
  new Chart(document.getElementById('langChart'), {
    type: 'bar',
    data: {
      labels: ['한국어 제목', '영어 제목'],
      datasets: [
        {
          label: '영상 수',
          data: [s.korean_count, s.english_count],
          backgroundColor: ['rgba(0,212,255,0.7)', 'rgba(255,68,68,0.7)'],
          borderRadius: 6,
          yAxisID: 'y1',
        },
        {
          label: '평균 조회수 (만)',
          data: [Math.round(s.korean_avg/10000), Math.round(s.english_avg/10000)],
          backgroundColor: ['rgba(0,200,81,0.7)', 'rgba(255,187,51,0.7)'],
          borderRadius: 6,
          yAxisID: 'y2',
          type: 'line',
          borderColor: ['#00C851', '#FFBB33'],
          pointBackgroundColor: ['#00C851', '#FFBB33'],
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#9090A8', font: { size: 11 } } } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9090A8' } },
        y1: { position: 'left', grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9090A8', callback: v => v + '개' } },
        y2: { position: 'right', grid: { display: false }, ticks: { color: '#9090A8', callback: v => v + '만' } },
      }
    }
  });

  // Duration distribution
  const durDist = data.duration_dist.all;
  new Chart(document.getElementById('durationChart'), {
    type: 'bar',
    data: {
      labels: Object.keys(durDist),
      datasets: [{
        label: '영상 수',
        data: Object.values(durDist),
        backgroundColor: ['rgba(0,212,255,0.7)', 'rgba(255,0,80,0.7)', 'rgba(255,215,0,0.7)', 'rgba(0,200,81,0.7)'],
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9090A8' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9090A8' } }
      }
    }
  });
}

// ============================================================
// TOP TABLE
// ============================================================

function initTopTable(data) {
  const top30 = data.videos.filter(v => v.tier === 'top30');
  renderTopTable(top30);

  // Content type chart
  const topTypes = data.content_type_stats.top30;
  const typeLabels = Object.keys(topTypes).sort((a,b) => topTypes[b] - topTypes[a]);
  const typeValues = typeLabels.map(k => topTypes[k]);

  new Chart(document.getElementById('topContentChart'), {
    type: 'bar',
    data: {
      labels: typeLabels,
      datasets: [{
        data: typeValues,
        backgroundColor: 'rgba(255,0,80,0.7)',
        borderRadius: 6,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9090A8' } },
        y: { grid: { display: false }, ticks: { color: '#F0F0F5', font: { size: 12 } } }
      }
    }
  });

  // Pattern chart
  const patterns = data.title_patterns;
  const patternLabels = {
    'quote_marks': '따옴표 사용',
    'person_name': '인물 이름 포함',
    'negative_hook': '부정적 훅',
    'english_title': '영어 제목',
    'company_name': '기획사명 포함',
    'idol_general': '아이돌 언급',
  };

  new Chart(document.getElementById('topPatternChart'), {
    type: 'radar',
    data: {
      labels: Object.values(patternLabels),
      datasets: [{
        label: '상위 30',
        data: Object.keys(patternLabels).map(k => (patterns[k]?.top30 || 0) / 30 * 100),
        borderColor: '#FF0050',
        backgroundColor: 'rgba(255,0,80,0.1)',
        pointBackgroundColor: '#FF0050',
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#9090A8' } } },
      scales: {
        r: {
          grid: { color: 'rgba(255,255,255,0.1)' },
          ticks: { color: '#9090A8', font: { size: 10 }, backdropColor: 'transparent', callback: v => v + '%' },
          pointLabels: { color: '#F0F0F5', font: { size: 11 } },
          min: 0, max: 60,
        }
      }
    }
  });
}

function renderTopTable(videos) {
  const tbody = document.getElementById('top-tbody');
  const maxViews = Math.max(...videos.map(v => v.view_count));
  tbody.innerHTML = videos.map(v => `
    <tr>
      <td><span class="rank-badge top">${v.rank}</span></td>
      <td class="video-title-cell">
        <a href="${v.url}" target="_blank" class="video-title-link" title="${v.title}">${v.title}</a>
      </td>
      <td>
        <div class="view-bar">
          <div class="view-bar-fill" style="width: ${getViewBarWidth(v.view_count, maxViews)}px"></div>
          <span class="view-count-text">${formatViews(v.view_count)}</span>
        </div>
      </td>
      <td class="date-text">${v.upload_date || '-'}</td>
      <td><span class="duration-badge">${formatDuration(v.duration_seconds)}</span></td>
      <td>${getContentTypeTags(v.content_types)}</td>
    </tr>
  `).join('');
}

function filterTable(type, query) {
  if (type === 'top') {
    topSearchQuery = query.toLowerCase();
    const top30 = allData.videos.filter(v => v.tier === 'top30');
    const filtered = top30.filter(v => v.title.toLowerCase().includes(topSearchQuery));
    renderTopTable(filtered);
  } else {
    botSearchQuery = query.toLowerCase();
    const bot30 = allData.videos.filter(v => v.tier === 'bottom30');
    const filtered = bot30.filter(v => v.title.toLowerCase().includes(botSearchQuery));
    renderBotTable(filtered);
  }
}

function sortTable(type, key) {
  if (type === 'top') {
    if (topSortKey === key) allData.videos.filter(v => v.tier === 'top30').reverse();
    topSortKey = key;
    const top30 = allData.videos.filter(v => v.tier === 'top30').sort((a, b) => {
      if (key === 'view_count') return b[key] - a[key];
      if (key === 'rank') return a[key] - b[key];
      return (a[key] || '').localeCompare(b[key] || '');
    });
    renderTopTable(top30);
  }
}

// ============================================================
// BOTTOM TABLE
// ============================================================

function initBotTable(data) {
  const bot30 = data.videos.filter(v => v.tier === 'bottom30');
  renderBotTable(bot30);

  // Content type chart
  const botTypes = data.content_type_stats.bottom30;
  const typeLabels = Object.keys(botTypes).sort((a,b) => botTypes[b] - botTypes[a]);
  const typeValues = typeLabels.map(k => botTypes[k]);

  new Chart(document.getElementById('botContentChart'), {
    type: 'bar',
    data: {
      labels: typeLabels,
      datasets: [{
        data: typeValues,
        backgroundColor: 'rgba(255,68,68,0.7)',
        borderRadius: 6,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9090A8' } },
        y: { grid: { display: false }, ticks: { color: '#F0F0F5', font: { size: 12 } } }
      }
    }
  });

  // Failure factor chart
  const failFactors = {
    '영어 제목': 11,
    '모호한 소재': 8,
    '특정인물 부재': 7,
    '부정적 훅 없음': 6,
    '뷰티/패션 반복': 5,
    '시의성 이탈': 4,
  };

  new Chart(document.getElementById('botFailChart'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(failFactors),
      datasets: [{
        data: Object.values(failFactors),
        backgroundColor: ['#FF4444','#FF6B00','#FFBB33','#9090A8','#FF0050','#CC0040'],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#9090A8', font: { size: 11 }, padding: 10 } }
      }
    }
  });
}

function renderBotTable(videos) {
  const tbody = document.getElementById('bot-tbody');
  const maxViews = Math.max(...videos.map(v => v.view_count));
  
  const failReasons = {
    'english': '영어 제목 (국내 타겟 이탈)',
    'beauty': '뷰티/패션 반복 소재',
    'vague': '모호한 소재/훅 부재',
    'timing': '시의성 이탈',
    'generic': '아이돌 일반 소재',
  };
  
  tbody.innerHTML = videos.map((v, i) => {
    let failReason = '모호한 소재/훅 부재';
    if (v.is_english) failReason = '영어 제목 (국내 타겟 이탈)';
    else if (v.content_types.includes('외모/뷰티')) failReason = '뷰티/패션 반복 소재';
    else if (v.upload_date && v.upload_date >= '2026-03') failReason = '최근 업로드 (성장 중)';
    
    return `
    <tr>
      <td><span class="rank-badge bot">${v.rank}</span></td>
      <td class="video-title-cell">
        <a href="${v.url}" target="_blank" class="video-title-link" title="${v.title}">${v.title}</a>
      </td>
      <td>
        <div class="view-bar">
          <div class="view-bar-fill" style="width: ${getViewBarWidth(v.view_count, maxViews)}px; background: rgba(255,68,68,0.7);"></div>
          <span class="view-count-text" style="color: #FF8888;">${formatViews(v.view_count)}</span>
        </div>
      </td>
      <td class="date-text">${v.upload_date || '-'}</td>
      <td><span class="duration-badge">${formatDuration(v.duration_seconds)}</span></td>
      <td><span class="tag tag-red" style="font-size:11px;">${failReason}</span></td>
    </tr>
  `}).join('');
}

// ============================================================
// COMPARISON
// ============================================================

function initComparison(data) {
  const s = data.summary;
  const patterns = data.title_patterns;
  
  // Metric comparison bars
  const metrics = [
    { label: '평균 조회수', top: s.top30_avg, bot: s.bot30_avg, max: s.top30_avg, format: formatViews },
    { label: '인물 이름 포함', top: patterns.person_name.top30/30*100, bot: patterns.person_name.bot30/30*100, max: 100, format: v => v.toFixed(0)+'%' },
    { label: '부정적 훅', top: patterns.negative_hook.top30/30*100, bot: patterns.negative_hook.bot30/30*100, max: 100, format: v => v.toFixed(0)+'%' },
    { label: '기획사명 포함', top: patterns.company_name.top30/30*100, bot: patterns.company_name.bot30/30*100, max: 100, format: v => v.toFixed(0)+'%' },
    { label: '아이돌 언급', top: patterns.idol_general.top30/30*100, bot: patterns.idol_general.bot30/30*100, max: 100, format: v => v.toFixed(0)+'%' },
    { label: '영어 제목', top: patterns.english_title.top30/30*100, bot: patterns.english_title.bot30/30*100, max: 100, format: v => v.toFixed(0)+'%' },
  ];

  const container = document.getElementById('metric-compare-container');
  container.innerHTML = metrics.map(m => `
    <div class="metric-compare">
      <div class="metric-label">${m.label}</div>
      <div class="metric-bars">
        <div class="metric-bar-row">
          <span class="metric-bar-label" style="color: #00C851;">상위30</span>
          <div class="metric-bar-track">
            <div class="metric-bar-fill" style="width: ${m.top/m.max*100}%; background: linear-gradient(90deg, #00C851, #00A040);"></div>
          </div>
          <span class="metric-value" style="color: #00C851;">${m.format(m.top)}</span>
        </div>
        <div class="metric-bar-row">
          <span class="metric-bar-label" style="color: #FF4444;">하위30</span>
          <div class="metric-bar-track">
            <div class="metric-bar-fill" style="width: ${m.bot/m.max*100}%; background: linear-gradient(90deg, #FF4444, #CC2222);"></div>
          </div>
          <span class="metric-value" style="color: #FF4444;">${m.format(m.bot)}</span>
        </div>
      </div>
    </div>
  `).join('');

  // Pattern comparison chart
  const patternLabels = ['따옴표', '인물이름', '부정적훅', '영어제목', '기획사명', '아이돌언급'];
  const topValues = [
    patterns.quote_marks.top30/30*100,
    patterns.person_name.top30/30*100,
    patterns.negative_hook.top30/30*100,
    patterns.english_title.top30/30*100,
    patterns.company_name.top30/30*100,
    patterns.idol_general.top30/30*100,
  ];
  const botValues = [
    patterns.quote_marks.bot30/30*100,
    patterns.person_name.bot30/30*100,
    patterns.negative_hook.bot30/30*100,
    patterns.english_title.bot30/30*100,
    patterns.company_name.bot30/30*100,
    patterns.idol_general.bot30/30*100,
  ];

  new Chart(document.getElementById('patternCompareChart'), {
    type: 'bar',
    data: {
      labels: patternLabels,
      datasets: [
        {
          label: '상위 30 (%)',
          data: topValues,
          backgroundColor: 'rgba(0,200,81,0.7)',
          borderRadius: 4,
        },
        {
          label: '하위 30 (%)',
          data: botValues,
          backgroundColor: 'rgba(255,68,68,0.7)',
          borderRadius: 4,
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#9090A8' } } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#F0F0F5' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9090A8', callback: v => v + '%' }, max: 60 }
      }
    }
  });

  // Comparison table
  const compData = [
    ['제목 언어', '100% 한국어', '37% 영어 (11개)'],
    ['특정 인물 언급', '50% (15개)', '17% (5개)'],
    ['부정적 훅 사용', '33% (10개)', '0% (0개)'],
    ['기획사명 포함', '20% (6개)', '10% (3개)'],
    ['평균 조회수', formatViews(s.top30_avg), formatViews(s.bot30_avg)],
    ['평균 영상 길이', '31.5초', '33.1초'],
    ['주요 업로드 시기', '2025년 (93%)', '2026년 (47%)'],
    ['주요 콘텐츠 유형', '특정인물 + 업계/기획사', '기타 + 아이돌 일반'],
    ['감정 자극 요소', '충격/반전/비밀/논란', '대부분 없음'],
    ['소재 구체성', '매우 구체적 (인물/사건)', '추상적/일반적'],
  ];

  const tbody = document.getElementById('comp-tbody');
  tbody.innerHTML = compData.map(row => `
    <tr>
      <td class="factor-col">${row[0]}</td>
      <td class="top-col">${row[1]}</td>
      <td class="bot-col">${row[2]}</td>
    </tr>
  `).join('');

  // Hypothesis cards
  const hypotheses = [
    {
      title: '가설 1: 특정 인물의 이름이 클릭률을 결정한다',
      desc: '상위 30개의 50%가 특정 아이돌 이름을 제목에 포함. "아이돌이 ~하면"보다 "카리나가 ~한 이유"가 훨씬 높은 클릭률을 유도. 팬덤이 있는 1군 아이돌 이름은 그 자체로 클릭 유발 요소.'
    },
    {
      title: '가설 2: 부정적 훅이 호기심을 3배 이상 자극한다',
      desc: '상위 30개의 33%가 "안 된다", "사라진", "충격적인", "삭제된" 등 부정적 키워드 포함. 하위 30개는 0%. 긍정적 소개보다 "문제/위기/반전" 프레임이 조회수에 직접 영향.'
    },
    {
      title: '가설 3: 영어 제목은 한국 타겟 채널에서 치명적이다',
      desc: '영어 제목 42개의 평균 조회수는 100,395회로 한국어 제목(608,228회)의 16.5% 수준. 하위 30개의 37%가 영어 제목. 국내 아이돌 팬 타겟 채널에서 영어 제목은 명백한 실패 요인.'
    },
    {
      title: '가설 4: 기획사/업계 내부 이야기가 가장 강한 소재다',
      desc: 'SM, JYP, HYBE 등 기획사 관련 소재는 상위 30개에서 20% 비중. 팬들이 접근하기 어려운 "업계 내부 정보"를 다루는 것이 높은 조회수와 직결. 단순 무대 영상보다 "왜 그랬나"를 설명하는 콘텐츠가 강함.'
    },
    {
      title: '가설 5: 2026년 이후 영상의 조회수가 낮은 이유',
      desc: '2026년 3~4월 영상의 평균 조회수는 72,074~98,233회로 채널 평균의 13~17% 수준. 이는 최근 업로드라 아직 조회수가 쌓이는 중일 수 있으나, 영어 제목 비율 증가와 소재 구체성 저하도 동시에 관찰됨.'
    },
    {
      title: '가설 6: 길이보다 소재와 제목이 조회수를 결정한다',
      desc: '상위 30(31.5초)과 하위 30(33.1초)의 평균 길이 차이는 1.6초에 불과. 영상 길이는 조회수에 거의 영향을 주지 않음. 소재의 흥미도와 제목의 훅이 결정적 요인.'
    },
  ];

  const grid = document.getElementById('hypothesis-grid');
  grid.innerHTML = hypotheses.map(h => `
    <div class="hypothesis-card">
      <h4>${h.title}</h4>
      <p>${h.desc}</p>
    </div>
  `).join('');
}

// ============================================================
// TRANSFORM SECTION
// ============================================================

function initTransform(data) {
  // Calculate average views by content type
  const typeViews = {};
  data.videos.forEach(v => {
    v.content_types.forEach(t => {
      if (!typeViews[t]) typeViews[t] = { total: 0, count: 0 };
      typeViews[t].total += v.view_count;
      typeViews[t].count += 1;
    });
  });
  
  const typeAvg = Object.entries(typeViews)
    .map(([t, v]) => ({ type: t, avg: Math.round(v.total / v.count) }))
    .sort((a, b) => b.avg - a.avg);

  new Chart(document.getElementById('typeViewChart'), {
    type: 'bar',
    data: {
      labels: typeAvg.map(t => t.type),
      datasets: [{
        data: typeAvg.map(t => Math.round(t.avg/10000)),
        backgroundColor: [
          'rgba(255,0,80,0.8)', 'rgba(255,107,0,0.8)', 'rgba(255,215,0,0.8)',
          'rgba(0,212,255,0.8)', 'rgba(0,200,81,0.8)', 'rgba(144,144,168,0.8)',
          'rgba(255,0,80,0.4)', 'rgba(255,107,0,0.4)', 'rgba(255,215,0,0.4)',
        ],
        borderRadius: 6,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9090A8', callback: v => v + '만' } },
        y: { grid: { display: false }, ticks: { color: '#F0F0F5', font: { size: 11 } } }
      }
    }
  });

  // Transform formulas
  const formulas = [
    { icon: '⚡', name: '이슈 직후형', desc: '이슈 발생 직후 즉시 업로드. 시의성 최고지만 유효기간 짧음', color: '#FF4444' },
    { icon: '💬', name: '반응 정리형', desc: '이슈에 대한 팬/여론 반응을 정리·분석. 이슈 후 1~3일 유효', color: '#FF6B00' },
    { icon: '🔍', name: '여론 분석형', desc: '"왜 이 반응이 나왔나"를 구조적으로 설명. 이슈 후 1주일 유효', color: '#FFD700' },
    { icon: '🏭', name: '산업 영향형', desc: '이슈가 업계/기획사에 미친 영향 분석. 이슈 후 2주 유효', color: '#00D4FF' },
    { icon: '📸', name: '사진/행동 재해석형', desc: '이슈 관련 사진·행동을 새로운 각도로 재해석. 상시 활용 가능', color: '#00C851' },
  ];

  const formulasContainer = document.getElementById('transform-formulas');
  formulasContainer.innerHTML = formulas.map(f => `
    <div style="display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(42,42,62,0.5);">
      <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">${f.icon}</div>
      <div>
        <div style="font-size: 13px; font-weight: 600; color: ${f.color}; margin-bottom: 3px;">${f.name}</div>
        <div style="font-size: 12px; color: #9090A8; line-height: 1.5;">${f.desc}</div>
      </div>
    </div>
  `).join('');

  // Transform examples
  const examples = [
    {
      topic: '카리나 열애설/논란',
      before: '카리나 열애설 (이슈 직후형)',
      afters: [
        { type: '반응 정리형', title: '카리나 열애 인정 후 올라온 팬 반응들', why: '팬들의 실제 반응을 정리하면 이슈 후에도 소비됨' },
        { type: '여론 분석형', title: '유독 여자 아이돌 연애가 더 욕먹는 이유', why: '구조적 분석으로 이슈와 무관하게 상시 소비 가능' },
        { type: '산업 영향형', title: '카리나 열애설로 인한 SM 주가 변동', why: '업계 영향 분석은 이슈 후 2~3주도 유효' },
        { type: '사진 재해석형', title: 'GD가 카리나 논란 잠재운 방법', why: '실제 채널에서 324만 조회수 기록한 성공 사례' },
      ]
    },
    {
      topic: '아이돌 워터밤 이슈',
      before: '워터밤 무대 직캠 (이슈 직후형)',
      afters: [
        { type: '산업 영향형', title: '워터밤으로 떡상한 여돌이 사라진 이유', why: '실제 채널에서 397만 조회수 기록. 결과 추적형은 강함' },
        { type: '여론 분석형', title: '워터밤이 여돌 이미지에 미치는 영향', why: '구조적 분석으로 상시 소비 가능' },
        { type: '비교형', title: '워터밤 전후 팔로워 변화 비교', why: '수치 비교는 시의성과 무관하게 소비됨' },
      ]
    },
    {
      topic: '아이돌 광고 이슈',
      before: '아이돌 광고 영상 소개 (단순 리뷰형)',
      afters: [
        { type: '폭로/비밀형', title: '사실 가짜였던 장원영 광고의 비밀', why: '실제 채널에서 451만 조회수. 비밀 폭로 프레임이 핵심' },
        { type: '폭로/비밀형', title: '전부 가짜였던 아이돌 광고 소품들', why: '실제 채널에서 525만 조회수. "가짜"라는 반전 요소가 강함' },
        { type: '산업 영향형', title: '아이돌이 먹는 광고 음식의 진실', why: '실제 채널에서 488만 조회수. 업계 내부 정보 프레임' },
      ]
    },
  ];

  const examplesContainer = document.getElementById('transform-examples');
  examplesContainer.innerHTML = examples.map(ex => `
    <div class="transform-card">
      <div style="font-size: 15px; font-weight: 700; margin-bottom: 12px; color: var(--text);">📌 ${ex.topic}</div>
      <div class="transform-before">❌ 기존 접근: ${ex.before}</div>
      <div style="margin: 12px 0;">
        ${ex.afters.map(a => `
          <div style="display: flex; align-items: flex-start; gap: 12px; padding: 10px; background: rgba(0,200,81,0.05); border: 1px solid rgba(0,200,81,0.15); border-radius: 8px; margin-bottom: 8px;">
            <span class="tag tag-green" style="flex-shrink: 0; margin-top: 1px;">${a.type}</span>
            <div>
              <div style="font-size: 13px; font-weight: 600; color: var(--success); margin-bottom: 4px;">✅ ${a.title}</div>
              <div style="font-size: 12px; color: #9090A8;">${a.why}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// ============================================================
// STRATEGY SECTION
// ============================================================

function initStrategy(data) {
  // Focus areas
  const focusItems = [
    { icon: '👤', title: '1군 아이돌 이름 직접 언급', desc: '카리나, 로제, 장원영, 뉴진스, 에스파 등 팬덤이 큰 아이돌 이름을 제목에 직접 포함. 이름 자체가 클릭 유발 요소.' },
    { icon: '🏢', title: 'SM/JYP/HYBE 내부 이야기', desc: '기획사 내부 정책, 연습생 관리, 아이돌 계약 등 팬들이 접근하기 어려운 "업계 내부 정보" 소재. 평균 조회수 최상위.' },
    { icon: '🔍', title: '비밀/진실 폭로 프레임', desc: '"사실 가짜였던", "숨겨진", "진짜 이유" 등의 폭로 프레임. 단순 소개보다 "반전"을 제시하는 구조가 클릭률 3배 이상.' },
    { icon: '😱', title: '부정적 훅 + 감정 자극', desc: '"충격적인", "사라진", "안 된다", "힘들어진" 등 부정적 키워드로 시작. 긍정보다 위기/문제 프레임이 조회수에 직결.' },
    { icon: '⚡', title: '이슈 발생 직후 업로드', desc: '2025년 3월 채널 평균 100만 조회수. 이슈 발생 후 24시간 내 업로드가 핵심. 늦으면 2차 해석형으로 전환.' },
    { icon: '🎭', title: '인물 간 관계/비교 소재', desc: '"카리나vs윈터", "에스파 때문에 힘들어진 연습생" 등 인물 간 관계나 대비를 다루는 소재. 팬덤 내 갈등/비교 심리 자극.' },
  ];

  document.getElementById('focus-grid').innerHTML = focusItems.map(item => `
    <div class="strategy-card">
      <div class="strategy-card-icon">${item.icon}</div>
      <h4>${item.title}</h4>
      <p>${item.desc}</p>
    </div>
  `).join('');

  // Avoid areas
  const avoidItems = [
    { icon: '🚫', title: '영어 제목 사용 금지', desc: '영어 제목 영상의 평균 조회수는 한국어의 16.5% 수준. 하위 30개의 37%가 영어 제목. 국내 아이돌 팬 채널에서 영어 제목은 명백한 실패 요인.' },
    { icon: '❌', title: '추상적인 뷰티/패션 소재', desc: '"추구미", "메이크업 팁" 등 일반적인 뷰티 소재는 차별성이 없어 낮은 조회수. 뷰티 소재를 다룰 경우 반드시 특정 인물과 연결.' },
    { icon: '⚠️', title: '모호한 "이것/그것" 지칭', desc: '"아이돌이 하는 이것", "탑 아이돌이 무조건 하는 이것" 등 모호한 지칭은 클릭 유발 실패. 제목에서 소재를 직접 드러내거나 강한 반전을 제시해야 함.' },
    { icon: '🔇', title: '시의성 지난 소재 그대로 사용', desc: '이슈 직후형 소재를 2주 이상 지나서 업로드하면 효과 없음. 반드시 2차 해석형(여론 분석, 산업 영향, 반응 정리)으로 변환하여 업로드.' },
  ];

  document.getElementById('avoid-grid').innerHTML = avoidItems.map(item => `
    <div class="strategy-card" style="border-top: 3px solid var(--danger);">
      <div class="strategy-card-icon">${item.icon}</div>
      <h4>${item.title}</h4>
      <p>${item.desc}</p>
    </div>
  `).join('');

  // Timing content
  document.getElementById('timing-content').innerHTML = `
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">📅 업로드 타이밍 전략</div>
        <div style="padding: 8px 0;">
          ${[
            { time: '이슈 발생 후 0~6시간', action: '이슈 직후형 업로드', priority: '최우선', color: '#FF0050' },
            { time: '이슈 발생 후 6~24시간', action: '반응 정리형 업로드', priority: '우선', color: '#FF6B00' },
            { time: '이슈 발생 후 1~3일', action: '여론 분석형 업로드', priority: '권장', color: '#FFD700' },
            { time: '이슈 발생 후 1~2주', action: '산업 영향형 업로드', priority: '가능', color: '#00D4FF' },
            { time: '이슈 발생 후 2주+', action: '2차 해석형으로 변환 필수', priority: '변환', color: '#9090A8' },
          ].map(t => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(42,42,62,0.5);">
              <span class="tag" style="background: rgba(255,255,255,0.05); color: ${t.color}; flex-shrink: 0;">${t.priority}</span>
              <div>
                <div style="font-size: 13px; font-weight: 600; color: var(--text);">${t.time}</div>
                <div style="font-size: 12px; color: #9090A8; margin-top: 2px;">${t.action}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-title">📊 월별 성과 기반 인사이트</div>
        <div class="insight-box" style="margin-bottom: 12px;">2025년 3월이 채널 최고 성과 월 (평균 100만 조회수). 채널 초기 알고리즘 부스트 + 강한 소재 집중이 원인.</div>
        <div class="alert" style="margin-bottom: 12px;">2026년 2~4월 급격한 성과 하락. 영어 제목 증가 + 소재 구체성 저하가 동시에 발생.</div>
        <div class="danger-box">2025년 11~12월 두 번째 성과 피크 (평균 77만, 66만). 강한 소재(아이돌 무수면, SM 얼굴상)가 집중된 시기.</div>
      </div>
    </div>
  `;

  // Title templates
  document.getElementById('title-content').innerHTML = `
    <div class="insight-box">💡 상위 30개 영상 제목을 분석하여 도출한 고성과 제목 구조 템플릿입니다.</div>
    
    <div class="template-card">
      <div class="template-label">템플릿 1: 특정 인물 + 충격/반전</div>
      [유명 아이돌 이름]이/가 [충격적인/의외의] [행동/사건]
    </div>
    <div style="font-size: 12px; color: #9090A8; margin: -8px 0 16px 16px;">예시: "카리나가 충격적으로 대응한 협박 사건" / "로제가 도플갱어를 만난 반응"</div>
    
    <div class="template-card">
      <div class="template-label">템플릿 2: 기획사 + 내부 정보</div>
      [기획사명]이/가 [특정 아이돌/상황]에게 [숨겨진/의외의] 행동
    </div>
    <div style="font-size: 12px; color: #9090A8; margin: -8px 0 16px 16px;">예시: "SM이 포기해도 할 말 없는 아이돌" / "JYP가 설윤에게만 내린 특이한 금지사항"</div>
    
    <div class="template-card">
      <div class="template-label">템플릿 3: 일반인 vs 아이돌 비교 + 불가능</div>
      일반인이 [노력/돈]으로도 아이돌처럼 [안 되는/못 하는] [이유/영역]
    </div>
    <div style="font-size: 12px; color: #9090A8; margin: -8px 0 16px 16px;">예시: "일반인이 노력해도 아이돌처럼 안 되는 이유" / "아이돌이 노력으로 안 된다는 영역"</div>
    
    <div class="template-card">
      <div class="template-label">템플릿 4: 가짜/진실 폭로</div>
      사실 [가짜/거짓]였던 [유명 아이돌/기획사]의 [광고/이미지/행동]
    </div>
    <div style="font-size: 12px; color: #9090A8; margin: -8px 0 16px 16px;">예시: "사실 가짜였던 장원영 광고의 비밀" / "전부 가짜였던 아이돌 광고 소품들"</div>
    
    <div class="template-card">
      <div class="template-label">템플릿 5: 극한 상황 + 결과</div>
      아이돌이 [구체적 숫자/극한 상황]이면 [벌어지는/생기는] 일
    </div>
    <div style="font-size: 12px; color: #9090A8; margin: -8px 0 16px 16px;">예시: "아이돌이 72시간 무수면이면 생기는 일" / "아이돌이 먹는 광고 음식의 진실"</div>
  `;

  // Hook templates
  document.getElementById('hook-content').innerHTML = `
    <div class="insight-box">💡 첫 3초에 시청자를 붙잡는 훅 패턴. 상위 영상들의 공통 구조에서 도출.</div>
    
    <div class="strategy-grid">
      ${[
        { icon: '🔢', title: '구체적 숫자 훅', desc: '"72시간", "1시간 만에", "3천만 개" 등 구체적인 숫자로 시작. 추상적인 설명보다 숫자가 즉각적인 호기심 유발.', example: '"아이돌이 72시간 무수면이면..." → 7,274,614 조회수' },
        { icon: '🎭', title: '반전 선언 훅', desc: '"사실 가짜였던", "진짜 이유는", "모두가 몰랐던" 등 반전을 예고하는 첫 문장. 시청자가 끝까지 볼 이유 제공.', example: '"사실 가짜였던 장원영 광고..." → 4,517,267 조회수' },
        { icon: '😱', title: '충격 사실 선언 훅', desc: '"충격적인", "있지 못할", "역대급" 등 감정 자극 단어로 시작. 단 구체적인 사실과 함께 사용해야 효과적.', example: '"충격적인 카리나 협박 사건..." → 2,603,991 조회수' },
        { icon: '🔍', title: '비교/대비 훅', desc: '과거vs현재, A그룹vs B그룹 등 시각적 대비를 첫 화면에 제시. 비교 자체가 클릭 유발 요소.', example: '"4대 기획사 과거vs현재 건물 비교" → 2,452,117 조회수' },
        { icon: '👤', title: '인물 이름 직접 훅', desc: '첫 화면에 유명 아이돌 이름을 크게 표시. 팬덤이 있는 인물의 이름은 그 자체로 3초 이내 시청 결정 유발.', example: '"도플갱어를 만난 로제 반응" → 5,905,171 조회수' },
        { icon: '❓', title: '의문 제기 훅', desc: '"왜 ~했을까?", "~의 진짜 이유는?" 등 답을 궁금하게 만드는 질문 형식. 끝까지 보게 만드는 구조.', example: '"워터밤으로 떡상한 여돌이 사라진 이유" → 3,971,157 조회수' },
      ].map(h => `
        <div class="strategy-card">
          <div class="strategy-card-icon">${h.icon}</div>
          <h4>${h.title}</h4>
          <p>${h.desc}</p>
          <div style="margin-top: 10px; padding: 8px 10px; background: rgba(255,215,0,0.05); border: 1px solid rgba(255,215,0,0.15); border-radius: 6px; font-size: 11px; color: #FFD700;">${h.example}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ============================================================
// IDEAS SECTION
// ============================================================

const ideasData = [
  { title: 'SM이 에스파 다음으로 밀고 있는 아이돌', types: ['업계/기획사', '특정인물'], priority: '최우선' },
  { title: 'JYP가 ITZY에게만 허락한 특이한 행동', types: ['업계/기획사', '특정인물'], priority: '최우선' },
  { title: '뉴진스 해체 이후 HYBE가 바꾼 것들', types: ['업계/기획사', '논란/스캔들'], priority: '최우선' },
  { title: '사실 가짜였던 블랙핑크 공연 소품들', types: ['폭로/비밀', '특정인물'], priority: '최우선' },
  { title: '아이유가 절대 하지 않는 광고 유형', types: ['특정인물', '폭로/비밀'], priority: '최우선' },
  { title: '로제가 솔로 이후 달라진 SM 내부 분위기', types: ['업계/기획사', '특정인물'], priority: '최우선' },
  { title: '일반인이 아이돌 연습생 오디션 보면 생기는 일', types: ['아이돌행동', '비교'], priority: '우선' },
  { title: '에스파 닝닝이 중국 활동 안 하는 진짜 이유', types: ['특정인물', '폭로/비밀'], priority: '최우선' },
  { title: '음악방송 PD들이 가장 선호하는 아이돌 유형', types: ['업계/기획사', '아이돌행동'], priority: '우선' },
  { title: '카리나가 광고 찍을 때 절대 안 하는 행동', types: ['특정인물', '폭로/비밀'], priority: '최우선' },
  { title: 'HYBE가 르세라핌에게만 내린 특이한 제약', types: ['업계/기획사', '특정인물'], priority: '최우선' },
  { title: '아이돌이 100시간 연속 스케줄이면 생기는 일', types: ['아이돌행동'], priority: '우선' },
  { title: '전부 가짜였던 아이돌 뮤직비디오 배경들', types: ['폭로/비밀'], priority: '우선' },
  { title: '장원영이 광고 계약 거절한 실제 이유', types: ['특정인물', '폭로/비밀'], priority: '최우선' },
  { title: 'SM 연습생이 에스파 보고 그만두는 이유', types: ['업계/기획사', '특정인물', '논란/스캔들'], priority: '최우선' },
  { title: '아이돌 성형 전후 비교를 금지하는 기획사들', types: ['업계/기획사', '비교'], priority: '우선' },
  { title: '종현 목소리를 들은 SHINee 멤버들의 최근 근황', types: ['특정인물', '아이돌행동'], priority: '우선' },
  { title: '이사배가 가장 힘들었다는 아이돌 메이크업', types: ['특정인물', '외모/뷰티'], priority: '우선' },
  { title: '뉴진스가 민희진 없이 활동하면 달라지는 것들', types: ['특정인물', '업계/기획사', '논란/스캔들'], priority: '최우선' },
  { title: 'YG가 블랙핑크 이후 여자 아이돌 못 내는 이유', types: ['업계/기획사', '폭로/비밀'], priority: '최우선' },
  { title: '아이돌이 팬사인회에서 절대 말 못 하는 것들', types: ['아이돌행동', '폭로/비밀'], priority: '우선' },
  { title: '성형으로 절대 만들 수 없는 2025년 여돌 얼굴', types: ['외모/뷰티', '비교'], priority: '우선' },
  { title: '워터밤 이후 활동이 줄어든 여자 아이돌들', types: ['특정인물', '논란/스캔들'], priority: '우선' },
  { title: 'SM이 카리나 다음으로 밀고 있는 에스파 멤버', types: ['업계/기획사', '특정인물'], priority: '최우선' },
  { title: '아이돌이 방송 중 절대 먹지 않는 음식들', types: ['아이돌행동', '폭로/비밀'], priority: '우선' },
  { title: '충격적인 JYP 연습생 탈락 기준', types: ['업계/기획사', '폭로/비밀'], priority: '최우선' },
  { title: '르세라핌이 엠넷과 사이 나빠진 진짜 이유', types: ['특정인물', '업계/기획사', '논란/스캔들'], priority: '최우선' },
  { title: '일반인이 아이돌 다이어트 그대로 따라하면 생기는 일', types: ['아이돌행동', '비교'], priority: '우선' },
  { title: '고연차 아이돌만 할 수 있는 방송 행동들', types: ['아이돌행동'], priority: '우선' },
  { title: '4대 기획사가 연습생에게 공통으로 금지하는 것', types: ['업계/기획사', '폭로/비밀'], priority: '최우선' },
];

let currentIdeaFilter = 'all';

function initIdeas() {
  renderIdeas(ideasData);
}

function filterIdeas(type) {
  currentIdeaFilter = type;
  document.querySelectorAll('#idea-filters .filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === (type === 'all' ? '전체' : type));
  });
  
  const filtered = type === 'all' ? ideasData : ideasData.filter(idea => idea.types.includes(type) || (type === '아이돌행동' && idea.types.some(t => t.includes('아이돌행동'))));
  renderIdeas(filtered);
}

function renderIdeas(ideas) {
  const grid = document.getElementById('ideas-grid');
  grid.innerHTML = ideas.map((idea, i) => `
    <div class="idea-card">
      <div class="idea-number">#${(ideasData.indexOf(idea) + 1).toString().padStart(2, '0')} · ${idea.priority === '최우선' ? '🔥 최우선' : '⭐ 우선'}</div>
      <div class="idea-title">${idea.title}</div>
      <div class="idea-meta">
        ${idea.types.map(t => `<span class="tag tag-blue">${t}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

// ============================================================
// ALL TABLE
// ============================================================

function initAllTable(data) {
  renderAllTable();
}

function renderAllTable() {
  if (!allData) return;
  
  let filtered = allVideos;
  
  // Apply tier filter
  if (allFilterTier !== 'all') {
    filtered = filtered.filter(v => v.tier === allFilterTier);
  }
  
  // Apply search
  if (allSearchQuery) {
    filtered = filtered.filter(v => v.title.toLowerCase().includes(allSearchQuery));
  }
  
  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (allSortKey === 'view_count') return (b.view_count - a.view_count) * allSortDir;
    if (allSortKey === 'rank') return (a.rank - b.rank) * allSortDir;
    if (allSortKey === 'duration_seconds') return ((a.duration_seconds || 0) - (b.duration_seconds || 0)) * allSortDir;
    if (allSortKey === 'upload_date') return ((a.upload_date || '') < (b.upload_date || '') ? -1 : 1) * allSortDir;
    return 0;
  });
  
  // Paginate
  const totalPages = Math.ceil(filtered.length / ALL_PAGE_SIZE);
  allCurrentPage = Math.min(allCurrentPage, Math.max(1, totalPages));
  const start = (allCurrentPage - 1) * ALL_PAGE_SIZE;
  const pageData = filtered.slice(start, start + ALL_PAGE_SIZE);
  
  const tbody = document.getElementById('all-tbody');
  const maxViews = Math.max(...allVideos.map(v => v.view_count));
  
  tbody.innerHTML = pageData.map(v => `
    <tr>
      <td>${getTierBadge(v.tier)} <span style="font-size: 12px; color: #9090A8;">${v.rank}</span></td>
      <td class="video-title-cell">
        <a href="${v.url}" target="_blank" class="video-title-link" title="${v.title}">${v.title}</a>
      </td>
      <td>
        <div class="view-bar">
          <div class="view-bar-fill" style="width: ${getViewBarWidth(v.view_count, maxViews)}px"></div>
          <span class="view-count-text">${formatViews(v.view_count)}</span>
        </div>
      </td>
      <td class="date-text">${v.upload_date || '-'}</td>
      <td><span class="duration-badge">${formatDuration(v.duration_seconds)}</span></td>
      <td>${getContentTypeTags(v.content_types)}</td>
      <td><span class="tag ${v.is_english ? 'tag-red' : 'tag-green'}">${v.is_english ? 'EN' : 'KR'}</span></td>
    </tr>
  `).join('');
  
  // Pagination
  const pagination = document.getElementById('all-pagination');
  if (totalPages <= 1) {
    pagination.innerHTML = `<span class="page-info">총 ${filtered.length}개</span>`;
    return;
  }
  
  let pages = [];
  pages.push(`<button class="page-btn" onclick="goToPage(${allCurrentPage-1})" ${allCurrentPage === 1 ? 'disabled' : ''}>‹</button>`);
  
  for (let p = Math.max(1, allCurrentPage-2); p <= Math.min(totalPages, allCurrentPage+2); p++) {
    pages.push(`<button class="page-btn ${p === allCurrentPage ? 'active' : ''}" onclick="goToPage(${p})">${p}</button>`);
  }
  
  pages.push(`<button class="page-btn" onclick="goToPage(${allCurrentPage+1})" ${allCurrentPage === totalPages ? 'disabled' : ''}>›</button>`);
  pages.push(`<span class="page-info">${filtered.length}개 중 ${start+1}-${Math.min(start+ALL_PAGE_SIZE, filtered.length)}</span>`);
  
  pagination.innerHTML = pages.join('');
}

function goToPage(page) {
  allCurrentPage = page;
  renderAllTable();
}

function filterAllTable(query) {
  allSearchQuery = query.toLowerCase();
  allFilterTier = document.getElementById('all-filter').value;
  allCurrentPage = 1;
  renderAllTable();
}

function sortAllTable(key) {
  if (allSortKey === key) {
    allSortDir *= -1;
  } else {
    allSortKey = key;
    allSortDir = 1;
  }
  renderAllTable();
}

// ============================================================
// TAB SWITCHING
// ============================================================

function switchTab(section, tab) {
  const tabs = document.querySelectorAll(`#${section}-${tab}`).length > 0 
    ? document.querySelectorAll(`[id^="${section}-"]`)
    : document.querySelectorAll(`[id^="strategy-"]`);
  
  document.querySelectorAll(`[id^="strategy-"]`).forEach(el => el.classList.remove('active'));
  document.getElementById(`strategy-${tab}`).classList.add('active');
  
  const btns = document.querySelectorAll('.tab-btn');
  btns.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

// ============================================================
// NAVIGATION ACTIVE STATE
// ============================================================

window.addEventListener('scroll', () => {
  const sections = ['dashboard', 'top-analysis', 'bottom-analysis', 'comparison', 'transform', 'strategy', 'ideas', 'data-table'];
  const navLinks = document.querySelectorAll('.nav-links a');
  
  let current = '';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= 100) {
      current = id;
    }
  });
  
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
});
