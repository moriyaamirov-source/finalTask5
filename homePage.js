document.addEventListener('DOMContentLoaded', function() {
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    // שליפת השם שנשמר ב-localStorage
    const user = localStorage.getItem('loggedInUser');

    if (user && welcomeMessage) {
        welcomeMessage.textContent = 'ברוך הבא, ' + user + '!';
    }
});