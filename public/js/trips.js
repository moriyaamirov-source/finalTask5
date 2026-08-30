let map;
let markers = [];

// אתחול מפת גוגל
function initMap() {
    const defaultCenter = { lat: 31.7683, lng: 35.2137 }; 
    const mapElement = document.getElementById('map');
    
    if (mapElement && typeof google !== 'undefined' && google.maps) {
        map = new google.maps.Map(mapElement, {
            zoom: 8,
            center: defaultCenter
        });
    }

    loadTrips();
}

window.initMap = initMap;

// טעינת המסלולים מה-DB באמצעות Ajax והצגתם בטבלה ובמפה
function loadTrips() {
    $.ajax({
        url: '/posts',
        type: 'GET',
        success: function(posts) {
            const tbody = document.getElementById('tripsTableBody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            clearMarkers();

            if (!posts || posts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">אין מסלולים להצגה עדיין. הוסיפו מסלול ראשון!</td></tr>';
                return;
            }

            posts.forEach(post => {
                // הוספת שורה לטבלה
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${post.title || ''}</td>
                    <td>${post.location?.address || 'כללי'}</td>
                    <td>${post.content || ''}</td>
                    <td>קל</td>
                    <td>
                        <button onclick="deleteTrip('${post._id}')" style="color:red; cursor:pointer;">מחק</button>
                    </td>
                `;
                tbody.appendChild(row);

                // הוספת מרקר למפה במידה וקיימות קואורדינטות ומפה אתחלה
                if (map && post.location && post.location.lat && post.location.lng) {
                    addMarker(post);
                }
            });
        },
        error: function(err) {
            console.error('שגיאה בטעינת הנתונים:', err);
        }
    });
}

// הוספת מרקר למפה
function addMarker(post) {
    if (!map) return;
    const marker = new google.maps.Marker({
        position: { lat: Number(post.location.lat), lng: Number(post.location.lng) },
        map: map,
        title: post.title
    });

    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="direction: rtl; text-align: right;">
                <h4>${post.title}</h4>
                <p>${post.content}</p>
                <small>${post.location.address || ''}</small>
            </div>
        `
    });

    marker.addListener('click', function() {
        infoWindow.open(map, marker);
    });

    markers.push(marker);
}

// ניקוי מרקרים ישנים
function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
}

// Ajax-מחיקת מסלול ב
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

// חיפוש בטבלה
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

// מיון לפי כותרת/טקסט
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

            const newPost = {
                title: document.getElementById('tripTitle')?.value,
                content: document.getElementById('tripContent')?.value,
                location: {
                    address: document.getElementById('tripAddress')?.value,
                    lat: parseFloat(document.getElementById('tripLat')?.value) || 0,
                    lng: parseFloat(document.getElementById('tripLng')?.value) || 0
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
                    loadTrips();
                },
                error: function(err) {
                    alert('שגיאה בשמירת המסלול');
                }
            });
        });
    }
});