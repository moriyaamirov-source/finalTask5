document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');

    if (!registerForm) return;

    registerForm.addEventListener('submit', function(event) {
        event.preventDefault();

        let isValid = true;

        const fullNameInput = document.getElementById('fullName');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        const fullNameError = document.getElementById('fullNameError');
        const emailError = document.getElementById('emailError');
        const passwordError = document.getElementById('passwordError');
        const confirmPasswordError = document.getElementById('confirmPasswordError');

        fullNameError.textContent = '';
        emailError.textContent = '';
        passwordError.textContent = '';
        confirmPasswordError.textContent = '';

        if (!fullNameInput.value.trim()) {
            fullNameError.textContent = 'שדה שם מלא הוא חובה';
            isValid = false;
        }

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

        if (!confirmPasswordInput.value) {
            confirmPasswordError.textContent = 'יש לאשר את הסיסמה';
            isValid = false;
        } else if (confirmPasswordInput.value !== passwordInput.value) {
            confirmPasswordError.textContent = 'הסיסמאות אינן תואמות';
            isValid = false;
        }

        if (isValid) {
            fetch('/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    fullName: fullNameInput.value.trim(),
                    username: emailInput.value.trim(),
                    email: emailInput.value.trim(),
                    password: passwordInput.value
                })
            })
            .then(res => res.json().then(data => ({ status: res.status, ok: res.ok, body: data })))
            .then(res => {
                if (res.ok) {
                    // תפיסה רחבה של Token מכל שדה אפשרי
                    const token = res.body.token || res.body.accessToken || res.body.jwt;
                    if (token) {
                        localStorage.setItem('token', token);
                    }

                    if (res.body.userId) localStorage.setItem('userId', res.body.userId);
                    localStorage.setItem('loggedInUser', fullNameInput.value.trim());
                    
                    alert('ההרשמה הושלמה בהצלחה!');
                    window.location.href = 'homePage.html';
                } else {
                    alert('שגיאה בהרשמה: ' + (res.body.message || 'נתונים לא תקינים'));
                }
            })
            .catch(err => {
                console.error('Register error:', err);
                alert('שגיאת תקשורת מול השרת');
            });
        }
    });
});