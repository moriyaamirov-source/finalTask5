let currentUser = null;
let currentUserId = null;
let allUsers = [];
let myFriends = [];


// ========================================
// HELPERS
// ========================================

function getId(value) {
    if (!value) {
        return '';
    }

    return String(
        value._id ||
        value.id ||
        value.userId ||
        value
    );
}


function escapeHtml(value) {
    if (value === undefined || value === null) {
        return '';
    }

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}


function createUserCard(user, isFriend) {
    const userId = getId(user);

    return `
        <article class="user-card">

            <div class="user-icon">
                👤
            </div>

            <div class="user-info">

                <h3>
                    ${escapeHtml(user.username)}
                </h3>

                <span class="friend-state">
                    ${
                        isFriend
                            ? 'חבר/ה שלך'
                            : 'משתמש/ת באתר'
                    }
                </span>

            </div>

            <button
                type="button"
                class="
                    friend-action-button
                    ${isFriend ? 'remove-friend' : 'add-friend'}
                "
                data-user-id="${userId}"
                data-action="${isFriend ? 'remove' : 'add'}"
            >
                ${
                    isFriend
                        ? 'הסר חבר'
                        : 'הוסף חבר'
                }
            </button>

        </article>
    `;
}


// ========================================
// AUTH
// ========================================

async function loadCurrentUser() {
    try {
        const response = await fetch(
            '/auth/me',
            {
                credentials: 'include'
            }
        );

        if (!response.ok) {
            window.location.href =
                '/login.html';

            return false;
        }

        const data = await response.json();

        currentUser =
            data.user ||
            data;

        currentUserId =
            getId(currentUser);

        return Boolean(currentUserId);

    } catch (error) {
        console.error(
            'Auth error:',
            error
        );

        window.location.href =
            '/login.html';

        return false;
    }
}


// ========================================
// LOAD DATA
// ========================================

async function loadAllUsers() {
    const response = await fetch(
        '/users',
        {
            credentials: 'include'
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Failed to load users'
        );
    }

    allUsers =
        Array.isArray(data)
            ? data
            : [];
}


async function loadMyFriends() {
    const response = await fetch(
        '/users/friends/me',
        {
            credentials: 'include'
        }
    );

    if (response.status === 401) {
        window.location.href =
            '/login.html';

        return;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Failed to load friends'
        );
    }

    myFriends =
        Array.isArray(data)
            ? data
            : [];
}


// ========================================
// RENDER
// ========================================

function renderUsers() {
    const friendsContainer =
        document.getElementById(
            'myFriendsContainer'
        );

    const usersContainer =
        document.getElementById(
            'usersContainer'
        );

    const friendsStatus =
        document.getElementById(
            'myFriendsStatus'
        );

    const usersStatus =
        document.getElementById(
            'usersStatus'
        );

    const friendIds = new Set(
        myFriends.map(friend =>
            getId(friend)
        )
    );

    const otherUsers =
        allUsers.filter(user => {
            const id = getId(user);

            return (
                id !== currentUserId &&
                !friendIds.has(id)
            );
        });


    // MY FRIENDS

    friendsStatus.textContent = '';

    if (myFriends.length === 0) {

        friendsContainer.innerHTML = `
            <div class="empty-state">
                <h3>עדיין אין לך חברים</h3>
                <p>
                    אפשר להוסיף חברים מרשימת המשתמשים.
                </p>
            </div>
        `;

    } else {

        friendsContainer.innerHTML =
            myFriends
                .map(friend =>
                    createUserCard(
                        friend,
                        true
                    )
                )
                .join('');
    }


    // OTHER USERS

    usersStatus.textContent = '';

    if (otherUsers.length === 0) {

        usersContainer.innerHTML = `
            <div class="empty-state">
                <h3>
                    אין משתמשים נוספים להצגה
                </h3>
            </div>
        `;

    } else {

        usersContainer.innerHTML =
            otherUsers
                .map(user =>
                    createUserCard(
                        user,
                        false
                    )
                )
                .join('');
    }
}


async function loadPageData() {
    const friendsStatus =
        document.getElementById(
            'myFriendsStatus'
        );

    const usersStatus =
        document.getElementById(
            'usersStatus'
        );

    friendsStatus.textContent =
        'טוען חברים...';

    usersStatus.textContent =
        'טוען משתמשים...';

    try {

        await Promise.all([
            loadAllUsers(),
            loadMyFriends()
        ]);

        renderUsers();

    } catch (error) {

        console.error(
            'Friends page error:',
            error
        );

        friendsStatus.textContent =
            'לא הצלחנו לטעון את רשימת החברים.';

        usersStatus.textContent =
            'לא הצלחנו לטעון את המשתמשים.';
    }
}


// ========================================
// ADD FRIEND
// ========================================

async function addFriend(userId) {
    const response = await fetch(
        `/users/friends/${userId}`,
        {
            method: 'POST',
            credentials: 'include'
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Failed to add friend'
        );
    }

    await loadPageData();
}


// ========================================
// REMOVE FRIEND
// ========================================

async function removeFriend(userId) {
    const response = await fetch(
        `/users/friends/${userId}`,
        {
            method: 'DELETE',
            credentials: 'include'
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Failed to remove friend'
        );
    }

    await loadPageData();
}


// ========================================
// BUTTON EVENTS
// ========================================

async function handleFriendAction(event) {
    const button =
        event.target.closest(
            '.friend-action-button'
        );

    if (!button) {
        return;
    }

    const userId =
        button.dataset.userId;

    const action =
        button.dataset.action;

    if (!userId) {
        return;
    }

    button.disabled = true;

    try {

        if (action === 'add') {
            await addFriend(userId);
        }

        if (action === 'remove') {
            await removeFriend(userId);
        }

    } catch (error) {

        console.error(
            'Friend action error:',
            error
        );

        alert(error.message);

        button.disabled = false;
    }
}


// ========================================
// INIT
// ========================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        const authenticated =
            await loadCurrentUser();

        if (!authenticated) {
            return;
        }

        document
            .getElementById(
                'refreshFriendsBtn'
            )
            .addEventListener(
                'click',
                loadPageData
            );

        document
            .getElementById(
                'myFriendsContainer'
            )
            .addEventListener(
                'click',
                handleFriendAction
            );

        document
            .getElementById(
                'usersContainer'
            )
            .addEventListener(
                'click',
                handleFriendAction
            );

        await loadPageData();
    }
);