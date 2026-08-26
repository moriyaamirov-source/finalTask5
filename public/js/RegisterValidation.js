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
            // שמירת השם המלא בדפדפן והעברה לדף הבית
            localStorage.setItem('loggedInUser', fullNameInput.value.trim());
            window.location.href = 'homePage.html';
        }
    });
});