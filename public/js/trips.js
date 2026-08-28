let map;
let markers = [];

// אתחול מפת גוגל
function initMap() {
    const defaultCenter = { lat: 31.7683, lng: 35.2137 }; // ירושלים
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 8,
        center: defaultCenter
    });

    loadTrips();
}

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

            posts.forEach(post => {
                // הוספת שורה לטבלה
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${post.title}</td>
                    <td>${post.location?.address || 'כללי'}</td>
                    <td>${post.content}</td>
                    <td>קל</td>
                    <td>
                        <button onclick="deleteTrip('${post._id}')" style="color:red; cursor:pointer;">מחק</button>
                    </td>
                `;
                tbody.appendChild(row);

                // הוספת מרקר למפה במידה וקיימות קואורדינטות
                if (post.location && post.location.lat && post.location.lng) {
                    addMarker(post);
                }
            });
        },
        error: function(err) {
            console.error('שגיאה שטעינת הנתונים:', err);
        }
    });
}

// הוספת מרקר למפה
function addMarker(post) {
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

// מחיקת מסלול ב-Ajax
function deleteTrip(id) {
    if (!confirm('האם למחוק את המסלול?')) return;

    $.ajax({
        url: '/posts/' + id,
        type: 'DELETE',
        success: function() {
            loadTrips();
        },
        error: function(err) {
            alert('שגיאה במחיקת המסלול');
        }
    });
}

// חיפוש בטבלה
function searchTable() {
    var input = document.getElementById("tableNameSearch");
    var filter = input.value.toLowerCase();
    var table = document.getElementById("tripsTable");
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

// מיון לפי זמן
var isAsc = true;
function sortTableByTime() {
    var table = document.getElementById("tripsTable");
    var tbody = table.querySelector("tbody");
    var rows = Array.from(tbody.querySelectorAll("tr"));

    rows.sort(function(a, b) {
        var timeA = parseFloat(a.getElementsByTagName("td")[2].innerText) || 0;
        var timeB = parseFloat(b.getElementsByTagName("td")[2].innerText) || 0;
        return isAsc ? timeA - timeB : timeB - timeA;
    });

    isAsc = !isAsc;

    for (var i = 0; i < rows.length; i++) {
        tbody.appendChild(rows[i]);
    }
}

// חיבור אירועים בטעינת הדף
document.addEventListener("DOMContentLoaded", function() {
    var searchInput = document.getElementById("tableNameSearch");
    var sortHeader = document.getElementById("sortTimeHeader");
    var addForm = document.getElementById("addTripForm");

    if (searchInput) searchInput.addEventListener("keyup", searchTable);
    if (sortHeader) sortHeader.addEventListener("click", sortTableByTime);

    // טיפול בשליחת טופס הוספת מסלול ב-Ajax
    if (addForm) {
        addForm.addEventListener("submit", function(e) {
            e.preventDefault();

            const newPost = {
                title: document.getElementById('tripTitle').value,
                content: document.getElementById('tripContent').value,
                location: {
                    address: document.getElementById('tripAddress').value,
                    lat: parseFloat(document.getElementById('tripLat').value),
                    lng: parseFloat(document.getElementById('tripLng').value)
                }
            };

            $.ajax({
                url: '/posts',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(newPost),
                success: function() {
                    addForm.reset();
                    loadTrips();
                },
                error: function(err) {
                    alert('שגיאה בשמירת המסלול');
                }
            });
        });
    }
});