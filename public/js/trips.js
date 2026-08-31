let map = null;
let geocoder = null;

let currentUserId = null;
let editingTripId = null;

let isAsc = true;
let allDbTrips = [];

const markersByTripId = new Map();
const geocodeCache = new Map();


// ========================================
// משתמש/ת מחובר
// ========================================

async function getCurrentUser() {
    try {
        const res = await fetch(
            '/auth/me',
            {
                credentials: 'include'
            }
        );

        if (!res.ok) {
            return;
        }

        const data = await res.json();
        const user = data.user || data;

        currentUserId = String(
            user._id ||
            user.id ||
            user.userId ||
            data.userId ||
            ''
        );

    } catch (err) {
        console.error(
            'שגיאה בבדיקת המשתמש:',
            err
        );
    }
}


function isMyTrip(trip) {
    if (
        !currentUserId ||
        !trip.author
    ) {
        return false;
    }

    const authorId = typeof trip.author === 'object'
        ? (trip.author._id || trip.author.id)
        : trip.author;

    return String(authorId || '') === currentUserId;
}


// ========================================
// GOOGLE MAPS
// ========================================

async function loadGoogleMaps() {
    const status = document.getElementById('mapStatus');

    try {
        const res = await fetch('/api/maps-key');
        const data = await res.json();

        if (!res.ok || !data.key) {
            throw new Error(
                data.message || 'Google Maps API Key חסר'
            );
        }

        // אם כבר נטען
        if (window.google && window.google.maps) {
            initMap();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=' +
            encodeURIComponent(data.key) +
            '&v=weekly';

        script.async = true;
        script.defer = true;
        script.onload = initMap;

        script.onerror = () => {
            if (status) {
                status.textContent = 'לא ניתן לטעון את Google Maps.';
            }
        };

        document.head.appendChild(script);

    } catch (err) {
        console.error(
            'שגיאה בטעינת Google Maps:',
            err
        );

        if (status) {
            status.textContent = 'שגיאה בטעינת המפה: ' + err.message;
        }
    }
}


function initMap() {
    const mapElement = document.getElementById('map');

    if (!mapElement || !window.google || !window.google.maps) {
        return;
    }

    map = new google.maps.Map(
        mapElement,
        {
            center: {
                lat: 31.5,
                lng: 34.8
            },
            zoom: 8
        }
    );

    geocoder = new google.maps.Geocoder();

    const status = document.getElementById('mapStatus');
    if (status) {
        status.textContent = 'המפה נטענה. מסלולים מה-DB יסומנו עליה.';
    }

    renderAllMarkers();
}


function clearMarkers() {
    markersByTripId.forEach(marker => {
        marker.setMap(null);
    });

    markersByTripId.clear();
}



function createMarkerPopup(tripData) {
    const wrapper = document.createElement('div');
    wrapper.style.direction = 'rtl';
    wrapper.style.textAlign = 'right';

    const title = document.createElement('strong');
    title.textContent = tripData.title;

    const address = document.createElement('div');
    address.textContent = tripData.address;

    const details = document.createElement('div');
    details.textContent = tripData.region + ' | ' + tripData.duration + ' שעות | ' + tripData.difficulty;

    wrapper.appendChild(title);
    wrapper.appendChild(address);
    wrapper.appendChild(details);

    return wrapper;
}


async function addMarkerForTrip(trip) {
    const data = getTripData(trip);

    if (
        !trip._id ||
        !data.address ||
        !map ||
        !geocoder
    ) {
        return;
    }

    let position = null;

    const rawLat = trip.location?.lat;
    const rawLng = trip.location?.lng;

    const hasStoredCoordinates =
        rawLat !== null &&
        rawLat !== undefined &&
        rawLat !== '' &&
        rawLng !== null &&
        rawLng !== undefined &&
        rawLng !== '';

    if (hasStoredCoordinates) {
        const lat = Number(rawLat);
        const lng = Number(rawLng);

        // משתמשים בקואורדינטות שמורות רק אם הן באמת תקינות ובישראל
        if (
            Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            lat >= 29 &&
            lat <= 34 &&
            lng >= 34 &&
            lng <= 36
        ) {
            position = {
                lat,
                lng
            };
        }
    }

    // אם אין קואורדינטות תקינות - ממירים את הכתובת
    if (!position) {
        position = await geocodeAddress(data.address);
    }

    if (!position) {
        console.warn(
            'לא ניתן ליצור Marker עבור:',
            data.address
        );
        return;
    }

    const marker = new google.maps.Marker({
        map: map,
        position: position,
        title: data.title
    });

    const infoWindow = new google.maps.InfoWindow({
        content: createMarkerPopup(data)
    });

    marker.addListener('click', () => {
        infoWindow.open({
            map: map,
            anchor: marker
        });
    });

    markersByTripId.set(
        String(trip._id),
        marker
    );
}


function geocodeAddress(address) {
    if (!address || !geocoder) {
        return Promise.resolve(null);
    }

    if (geocodeCache.has(address)) {
        return Promise.resolve(
            geocodeCache.get(address)
        );
    }

    return new Promise(resolve => {
        geocoder.geocode(
            {
                address: address + ', Israel'
            },
            (results, status) => {

                if (
                    status === 'OK' &&
                    results &&
                    results[0]
                ) {
                    const googleLocation =
                        results[0].geometry.location;

                    const position = {
                        lat: googleLocation.lat(),
                        lng: googleLocation.lng()
                    };

                    console.log(
                        'נמצאו קואורדינטות:',
                        address,
                        position
                    );

                    geocodeCache.set(
                        address,
                        position
                    );

                    resolve(position);

                } else {
                    console.warn(
                        'לא נמצא מיקום עבור:',
                        address,
                        'status:',
                        status
                    );

                    resolve(null);
                }
            }
        );
    });
}

async function renderAllMarkers() {
    if (!map || !geocoder) {
        return;
    }

    // מוחקים markers ישנים
    markersByTripId.forEach(marker => {
        marker.setMap(null);
    });

    markersByTripId.clear();

    // רק מסלולים שיש להם כתובת
    const tripsWithAddress = allDbTrips.filter(trip => {
        const tripData = getTripData(trip);
        return tripData.address && tripData.address.trim() !== '';
    });

    if (tripsWithAddress.length === 0) {
        const status = document.getElementById('mapStatus');

        if (status) {
            status.textContent = 'אין עדיין מסלולים עם כתובת להצגה במפה.';
        }

        return;
    }

    // יוצרים markers
    for (const trip of tripsWithAddress) {
        try {
            await addMarkerForTrip(trip);
        } catch (err) {
            console.error(
                'שגיאה בהוספת מסלול למפה:',
                trip.title,
                err
            );
        }
    }

    // אוספים רק מיקומים תקינים
    const validPositions = [];

    markersByTripId.forEach(marker => {
        const position = marker.getPosition();

        if (!position) {
            return;
        }

        const lat = position.lat();
        const lng = position.lng();

        // המסלולים אצלנו בישראל
        if (
            Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            lat >= 29 &&
            lat <= 34 &&
            lng >= 34 &&
            lng <= 36
        ) {
            validPositions.push({
                lat: lat,
                lng: lng
            });
        }
    });

    // מסלול אחד - מתמקדים עליו
    if (validPositions.length === 1) {
        map.setCenter(validPositions[0]);
        map.setZoom(13);
    }

    // כמה מסלולים - מציגים את כולם
    else if (validPositions.length > 1) {
        const bounds = new google.maps.LatLngBounds();

        validPositions.forEach(position => {
            bounds.extend(position);
        });

        map.fitBounds(bounds);
    }

    // אין נקודות תקינות
    else {
        map.setCenter({
            lat: 31.5,
            lng: 34.8
        });

        map.setZoom(8);
    }

    const status = document.getElementById('mapStatus');

    if (status) {
        status.textContent =
            'מוצגים ' +
            validPositions.length +
            ' מסלולים על המפה';
    }
}

function focusTripOnMap(trip) {
    if (!map || !trip || !trip._id) {
        return;
    }

    const marker = markersByTripId.get(String(trip._id));

    if (!marker) {
        return;
    }

    map.panTo(marker.getPosition());
    map.setZoom(14);

    document.querySelector('.map-section')?.scrollIntoView({
        behavior: 'smooth'
    });
}


// ========================================
// נתוני מסלול
// ========================================

function getContentValue(content, label) {
    const part = String(content || '')
        .split('|')
        .map(item => item.trim())
        .find(item => item.startsWith(label + ':'));

    return part ? part.slice(label.length + 1).trim() : '';
}


function getTripData(trip) {
    const content = trip.content || '';
    let address = '';

    if (trip.location && typeof trip.location === 'object') {
        address = trip.location.address || '';
    } else if (typeof trip.location === 'string') {
        address = trip.location;
    }

    return {
        title: trip.title || 'ללא שם',
        region: trip.region || getContentValue(content, 'אזור') || 'מרכז',
        duration: Number(trip.duration || getContentValue(content, 'משך')) || 2,
        difficulty: trip.difficulty || getContentValue(content, 'רמת קושי') || 'קל',
        address: address || getContentValue(content, 'מיקום')
    };
}


function buildTripContent(region, duration, difficulty, address) {
    return 'אזור: ' + region + ' | משך: ' + duration + ' | רמת קושי: ' + difficulty + ' | מיקום: ' + address;
}


function regionToEnglish(region) {
    if (region === 'צפון' || region === 'north') {
        return 'north';
    }
    if (region === 'דרום' || region === 'south') {
        return 'south';
    }
    return 'center';
}


// ========================================
// מזג אוויר
// ========================================

function loadTableWeather() {
    ['north', 'center', 'south'].forEach(region => {
        fetch('/api/weather?region=' + region)
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    return;
                }

                document.querySelectorAll('.weather-cell[data-region="' + region + '"]')
                    .forEach(cell => {
                        cell.innerHTML = '☀️ ' + data.temperature + '°C | <bdi dir="rtl">' + data.windspeed + ' קמ"ש</bdi>';
                    });
            })
            .catch(err => {
                console.error('שגיאה בטעינת מזג האוויר:', err);
            });
    });
}


// ========================================
// טבלה
// ========================================

function prepareStaticRows() {
    document.querySelectorAll('#tripsTableBody tr').forEach(row => {
        if (!row.classList.contains('db-trip-row') && row.cells.length === 5) {
            const cell = document.createElement('td');
            cell.textContent = '—';
            row.appendChild(cell);
        }
    });
}


function makeButton(text, className, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.className = className;
    button.addEventListener('click', onClick);

    return button;
}


function addTripToTable(trip) {
    const data = getTripData(trip);

    if (!trip._id || !data.address) {
        return;
    }

    const tbody = document.getElementById('tripsTableBody');

    if (!tbody || document.getElementById('trip-row-' + trip._id)) {
        return;
    }

    const row = document.createElement('tr');
    row.id = 'trip-row-' + trip._id;
    row.className = 'db-trip-row';

    const values = [
        data.title,
        data.region,
        data.duration + ' שעות',
        data.difficulty
    ];

    values.forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
    });

    // מזג אוויר
    const weather = document.createElement('td');
    weather.className = 'weather-cell';
    weather.dataset.region = regionToEnglish(data.region);
    weather.textContent = 'טוען...';
    row.appendChild(weather);

    // פעולות
    const actions = document.createElement('td');
    const buttons = document.createElement('div');
    buttons.className = 'trip-action-buttons';

    // הצגה במפה
    buttons.appendChild(
        makeButton('הצג במפה', 'btn-map', () => focusTripOnMap(trip))
    );

    // עריכה / מחיקה
    if (isMyTrip(trip)) {
        buttons.appendChild(
            makeButton('ערוך', 'btn-edit', () => startEditTrip(trip))
        );

        buttons.appendChild(
            makeButton('מחק', 'btn-delete', () => deleteTrip(trip._id))
        );
    }

    actions.appendChild(buttons);
    row.appendChild(actions);

    tbody.insertBefore(row, tbody.firstChild);
}


// ========================================
// טעינת המסלולים מה-DB
// ========================================

async function loadTrips() {
    document.querySelectorAll('.db-trip-row').forEach(row => row.remove());

    try {
        const res = await fetch('/posts', { credentials: 'include' });

        if (!res.ok) {
            throw new Error('לא ניתן לטעון מסלולים');
        }

        const posts = await res.json();
        allDbTrips = Array.isArray(posts) ? posts : [];

        allDbTrips
            .filter(post => getTripData(post).address)
            .forEach(addTripToTable);

        loadTableWeather();
        await renderAllMarkers();

    } catch (err) {
        console.error('שגיאה בטעינת המסלולים:', err);
    }
}


// ========================================
// הודעה בטופס
// ========================================

function setFormMessage(text, color) {
    const message = document.getElementById('tripFormMessage');
    if (!message) {
        return;
    }
    message.textContent = text;
    message.style.color = color;
}


// ========================================
// איפוס טופס
// ========================================

function resetTripForm() {
    editingTripId = null;

    document.getElementById('addTripForm')?.reset();

    const titleElem = document.getElementById('tripFormTitle');
    if (titleElem) titleElem.textContent = 'הוספת מסלול טיול חדש';

    const submitBtn = document.getElementById('tripSubmitButton');
    if (submitBtn) submitBtn.textContent = 'הוסף מסלול';

    const cancelBtn = document.getElementById('cancelEditButton');
    if (cancelBtn) cancelBtn.hidden = true;
}


// ========================================
// התחלת עריכה
// ========================================

function startEditTrip(trip) {
    if (!isMyTrip(trip)) {
        alert('אין הרשאה לערוך מסלול של משתמש אחר.');
        return;
    }

    const data = getTripData(trip);
    editingTripId = String(trip._id);

    const titleInput = document.getElementById('tripTitle');
    if (titleInput) titleInput.value = data.title;

    const diffInput = document.getElementById('tripDifficulty');
    if (diffInput) diffInput.value = data.difficulty;

    const regInput = document.getElementById('tripRegion');
    if (regInput) regInput.value = data.region;

    const durInput = document.getElementById('tripDuration');
    if (durInput) durInput.value = data.duration;

    const locInput = document.getElementById('tripLocation');
    if (locInput) locInput.value = data.address;

    const formTitle = document.getElementById('tripFormTitle');
    if (formTitle) formTitle.textContent = 'עריכת מסלול';

    const submitBtn = document.getElementById('tripSubmitButton');
    if (submitBtn) submitBtn.textContent = 'שמור שינויים';

    const cancelBtn = document.getElementById('cancelEditButton');
    if (cancelBtn) cancelBtn.hidden = false;

    setFormMessage('', '#333');

    document.querySelector('.add-trip-section')?.scrollIntoView({
        behavior: 'smooth'
    });
}


// ========================================
// קריאת נתוני טופס
// ========================================

function getFormTripData() {
    return {
        title: document.getElementById('tripTitle')?.value.trim() || '',
        difficulty: document.getElementById('tripDifficulty')?.value || '',
        region: document.getElementById('tripRegion')?.value || '',
        duration: Number(document.getElementById('tripDuration')?.value) || 0,
        address: document.getElementById('tripLocation')?.value.trim() || ''
    };
}


function isValidTripForm(data) {
    return Boolean(
        data.title &&
        ['קל', 'בינוני', 'קשה'].includes(data.difficulty) &&
        ['צפון', 'מרכז', 'דרום'].includes(data.region) &&
        Number.isFinite(data.duration) &&
        data.duration >= 0.5 &&
        data.address
    );
}


// ========================================
// POST / PUT
// ========================================

async function submitTrip(event) {
    event.preventDefault();

    const data = getFormTripData();

    if (!isValidTripForm(data)) {
        setFormMessage(
            'יש למלא את כל השדות בצורה תקינה.',
            '#d32f2f'
        );
        return;
    }

    const body = {
        title: data.title,
        content: buildTripContent(
            data.region,
            data.duration,
            data.difficulty,
            data.address
        ),
        postType: 'text',
        region: data.region,
        duration: data.duration,
        difficulty: data.difficulty,
        location: {
            address: data.address
        }
    };

    const isEditing = Boolean(editingTripId);
    const idBeforeRequest = editingTripId;

    const url = isEditing ? '/posts/' + editingTripId : '/posts';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(body)
        });

        const responseData = await res.json().catch(() => ({}));

        if (res.status === 401) {
            throw new Error('יש להתחבר למערכת.');
        }

        if (res.status === 403) {
            throw new Error('אין הרשאה לשנות מסלול של משתמש אחר.');
        }

        if (!res.ok) {
            throw new Error(
                responseData.message ||
                (isEditing ? 'לא ניתן לעדכן את המסלול.' : 'לא ניתן להוסיף את המסלול.')
            );
        }

        setFormMessage(
            isEditing ? 'המסלול עודכן בהצלחה!' : 'המסלול נוסף בהצלחה!',
            '#2e7d32'
        );

        resetTripForm();
        await loadTrips();

        const savedId = responseData._id || idBeforeRequest;
        const savedTrip = allDbTrips.find(
            trip => String(trip._id) === String(savedId)
        );

        if (savedTrip) {
            focusTripOnMap(savedTrip);
        }

    } catch (err) {
        setFormMessage(
            'שגיאה: ' + err.message,
            '#d32f2f'
        );
    }
}


// ========================================
// DELETE
// ========================================

async function deleteTrip(id) {
    if (!confirm('האם למחוק את המסלול?')) {
        return;
    }

    try {
        const res = await fetch('/posts/' + id, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await res.json().catch(() => ({}));

        if (res.status === 401) {
            throw new Error('יש להתחבר למערכת.');
        }

        if (res.status === 403) {
            throw new Error('אין הרשאה למחוק מסלול של משתמש אחר.');
        }

        if (!res.ok) {
            throw new Error(
                data.message || 'לא ניתן למחוק את המסלול.'
            );
        }

        if (editingTripId === String(id)) {
            resetTripForm();
        }

        await loadTrips();

    } catch (err) {
        alert(err.message);
    }
}


// ========================================
// חיפוש
// ========================================

function searchTable() {
    const filter = document.getElementById('tableNameSearch')?.value.toLowerCase() || '';

    document.querySelectorAll('#tripsTableBody tr').forEach(row => {
        const name = row.cells[0]?.textContent.toLowerCase() || '';
        row.style.display = name.includes(filter) ? '' : 'none';
    });
}


// ========================================
// מיון
// ========================================

function sortTableByTime() {
    const tbody = document.getElementById('tripsTableBody');
    if (!tbody) return;

    const rows = Array.from(tbody.rows);

    rows.sort((a, b) => {
        const aTime = parseFloat(a.cells[2]?.textContent) || 0;
        const bTime = parseFloat(b.cells[2]?.textContent) || 0;

        return isAsc ? aTime - bTime : bTime - aTime;
    });

    isAsc = !isAsc;

    rows.forEach(row => tbody.appendChild(row));
}


// ========================================
// הפעלת הדף
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    prepareStaticRows();

    document.getElementById('tableNameSearch')?.addEventListener('keyup', searchTable);
    document.getElementById('sortTimeHeader')?.addEventListener('click', sortTableByTime);
    document.getElementById('addTripForm')?.addEventListener('submit', submitTrip);
    document.getElementById('cancelEditButton')?.addEventListener('click', resetTripForm);

    await getCurrentUser();
    await loadTrips();
    await loadGoogleMaps();
});