document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) return;

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        let isValid = true;

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        const emailError = document.getElementById('emailError');
        const passwordError = document.getElementById('passwordError');

        emailError.textContent = '';
        passwordError.textContent = '';

        if (!emailInput.value.trim()) {
            emailError.textContent = 'שדה אימייל הוא חובה';
            isValid = false;
        } else if (!emailInput.value.includes('@')) {
            emailError.textContent = 'כתובת אימייל אינה תקינה';
            isValid = false;
        }

        if (!passwordInput.value) {
            passwordError.textContent = 'שדה סיסמה הוא חובה';
            isValid = false;
        } else if (passwordInput.value.length < 6) {
            passwordError.textContent = 'הסיסמה חייבת להכיל לפחות 6 תווים';
            isValid = false;
        }

        if (isValid) {
            // חילוץ שם המשתמש מתוך האימייל (כל מה שלפני ה-@)
            const userName = emailInput.value.split('@')[0];
            
            // שמירת שם המשתמש בדפדפן
            localStorage.setItem('loggedInUser', userName);

            // מעבר חזרה לדף הבית
            window.location.href = 'homePage.html';
        }
    });
});