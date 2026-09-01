let currentUser = null;
let currentUserId = null;


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


function formatDate(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleString('he-IL');
}


function renderMedia(post) {
    if (!post.mediaUrl) {
        return '';
    }

    const safeUrl = escapeHtml(post.mediaUrl);

    if (post.postType === 'image') {
        return `
            <img
                class="post-media"
                src="${safeUrl}"
                alt="תמונת פוסט"
            >
        `;
    }

    if (post.postType === 'video') {
        return `
            <video
                class="post-media"
                controls
            >
                <source src="${safeUrl}">
            </video>
        `;
    }

    return '';
}


function createPostCard(post) {
    const groupText = post.group?.name
        ? `<span>קבוצה: ${escapeHtml(post.group.name)}</span>`
        : '';

    return `
        <article class="post-card">

            <h3>
                ${escapeHtml(post.title)}
            </h3>

            <p>
                ${escapeHtml(post.content)}
            </p>

            ${renderMedia(post)}

            <div class="post-meta">
                ${groupText}

                ${
                    post.region
                        ? `<span>אזור: ${escapeHtml(post.region)}</span>`
                        : ''
                }

                <span>
                    ${formatDate(post.createdAt)}
                </span>
            </div>

        </article>
    `;
}


async function loadCurrentUser() {
    const response = await fetch(
        '/auth/me',
        {
            credentials: 'include'
        }
    );

    if (!response.ok) {
        window.location.href = '/login.html';
        return false;
    }

    const data = await response.json();

    currentUser = data.user || data;
    currentUserId = getId(currentUser);

    if (!currentUserId) {
        window.location.href = '/login.html';
        return false;
    }

    document.getElementById(
        'username'
    ).value = currentUser.username || '';

    return true;
}


async function loadMyPosts() {
    const status =
        document.getElementById('postsStatus');

    const container =
        document.getElementById('postsContainer');

    status.textContent =
        'טוען את הפוסטים שלך...';

    try {

        const response = await fetch(
            '/users/posts/me',
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
                'Failed to load posts'
            );
        }

        status.textContent = '';

        if (!Array.isArray(data) ||
            data.length === 0) {

            container.innerHTML = `
                <div class="empty-state">
                    עדיין לא פרסמת פוסטים.
                </div>
            `;

            return;
        }

        container.innerHTML =
            data
                .map(createPostCard)
                .join('');

    } catch (error) {

        console.error(error);

        status.textContent =
            'לא הצלחנו לטעון את הפוסטים.';
    }
}


async function updateProfile(event) {
    event.preventDefault();

    const status =
        document.getElementById(
            'profileStatus'
        );

    const username =
        document
            .getElementById('username')
            .value
            .trim();

    if (!username) {
        status.textContent =
            'יש להזין שם משתמש.';
        return;
    }

    try {

        const response = await fetch(
            `/users/${currentUserId}`,
            {
                method: 'PUT',

                credentials: 'include',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify({
                    username
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Failed to update profile'
            );
        }

        currentUser = data;

        status.textContent =
            'הפרטים עודכנו בהצלחה.';

    } catch (error) {

        console.error(error);

        status.textContent =
            error.message;
    }
}


async function deleteAccount() {
    const approved = confirm(
        'האם את בטוחה שברצונך למחוק את החשבון?'
    );

    if (!approved) {
        return;
    }

    try {

        const response = await fetch(
            `/users/${currentUserId}`,
            {
                method: 'DELETE',
                credentials: 'include'
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Failed to delete account'
            );
        }

        window.location.href =
            '/register.html';

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}


document.addEventListener(
    'DOMContentLoaded',
    async () => {

        try {

            const authenticated =
                await loadCurrentUser();

            if (!authenticated) {
                return;
            }

            document
                .getElementById(
                    'profileForm'
                )
                .addEventListener(
                    'submit',
                    updateProfile
                );

            document
                .getElementById(
                    'deleteAccountBtn'
                )
                .addEventListener(
                    'click',
                    deleteAccount
                );

            await loadMyPosts();

        } catch (error) {

            console.error(
                'Profile initialization error:',
                error
            );

            window.location.href =
                '/login.html';
        }
    }
);