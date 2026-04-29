document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('jobs-tbody');
  const table = document.getElementById('jobs-table');
  const emptyState = document.getElementById('empty-state');
  
  const btnDeleteAll = document.getElementById('btn-delete-all');
  const deleteModal = document.getElementById('delete-modal');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');

  // Load and render data
  async function loadData() {
    try {
      const jobs = await StorageUtil.getJobs();
      renderTable(jobs);
    } catch (err) {
      console.error("Failed to load jobs", err);
    }
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

    jobs.forEach(job => {
      const tr = document.createElement('tr');
      
      const linkHtml = job.url && job.url !== 'N/A' 
        ? `<a href="${job.url}" target="_blank" class="link">链接</a>` 
        : 'N/A';

      tr.innerHTML = `
        <td>${escapeHtml(job.date || '')}</td>
        <td><strong>${escapeHtml(job.company || '')}</strong></td>
        <td>${escapeHtml(job.location || '')}</td>
        <td>${escapeHtml(job.title || '')}</td>
        <td>${escapeHtml(job.workType || '')}</td>
        <td>${escapeHtml(job.interviewStatus || '')}</td>
        <td>${escapeHtml(job.source || '')}</td>
        <td>${escapeHtml(job.platform || '')}</td>
        <td>${linkHtml}</td>
        <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(job.notes || '')}">
          ${escapeHtml(job.notes || '')}
        </td>
        <td class="actions-col">
          <button class="btn-delete-row" data-id="${job.id}">删除</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Attach delete listeners
    document.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        if (confirm('确认删除这条记录吗？')) {
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

  // Initial load
  loadData();
});
