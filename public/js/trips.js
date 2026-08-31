// אתחול וטעינת הנתונים
function initMap() {
    loadTrips();
}
window.initMap = initMap;

// טעינת המסלולים מה-DB באמצעות Ajax והצגתם בטבלה
function loadTrips() {
    $.ajax({
        url: '/posts',
        type: 'GET',
        success: function(posts) {
            const tbody = document.getElementById('tripsTableBody');
            if (!tbody) return;
            
            tbody.innerHTML = '';

            if (!posts || posts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">אין מסלולים להצגה עדיין. הוסיפו מסלול ראשון!</td></tr>';
                return;
            }

            posts.forEach(post => {
                const row = document.createElement('tr');
                row.style.cursor = 'pointer';
                row.innerHTML = `
                    <td>${post.title || ''}</td>
                    <td>${post.location?.address || 'כללי'}</td>
                    <td>${post.content || ''}</td>
                    <td>קל</td>
                    <td>
                        <button onclick="deleteTrip('${post._id}')" style="color:red; cursor:pointer;">מחק</button>
                    </td>
                `;

                // בלחיצה על שורה בטבלה – המפה מתמקדת במיקום המסלול
                row.addEventListener('click', function() {
                    if (post.location?.lat && post.location?.lng) {
                        updateMapLocation(post.location.lat, post.location.lng);
                    }
                });

                tbody.appendChild(row);
            });
        },
        error: function(err) {
            console.error('שגיאה בטעינת הנתונים:', err);
        }
    });
}

// עדכון מיקום המפה ב-Iframe
function updateMapLocation(lat, lng) {
    const mapFrame = document.getElementById('mapFrame');
    if (mapFrame && lat && lng) {
        mapFrame.src = `https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`;
    }
}

// מחיקת מסלול ב-Ajax
window.deleteTrip = function(id) {
    if (!confirm('האם למחוק את המסלול?')) return;

    $.ajax({
        url: '/posts/' + id,
        type: 'DELETE',
        success: function(response) {
            alert('המסלול נמחק בהצלחה');
            loadTrips(); // טעינה מחדש של הנתונים בטבלה
        },
        error: function(err) {
            console.error('Delete error details:', err.responseJSON || err);
            alert('שגיאה במחיקת המסלול: ' + (err.responseJSON?.message || 'שגיאת שרת'));
        }
    });
};

// חיפוש מהיר בטבלה לפי כותרת
function searchTable() {
    var input = document.getElementById("tableNameSearch");
    var filter = input.value.toLowerCase();
    var table = document.getElementById("tripsTable");
    if (!table) return;
    var tr = table.getElementsByTagName("tr");

    for (var i = 1; i < tr.length; i++) {
        var td = tr[i].getElementsByTagName("td")[0];
        if (td) {
            var txtValue = td.textContent || td.innerText;
            if (txtValue.toLowerCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

// מיון הטבלה לפי שם המסלול
var isAsc = true;
function sortTableByTime() {
    var table = document.getElementById("tripsTable");
    if (!table) return;
    var tbody = table.querySelector("tbody");
    var rows = Array.from(tbody.querySelectorAll("tr"));

    rows.sort(function(a, b) {
        var tdA = a.getElementsByTagName("td")[0]?.innerText || '';
        var tdB = b.getElementsByTagName("td")[0]?.innerText || '';
        return isAsc ? tdA.localeCompare(tdB) : tdB.localeCompare(tdA);
    });

    isAsc = !isAsc;

    for (var i = 0; i < rows.length; i++) {
        tbody.appendChild(rows[i]);
    }
}

// אירועים בטעינת הדף
document.addEventListener("DOMContentLoaded", function() {
    var searchInput = document.getElementById("tableNameSearch");
    var sortHeader = document.getElementById("sortTimeHeader");
    var submitBtn = document.getElementById("submitBtn");

    if (searchInput) searchInput.addEventListener("keyup", searchTable);
    if (sortHeader) sortHeader.addEventListener("click", sortTableByTime);

    loadTrips();

    if (submitBtn) {
        submitBtn.addEventListener("click", function(e) {
            e.preventDefault();

            const latVal = parseFloat(document.getElementById('tripLat')?.value);
            const lngVal = parseFloat(document.getElementById('tripLng')?.value);

            const newPost = {
                title: document.getElementById('tripTitle')?.value,
                content: document.getElementById('tripContent')?.value,
                location: {
                    address: document.getElementById('tripAddress')?.value,
                    lat: !isNaN(latVal) ? latVal : 0,
                    lng: !isNaN(lngVal) ? lngVal : 0
                }
            };

            $.ajax({
                url: '/posts',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(newPost),
                success: function() {
                    alert('המסלול התווסף בהצלחה!');
                    const form = document.getElementById('addTripForm');
                    if (form) form.reset();
                    
                    // במידה והוכנסו קואורדינטות, נמקד את המפה
                    if (!isNaN(latVal) && !isNaN(lngVal) && latVal !== 0 && lngVal !== 0) {
                        updateMapLocation(latVal, lngVal);
                    }
                    loadTrips();
                },
                error: function(err) {
                    alert('שגיאה בשמירת המסלול');
                }
            });
        });
    }
});