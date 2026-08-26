document.addEventListener('DOMContentLoaded', () => {
    // מבנה נתונים מופרד (בעתיד ניתן לשלוף פקודת fetch מהשרת)
    const tipsData = [
        {
            level: 'easy',
            icon: '🟢',
            title: 'טיפים למסלולים קלים',
            content: 'במסלולים אלו הדגש הוא על הנאה ומשפחתיות. מומלץ להצטייד ב-1.5 ליטר מים לאדם, כובע וקרם הגנה. רוב המסלולים האלו מתאימים לילדים קטנים ומוצלים בחלקם הגדול.'
        },
        {
            level: 'medium',
            icon: '🟠',
            title: 'טיפים למסלולים בינוניים',
            content: 'כאן נדרש מאמץ גופני קל. חובה לנעול נעלי הליכה סגורות (לא סנדלים). יש להביא לפחות 3 ליטר מים לאדם ולהתחיל את המסלול לפני שעות הצהריים החמות.'
        },
        {
            level: 'hard',
            icon: '🔴',
            title: 'טיפים למסלולים הקשים',
            content: '<strong>זהירות:</strong> מסלולים אלו דורשים הכנה מוקדמת. חובה להצטייד ב-5 ליטר מים, פנס ראש, ומפה מעודכנת. אין לצאת למסלולים אלו בימים של עומס חום כבד או סכנת שיטפונות בנחלים.'
        }
    ];

    renderTips(tipsData);
});

function renderTips(tips) {
    const container = document.getElementById('tips-grid');
    if (!container) return;

    container.innerHTML = tips.map(tip => `
        <article class="tip-card ${tip.level}">
            <div class="tip-card-header">
                <span>${tip.icon}</span>
                <h3>${tip.title}</h3>
            </div>
            <p>${tip.content}</p>
        </article>
    `).join('');
}