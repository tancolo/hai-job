/**
 * Wrapper for chrome.storage.local to handle job application records.
 */
const StorageUtil = {
  // Save a new job record
  saveJob: async (jobData) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['jobs'], (result) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        
        let jobs = result.jobs || [];
        
        // Add a unique ID and timestamp
        const newJob = {
          ...jobData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        
        jobs.push(newJob);
        
        chrome.storage.local.set({ jobs: jobs }, () => {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
          }
          resolve(newJob);
        });
      });
    });
  },

  // Get all job records
  getJobs: async () => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['jobs'], (result) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        // Return sorted by date (newest first) based on user inputted date, fallback to createdAt
        let jobs = result.jobs || [];
        jobs.sort((a, b) => new Date(b.date) - new Date(a.date));
        resolve(jobs);
      });
    });
  },

  // Update a specific job record by ID
  updateJob: async (jobId, updatedFields) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['jobs'], (result) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        
        let jobs = result.jobs || [];
        let updated = false;
        
        jobs = jobs.map(job => {
          if (job.id === jobId) {
            updated = true;
            return { ...job, ...updatedFields };
          }
          return job;
        });
        
        if (!updated) {
          return resolve(false); // Job not found
        }
        
        chrome.storage.local.set({ jobs: jobs }, () => {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
          }
          resolve(true);
        });
      });
    });
  },

  // Delete a specific job record by ID
  deleteJob: async (jobId) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['jobs'], (result) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        
        let jobs = result.jobs || [];
        const initialLength = jobs.length;
        jobs = jobs.filter(job => job.id !== jobId);
        
        if (jobs.length === initialLength) {
          return resolve(false); // No job found
        }
        
        chrome.storage.local.set({ jobs: jobs }, () => {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
          }
          resolve(true);
        });
      });
    });
  },

  // Clear all job records
  clearAllJobs: async () => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ jobs: [] }, () => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve(true);
      });
    });
  }
};
