// CSV Utility Functions
const CsvUtil = {
  // Export logic
  exportToCSV: function(jobs) {
    if (jobs.length === 0) {
      alert(chrome.i18n.getMessage("csvNoData"));
      return;
    }
    
    const headers = [
      chrome.i18n.getMessage("lblDate"),
      chrome.i18n.getMessage("lblCompany"),
      chrome.i18n.getMessage("lblCity"),
      chrome.i18n.getMessage("lblTitle"),
      chrome.i18n.getMessage("lblWorkType"),
      chrome.i18n.getMessage("lblInterview"),
      chrome.i18n.getMessage("lblStatusDate"),
      chrome.i18n.getMessage("lblSource"),
      chrome.i18n.getMessage("lblPlatform"),
      chrome.i18n.getMessage("lblUrl"),
      chrome.i18n.getMessage("lblNotes")
    ];
    const keys = ['date', 'company', 'location', 'title', 'workType', 'interviewStatus', 'statusDate', 'source', 'platform', 'url', 'notes'];
    
    let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';
    
    jobs.forEach(job => {
      const rowData = { ...job, statusDate: job.statusDate || job.date || '' };
      const row = keys.map(key => {
        let val = rowData[key] || '';
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
        date: row[chrome.i18n.getMessage("lblDate")] || row['投递时间'] || row['Date'] || row['date'] || '',
        company: row[chrome.i18n.getMessage("lblCompany")] || row['公司名称'] || row['投递公司'] || row['Company'] || row['company'] || '',
        location: row[chrome.i18n.getMessage("lblCity")] || row['城市'] || row['City'] || row['location'] || '',
        title: row[chrome.i18n.getMessage("lblTitle")] || row['职位信息'] || row['职位'] || row['Title'] || row['title'] || '',
        workType: row[chrome.i18n.getMessage("lblWorkType")] || row['工作类型'] || row['Work Type'] || row['workType'] || 'On-site',
        interviewStatus: row[chrome.i18n.getMessage("lblInterview")] || row['面试进度'] || row['Interview'] || row['interviewStatus'] || '否',
        statusDate: row[chrome.i18n.getMessage("lblStatusDate")] || row['状态更新时间'] || row['Interview update'] || row['statusDate'] || '',
        source: row[chrome.i18n.getMessage("lblSource")] || row['职位来源'] || row['Source'] || row['source'] || '自投',
        platform: row[chrome.i18n.getMessage("lblPlatform")] || row['投递平台'] || row['Platform'] || row['platform'] || 'others',
        url: row[chrome.i18n.getMessage("lblUrl")] || row['职位链接'] || row['URL'] || row['url'] || 'N/A',
        notes: row[chrome.i18n.getMessage("lblNotes")] || row['备注'] || row['Notes'] || row['notes'] || ''
      };
    }).filter(job => job.company !== '' && job.title !== ''); // Filter out empty lines
  }
};
