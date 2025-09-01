export default {
  // Đếm tổng số run theo filter hiện tại
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
	
	  // Success Rate (%) = Done / Total * 100
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
  }
};
