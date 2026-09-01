document.addEventListener('DOMContentLoaded', () => {
  
  // פונקציה כללית לחיפוש עם Fetch
  async function doSearch(formId, endpoint, statusId, resultsId) {
    const form = document.getElementById(formId);
    const status = document.getElementById(statusId);
    const results = document.getElementById(resultsId);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      results.innerHTML = '';
      status.className = '';
      status.textContent = 'טוען...';

      const params = new URLSearchParams(new FormData(form)).toString();

      try {
        const res = await fetch(`${endpoint}?${params}`);
        if (!res.ok) throw new Error();

        const data = await res.json();
        const posts = Array.isArray(data) ? data : (data.posts || []);

        if (posts.length === 0) {
          status.textContent = 'לא נמצאו תוצאות';
          status.className = 'empty';
          return;
        }

        status.textContent = `נמצאו ${posts.length} תוצאות:`;
        posts.forEach(p => {
          const div = document.createElement('div');
          div.className = 'post';
          div.innerHTML = `<h3>${p.title || 'ללא כותרת'}</h3><p>${p.content || ''}</p>`;
          results.appendChild(div);
        });

      } catch (err) {
        status.textContent = 'שגיאה בחיפוש';
        status.className = 'error';
      }
    });
  }

  // הפעלת שני החיפושים
  doSearch('advForm', '/posts/search/advanced', 'advStatus', 'advResults');
  doSearch('filterForm', '/posts/search/filter', 'filterStatus', 'filterResults');
});