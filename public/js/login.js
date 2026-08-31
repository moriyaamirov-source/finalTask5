document.addEventListener('DOMContentLoaded', function () {

    const loginForm =
        document.getElementById('loginForm');

    if (!loginForm) {
        console.error('loginForm was not found');
        return;
    }


    loginForm.addEventListener(
        'submit',
        async function (event) {

            event.preventDefault();


            const usernameInput =
                document.getElementById('username');

            const passwordInput =
                document.getElementById('password');


            const username =
                usernameInput.value.trim();

            const password =
                passwordInput.value;


            if (!username || !password) {

                alert(
                    'יש להזין שם משתמש וסיסמה'
                );

                return;
            }


            try {

                const response =
                    await fetch('/auth/login', {

                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        // חשוב עבור Session Cookie
                        credentials: 'include',

                        body: JSON.stringify({
                            username,
                            password
                        })
                    });


                const data =
                    await response.json();


                if (!response.ok) {

                    alert(
                        data.message ||
                        'שם המשתמש או הסיסמה שגויים'
                    );

                    return;
                }


                // השרת שלכם מחזיר:
                // data.user.id
                // data.user.username

                if (data.user) {

                    localStorage.setItem(
                        'userId',
                        data.user.id
                    );

                    localStorage.setItem(
                        'username',
                        data.user.username
                    );
                }


                alert(
                    'התחברת בהצלחה!'
                );


                window.location.href =
                    '/homePage.html';


            } catch (err) {

                console.error(
                    'Login error:',
                    err
                );

                alert(
                    'שגיאת תקשורת מול השרת'
                );
            }
        }
    );
});