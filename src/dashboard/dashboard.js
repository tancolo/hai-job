document.addEventListener('DOMContentLoaded', () => {
  // Register this tab's ID with the background so sidepanel can reuse it
  chrome.tabs.getCurrent((tab) => {
    if (tab) {
      chrome.runtime.sendMessage({ action: 'register_dashboard', tabId: tab.id });
    }
  });

  const tbody = document.getElementById('jobs-tbody');
  const table = document.getElementById('jobs-table');
  const emptyState = document.getElementById('empty-state');
  
  const btnDeleteAll = document.getElementById('btn-delete-all');
  const deleteModal = document.getElementById('delete-modal');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');

  let allJobs = []; // Module level cache for all jobs

  // Filtering Elements
  const searchInput = document.getElementById('search-input');
  const filterWorkType = document.getElementById('filter-work-type');
  const filterInterview = document.getElementById('filter-interview');
  const filterPlatform = document.getElementById('filter-platform');

  // Load and render data
  async function loadData() {
    try {
      allJobs = await StorageUtil.getJobs();
      applyFilters(); // Apply current filters and render
    } catch (err) {
      console.error('Failed to load data:', err);
      alert('加载数据失败: ' + err.message);
    }
  }

  // Apply filters and search
  function applyFilters() {
    const searchText = searchInput.value.toLowerCase().trim();
    const workTypeValue = filterWorkType.value;
    const interviewValue = filterInterview.value;
    const platformValue = filterPlatform.value;

    const filteredJobs = allJobs.filter(job => {
      // 1. Search text matches company, city, or title
      const company = (job.company || '').toLowerCase();
      const city = (job.location || '').toLowerCase();
      const title = (job.title || '').toLowerCase();
      
      const matchesSearch = searchText === '' || 
                            company.includes(searchText) || 
                            city.includes(searchText) || 
                            title.includes(searchText);

      // 2. Dropdown filters
      const matchesWorkType = workTypeValue === 'all' || job.workType === workTypeValue;
      const matchesInterview = interviewValue === 'all' || job.interviewStatus === interviewValue;
      // Handle "否" correctly
      if (interviewValue === '否' && job.interviewStatus !== '否') return false;

      const matchesPlatform = platformValue === 'all' || (job.platform && job.platform.toLowerCase() === platformValue.toLowerCase());

      return matchesSearch && matchesWorkType && matchesInterview && matchesPlatform;
    });

    renderTable(filteredJobs);
  }

  function renderTable(jobs) {
    tbody.innerHTML = '';
    
    if (jobs.length === 0) {
      table.classList.add('hidden');
      emptyState.classList.remove('hidden');
      btnDeleteAll.disabled = true;
      btnDeleteAll.style.opacity = '0.5';
      return;
    }

    table.classList.remove('hidden');
    emptyState.classList.add('hidden');
    btnDeleteAll.disabled = false;
    btnDeleteAll.style.opacity = '1';

    const srcMap = {
      '自投': chrome.i18n.getMessage("srcSelf"),
      '暂未投递': chrome.i18n.getMessage("srcNotApplied"),
      '猎头推荐': chrome.i18n.getMessage("srcRecruiter"),
      '内推': chrome.i18n.getMessage("srcReferral")
    };

    const statusMap = {
      '否': chrome.i18n.getMessage("intStatusNo"),
      '是': chrome.i18n.getMessage("intStatusYes"),
      '一面': chrome.i18n.getMessage("intStatusRound1"),
      '二面': chrome.i18n.getMessage("intStatusRound2"),
      '三面': chrome.i18n.getMessage("intStatusRound3"),
      '四面': chrome.i18n.getMessage("intStatusRound4"),
      '终面': chrome.i18n.getMessage("intStatusFinal"),
      '录用': chrome.i18n.getMessage("intStatusOffer"),
      '被拒': chrome.i18n.getMessage("intStatusRejected")
    };

    jobs.forEach(job => {
      const tr = document.createElement('tr');
      
      const linkHtml = job.url && job.url !== 'N/A' 
        ? `<a href="${job.url}" target="_blank" class="link">🔗</a>` 
        : 'N/A';

      const statusOptions = ['否', '是', '一面', '二面', '三面', '四面', '终面', '录用', '被拒'];
      let selectHtml = `<select class="status-select" data-id="${job.id}">`;
      statusOptions.forEach(opt => {
        const selected = (job.interviewStatus === opt) ? 'selected' : '';
        selectHtml += `<option value="${opt}" ${selected}>${statusMap[opt] || opt}</option>`;
      });
      selectHtml += `</select>`;

      const displaySource = srcMap[job.source] || job.source;
      const displayStatusDate = (job.interviewStatus !== '否' && job.statusDate) ? job.statusDate : job.date;

      tr.innerHTML = `
        <td>${escapeHtml(job.date || '')}</td>
        <td><strong>${escapeHtml(job.company || '')}</strong></td>
        <td>${escapeHtml(job.location || '')}</td>
        <td>${escapeHtml(job.title || '')}</td>
        <td>${escapeHtml(job.workType || '')}</td>
        <td>${selectHtml}</td>
        <td>${escapeHtml(displayStatusDate || '')}</td>
        <td>${escapeHtml(displaySource)}</td>
        <td>${escapeHtml(job.platform || '')}</td>
        <td>${linkHtml}</td>
        <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(job.notes || '')}">
          ${escapeHtml(job.notes || '')}
        </td>
        <td class="actions-col">
          <button class="btn-delete-row" data-id="${job.id}">${chrome.i18n.getMessage("btnDelete")}</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Attach status change listeners
    document.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const id = e.target.getAttribute('data-id');
        const newStatus = e.target.value;
        try {
           const updatePayload = { interviewStatus: newStatus };
           if (newStatus !== '否') {
             updatePayload.statusDate = new Date().toISOString().split('T')[0];
           }
           await StorageUtil.updateJob(id, updatePayload);
           
           // Update memory cache so filters keep working accurately
           const jobIndex = allJobs.findIndex(j => j.id === id);
           if(jobIndex > -1) {
             allJobs[jobIndex].interviewStatus = newStatus;
             if (newStatus !== '否') {
               allJobs[jobIndex].statusDate = updatePayload.statusDate;
             }
             
             // Update the specific statusDate cell visually without full re-render
             const tr = e.target.closest('tr');
             if (tr && tr.cells[6]) {
               const newDisplayDate = (newStatus !== '否' && updatePayload.statusDate) ? updatePayload.statusDate : allJobs[jobIndex].date;
               tr.cells[6].textContent = newDisplayDate || '';
             }
           }

           // Create visual feedback
           e.target.style.borderColor = 'var(--success-color, #10B981)';
           setTimeout(() => { e.target.style.borderColor = ''; }, 1000);
        } catch(err) {
           console.error("Failed to update status", err);
           alert(chrome.i18n.getMessage("msgSaveFailed") + err.message);
        }
      });
    });

    // Attach delete listeners
    document.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        if (confirm(chrome.i18n.getMessage("delRowConfirm"))) {
          await StorageUtil.deleteJob(id);
          loadData(); // Re-render
        }
      });
    });
  }

  // Delete All Flow
  btnDeleteAll.addEventListener('click', () => {
    deleteModal.classList.remove('hidden');
  });

  btnCancelDelete.addEventListener('click', () => {
    deleteModal.classList.add('hidden');
  });

  btnConfirmDelete.addEventListener('click', async () => {
    try {
      await StorageUtil.clearAllJobs();
      deleteModal.classList.add('hidden');
      loadData(); // Re-render empty state
    } catch (err) {
      console.error("Failed to clear jobs", err);
    }
  });

  // Helper to prevent XSS in table rendering
  function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  }

  // Event Listeners for Filters
  searchInput.addEventListener('input', applyFilters);
  filterWorkType.addEventListener('change', applyFilters);
  filterInterview.addEventListener('change', applyFilters);
  filterPlatform.addEventListener('change', applyFilters);

  // --- CSV Export Logic ---
  const btnExportCsv = document.getElementById('btn-export-csv');
  btnExportCsv.addEventListener('click', () => {
    CsvUtil.exportToCSV(allJobs);
  });

  // --- CSV Import Logic ---
  const btnImportCsv = document.getElementById('btn-import-csv');
  const fileInput = document.getElementById('csv-file-input');
  const importModal = document.getElementById('import-modal');
  const btnCancelImport = document.getElementById('btn-cancel-import');
  const btnConfirmImport = document.getElementById('btn-confirm-import');
  const importMessage = document.getElementById('import-message');
  
  let pendingImportData = [];

  btnImportCsv.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      let text = event.target.result;
      
      // Excel on Windows often exports CSV in GBK/ANSI encoding. 
      // If read as UTF-8, Chinese characters become ''.
      if (text.includes('')) {
        const readerGbk = new FileReader();
        readerGbk.onload = function(eGbk) {
          processCSVText(eGbk.target.result);
        };
        readerGbk.readAsText(file, 'GBK');
      } else {
        processCSVText(text);
      }
    };
    reader.readAsText(file, 'UTF-8');
    
    function processCSVText(csvText) {
      const parsedRows = CsvUtil.parseCSV(csvText);
      if (parsedRows.length === 0) {
        alert(chrome.i18n.getMessage("csvFormatErr"));
        fileInput.value = '';
        return;
      }
      
      pendingImportData = CsvUtil.processParsedCSV(parsedRows);
      
      if (pendingImportData.length === 0) {
         alert(chrome.i18n.getMessage("csvNoValid"));
         fileInput.value = '';
         return;
      }
      
      importMessage.textContent = chrome.i18n.getMessage("csvPreview").replace("{count}", pendingImportData.length);
      importModal.classList.remove('hidden');
    }
  });

  btnCancelImport.addEventListener('click', () => {
    importModal.classList.add('hidden');
    fileInput.value = '';
    pendingImportData = [];
  });

  btnConfirmImport.addEventListener('click', async () => {
    let importCount = 0;
    let duplicateCount = 0;
    
    for (const newJob of pendingImportData) {
      // 查重：公司名称与职位信息完全一致则忽略
      const isDuplicate = allJobs.some(existingJob => 
        existingJob.company === newJob.company && existingJob.title === newJob.title
      );
      
      if (isDuplicate) {
        duplicateCount++;
      } else {
        await StorageUtil.saveJob(newJob);
        importCount++;
      }
    }
    
    const summaryMsg = chrome.i18n.getMessage("csvSummary")
      .replace("{imp}", importCount)
      .replace("{dup}", duplicateCount);
    
    alert(summaryMsg);
    importModal.classList.add('hidden');
    fileInput.value = '';
    pendingImportData = [];
    loadData(); // Re-render table
  });

  // --- Profile Settings Logic ---
  const btnMyProfile = document.getElementById('btn-my-profile');
  const profileModal = document.getElementById('profile-modal');
  const btnCloseProfile = document.getElementById('btn-close-profile');
  const btnSaveProfile = document.getElementById('btn-save-profile');

  const inputs = {
    firstName: document.getElementById('prof-first-name'),
    lastName: document.getElementById('prof-last-name'),
    email: document.getElementById('prof-email'),
    phone: document.getElementById('prof-phone'),
    linkedin: document.getElementById('prof-linkedin'),
    github: document.getElementById('prof-github')
  };

  btnMyProfile.addEventListener('click', () => {
    chrome.storage.local.get(['userProfile'], (result) => {
      const p = result.userProfile || {};
      inputs.firstName.value = p.firstName || '';
      inputs.lastName.value = p.lastName || '';
      inputs.email.value = p.email || '';
      inputs.phone.value = p.phone || '';
      inputs.linkedin.value = p.linkedin || '';
      inputs.github.value = p.github || '';
      profileModal.classList.remove('hidden');
    });
  });

  btnCloseProfile.addEventListener('click', () => {
    profileModal.classList.add('hidden');
  });

  btnSaveProfile.addEventListener('click', () => {
    const p = {
      firstName: inputs.firstName.value.trim(),
      lastName: inputs.lastName.value.trim(),
      email: inputs.email.value.trim(),
      phone: inputs.phone.value.trim(),
      linkedin: inputs.linkedin.value.trim(),
      github: inputs.github.value.trim()
    };
    chrome.storage.local.set({ userProfile: p }, () => {
      alert(chrome.i18n.getMessage("msgProfileSaved") || "Profile saved!");
      profileModal.classList.add('hidden');
    });
  });

  // Initial load
  loadData();
});
