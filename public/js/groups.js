let currentUserId = null;
let allGroups = [];
let selectedGroupId = null;


// ========================================
// CURRENT USER
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
            currentUserId = null;
            return false;
        }

        const data = await response.json();
        const user = data.user || data;

        currentUserId = String(
            user._id ||
            user.id ||
            user.userId ||
            data.userId ||
            ''
        );

        return Boolean(currentUserId);

    } catch (error) {
        console.error(
            'Error loading current user:',
            error
        );

        currentUserId = null;
        return false;
    }
}


// ========================================
// LOAD GROUPS
// ========================================

async function loadGroups() {
    const status =
        document.getElementById(
            'groupsStatus'
        );

    try {
        status.textContent =
            'טוען קבוצות...';

        const response =
            await fetch('/groups', {
                credentials: 'include'
            });

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Failed to load groups'
            );
        }

        allGroups =
            Array.isArray(data)
                ? data
                : [];

        renderGroups();

        status.textContent =
            allGroups.length
                ? `נמצאו ${allGroups.length} קבוצות`
                : 'עדיין לא נוצרו קבוצות.';

    } catch (error) {
        console.error(
            'Error loading groups:',
            error
        );

        status.textContent =
            'שגיאה בטעינת הקבוצות.';
    }
}


// ========================================
// HELPERS
// ========================================

function getId(value) {
    if (!value) {
        return '';
    }

    if (typeof value === 'object') {
        return String(
            value._id ||
            value.id ||
            ''
        );
    }

    return String(value);
}


function isGroupAdmin(group) {
    return (
        currentUserId &&
        getId(group.admin) === currentUserId
    );
}


function isGroupMember(group) {
    if (
        !currentUserId ||
        !Array.isArray(group.members)
    ) {
        return false;
    }

    return group.members.some(
        member =>
            getId(member) === currentUserId
    );
}


function escapeHtml(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
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


// ========================================
// RENDER GROUPS
// ========================================

function renderGroups() {
    const container =
        document.getElementById(
            'groupsContainer'
        );

    container.innerHTML = '';

    if (!allGroups.length) {
        container.innerHTML = `
            <div class="empty-groups">
                עדיין אין קבוצות במערכת.
                צרו את הקבוצה הראשונה!
            </div>
        `;

        return;
    }

    allGroups.forEach(group => {
        const card =
            document.createElement(
                'article'
            );

        card.className =
            'group-card';

        const admin =
            isGroupAdmin(group);

        const member =
            isGroupMember(group);

        const adminName =
            group.admin &&
            typeof group.admin === 'object'
                ? group.admin.username
                : 'לא ידוע';

        const memberCount =
            Array.isArray(group.members)
                ? group.members.length
                : 0;


        let actionButtons = '';

        if (admin) {
            actionButtons = `
                <button
                    type="button"
                    class="group-btn"
                    data-action="posts"
                    data-id="${group._id}"
                >
                    פוסטים בקבוצה
                </button>

                <button
                    type="button"
                    class="group-btn edit-btn"
                    data-action="edit"
                    data-id="${group._id}"
                >
                    עריכה
                </button>

                <button
                    type="button"
                    class="group-btn delete-btn"
                    data-action="delete"
                    data-id="${group._id}"
                >
                    מחיקה
                </button>
            `;

        } else if (member) {
            actionButtons = `
                <button
                    type="button"
                    class="group-btn"
                    data-action="posts"
                    data-id="${group._id}"
                >
                    פוסטים בקבוצה
                </button>

                <button
                    type="button"
                    class="group-btn leave-btn"
                    data-action="leave"
                    data-id="${group._id}"
                >
                    עזיבת קבוצה
                </button>
            `;

        } else {
            actionButtons = `
                <button
                    type="button"
                    class="group-btn join-btn"
                    data-action="join"
                    data-id="${group._id}"
                >
                    הצטרפות לקבוצה
                </button>
            `;
        }


        let membershipLabel = '';

        if (admin) {
            membershipLabel = `
                <span class="membership-badge admin-badge">
                    מנהל/ת הקבוצה
                </span>
            `;

        } else if (member) {
            membershipLabel = `
                <span class="membership-badge member-badge">
                    חבר/ה בקבוצה
                </span>
            `;
        }


        card.innerHTML = `
            <div class="group-card-header">

                <div>
                    <h3>
                        ${escapeHtml(group.name)}
                    </h3>

                    ${membershipLabel}
                </div>

                <span class="region-badge">
                    ${escapeHtml(group.region)}
                </span>

            </div>

            <p class="group-description">
                ${
                    escapeHtml(
                        group.description
                    ) ||
                    'אין תיאור לקבוצה.'
                }
            </p>

            <div class="group-details">

                <span>
                    <strong>מנהל/ת:</strong>
                    ${escapeHtml(adminName)}
                </span>

                <span>
                    <strong>חברים:</strong>
                    ${memberCount}
                </span>

            </div>

            <div class="group-actions">
                ${actionButtons}
            </div>
        `;

        container.appendChild(card);
    });
}


// ========================================
// CREATE GROUP
// ========================================

async function createGroup(event) {
    event.preventDefault();

    if (!currentUserId) {
        window.location.href =
            '/login.html';
        return;
    }

    const message =
        document.getElementById(
            'groupFormMessage'
        );

    const name =
        document.getElementById(
            'groupName'
        ).value.trim();

    const region =
        document.getElementById(
            'groupRegion'
        ).value;

    const description =
        document.getElementById(
            'groupDescription'
        ).value.trim();


    if (!name || !region) {
        message.textContent =
            'יש להזין שם קבוצה ואזור.';

        message.className =
            'groups-message error';

        return;
    }


    try {
        const response =
            await fetch('/groups', {
                method: 'POST',

                credentials:
                    'include',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify({
                    name,
                    region,
                    description
                })
            });


        const data =
            await response.json();


        if (!response.ok) {
            throw new Error(
                data.message ||
                'Failed to create group'
            );
        }


        message.textContent =
            'הקבוצה נוצרה בהצלחה!';

        message.className =
            'groups-message success';


        document
            .getElementById(
                'createGroupForm'
            )
            .reset();


        await loadGroups();

    } catch (error) {
        console.error(
            'Error creating group:',
            error
        );

        message.textContent =
            error.message;

        message.className =
            'groups-message error';
    }
}


// ========================================
// JOIN GROUP
// ========================================

async function joinGroup(groupId) {
    if (!currentUserId) {
        window.location.href =
            '/login.html';
        return;
    }

    try {
        const response =
            await fetch(
                `/groups/${groupId}/join`,
                {
                    method: 'POST',
                    credentials:
                        'include'
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Failed to join group'
            );
        }

        await loadGroups();

    } catch (error) {
        alert(
            'לא ניתן להצטרף לקבוצה: ' +
            error.message
        );
    }
}


// ========================================
// LEAVE GROUP
// ========================================

async function leaveGroup(groupId) {
    if (!currentUserId) {
        window.location.href =
            '/login.html';
        return;
    }

    const confirmed =
        window.confirm(
            'האם לעזוב את הקבוצה?'
        );

    if (!confirmed) {
        return;
    }

    try {
        const response =
            await fetch(
                `/groups/${groupId}/leave`,
                {
                    method: 'POST',
                    credentials:
                        'include'
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Failed to leave group'
            );
        }

        if (
            String(selectedGroupId) ===
            String(groupId)
        ) {
            closeGroupPosts();
        }

        await loadGroups();

    } catch (error) {
        alert(
            'לא ניתן לעזוב את הקבוצה: ' +
            error.message
        );
    }
}


// ========================================
// GROUP POSTS
// ========================================

async function openGroupPosts(groupId) {
    if (!currentUserId) {
        window.location.href =
            '/login.html';

        return;
    }

    const group =
        allGroups.find(
            item =>
                String(item._id) ===
                String(groupId)
        );

    if (!group) {
        return;
    }

    selectedGroupId =
        String(groupId);

    document.getElementById(
        'groupPostsTitle'
    ).textContent =
        `פוסטים בקבוצה: ${group.name}`;

    document.getElementById(
        'groupPostMessage'
    ).textContent = '';

    const section =
        document.getElementById(
            'groupPostsSection'
        );

    section.classList.remove(
        'hidden'
    );

    await loadGroupPosts();

    section.scrollIntoView({
        behavior: 'smooth'
    });
}


async function loadGroupPosts() {
    if (!selectedGroupId) {
        return;
    }

    const status =
        document.getElementById(
            'groupPostsStatus'
        );

    const container =
        document.getElementById(
            'groupPostsContainer'
        );

    status.textContent =
        'טוען פוסטים...';

    container.innerHTML = '';

    try {
        const response =
            await fetch(
                `/groups/${selectedGroupId}/posts`,
                {
                    credentials:
                        'include'
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Failed to load group posts'
            );
        }

        status.textContent = '';

        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {
            container.innerHTML = `
                <div class="empty-groups">
                    עדיין אין פוסטים בקבוצה.
                </div>
            `;

            return;
        }

        container.innerHTML =
            data
                .map(post => {
                    const author =
                        post.author?.username ||
                        'משתמש לא ידוע';

                    return `
                        <article class="group-post-card">

                            <h4>
                                ${escapeHtml(post.title)}
                            </h4>

                            <p>
                                ${escapeHtml(post.content)}
                            </p>

                            <div class="group-post-meta">

                                <span>
                                    ${escapeHtml(author)}
                                </span>

                                <span>
                                    ${formatDate(post.createdAt)}
                                </span>

                            </div>

                        </article>
                    `;
                })
                .join('');

    } catch (error) {
        console.error(
            'Error loading group posts:',
            error
        );

        status.textContent =
            'שגיאה בטעינת פוסטי הקבוצה.';
    }
}


async function createGroupPost(event) {
    event.preventDefault();

    if (
        !currentUserId ||
        !selectedGroupId
    ) {
        return;
    }

    const title =
        document.getElementById(
            'groupPostTitle'
        ).value.trim();

    const content =
        document.getElementById(
            'groupPostContent'
        ).value.trim();

    const message =
        document.getElementById(
            'groupPostMessage'
        );


    if (!title || !content) {
        message.textContent =
            'יש להזין כותרת ותוכן.';

        message.className =
            'groups-message error';

        return;
    }


    try {
        const response =
            await fetch(
                `/groups/${selectedGroupId}/posts`,
                {
                    method: 'POST',

                    credentials:
                        'include',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            title,
                            content,

                            // כרגע Text בלבד.
                            // מוריה מטפלת ב-Post Types.
                            postType: 'text'
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Failed to create group post'
            );
        }

        document
            .getElementById(
                'groupPostForm'
            )
            .reset();

        message.textContent =
            'הפוסט פורסם בקבוצה בהצלחה.';

        message.className =
            'groups-message success';

        await loadGroupPosts();

    } catch (error) {
        console.error(
            'Error creating group post:',
            error
        );

        message.textContent =
            error.message;

        message.className =
            'groups-message error';
    }
}


function closeGroupPosts() {
    selectedGroupId = null;

    document
        .getElementById(
            'groupPostForm'
        )
        .reset();

    document
        .getElementById(
            'groupPostsSection'
        )
        .classList.add(
            'hidden'
        );

    document.getElementById(
        'groupPostMessage'
    ).textContent = '';

    document.getElementById(
        'groupPostsStatus'
    ).textContent = '';

    document.getElementById(
        'groupPostsContainer'
    ).innerHTML = '';
}


// ========================================
// START EDIT
// ========================================

function startEditGroup(groupId) {
    const group =
        allGroups.find(
            item =>
                String(item._id) ===
                String(groupId)
        );

    if (!group) {
        return;
    }

    document.getElementById(
        'editGroupId'
    ).value =
        group._id;

    document.getElementById(
        'editGroupName'
    ).value =
        group.name || '';

    document.getElementById(
        'editGroupRegion'
    ).value =
        group.region || 'מרכז';

    document.getElementById(
        'editGroupDescription'
    ).value =
        group.description || '';

    const section =
        document.getElementById(
            'editGroupSection'
        );

    section.classList.remove(
        'hidden'
    );

    section.scrollIntoView({
        behavior: 'smooth'
    });
}


// ========================================
// UPDATE GROUP
// ========================================

async function updateGroup(event) {
    event.preventDefault();

    if (!currentUserId) {
        window.location.href =
            '/login.html';
        return;
    }

    const groupId =
        document.getElementById(
            'editGroupId'
        ).value;

    const name =
        document.getElementById(
            'editGroupName'
        ).value.trim();

    const region =
        document.getElementById(
            'editGroupRegion'
        ).value;

    const description =
        document.getElementById(
            'editGroupDescription'
        ).value.trim();

    const message =
        document.getElementById(
            'editGroupMessage'
        );


    try {
        const response =
            await fetch(
                `/groups/${groupId}`,
                {
                    method: 'PUT',

                    credentials:
                        'include',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            name,
                            region,
                            description
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Failed to update group'
            );
        }

        message.textContent =
            'הקבוצה עודכנה בהצלחה.';

        message.className =
            'groups-message success';

        await loadGroups();

        setTimeout(() => {
            closeEditGroup();
        }, 700);

    } catch (error) {
        message.textContent =
            error.message;

        message.className =
            'groups-message error';
    }
}


// ========================================
// DELETE GROUP
// ========================================

async function deleteGroup(groupId) {
    if (!currentUserId) {
        window.location.href =
            '/login.html';
        return;
    }

    const confirmed =
        window.confirm(
            'האם למחוק את הקבוצה? הפעולה אינה ניתנת לביטול.'
        );

    if (!confirmed) {
        return;
    }


    try {
        const response =
            await fetch(
                `/groups/${groupId}`,
                {
                    method: 'DELETE',
                    credentials:
                        'include'
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'Failed to delete group'
            );
        }

        if (
            String(selectedGroupId) ===
            String(groupId)
        ) {
            closeGroupPosts();
        }

        await loadGroups();

    } catch (error) {
        alert(
            'לא ניתן למחוק את הקבוצה: ' +
            error.message
        );
    }
}


// ========================================
// CLOSE EDIT
// ========================================

function closeEditGroup() {
    document
        .getElementById(
            'editGroupForm'
        )
        .reset();

    document
        .getElementById(
            'editGroupSection'
        )
        .classList.add(
            'hidden'
        );

    document.getElementById(
        'editGroupMessage'
    ).textContent = '';
}


// ========================================
// CARD ACTIONS
// ========================================

function handleGroupAction(event) {
    const button =
        event.target.closest(
            '[data-action]'
        );

    if (!button) {
        return;
    }

    const action =
        button.dataset.action;

    const groupId =
        button.dataset.id;


    if (action === 'join') {
        joinGroup(groupId);
    }

    if (action === 'leave') {
        leaveGroup(groupId);
    }

    if (action === 'posts') {
        openGroupPosts(groupId);
    }

    if (action === 'edit') {
        startEditGroup(groupId);
    }

    if (action === 'delete') {
        deleteGroup(groupId);
    }
}


// ========================================
// INIT
// ========================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        await loadCurrentUser();


        document
            .getElementById(
                'createGroupForm'
            )
            .addEventListener(
                'submit',
                createGroup
            );


        document
            .getElementById(
                'editGroupForm'
            )
            .addEventListener(
                'submit',
                updateGroup
            );


        document
            .getElementById(
                'cancelEditGroup'
            )
            .addEventListener(
                'click',
                closeEditGroup
            );


        document
            .getElementById(
                'refreshGroupsBtn'
            )
            .addEventListener(
                'click',
                loadGroups
            );


        document
            .getElementById(
                'groupsContainer'
            )
            .addEventListener(
                'click',
                handleGroupAction
            );


        document
            .getElementById(
                'groupPostForm'
            )
            .addEventListener(
                'submit',
                createGroupPost
            );


        document
            .getElementById(
                'closeGroupPostsBtn'
            )
            .addEventListener(
                'click',
                closeGroupPosts
            );


        await loadGroups();
    }
);