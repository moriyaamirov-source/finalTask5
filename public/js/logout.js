document.addEventListener(
    'DOMContentLoaded',
    () => {

        const logoutBtn =
            document.getElementById(
                'logoutBtn'
            );

        if (!logoutBtn) {
            return;
        }

        logoutBtn.addEventListener(
            'click',
            async () => {

                try {
                    const response =
                        await fetch(
                            '/auth/logout',
                            {
                                method: 'POST',
                                credentials: 'include'
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.message ||
                            'Failed to logout'
                        );
                    }

                    localStorage.removeItem(
                        'userId'
                    );

                    localStorage.removeItem(
                        'username'
                    );

                    window.location.href =
                        '/login.html';

                } catch (error) {
                    console.error(
                        'Logout error:',
                        error
                    );

                    alert(
                        'לא הצלחנו להתנתק. נסו שוב.'
                    );
                }
            }
        );
    }
);