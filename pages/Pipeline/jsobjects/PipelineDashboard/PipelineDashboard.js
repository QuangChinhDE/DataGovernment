export default {
  getTotalRuns: function () {
    // 1) Lấy dữ liệu từ query Google Sheets
    const res  = fetchPipelines.data ?? [];
    const rows = Array.isArray(res) ? res : (res?.data || []);

    // 2) Lấy filter từ UI
    const startStr = dp_start.selectedDate || null;  // chỉ dùng selectedDate
    const endStr   = dp_end.selectedDate   || null;
    const selected = ms_pipeline.selectedOptionValues || []; // mảng tên pipeline

    // 3) Parse ngày (UTC) → tạo khoảng thời gian [from, to]
    const parse = (s) => {
      if (!s) return null;
      let m = moment.utc(s, moment.ISO_8601, true);
      if (!m.isValid()) {
        m = moment.utc(s, ["YYYY-MM-DD","DD-MM-YYYY","DD/MM/YYYY","MM-DD-YYYY","MM/DD/YYYY"], true);
      }
      if (!m.isValid()) m = moment.utc(new Date(s));
      return m.isValid() ? m : null;
    };

    const from = (parse(startStr) || moment.utc("1970-01-01")).startOf("day");
    const to   = (parse(endStr)   || moment.utc("2999-12-31")).endOf("day");

    // 4) Lọc & đếm
    let count = 0;
    for (const r of rows) {
      const name = (r.name || "").trim();
      const created = moment.utc(String(r.created));
      if (!created.isValid()) continue;
      if (!created.isBetween(from, to, null, "[]")) continue;
      if (selected.length && !selected.includes(name)) continue;
      count++;
    }
    return count; // number
  },
	
  getSuccessRate: function () {
    const res  = fetchPipelines.data ?? [];
    const rows = Array.isArray(res) ? res : (res?.data || []);

    // Lấy filter
    const startStr = dp_start.selectedDate || null;
    const endStr   = dp_end.selectedDate   || null;
    const selected = ms_pipeline.selectedOptionValues || [];

    // Parse ngày
    const parse = (s) => {
      if (!s) return null;
      let m = moment.utc(s, moment.ISO_8601, true);
      if (!m.isValid()) {
        m = moment.utc(s, ["YYYY-MM-DD","DD-MM-YYYY","DD/MM/YYYY","MM-DD-YYYY","MM/DD/YYYY"], true);
      }
      if (!m.isValid()) m = moment.utc(new Date(s));
      return m.isValid() ? m : null;
    };
    const from = (parse(startStr) || moment.utc("1970-01-01")).startOf("day");
    const to   = (parse(endStr)   || moment.utc("2999-12-31")).endOf("day");

    // Lọc dữ liệu
    let total = 0;
    let done  = 0;
    for (const r of rows) {
      const name = (r.name || "").trim();
      const status = (r.status || "").trim();
      const created = moment.utc(String(r.created));
      if (!created.isValid()) continue;
      if (!created.isBetween(from, to, null, "[]")) continue;
      if (selected.length && !selected.includes(name)) continue;

      total++;
      if (status === "Done") done++;
    }

    if (!total) return 0; // tránh chia 0
    return +((done / total) * 100).toFixed(1); // % với 1 chữ số thập phân
  },
	
	getFailedRuns: function () {
		// 1) Data từ query
		const res  = fetchPipelines.data ?? [];
		const rows = Array.isArray(res) ? res : (res?.data || []);

		// 2) Lấy filter
		const startStr = dp_start.selectedDate || null;
		const endStr   = dp_end.selectedDate   || null;
		const selected = ms_pipeline.selectedOptionValues || [];

		// 3) Parse ngày (UTC)
		const parse = (s) => {
			if (!s) return null;
			let m = moment.utc(s, moment.ISO_8601, true);
			if (!m.isValid()) {
				m = moment.utc(s, ["YYYY-MM-DD","DD-MM-YYYY","DD/MM/YYYY","MM-DD-YYYY","MM/DD/YYYY"], true);
			}
			if (!m.isValid()) m = moment.utc(new Date(s));
			return m.isValid() ? m : null;
		};
		const from = (parse(startStr) || moment.utc("1970-01-01")).startOf("day");
		const to   = (parse(endStr)   || moment.utc("2999-12-31")).endOf("day");

		// 4) Lọc & đếm
		let failed = 0;
		for (const r of rows) {
			const name = (r.name || "").trim();
			const status = (r.status || "").trim();
			const created = moment.utc(String(r.created));
			if (!created.isValid()) continue;
			if (!created.isBetween(from, to, null, "[]")) continue;
			if (selected.length && !selected.includes(name)) continue;
			if (status === "Failed") failed++;
		}
		return failed; // number
	},
	
	getAvgDurationMin: function () {
		// 1) Data
		const res  = fetchPipelines.data ?? [];
		const rows = Array.isArray(res) ? res : (res?.data || []);

		// 2) Filters
		const startStr = dp_start.selectedDate || null;
		const endStr   = dp_end.selectedDate   || null;
		const selected = ms_pipeline.selectedOptionValues || [];

		// 3) Parse date (UTC)
		const parse = (s) => {
			if (!s) return null;
			let m = moment.utc(s, moment.ISO_8601, true);
			if (!m.isValid()) {
				m = moment.utc(s, ["YYYY-MM-DD","DD-MM-YYYY","DD/MM/YYYY","MM-DD-YYYY","MM/DD/YYYY"], true);
			}
			if (!m.isValid()) m = moment.utc(new Date(s));
			return m.isValid() ? m : null;
		};
		const from = (parse(startStr) || moment.utc("1970-01-01")).startOf("day");
		const to   = (parse(endStr)   || moment.utc("2999-12-31")).endOf("day");

		// 4) Lọc & tính trung bình phút
		let sum = 0, cnt = 0;
		for (const r of rows) {
			const name = (r.name || "").trim();
			const created = moment.utc(String(r.created));
			const updated = r.updated ? moment.utc(String(r.updated)) : null;

			if (!created.isValid() || !updated?.isValid()) continue;      // cần đủ 2 mốc
			if (!created.isBetween(from, to, null, "[]")) continue;       // theo range
			if (selected.length && !selected.includes(name)) continue;    // theo pipeline

			sum += updated.diff(created, "minutes");  // phút
			cnt += 1;
		}

		if (!cnt) return 0;                     // tránh chia 0
		return +((sum / cnt).toFixed(1));       // số phút, 1 chữ số thập phân
	},
	
	getStatusTrendECharts: function () {
		const rows = Array.isArray(fetchPipelines.data) ? fetchPipelines.data : (fetchPipelines?.data?.data || []);
		const startStr = dp_start.selectedDate || null;
		const endStr   = dp_end.selectedDate   || null;
		const selected = ms_pipeline.selectedOptionValues || [];

		// Parse ngày
		const parse = (s) => {
			if (!s) return null;
			let m = moment.utc(s, moment.ISO_8601, true);
			if (!m.isValid()) m = moment.utc(s, ["YYYY-MM-DD","DD-MM-YYYY","DD/MM/YYYY","MM-DD-YYYY","MM/DD/YYYY"], true);
			if (!m.isValid()) m = moment.utc(new Date(s));
			return m.isValid() ? m : null;
		};
		const from = (parse(startStr) || moment.utc("1970-01-01")).startOf("day");
		const to   = (parse(endStr)   || moment.utc("2999-12-31")).endOf("day");

		// Gom nhóm theo ngày
		const byDay = {};
		for (const r of rows) {
			const name = (r.name || "").trim();
			if (selected.length && !selected.includes(name)) continue;

			const created = moment.utc(String(r.created));
			if (!created.isValid()) continue;
			if (!created.isBetween(from, to, null, "[]")) continue;

			const day = created.format("YYYY-MM-DD");
			if (!byDay[day]) byDay[day] = { Done: 0, Failed: 0, Process: 0 };
			const st = (r.status || "").trim();
			if (st === "Done") byDay[day].Done += 1;
			else if (st === "Failed") byDay[day].Failed += 1;
			else byDay[day].Process += 1;
		}

		// Dataset cho ECharts
		const days = Object.keys(byDay).sort();
		const source = [
			["Day", "Done", "Failed", "Process"],
			...days.map(d => [d, byDay[d].Done, byDay[d].Failed, byDay[d].Process])
		];

		// Option
		return {
			dataset: { source },
			tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
			title: { text: "Pipeline Status Trend", left: "center" },
			legend: { top: 40, type: "scroll" },
			grid: { left: 15, right: 15, bottom: 30, top: 100, containLabel: true },
			xAxis: [{ type: "category" }],
			yAxis: [{ type: "value" }],
			series: [
				{ type: "bar", stack: "runs", itemStyle: { color: "#28a745" } }, // Done - xanh lá
				{ type: "bar", stack: "runs", itemStyle: { color: "#dc3545" } }, // Failed - đỏ
				{ type: "bar", stack: "runs", itemStyle: { color: "#ffc107" } }  // Process - vàng
			]
		};
	},
	
	getFailureHealthECharts: function () {
		const rows = Array.isArray(fetchPipelines.data)
			? fetchPipelines.data
			: (fetchPipelines?.data?.data || []);
		const startStr = dp_start.selectedDate || null;
		const endStr   = dp_end.selectedDate   || null;
		const selected = ms_pipeline.selectedOptionValues || [];

		// Parse ngày
		const parse = (s) => {
			if (!s) return null;
			let m = moment.utc(s, moment.ISO_8601, true);
			if (!m.isValid()) m = moment.utc(s, ["YYYY-MM-DD","DD-MM-YYYY","DD/MM/YYYY","MM-DD-YYYY","MM/DD/YYYY"], true);
			if (!m.isValid()) m = moment.utc(new Date(s));
			return m.isValid() ? m : null;
		};
		const from = (parse(startStr) || moment.utc("1970-01-01")).startOf("day");
		const to   = (parse(endStr)   || moment.utc("2999-12-31")).endOf("day");

		// Gom dữ liệu theo ngày
		const byDay = {};
		for (const r of rows) {
			const name = (r.name || "").trim();
			if (selected.length && !selected.includes(name)) continue;

			const created = moment.utc(String(r.created));
			if (!created.isValid()) continue;
			if (!created.isBetween(from, to, null, "[]")) continue;

			const d = created.format("YYYY-MM-DD");
			if (!byDay[d]) byDay[d] = { total: 0, failed: 0 };
			byDay[d].total += 1;
			if ((r.status || "").trim() === "Failed") byDay[d].failed += 1;
		}

		const days = Object.keys(byDay).sort();
		if (days.length === 0) {
			return {
				title: { text: "Failure Rate & Anomalies", left: "center" },
				xAxis: [{ type: "category", data: [] }],
				yAxis: [{ type: "value", axisLabel: { formatter: '{value}%' } }],
				series: []
			};
		}

		// Failure rate %
		const rate = days.map(d => (byDay[d].failed / byDay[d].total) * 100);

		// Rolling mean & UpperBound
		const W = 7;
		const rolling = [], upper = [];
		for (let i = 0; i < days.length; i++) {
			const start = Math.max(0, i - W + 1);
			const window = rate.slice(start, i + 1);
			const mean = window.reduce((a,b)=>a+b,0) / window.length;
			const variance = window.reduce((a,b)=> a + Math.pow(b - mean, 2), 0) / window.length;
			const std = Math.sqrt(variance);
			rolling.push(+mean.toFixed(1));
			upper.push(+(mean + 3*std).toFixed(1));
		}

		// anomalies
		const anomalies = days
			.map((d, i) => ({ day: d, val: +rate[i].toFixed(1), isAnom: rate[i] > upper[i] }))
			.filter(p => p.isAnom);

		// dataset
		const source = [
			["Day", "FailureRate", "RollingMean", "UpperBound"],
			...days.map((d, i) => [d, +rate[i].toFixed(1), rolling[i], upper[i]])
		];

		return {
			dataset: { source },
			title: { text: "Failure Rate & Anomalies", left: "center" },
			legend: { top: 40, type: "scroll" },
			grid: { left: 15, right: 15, bottom: 40, top: 100, containLabel: true },
			tooltip: { trigger: "axis" },
			xAxis: [{ type: "category" }],
			yAxis: [{ type: "value", axisLabel: { formatter: '{value}%' } }],
			series: [
				{
					type: "line", name: "FailureRate", smooth: true,
					itemStyle: { color: "#dc3545" },
					label: { show: true, position: "top", formatter: (p) => `${p.value[1]}%` }
				},
				{
					type: "line", name: "RollingMean (7d)", smooth: true,
					itemStyle: { color: "#28a745" },
					label: { show: true, position: "top", formatter: (p) => `${p.value[2]}%` }
				},
				{
					type: "line", name: "UpperBound", smooth: true,
					lineStyle: { type: "dashed" },
					itemStyle: { color: "#ffc107" },
					label: { show: true, position: "top", formatter: (p) => `${p.value[3]}%` }
				},
				{
					type: "scatter", name: "Anomaly",
					data: anomalies.map(a => [a.day, a.val]),
					itemStyle: { color: "#b30000" },
					symbolSize: 8,
					label: { show: true, position: "top", formatter: (p) => `${p.value[1]}%` }
				}
			]
		};
	},
	
	getConcurrencyByTimeOfDayECharts: function () {
  // ===== config =====
  const STEP_MIN = 15;                              // bucket 15 phút
  const STEP_MS  = STEP_MIN * 60 * 1000;
  const BUCKETS_PER_DAY = Math.ceil((24 * 60) / STEP_MIN);

  // ===== get data & filters =====
  const rows = Array.isArray(fetchPipelines.data)
    ? fetchPipelines.data
    : (fetchPipelines?.data?.data || []);

  const startStr = dp_start.selectedDate || null;
  const endStr   = dp_end.selectedDate   || null;

  const selected =
    (ms_pipeline.selectedOptionValues && ms_pipeline.selectedOptionValues.length
      ? ms_pipeline.selectedOptionValues
      : (ms_pipeline.selectedOptions || []).map(o => o.value)) || [];

  const parse = (s) => {
    if (!s) return null;
    let m = moment.utc(s, moment.ISO_8601, true);
    if (!m.isValid()) m = moment.utc(s, ["YYYY-MM-DD","DD-MM-YYYY","DD/MM/YYYY","MM-DD-YYYY","MM/DD/YYYY"], true);
    if (!m.isValid()) m = moment.utc(new Date(s));
    return m.isValid() ? m : null;
  };

  const from = (parse(startStr) || moment.utc("1970-01-01")).startOf("day");
  const to   = (parse(endStr)   || moment.utc("2999-12-31")).endOf("day");
  if (!from.isValid() || !to.isValid() || to.isBefore(from)) {
    return {
      title: { text: "Concurrency by Time of Day", left: "center" },
      xAxis: [{ type: "category", data: [] }],
      yAxis: [{ type: "value", minInterval: 1 }],
      series: []
    };
  }

  // ===== normalize spans & clip to [from, to] =====
  const spans = [];
  for (const r of rows) {
    const name = (r.name || "").trim();
    if (selected.length && !selected.includes(name)) continue;

    const s = moment.utc(String(r.created));
    const e0 = r.updated ? moment.utc(String(r.updated)) : null;
    const e = (e0 && e0.isValid()) ? e0 : s;         // nếu thiếu updated → coi bằng created

    if (!s.isValid() || !e.isValid()) continue;

    const start = moment.max(s, from);
    const end   = moment.min(e, to);
    if (end.isBefore(start)) continue;

    spans.push({ start, end });
  }

  if (!spans.length) {
    return {
      title: { text: "Concurrency by Time of Day", left: "center" },
      xAxis: [{ type: "category", data: [] }],
      yAxis: [{ type: "value", minInterval: 1 }],
      series: []
    };
  }

  // ===== iterate day by day, sweep-line per day, then aggregate by time-of-day bucket =====
  // Aggregates:
  const sumCounts = new Array(BUCKETS_PER_DAY).fill(0); // tổng concurrency để tính average
  const maxCounts = new Array(BUCKETS_PER_DAY).fill(0); // max concurrency trên các ngày
  const activeDays = new Array(BUCKETS_PER_DAY).fill(0); // số ngày mà bucket nằm trong [from,to]

  // helper: for each day window, compute concurrency buckets
  const dayStart = moment.utc(from).startOf("day");
  const endDay   = moment.utc(to).startOf("day");
  const totalDays = endDay.diff(dayStart, "days") + 1;

  for (let d = 0; d < totalDays; d++) {
    const D0 = moment.utc(dayStart).add(d, "days");           // 00:00 UTC của ngày d
    const D1 = moment.utc(D0).add(1, "day");                  // 24:00

    // part of the day actually inside [from,to]
    const WS = moment.max(D0, from);
    const WE = moment.min(D1, to);
    if (WE.isSameOrBefore(WS)) continue;

    // sweep-line deltas for this day
    const deltas = new Array(BUCKETS_PER_DAY + 1).fill(0);

    const idxOf = (t) => {
      // time offset from D0
      const diff = t.valueOf() - D0.valueOf();
      let idx = Math.floor(diff / STEP_MS);
      if (idx < 0) idx = 0;
      if (idx > BUCKETS_PER_DAY) idx = BUCKETS_PER_DAY;
      return idx;
    };

    // Apply every span intersecting this day
    for (const sp of spans) {
      // intersect with [D0, D1)
      const s = moment.max(sp.start, D0);
      const e = moment.min(sp.end, D1);
      if (e.isSameOrBefore(s)) continue;

      const sIdx = idxOf(s);                         // inclusive
      const eIdxExcl = Math.ceil((e.valueOf() - D0.valueOf()) / STEP_MS); // exclusive
      const eIdx = Math.min(Math.max(eIdxExcl, 0), BUCKETS_PER_DAY);

      deltas[sIdx] += 1;
      if (eIdx <= BUCKETS_PER_DAY) deltas[eIdx] -= 1;
    }

    // prefix-sum -> concurrency per bucket for this day
    const counts = new Array(BUCKETS_PER_DAY).fill(0);
    let cur = 0;
    for (let i = 0; i < BUCKETS_PER_DAY; i++) {
      cur += deltas[i];
      counts[i] = cur;
    }

    // mark which buckets are valid inside [WS, WE]
    const firstBucket = Math.floor((WS.valueOf() - D0.valueOf()) / STEP_MS);
    const lastBucket  = Math.ceil((WE.valueOf() - D0.valueOf()) / STEP_MS) - 1;

    for (let i = Math.max(0, firstBucket); i <= Math.min(BUCKETS_PER_DAY - 1, lastBucket); i++) {
      sumCounts[i] += counts[i];
      if (counts[i] > maxCounts[i]) maxCounts[i] = counts[i];
      activeDays[i] += 1;
    }
  }

  // Build labels HH:mm và tính average
  const labels = [];
  const avgCounts = [];
  const maxSeries = [];
  for (let i = 0; i < BUCKETS_PER_DAY; i++) {
    const t = moment.utc().startOf("day").add(i * STEP_MIN, "minutes");
    labels.push(t.format("HH:mm"));

    const daysActive = activeDays[i] || 1;  // tránh chia 0
    const avg = sumCounts[i] / daysActive;
    avgCounts.push(+avg.toFixed(2));
    maxSeries.push(maxCounts[i]);
  }

  // ===== ECharts option =====
  return {
    title: { text: `Concurrency by Time of Day (bucket ${STEP_MIN}m)`, left: "center" },
    legend: { top: 30, type: "plain" },
    grid: { left: 15, right: 15, bottom: 40, top: 70, containLabel: true },
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const time = params?.[0]?.axisValue || "";
        const lines = params.map(p => `${p.marker} ${p.seriesName}: ${p.data}`);
        return `${time}<br/>${lines.join("<br/>")}`;
      }
    },
    xAxis: [{ type: "category", data: labels }],
    yAxis: [{ type: "value", minInterval: 1 }],
    dataZoom: [
      { type: "inside", xAxisIndex: 0, start: 0, end: 100 },
      { type: "slider", xAxisIndex: 0, height: 14, bottom: 10 }
    ],
    series: [
      { name: "Avg concurrent", type: "line", smooth: true, areaStyle: {}, itemStyle: { color: "#4e79a7" }, data: avgCounts },
      { name: "Max concurrent", type: "line", smooth: true, itemStyle: { color: "#9c27b0" }, data: maxSeries }
    ]
  };
},

	getPipelineOverviewTable: function () {
  // ===== CONFIG =====
  const TZ_OFFSET_H = 7; // UTC -> UTC+7
  const _colorList = [
    '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
    '#edc948', '#af7aa1', '#ff9da7', '#9c755f'
  ];

  // ===== SAFE READ =====
  const _safeArr = (x) => Array.isArray(x) ? x : (x && Array.isArray(x.data) ? x.data : []);
  const dictRows = _safeArr(distinctPipelines.data); // [{name, link, cron}]
  const runRows  = _safeArr(fetchPipelines.data);    // [{id,name,link,status,created,updated}]

  // ===== TIME HELPERS =====
  const toLocal = (sUtc) => {
    if (!sUtc) return null;
    const m = moment.utc(String(sUtc));
    return m.isValid() ? m.add(TZ_OFFSET_H, 'hours') : null;
  };
  const startStr = (typeof dp_start !== 'undefined' && dp_start.selectedDate) ? dp_start.selectedDate : null;
  const baseLocal = startStr
    ? moment.utc(startStr, ['YYYY-MM-DD','DD-MM-YYYY','DD/MM/YYYY'], true).startOf('day')
    : moment.utc().add(TZ_OFFSET_H, 'hours');

  // ===== CRON (6 fields: sec min hour dom mon dow) =====
  const parseField = (expr, min, max) => {
    if (!expr || expr === '*' || expr === '*/1') return () => true;
    const parts = String(expr).split(',');
    const testers = parts.map(p => {
      const stepm = p.match(/^(\*|\d+|\d+-\d+)\/(\d+)$/);
      if (stepm) {
        const base = stepm[1], step = parseInt(stepm[2], 10);
        if (base === '*') return v => (v - min) % step === 0;
        if (base.includes('-')) {
          const [a,b] = base.split('-').map(Number);
          return v => v>=a && v<=b && ((v-a)%step===0);
        }
        const a = parseInt(base,10);
        return v => v===a && ((v-a)%step===0);
      }
      if (p.includes('-')) {
        const [a,b] = p.split('-').map(Number);
        return v => v>=a && v<=b;
      }
      if (/^\d+$/.test(p)) {
        const val = parseInt(p,10);
        return v => v===val;
      }
      if (p === '*') return () => true;
      return () => false;
    });
    return v => testers.some(fn => fn(v));
  };
  const buildCronMatcher = (cron) => {
    if (!cron) return null;
    const f = cron.trim().split(/\s+/);
    const a = (f.length === 5) ? ['0', ...f] : f; // thêm giây = 0 nếu thiếu
    if (a.length !== 6) return null;
    const [sE,mE,hE,domE,monE,dowE] = a;
    const sM = parseField(sE,0,59), mM=parseField(mE,0,59), hM=parseField(hE,0,23);
    const domM=parseField(domE,1,31), monM=parseField(monE,1,12);
    const dowTester = parseField((dowE || '*').replace(/\b0\b/g,'7'),1,7); // 0/7 = Sun
    const dowM = (v)=> dowTester(v===0?7:v); // isoWeekday: 1..7
    return (t)=> sM(t.seconds()) && mM(t.minutes()) && hM(t.hours())
              && domM(t.date()) && monM(t.month()+1) && dowM(t.isoWeekday());
  };
  const nextFromCron = (cron, baseLocal, maxIter=50000) => {
    const m = buildCronMatcher(cron);
    if (!m) return '';
    const stepSec = (cron.split(/\s+/)[0] || '0') === '*' ? 60 : 1;
    let t = baseLocal.clone();
    for (let i=0;i<maxIter;i++){
      if (m(t)) return t.format('YYYY-MM-DD HH:mm');
      t.add(stepSec,'seconds');
    }
    return '';
  };

  // ===== GROUP RUNS BY NAME (sorted by created desc) =====
  const byName = new Map();
  for (const r of runRows) {
    const name = (r.name || '').trim();
    if (!name) continue;
    const created = toLocal(r.created);
    const updated = r.updated ? toLocal(r.updated) : null;
    if (!created) continue;
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push({
      created, updated,
      status: (r.status || '').trim(),
      link: r.link || ''
    });
  }
  for (const [, arr] of byName.entries()) {
    arr.sort((a,b)=> b.created.valueOf() - a.created.valueOf());
  }

  // ===== SUMMARY ROWS → cho table matrix =====
  // Cột: Pipeline | Last (min) | Avg(7) (min) | Status | Next run
  const _colHeaders = ['Pipeline', 'Last (min)', 'Avg(7) (min)', 'Status', 'Next run'];
  const _regionColIdx = 0;     // cột text trái
  const _geoColIdx = -1;       // không dùng geo

  const summary = [];
  for (const p of dictRows) {
    const name = (p.name || '').trim();
    if (!name) continue;
    const link = p.link || '';
    const cron = (p.cron || '').trim();

    const arr = byName.get(name) || [];
    const last = arr[0] || null;

    const lastDur = (last && last.updated) ? last.updated.diff(last.created, 'minutes') : 0;
    const durs = arr.filter(x=>x.updated && x.created).slice(0,7)
                    .map(x=> x.updated.diff(x.created,'minutes'));
    const avg7 = durs.length ? +((durs.reduce((a,b)=>a+b,0)/durs.length).toFixed(1)) : 0;
    const nextRun = cron ? nextFromCron(cron, baseLocal) : '';

    summary.push({
      pipeline: name,
      lastMin: lastDur,
      avg7Min: avg7,
      status:  last ? last.status : '',
      nextRun,
      link
    });
  }
  if (!summary.length) {
    return {
      title: { text: 'Pipelines Overview (table)', left: 'center' },
      matrix: { x: { data: [] }, y: { data: [] }, body: { data: [] } },
      series: []
    };
  }

  // ===== CHUẨN DỮ LIỆU THEO DEMO MATRIX =====
  // Dùng 2 "datasource" để vẽ mini-bar ở 2 cột Last/Avg(7)
  const _dataSourceList = [
    {
      name: 'Last',
      data: summary.map(r => [r.pipeline, Number(r.lastMin||0), 0, (r.status||''), (r.nextRun||''), r.link||''])
    },
    {
      name: 'Avg(7)',
      data: summary.map(r => [r.pipeline, 0, Number(r.avg7Min||0), (r.status||''), (r.nextRun||''), r.link||''])
    }
  ];

  // ===== HELPERS (port từ demo) =====
  const calculateDataExtentOnCol = (dataSourceList, colIdx) => {
    let min = Infinity, max = -Infinity;
    dataSourceList.forEach(ds => {
      ds.data.forEach(row => {
        const val = Number(row[colIdx] ?? 0);
        if (!Number.isFinite(val)) return;
        if (val < min) min = val;
        if (val > max) max = val;
      });
    });
    if (!isFinite(min)) min = 0;
    if (!isFinite(max)) max = 0;
    if (min === max) max = min + 1;
    return [min, max];
  };

  const addCellPlainText = (option, dataSourceList, dataColIdx, dataRowIdx) => {
    const dataSource = dataSourceList[0]; // text lấy từ DS đầu
    option.matrix.body.data.push({
      value: String(dataSource.data[dataRowIdx][dataColIdx] ?? ''),
      coord: [dataColIdx, dataRowIdx]
    });
  };

  const addCellMiniBar = (option, dataSourceList, dataColIdx, dataRowIdx, dataExtentOnCol) => {
    const id = 'mini-bar-' + dataColIdx + '-' + dataRowIdx;
    option.grid.push({
      id, coordinateSystem: 'matrix',
      coord: [dataColIdx, dataRowIdx],
      top: '15%', bottom: '15%'
    });
    option.xAxis.push({
      id, gridId: id, type: 'value',
      min: 0, max: dataExtentOnCol ? dataExtentOnCol[1] : undefined,
      scale: false,
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { show: false }, axisLabel: { show: false }
    });
    option.yAxis.push({
      id, gridId: id, type: 'category', boundaryGap: false, inverse: true,
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { show: false }, axisLabel: { show: false }
    });

    dataSourceList.forEach((ds, dsIdx) => {
      const v = Number(ds.data[dataRowIdx][dataColIdx] ?? 0);
      const meta = {
        pipeline: ds.data[dataRowIdx][0],
        status:   ds.data[dataRowIdx][3],
        nextRun:  ds.data[dataRowIdx][4],
        link:     ds.data[dataRowIdx][5] || ''
      };
      option.series.push({
        type: 'bar',
        name: ds.name,                // hiển thị trên legend
        xAxisId: id,
        yAxisId: id,
        label: { show: v > 0, position: 'insideLeft' },
        barMinHeight: 2,
        barGap: '40%',
        barWidth: '40%',
        itemStyle: { color: _colorList[dsIdx % _colorList.length] },
        encode: { label: 0 },
        data: [{ value: v, meta }]   // giữ object để tooltip đọc meta
      });
    });
  };

  // ===== BUILD OPTION =====
  const option = {
    title: { text: 'Pipelines Overview (table)', left: 'center' },
    legend: { top: 28, type: 'plain' },
    tooltip: {
      trigger: 'item',
      formatter: (p) => {
        const m = p?.data?.meta || {};
        const v = Number.isFinite(p?.data?.value) ? p.data.value : p.value;
        const linkShort = m.link ? (m.link.length > 40 ? m.link.slice(0,40) + '…' : m.link) : '-';
        return [
          `<b>${m.pipeline || ''}</b>`,
          `Value: <b>${v}</b> min`,
          `Status: ${m.status || '-'}`,
          `Next run: ${m.nextRun || '-'}`,
          `Link: ${linkShort}`
        ].join('<br/>');
      }
    },
    matrix: {
      x: {
        levelSize: 40,
        data: _colHeaders.map((item, colIdx) => ({
          value: item,
          size: colIdx === _regionColIdx ? 140 : (colIdx === 4 ? 160 : undefined) // "Next run" rộng hơn
        })),
        itemStyle: { color: '#f0f8ff' },
        label: { fontWeight: 'bold' }
      },
      y: {
        data: _dataSourceList[0].data.map(() => '_'), // dummy như demo
        show: false
      },
      body: { data: [] },
      top: 25
    },
    grid: [],
    xAxis: [],
    yAxis: [],
    geo: [],
    series: []
  };

  // Vẽ cell theo đúng demo
  const rowCount = _dataSourceList[0].data.length;
  for (let dataColIdx = 0; dataColIdx < _colHeaders.length; ++dataColIdx) {
    const isBarCol = (dataColIdx === 1 || dataColIdx === 2); // Last / Avg(7)
    const dataExtentOnCol =
      (dataColIdx === _regionColIdx || dataColIdx === _geoColIdx)
        ? null
        : (isBarCol ? calculateDataExtentOnCol(_dataSourceList, dataColIdx) : null);

    for (let dataRowIdx = 0; dataRowIdx < rowCount; ++dataRowIdx) {
      if (dataColIdx === _regionColIdx) {
        addCellPlainText(option, _dataSourceList, dataColIdx, dataRowIdx); // Pipeline
      } else if (dataColIdx === _geoColIdx) {
        // Không dùng geo trong bài này → bỏ qua
      } else if (isBarCol) {
        addCellMiniBar(option, _dataSourceList, dataColIdx, dataRowIdx, dataExtentOnCol);
      } else {
        addCellPlainText(option, _dataSourceList, dataColIdx, dataRowIdx); // Status / Next run
      }
    }
  }

  return option;
}


};
