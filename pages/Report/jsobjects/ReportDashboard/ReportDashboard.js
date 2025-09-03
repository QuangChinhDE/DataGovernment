export default {
  // Hàm filter report list
  getFilteredReports: function () {
    const rows = dimReports.data || [];      // toàn bộ dữ liệu
    const query = (inp_search.text || "").trim().toLowerCase(); // text search

    // Nếu không có search thì trả hết
    if (!query) return rows;

    // Ngược lại thì lọc
    return rows.filter(r => {
      const name = (r.name || "").toLowerCase();
      const tags = (r.tags || "").toLowerCase();
      return name.includes(query) || tags.includes(query);
    });
  }
}
