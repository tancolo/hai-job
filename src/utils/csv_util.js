// CSV Utility Functions
const CsvUtil = {
  // Export logic
  exportToCSV: function(jobs) {
    if (jobs.length === 0) {
      alert('没有数据可导出');
      return;
    }
    
    const headers = ['投递时间', '公司名称', '城市', '职位信息', '工作类型', '面试进度', '职位来源', '投递平台', '职位链接', '备注'];
    const keys = ['date', 'company', 'location', 'title', 'workType', 'interviewStatus', 'source', 'platform', 'url', 'notes'];
    
    let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';
    
    jobs.forEach(job => {
      const row = keys.map(key => {
        let val = job[key] || '';
        val = val.toString().replace(/"/g, '""'); // Escape inner quotes
        return `"${val}"`;
      });
      csvContent += row.join(',') + '\n';
    });
    
    // Add BOM for Excel UTF-8 display
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `HaiJob_Backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  // Parse CSV text to raw rows
  parseCSV: function(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    const headers = this.parseCSVLine(lines[0]);
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      const values = this.parseCSVLine(lines[i]);
      const obj = {};
      headers.forEach((header, index) => {
        // Remove BOM if exists on first header
        const cleanHeader = header.replace(/^\uFEFF/, '').trim();
        obj[cleanHeader] = values[index] ? values[index] : '';
      });
      result.push(obj);
    }
    return result;
  },

  // Helper for parsing a single CSV line
  parseCSVLine: function(line) {
    const result = [];
    let currentToken = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          currentToken += '"'; // Escaped quote
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(currentToken.trim());
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
    result.push(currentToken.trim());
    return result;
  },

  // Map raw CSV rows to standard Job objects
  processParsedCSV: function(rows) {
    return rows.map(row => {
      return {
        date: row['投递时间'] || row['date'] || '',
        company: row['公司名称'] || row['投递公司'] || row['company'] || '',
        location: row['城市'] || row['location'] || '',
        title: row['职位信息'] || row['职位'] || row['title'] || '',
        workType: row['工作类型'] || row['workType'] || 'On-site',
        interviewStatus: row['面试进度'] || row['interviewStatus'] || '否',
        source: row['职位来源'] || row['source'] || '自投',
        platform: row['投递平台'] || row['platform'] || 'others',
        url: row['职位链接'] || row['url'] || 'N/A',
        notes: row['备注'] || row['notes'] || ''
      };
    }).filter(job => job.company !== '' && job.title !== ''); // Filter out empty lines
  }
};
