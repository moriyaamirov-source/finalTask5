document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('התחברת בהצלחה!');
                    // שמירת ה-ID ושם המשתמש ב-LocalStorage כדי שנדע מי מחובר
                    localStorage.setItem('userId', data.userId);
                    localStorage.setItem('username', data.username);

                    // מעבר לעמוד הבית / הפיד
                    window.location.href = '/homePage.html';
                } else {
                    alert(`שגיאה: ${data.message}`);
                }
            } catch (err) {
                console.error('Login error:', err);
                alert('שגיאת תקשורת מול השרת');
            }
        });
    }
});