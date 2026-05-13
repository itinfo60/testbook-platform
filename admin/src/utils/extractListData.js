export const extractListData = (responseData, debugKey = 'DATA') => {
  // responseData = axios res.data = { success, message, data, pagination }
  // OR could be: { success, data: { docs, page, ... } }
  
  let wrapper = responseData;
  
  // If responseData has a nested .data that's the actual payload
  // But responseData.data could be the array itself or an object
  
  if (import.meta.env.DEV) {
    const topKeys = Object.keys(wrapper || {});
  }

  let list = [];
  let pagination = null;

  // ─── CASE 1: { success, data: [...], pagination: {...} } ───
  // This is YOUR confirmed format
  if (Array.isArray(wrapper?.data)) {
    list = wrapper.data;
    pagination = wrapper.pagination || null;
    
    if (import.meta.env.DEV) {
    }
  }
  // ─── CASE 2: { success, data: { docs: [...], page, ... } } ───
  else if (wrapper?.data && typeof wrapper.data === 'object') {
    const inner = wrapper.data;
    
    if (Array.isArray(inner.docs)) {
      list = inner.docs;
    } else {
      // Find any array in the inner object
      const arrayKeys = [
        'users', 'courses', 'tests', 'quizzes', 'reviews',
        'enrollments', 'teachers', 'coupons', 'categories',
        'notifications', 'badges', 'payments', 'discussions',
        'data', 'results', 'items', 'records', 'list',
      ];
      for (const key of arrayKeys) {
        if (Array.isArray(inner[key])) {
          list = inner[key];
          break;
        }
      }
    }
    
    pagination = inner.pagination || wrapper.pagination || {
      page: inner.page || 1,
      totalPages: inner.totalPages || inner.pages || 1,
      total: inner.total || inner.totalDocs || list.length,
      limit: inner.limit || 10,
    };

    if (import.meta.env.DEV) {
    }
  }
  // ─── CASE 3: Direct array ───
  else if (Array.isArray(wrapper)) {
    list = wrapper;
    if (import.meta.env.DEV) {
    }
  }

  // Build pagination if not found
  if (!pagination) {
    pagination = {
      page: 1,
      totalPages: 1,
      total: list.length,
      limit: 10,
    };
  }

  // Normalize pagination
  pagination = {
    page: pagination.page || pagination.currentPage || 1,
    totalPages: pagination.totalPages || pagination.pages || 
      Math.ceil((pagination.total || list.length) / (pagination.limit || 10)) || 1,
    total: pagination.total || pagination.totalDocs || pagination.totalResults || list.length,
    limit: pagination.limit || pagination.perPage || 10,
  };

  return { list, pagination };
};