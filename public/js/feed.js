let currentUser = null;


// ========================================
// HELPERS
// ========================================

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


function formatDate(dateValue) {
    if (!dateValue) {
        return '';
    }

    const date = new Date(dateValue);

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
            <div class="post-media">
                <img
                    src="${safeUrl}"
                    alt="תמונה מהפוסט"
                    loading="lazy"
                >
            </div>
        `;
    }

    if (post.postType === 'video') {
        return `
            <div class="post-media">
                <video controls>
                    <source src="${safeUrl}">
                    הדפדפן שלך אינו תומך בווידאו.
                </video>
            </div>
        `;
    }

    return '';
}


function createPostCard(post) {
    const authorName =
        post.author?.username ||
        'משתמש לא ידוע';

    const groupName =
        post.group?.name || null;

    const groupHtml = groupName
        ? `
            <span class="post-group">
                קבוצה: ${escapeHtml(groupName)}
            </span>
        `
        : '';

    return `
        <article class="post-card">

            <div class="post-card-top">

                <div>
                    <h3>
                        ${escapeHtml(post.title)}
                    </h3>

                    <div class="post-meta">
                        <span>
                            ${escapeHtml(authorName)}
                        </span>

                        ${groupHtml}
                    </div>
                </div>

                <span class="post-type">
                    ${escapeHtml(post.postType || 'text')}
                </span>

            </div>

            <p class="post-content">
                ${escapeHtml(post.content)}
            </p>

            ${renderMedia(post)}

            <div class="post-bottom">

                ${
                    post.region
                        ? `
                            <span>
                                אזור: ${escapeHtml(post.region)}
                            </span>
                        `
                        : ''
                }

                <span>
                    ${formatDate(post.createdAt)}
                </span>

            </div>

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

        const username =
            currentUser.username ||
            'משתמש';

        document.getElementById(
            'welcomeMessage'
        ).textContent =
            `שלום ${username}, הנה מה שחדש אצלך`;

        return true;

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
// FEED
// ========================================

async function loadFeed() {
    const status =
        document.getElementById(
            'feedStatus'
        );

    const container =
        document.getElementById(
            'feedContainer'
        );

    status.textContent =
        'טוען פוסטים...';

    container.innerHTML = '';

    try {
        const response = await fetch(
            '/users/feed/me',
            {
                credentials: 'include'
            }
        );

        if (response.status === 401) {
            window.location.href =
                '/login.html';

            return;
        }

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Failed to load feed'
            );
        }

        status.textContent = '';

        if (!Array.isArray(data) ||
            data.length === 0) {

            container.innerHTML = `
                <div class="empty-state">
                    <h3>
                        הפיד עדיין ריק
                    </h3>

                    <p>
                        הוסיפי חברים או הצטרפי לקבוצות כדי לראות כאן פוסטים.
                    </p>
                </div>
            `;

            return;
        }

        container.innerHTML =
            data
                .map(createPostCard)
                .join('');

    } catch (error) {
        console.error(
            'Feed error:',
            error
        );

        status.textContent =
            'לא הצלחנו לטעון את הפיד.';
    }
}


// ========================================
// MY POSTS
// ========================================

async function loadMyPosts() {
    const status =
        document.getElementById(
            'myPostsStatus'
        );

    const container =
        document.getElementById(
            'myPostsContainer'
        );

    status.textContent =
        'טוען את הפוסטים שלך...';

    container.innerHTML = '';

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

        const data =
            await response.json();

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
                    <h3>
                        עדיין לא פרסמת פוסטים
                    </h3>

                    <p>
                        הפוסטים שתפרסמי יופיעו כאן.
                    </p>
                </div>
            `;

            return;
        }

        container.innerHTML =
            data
                .map(createPostCard)
                .join('');

    } catch (error) {
        console.error(
            'My posts error:',
            error
        );

        status.textContent =
            'לא הצלחנו לטעון את הפוסטים שלך.';
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
                'refreshFeedBtn'
            )
            .addEventListener(
                'click',
                async () => {
                    await Promise.all([
                        loadFeed(),
                        loadMyPosts()
                    ]);
                }
            );

        await Promise.all([
            loadFeed(),
            loadMyPosts()
        ]);
    }
);