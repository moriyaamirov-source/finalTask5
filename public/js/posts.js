document.addEventListener('DOMContentLoaded', () => {
    const createPostForm = document.getElementById('createPostForm');
    const postTypeSelect = document.getElementById('postType');
    const mediaUrlGroup = document.getElementById('mediaUrlGroup');
    const mediaUrlLabel = document.getElementById('mediaUrlLabel');
    const postMediaUrl = document.getElementById('postMediaUrl');

    // 1. שינוי ממשק הטופס לפי סוג הפוסט שנבחר
    if (postTypeSelect) {
        postTypeSelect.addEventListener('change', () => {
            const selectedType = postTypeSelect.value;

            if (selectedType === 'text') {
                mediaUrlGroup.style.display = 'none';
                postMediaUrl.required = false;
                postMediaUrl.value = '';
            } else if (selectedType === 'image') {
                mediaUrlGroup.style.display = 'block';
                mediaUrlLabel.textContent = 'קישור לתמונה (URL):';
                postMediaUrl.placeholder = 'https://example.com/image.jpg';
                postMediaUrl.required = true;
            } else if (selectedType === 'video') {
                mediaUrlGroup.style.display = 'block';
                mediaUrlLabel.textContent = 'קישור לסרטון וידאו (URL):';
                postMediaUrl.placeholder = 'https://example.com/video.mp4';
                postMediaUrl.required = true;
            }
        });
    }

    // 2. יצירת פוסט חדש מול POST /posts
    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('postTitle').value.trim();
            const content = document.getElementById('postContent').value.trim();
            const postType = postTypeSelect.value;
            const mediaUrl = postMediaUrl.value.trim() || undefined;

            const payload = { title, content, postType, mediaUrl };

            try {
                const response = await fetch('/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok) {
                    alert('הביקורת פורסמה בהצלחה!');
                    createPostForm.reset();
                    if (mediaUrlGroup) mediaUrlGroup.style.display = 'none';
                    fetchPosts();
                } else {
                    alert(`שגיאה בפרסום: ${data.message || 'שגיאה לא ידועה'}`);
                }
            } catch (err) {
                console.error('Error creating post:', err);
                alert('תרחשה שגיאה בתקשורת עם השרת');
            }
        });
    }

    // טעינה ראשונית של הפוסטים מ-MongoDB
    fetchPosts();
});

// 3. טעינת פוסטים מ-GET /posts
async function fetchPosts() {
    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) return;

    try {
        const response = await fetch('/posts');
        const posts = await response.json();

        if (!response.ok) {
            postsContainer.innerHTML = `<p class="error">שגיאה בטעינת פוסטים: ${escapeHtml(posts.message || '')}</p>`;
            return;
        }

        if (!Array.isArray(posts) || posts.length === 0) {
            postsContainer.innerHTML = '<p class="empty">עדיין אין ביקורות. היו הראשונים לשתף!</p>';
            return;
        }

        postsContainer.innerHTML = posts.map(post => renderPostCard(post)).join('');
    } catch (err) {
        console.error('Error fetching posts:', err);
        postsContainer.innerHTML = '<p class="error">שגיאה בחיבור לשרת.</p>';
    }
}

// 4. רינדור כרטיסיית פוסט בודד (HTML5 Video & Image)
function renderPostCard(post) {
    const authorName = escapeHtml(post.author?.username || 'מטייל אנונימי');
    const title = escapeHtml(post.title || '');
    const content = escapeHtml(post.content || '');
    const createdAt = post.createdAt ? new Date(post.createdAt).toLocaleDateString('he-IL') : '';

    let mediaHtml = '';

    // טיפול בפוסט תמונה - שימוש ב-placehold.co במקום via.placeholder.com
    if (post.postType === 'image' && post.mediaUrl) {
        const safeUrl = escapeHtml(post.mediaUrl.trim());
        mediaHtml = `
            <div class="media-wrapper">
                <img src="${safeUrl}" 
                     alt="${title}" 
                     class="post-image" 
                     onerror="this.onerror=null; this.src='https://placehold.co/600x300?text=Image+Error';" />
            </div>
        `;
    } 
    // טיפול בפוסט וידאו - HTML5 Video עם src ישיר
    else if (post.postType === 'video' && post.mediaUrl) {
        const safeUrl = escapeHtml(post.mediaUrl.trim());
        mediaHtml = `
            <div class="media-wrapper">
                <video controls src="${safeUrl}" class="post-video">
                    הדפדפן שלך אינו תומך בנגן הוידאו.
                </video>
            </div>
        `;
    }

    return `
        <article class="post-card">
            <div class="post-header">
                <h3>${title}</h3>
                <span class="badge badge-${escapeHtml(post.postType)}">${getPostTypeLabel(post.postType)}</span>
            </div>
            <p class="post-meta">מאת: <strong>${authorName}</strong> ${createdAt ? `| בתאריך: ${createdAt}` : ''}</p>
            <p class="post-content">${content}</p>
            ${mediaHtml}
        </article>
    `;
}

function getPostTypeLabel(type) {
    switch (type) {
        case 'image': return 'פוסט תמונה';
        case 'video': return 'פוסט וידאו';
        default: return 'טקסט בלבד';
    }
}

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}