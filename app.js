// Database (LocalStorage)
let currentUser = null;
let db = {
    users: ['Manthan', 'Vihan', 'Nemi'],
    data: {}
};

// Viewer State
let viewerState = {
    module: null,
    items: [],
    index: 0
};

function ensureUserDataStructure(dbRef) {
    const defaultModules = ['posters', 'wardMaps', 'skywalks', 'surveys', 'interviews', 'mapillary', 'problems'];
    if (!Array.isArray(dbRef.users) || dbRef.users.length === 0) {
        dbRef.users = ['Manthan', 'Vihan', 'Nemi'];
    }
    if (!dbRef.data || typeof dbRef.data !== 'object') {
        dbRef.data = {};
    }
    dbRef.users.forEach(user => {
        if (!dbRef.data[user] || typeof dbRef.data[user] !== 'object') {
            dbRef.data[user] = {};
        }
        defaultModules.forEach(module => {
            if (!Array.isArray(dbRef.data[user][module])) {
                dbRef.data[user][module] = [];
            }
        });
    });
}

// Initialize database
function initDB() {
    const stored = localStorage.getItem('urbanAuditDB');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
                ensureUserDataStructure(parsed);
                db = parsed;
            }
        } catch (err) {
            localStorage.removeItem('urbanAuditDB');
            db = {
                users: ['Manthan', 'Vihan', 'Nemi'],
                data: {}
            };
            ensureUserDataStructure(db);
            saveDB();
            return;
        }
    } else {
        ensureUserDataStructure(db);
        saveDB();
    }
}

// Save database
function saveDB() {
    localStorage.setItem('urbanAuditDB', JSON.stringify(db));
}

// Login
function login(username) {
    currentUser = username;
    document.getElementById('currentUser').textContent = username;
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('dashboardScreen').classList.add('active');
    loadModuleData('poster');
}

// Logout
function logout() {
    currentUser = null;
    document.getElementById('dashboardScreen').classList.remove('active');
    document.getElementById('loginScreen').classList.add('active');
}

// Show Module
function showModule(moduleName) {
    // Hide all modules
    document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    // Show selected module
    document.getElementById(moduleName + 'Module').classList.add('active');
    event.target.classList.add('active');
    
    // Load module data
    loadModuleData(moduleName);
}

// Load Module Data
function loadModuleData(moduleName) {
    if (!currentUser) return;
    
    switch(moduleName) {
        case 'poster':
            loadPosters();
            break;
        case 'wardmap':
            loadWardMaps();
            break;
        case 'skywalk':
            loadSkywalks();
            break;
        case 'survey':
            loadSurveys();
            break;
        case 'interview':
            loadInterviews();
            break;
        case 'mapillary':
            loadMapillary();
            break;
        case 'problem':
            loadProblems();
            break;
    }
}

// ======================
// IMAGE VIEWER SYSTEM
// ======================

function openImageViewer() {
    const modal = document.getElementById('imageViewerModal');
    modal.classList.add('active');
    updateViewerContent();
}

function closeImageViewer() {
    document.getElementById('imageViewerModal').classList.remove('active');
}

function updateViewerContent() {
    if (!viewerState.items || viewerState.items.length === 0) return;
    
    const item = viewerState.items[viewerState.index];
    document.getElementById('viewerImage').src = item.image;
    document.getElementById('viewerTitle').textContent = item.title;
    document.getElementById('viewerDescription').textContent = item.description || 'No description';
    document.getElementById('viewerMeta').textContent = `📅 ${item.date}`;
}

function prevImage() {
    if (viewerState.index > 0) {
        viewerState.index--;
        updateViewerContent();
    }
}

function nextImage() {
    if (viewerState.index < viewerState.items.length - 1) {
        viewerState.index++;
        updateViewerContent();
    }
}

function deleteCurrentImage() {
    if (!viewerState.module || !viewerState.items.length) return;
    
    const item = viewerState.items[viewerState.index];
    
    if (viewerState.module === 'posters') {
        deletePoster(item.id);
    } else if (viewerState.module === 'skywalk') {
        const auditId = parseInt(item.id.split('-')[0]);
        deleteSkywalkImage(auditId, viewerState.index);
    } else if (viewerState.module === 'mapillary') {
        const mappingId = parseInt(item.id.split('-')[0]);
        deleteMapillaryImage(mappingId, viewerState.index);
    }
}

// ======================
// MODULE 1: POSTER UPLOAD
// ======================

function openPosterModal() {
    document.getElementById('posterModal').classList.add('active');
}

function closePosterModal() {
    document.getElementById('posterModal').classList.remove('active');
    document.getElementById('posterForm').reset();
}

document.getElementById('posterForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('posterTitle').value;
    const desc = document.getElementById('posterDesc').value;
    const files = document.getElementById('posterFile').files;
    
    if (files.length === 0) {
        alert('Please select at least one image.');
        return;
    }
    
    let processed = 0;
    
    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const poster = {
                id: Date.now() + index,
                title: files.length > 1 ? `${title} (${index + 1})` : title,
                description: desc,
                image: e.target.result,
                date: new Date().toLocaleDateString()
            };
            
            db.data[currentUser].posters.push(poster);
            processed++;
            
            if (processed === files.length) {
                saveDB();
                loadPosters();
                closePosterModal();
                document.getElementById('posterForm').reset();
            }
        };
        reader.readAsDataURL(file);
    });
});

function loadPosters() {
    const grid = document.getElementById('posterGrid');
    const posters = db.data[currentUser].posters;
    
    grid.innerHTML = '';
    
    if (posters.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">📸</div>
                <h3>No Posters Yet</h3>
                <p>Upload your first poster to get started</p>
                <button class="btn-primary" onclick="openPosterModal()">+ Upload Poster</button>
            </div>
        `;
        return;
    }
    
    posters.forEach(poster => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div style="position:relative; margin-bottom:1rem;">
                <img src="${poster.image}" style="width:100%; height:180px; object-fit:cover; border-radius:0.5rem; cursor:pointer;" onclick="viewPoster('${poster.id}')">
                <div style="position:absolute; top:0.5rem; right:0.5rem; display:flex; gap:0.5rem;">
                    <button class="btn-icon" onclick="viewPoster('${poster.id}')" title="View Full Size">👁️</button>
                    <button class="btn-icon delete" onclick="deletePoster('${poster.id}')" title="Delete">🗑️</button>
                </div>
            </div>
            <div class="card-title">${poster.title}</div>
            <div class="card-desc">${poster.description || 'No description'}</div>
            <div class="card-meta">
                <span class="stat-badge">📅 ${poster.date}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

function viewPoster(id) {
    const posters = db.data[currentUser].posters;
    const index = posters.findIndex(p => p.id == id);
    if (index !== -1) {
        viewerState = {
            module: 'posters',
            items: posters,
            index
        };
        openImageViewer();
    }
}

// Close image viewer on Escape key or clicking backdrop
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const viewerModal = document.getElementById('imageViewerModal');
        if (viewerModal.classList.contains('active')) {
            closeImageViewer();
        }
    }
});

// Close when clicking the modal backdrop (outside the content)
document.getElementById('imageViewerModal').addEventListener('click', function(e) {
    if (e.target === this) { // clicked on the semi-transparent background
        closeImageViewer();
    }
});

function deletePoster(id) {
    if (confirm('Delete this poster?')) {
        db.data[currentUser].posters = db.data[currentUser].posters.filter(p => p.id != id);
        saveDB();
        loadPosters();
        if (viewerState.module === 'posters' && viewerState.items.length) {
            viewerState.items = db.data[currentUser].posters;
            if (viewerState.index >= viewerState.items.length) {
                viewerState.index = viewerState.items.length - 1;
            }
            if (viewerState.items.length === 0) {
                closeImageViewer();
            } else {
                updateViewerContent();
            }
        }
    }
}

// ======================
// MODULE 2: WARD MAP
// ======================

function openWardMapModal() {
    document.getElementById('wardMapModal').classList.add('active');
}

function closeWardMapModal() {
    document.getElementById('wardMapModal').classList.remove('active');
    document.getElementById('wardMapForm').reset();
}

document.getElementById('wardMapForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('mapTitle').value.trim();
    const url = document.getElementById('mapUrl').value.trim();
    const fileInput = document.getElementById('mapFile');
    const file = fileInput.files[0];
    const description = document.getElementById('mapDesc').value;
    
    if (!url && !file) {
        alert('Please provide a map URL or upload a KMQ file.');
        return;
    }
    
    const baseMap = {
        id: Date.now(),
        title: title,
        url: url || null,
        description: description,
        date: new Date().toLocaleDateString(),
        fileName: null,
        fileData: null,
        fileType: null
    };
    
    const saveMap = (mapData) => {
        db.data[currentUser].wardMaps.push(mapData);
        saveDB();
        loadWardMaps();
        closeWardMapModal();
    };
    
    if (file) {
        const ext = file.name.split('.').pop().toLowerCase();
        const fileType = ext === 'kmz' ? 'KMZ' : 'KML';
        const reader = new FileReader();
        reader.onload = function(event) {
            saveMap({
                ...baseMap,
                fileName: file.name,
                fileData: event.target.result,
                fileType: fileType
            });
        };
        reader.readAsDataURL(file);
    } else {
        saveMap(baseMap);
    }
});

function loadWardMaps() {
    const list = document.getElementById('wardMapList');
    const maps = db.data[currentUser].wardMaps;
    
    list.innerHTML = '';
    maps.forEach(map => {
        const card = document.createElement('div');
        card.className = 'card';
        const urlSection = map.url ? `<div class="card-desc" style="color:#667eea;">${map.url}</div>` : '';
        const fileSection = map.fileName ? `<div class="card-desc">File: ${map.fileName} (${map.fileType})</div>` : '';
        const openButton = map.url ? `<button class="btn-small btn-view" onclick="window.open('${map.url}', '_blank')">Open Map</button>` : '';
        const downloadButton = map.fileData ? `<button class="btn-small btn-view" onclick="downloadWardMapFile('${map.id}')">Download ${map.fileType}</button>` : '';
        const viewDetailsButton = (map.fileName && (map.fileType === 'KML' || map.fileType === 'KMZ')) ? `<button class="btn-small btn-view" onclick="viewMapDetails('${map.id}')">View Details</button>` : '';
        
        card.innerHTML = `
            <div class="card-title">🗺️ ${map.title}</div>
            <div class="card-desc">${map.description}</div>
            ${urlSection}
            ${fileSection}
            <div class="card-actions">
                ${openButton}
                ${viewDetailsButton}
                ${downloadButton}
                <button class="btn-small btn-delete" onclick="deleteWardMap('${map.id}')">Delete</button>
            </div>
        `;
        list.appendChild(card);
    });
}

function downloadWardMapFile(id) {
    const maps = db.data[currentUser].wardMaps;
    const map = maps.find(m => m.id == id);
    if (!map || !map.fileData) return;
    const link = document.createElement('a');
    link.href = map.fileData;
    link.download = map.fileName || 'ward-map.kmz';
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function deleteWardMap(id) {
    if (confirm('Delete this map?')) {
        db.data[currentUser].wardMaps = db.data[currentUser].wardMaps.filter(m => m.id != id);
        saveDB();
        loadWardMaps();
    }
}

// ======================
// KML/KMZ VIEWER
// ======================

function openMapViewer() {
    document.getElementById('mapViewerModal').classList.add('active');
}

function closeMapViewer() {
    document.getElementById('mapViewerModal').classList.remove('active');
}

function viewMapDetails(id) {
    const maps = db.data[currentUser].wardMaps;
    const map = maps.find(m => m.id == id);
    if (!map || !map.fileData) return;

    openMapViewer();
    const content = document.getElementById('mapViewerContent');
    const detailsContent = document.getElementById('mapDetailsContent');

    try {
        // Convert base64 to blob and parse
        fetch(map.fileData)
            .then(res => res.blob())
            .then(blob => {
                if (map.fileType === 'KMZ') {
                    parseKMZ(blob, map.fileName);
                } else {
                    parseKMLForMap(blob, map.fileName);
                }
            })
            .catch(err => {
                content.innerHTML = `
                    <div class="error">
                        <h4>❌ Error loading map file</h4>
                        <p>Could not process the uploaded file.</p>
                    </div>
                `;
                detailsContent.innerHTML = '<div class="error"><p>Failed to load map details.</p></div>';
            });
    } catch (err) {
        content.innerHTML = `
            <div class="error">
                <h4>❌ Error loading map file</h4>
                <p>Failed to process the uploaded file.</p>
            </div>
        `;
        detailsContent.innerHTML = '<div class="error"><p>Failed to load map details.</p></div>';
    }
}

function parseKMLForMap(blob, fileName) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const kmlText = e.target.result;
        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
        
        const placemarks = kmlDoc.querySelectorAll('Placemark');
        const features = [];
        
        placemarks.forEach((placemark, index) => {
            const name = placemark.querySelector('name')?.textContent || `Feature ${index + 1}`;
            const description = placemark.querySelector('description')?.textContent || '';
            const coordinates = placemark.querySelector('coordinates')?.textContent?.trim() || '';
            
            if (coordinates) {
                const coords = coordinates.split(' ').map(coord => {
                    const [lng, lat] = coord.split(',').map(parseFloat);
                    return { lat, lng };
                }).filter(c => !isNaN(c.lat) && !isNaN(c.lng));
                
                if (coords.length > 0) {
                    features.push({
                        name,
                        description,
                        coordinates: coords,
                        type: coords.length === 1 ? 'point' : coords.length === 2 ? 'line' : 'polygon'
                    });
                }
            }
        });
        
        if (features.length > 0) {
            createInteractiveMap(features, fileName);
            displayMapDetails(fileName, features, kmlText);
        } else {
            showNoFeaturesMap();
        }
    };
    reader.readAsText(blob);
}

function createInteractiveMap(features, fileName) {
    const content = document.getElementById('mapViewerContent');
    
    // Calculate bounds for all features
    let bounds = L.latLngBounds();
    features.forEach(feature => {
        feature.coordinates.forEach(coord => {
            bounds.extend([coord.lat, coord.lng]);
        });
    });
    
    // Create map
    const map = L.map('mapViewerContent').fitBounds(bounds, { padding: [20, 20] });
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add features to map
    features.forEach((feature, index) => {
        const color = getFeatureColor(index);
        
        if (feature.type === 'point') {
            // Single point
            const coord = feature.coordinates[0];
            const marker = L.circleMarker([coord.lat, coord.lng], {
                color: color,
                fillColor: color,
                fillOpacity: 0.8,
                radius: 8
            }).addTo(map);
            
            marker.bindPopup(`
                <strong>${feature.name}</strong><br>
                ${feature.description || 'No description'}
            `);
            
        } else if (feature.type === 'line') {
            // Line (2 points)
            const polyline = L.polyline(feature.coordinates.map(c => [c.lat, c.lng]), {
                color: color,
                weight: 3,
                opacity: 0.8
            }).addTo(map);
            
            polyline.bindPopup(`
                <strong>${feature.name}</strong><br>
                ${feature.description || 'No description'}
            `);
            
        } else {
            // Polygon (3+ points)
            const polygon = L.polygon(feature.coordinates.map(c => [c.lat, c.lng]), {
                color: color,
                fillColor: color,
                fillOpacity: 0.3,
                weight: 2
            }).addTo(map);
            
            polygon.bindPopup(`
                <strong>${feature.name}</strong><br>
                ${feature.description || 'No description'}
            `);
        }
    });
    
    // Store map instance for cleanup
    window.currentMap = map;
}

function getFeatureColor(index) {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
    return colors[index % colors.length];
}

function showNoFeaturesMap() {
    const content = document.getElementById('mapViewerContent');
    content.innerHTML = `
        <div class="no-map-features">
            <h4>📍 No Geographic Features Found</h4>
            <p>This KML file doesn't contain any mappable geographic features (points, lines, or polygons).</p>
            <p>The file may contain only metadata or non-spatial information.</p>
        </div>
    `;
    
    const detailsContent = document.getElementById('mapDetailsContent');
    detailsContent.innerHTML = `
        <div class="info">
            <h4>📄 File Information</h4>
            <p>This KML file contains no geographic features that can be displayed on a map.</p>
        </div>
    `;
}

function parseKMZ(blob, fileName) {
    // For KMZ files, we'd need to unzip. For now, show a message
    const content = document.getElementById('mapViewerContent');
    content.innerHTML = `
        <div class="info kmz-info">
            <h4>📦 KMZ File Detected</h4>
            <p><strong>File:</strong> ${fileName}</p>
            <p><strong>Type:</strong> Compressed KML Archive</p>
            <p>KMZ files contain compressed KML data. To view detailed information, extract the KML file from the archive.</p>
            <button class="btn-primary" onclick="downloadWardMapFile('${fileName.split('.')[0]}')">Download KMZ File</button>
        </div>
    `;
}

function displayMapDetails(fileName, features, rawKML) {
    const content = document.getElementById('mapViewerContent');
    
    const bounds = calculateBounds(features);
    const totalPoints = features.reduce((sum, f) => sum + f.coordinates.length, 0);
    
    content.innerHTML = `
        <div class="map-details">
            <div class="file-info">
                <h4>📁 File Information</h4>
                <p><strong>Name:</strong> ${fileName}</p>
                <p><strong>Features:</strong> ${features.length}</p>
                <p><strong>Total Points:</strong> ${totalPoints}</p>
                ${bounds ? `
                    <p><strong>Bounds:</strong> ${bounds.north.toFixed(4)}, ${bounds.south.toFixed(4)}, ${bounds.east.toFixed(4)}, ${bounds.west.toFixed(4)}</p>
                ` : ''}
            </div>
            
            ${features.length > 0 ? `
                <div class="features-list">
                    <h4>📍 Features</h4>
                    <div class="features-container">
                        ${features.slice(0, 10).map(feature => `
                            <div class="feature-item">
                                <strong>${feature.name}</strong>
                                <span class="feature-type">${feature.type}</span>
                                <div class="coordinates">
                                    ${feature.coordinates.slice(0, 3).map(coord => 
                                        `${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`
                                    ).join(' | ')}
                                    ${feature.coordinates.length > 3 ? ` ... (+${feature.coordinates.length - 3} more)` : ''}
                                </div>
                                ${feature.description ? `<div class="description">${feature.description}</div>` : ''}
                            </div>
                        `).join('')}
                        ${features.length > 10 ? `<p>... and ${features.length - 10} more features</p>` : ''}
                    </div>
                </div>
            ` : `
                <div class="no-features">
                    <p>No geographic features found in this file.</p>
                </div>
            `}
            
            <div class="actions">
                <button class="btn-primary" onclick="downloadWardMapFile('${fileName.split('.')[0]}')">Download ${fileName.split('.').pop().toUpperCase()}</button>
                <button class="btn-small" onclick="openInExternalMap('${rawKML ? 'kml' : 'kmz'}', '${fileName}')">Open in External Map</button>
            </div>
        </div>
    `;
}

function calculateBounds(features) {
    if (!features.length) return null;
    
    let north = -90, south = 90, east = -180, west = 180;
    
    features.forEach(feature => {
        feature.coordinates.forEach(coord => {
            north = Math.max(north, coord.lat);
            south = Math.min(south, coord.lat);
            east = Math.max(east, coord.lng);
            west = Math.min(west, coord.lng);
        });
    });
    
    return { north, south, east, west };
}

function openInExternalMap(type, fileName) {
    // For now, just show download option since we can't directly upload to external services
    alert(`To view this ${type.toUpperCase()} file in an external map application:\n\n1. Download the file using the Download button\n2. Open it in Google Earth, QGIS, or another GIS application`);
}

function openSkywalkModal() {
    document.getElementById('skywalkModal').classList.add('active');
}

function closeSkywalkModal() {
    document.getElementById('skywalkModal').classList.remove('active');
    document.getElementById('skywalkForm').reset();
}

document.getElementById('skywalkForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('skywalkTitle').value;
    const desc = document.getElementById('skywalkDesc').value;
    const files = document.getElementById('skywalkFiles').files;
    
    const images = [];
    let processed = 0;
    
    if (files.length === 0) {
        alert('Please select at least one image.');
        return;
    }
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            images.push(e.target.result);
            processed++;
            
            if (processed === files.length) {
                const audit = {
                    id: Date.now(),
                    title: title,
                    description: desc,
                    images: images,
                    date: new Date().toLocaleDateString()
                };
                
                db.data[currentUser].skywalks.push(audit);
                saveDB();
                loadSkywalks();
                closeSkywalkModal();
            }
        };
        reader.readAsDataURL(file);
    });
});

function loadSkywalks() {
    const list = document.getElementById('skywalkList');
    const audits = db.data[currentUser].skywalks;
    
    list.innerHTML = '';
    audits.forEach(audit => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-title">🏗️ ${audit.title}</div>
            <div class="card-desc">${audit.description}</div>
            <div class="card-desc">${audit.images.length} images</div>
            <div class="image-gallery">
                ${audit.images.slice(0, 4).map((img, idx) => 
                    `<img src="${img}" class="gallery-image" onclick="viewSkywalkImage('${audit.id}', ${idx})">`
                ).join('')}
            </div>
            <div class="card-actions" style="margin-top:1rem;">
                <button class="btn-small btn-delete" onclick="deleteSkywalk('${audit.id}')">Delete Audit</button>
            </div>
        `;
        list.appendChild(card);
    });
}

function viewSkywalkImage(auditId, imageIndex) {
    const audits = db.data[currentUser].skywalks;
    const audit = audits.find(a => a.id == auditId);
    if (!audit) return;
    
    const items = audit.images.map((img, idx) => ({
        id: `${auditId}-${idx}`,
        title: audit.title,
        description: audit.description,
        image: img,
        date: audit.date,
        type: 'skywalk'
    }));
    
    viewerState = {
        module: 'skywalk',
        items: items,
        index: imageIndex
    };
    openImageViewer();
}

function deleteSkywalk(id) {
    if (confirm('Delete this entire audit?')) {
        db.data[currentUser].skywalks = db.data[currentUser].skywalks.filter(a => a.id != id);
        saveDB();
        loadSkywalks();
    }
}

function deleteSkywalkImage(auditId, imageIndex) {
    const audits = db.data[currentUser].skywalks;
    const audit = audits.find(a => a.id == auditId);
    if (!audit) return;
    
    if (confirm('Delete this image?')) {
        audit.images.splice(imageIndex, 1);
        saveDB();
        loadSkywalks();
        closeImageViewer();
    }
}

// ======================
// MODULE 4: SURVEY ANALYTICS
// ======================

function openSurveyModal() {
    document.getElementById('surveyModal').classList.add('active');
}

function closeSurveyModal() {
    document.getElementById('surveyModal').classList.remove('active');
    document.getElementById('surveyForm').reset();
}

document.getElementById('surveyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('surveyTitle').value;
    const file = document.getElementById('surveyFile').files[0];
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csvData = e.target.result;
            const parsedData = parseCSV(csvData);
            
            const survey = {
                id: Date.now(),
                title: title,
                data: parsedData,
                date: new Date().toLocaleDateString()
            };
            
            db.data[currentUser].surveys.push(survey);
            saveDB();
            loadSurveys();
            closeSurveyModal();
        } catch (err) {
            alert('Failed to parse CSV. Please check format.');
            console.error(err);
        }
    };
    reader.readAsText(file);
});

function parseCSV(csv) {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        data.push(row);
    }
    
    return { headers, rows: data };
}

function loadSurveys() {
    const list = document.getElementById('surveyList');
    const surveys = db.data[currentUser].surveys;
    
    list.innerHTML = '';
    surveys.forEach(survey => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-title">📊 ${survey.title}</div>
            <div class="card-desc">${survey.data.rows.length} responses</div>
            <div class="card-desc">Columns: ${survey.data.headers.join(', ')}</div>
            <div class="card-actions">
                <button class="btn-small btn-view" onclick="showChart('${survey.id}')">View Chart</button>
                <button class="btn-small btn-delete" onclick="deleteSurvey('${survey.id}')">Delete</button>
            </div>
        `;
        list.appendChild(card);
    });
}

function showChart(id) {
    const survey = db.data[currentUser].surveys.find(s => s.id == id);
    if (!survey || survey.data.rows.length === 0) return;
    
    const canvas = document.getElementById('chartCanvas');
    canvas.style.display = 'block';
    
    const firstHeader = survey.data.headers[0];
    const labels = survey.data.rows.map((r, i) => `R${i + 1}`);
    const data = survey.data.rows.map(r => {
        const val = r[firstHeader];
        return isNaN(val) ? 1 : parseFloat(val);
    });
    
    // Destroy existing chart if any
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();
    
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: firstHeader,
                data: data,
                backgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            }
        }
    });
}

function deleteSurvey(id) {
    if (confirm('Delete this survey?')) {
        db.data[currentUser].surveys = db.data[currentUser].surveys.filter(s => s.id != id);
        saveDB();
        loadSurveys();
    }
}

// ======================
// MODULE 5: INTERVIEW MEDIA
// ======================

function openInterviewModal() {
    document.getElementById('interviewModal').classList.add('active');
}

function closeInterviewModal() {
    document.getElementById('interviewModal').classList.remove('active');
    document.getElementById('interviewForm').reset();
}

document.getElementById('interviewForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('interviewTitle').value;
    const desc = document.getElementById('interviewDesc').value;
    const files = document.getElementById('interviewFile').files;
    
    if (files.length === 0) {
        alert('Please select at least one audio or video file.');
        return;
    }
    
    let processed = 0;
    
    Array.from(files).forEach((file, index) => {
        if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
            alert(`File ${file.name} is not an audio or video file. Skipping.`);
            processed++;
            if (processed === files.length) {
                finishInterviewUpload();
            }
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const interview = {
                id: Date.now() + index,
                title: files.length > 1 ? `${title} (${index + 1})` : title,
                description: desc,
                media: e.target.result,
                type: file.type.startsWith('video/') ? 'video' : 'audio',
                date: new Date().toLocaleDateString()
            };
            
            db.data[currentUser].interviews.push(interview);
            processed++;
            
            if (processed === files.length) {
                finishInterviewUpload();
            }
        };
        reader.readAsDataURL(file);
    });
    
    function finishInterviewUpload() {
        saveDB();
        loadInterviews();
        closeInterviewModal();
        document.getElementById('interviewForm').reset();
    }
});

function loadInterviews() {
    const list = document.getElementById('interviewList');
    const interviews = db.data[currentUser].interviews;
    
    list.innerHTML = '';
    interviews.forEach(interview => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-title">${interview.type === 'video' ? '🎥' : '🎤'} ${interview.title}</div>
            <div class="card-desc">${interview.description}</div>
            <div class="card-actions">
                <button class="btn-small btn-view" onclick="playMedia('${interview.id}')">Play</button>
                <button class="btn-small btn-delete" onclick="deleteInterview('${interview.id}')">Delete</button>
            </div>
        `;
        list.appendChild(card);
    });
}

function playMedia(id) {
    const interview = db.data[currentUser].interviews.find(i => i.id == id);
    if (!interview) return;
    
    const player = document.getElementById('audioPlayer');
    const title = document.getElementById('audioTitle');
    
    // Clean up previous media
    const audioEl = document.getElementById('audioElement');
    const videoEl = document.getElementById('videoElement');
    if (videoEl) videoEl.remove();
    
    if (interview.type === 'video') {
        const video = document.createElement('video');
        video.id = 'videoElement';
        video.controls = true;
        video.style.width = '100%';
        video.style.marginBottom = '1rem';
        video.src = interview.media;
        player.insertBefore(video, audioEl);
        audioEl.style.display = 'none';
        video.play();
    } else {
        audioEl.style.display = 'block';
        audioEl.src = interview.media;
        audioEl.play();
    }
    
    player.style.display = 'block';
    title.textContent = interview.title;
}

function deleteInterview(id) {
    if (confirm('Delete this media?')) {
        db.data[currentUser].interviews = db.data[currentUser].interviews.filter(i => i.id != id);
        saveDB();
        loadInterviews();
    }
}

// ======================
// MODULE 6: MAPILLARY MAPPING
// ======================

function openMapillaryModal() {
    document.getElementById('mapillaryModal').classList.add('active');
}

function closeMapillaryModal() {
    document.getElementById('mapillaryModal').classList.remove('active');
    document.getElementById('mapillaryForm').reset();
}

document.getElementById('mapillaryForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('mapillaryTitle').value;
    const url = document.getElementById('mapillaryUrl').value;
    const files = document.getElementById('mapillaryImages').files;
    
    const images = [];
    let processed = 0;
    
    const saveMapping = (imgs) => {
        const mapping = {
            id: Date.now(),
            title: title,
            url: url,
            images: imgs,
            date: new Date().toLocaleDateString()
        };
        db.data[currentUser].mapillary.push(mapping);
        saveDB();
        loadMapillary();
        closeMapillaryModal();
    };
    
    if (files.length === 0) {
        saveMapping([]);
    } else {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                images.push(e.target.result);
                processed++;
                if (processed === files.length) {
                    saveMapping(images);
                }
            };
            reader.readAsDataURL(file);
        });
    }
});

function loadMapillary() {
    const list = document.getElementById('mapillaryList');
    const mappings = db.data[currentUser].mapillary;
    
    list.innerHTML = '';
    mappings.forEach(mapping => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-title">📍 ${mapping.title}</div>
            <div class="card-desc" style="color:#667eea;">${mapping.url}</div>
            ${mapping.images.length > 0 ? `
                <div class="image-gallery">
                    ${mapping.images.map((img, idx) => 
                        `<img src="${img}" class="gallery-image" onclick="viewMapillaryImage('${mapping.id}', ${idx})">`
                    ).join('')}
                </div>
            ` : ''}
            <div class="card-actions" style="margin-top:1rem;">
                <button class="btn-small btn-view" onclick="window.open('${mapping.url}', '_blank')">Open Mapillary</button>
                <button class="btn-small btn-delete" onclick="deleteMapillary('${mapping.id}')">Delete</button>
            </div>
        `;
        list.appendChild(card);
    });
}

function viewMapillaryImage(mappingId, imageIndex) {
    const mappings = db.data[currentUser].mapillary;
    const mapping = mappings.find(m => m.id == mappingId);
    if (!mapping || !mapping.images.length) return;
    
    const items = mapping.images.map((img, idx) => ({
        id: `${mappingId}-${idx}`,
        title: mapping.title,
        description: '',
        image: img,
        date: mapping.date,
        type: 'mapillary'
    }));
    
    viewerState = {
        module: 'mapillary',
        items: items,
        index: imageIndex
    };
    openImageViewer();
}

function deleteMapillary(id) {
    if (confirm('Delete this mapping?')) {
        db.data[currentUser].mapillary = db.data[currentUser].mapillary.filter(m => m.id != id);
        saveDB();
        loadMapillary();
    }
}

function deleteMapillaryImage(mappingId, imageIndex) {
    const mappings = db.data[currentUser].mapillary;
    const mapping = mappings.find(m => m.id == mappingId);
    if (!mapping) return;
    
    if (confirm('Delete this image?')) {
        mapping.images.splice(imageIndex, 1);
        saveDB();
        loadMapillary();
        closeImageViewer();
    }
}

// ======================
// MODULE 7: PROBLEM SOLVING
// ======================

function openProblemModal() {
    document.getElementById('problemModal').classList.add('active');
}

function closeProblemModal() {
    document.getElementById('problemModal').classList.remove('active');
    document.getElementById('problemForm').reset();
}

document.getElementById('problemForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const problem = {
        id: Date.now(),
        title: document.getElementById('problemTitle').value,
        url: document.getElementById('problemUrl').value,
        description: document.getElementById('problemDesc').value,
        tags: document.getElementById('problemTags').value.split(',').map(t => t.trim()).filter(t => t),
        date: new Date().toLocaleDateString()
    };
    
    db.data[currentUser].problems.push(problem);
    saveDB();
    loadProblems();
    closeProblemModal();
});

function loadProblems() {
    const list = document.getElementById('problemList');
    const problems = db.data[currentUser].problems;
    
    list.innerHTML = '';
    problems.forEach(problem => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-title">💻 ${problem.title}</div>
            <div class="card-desc">${problem.description}</div>
            <div style="margin: 0.5rem 0;">
                ${problem.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <div class="card-desc" style="color:#667eea;">${problem.url}</div>
            <div class="card-actions">
                <button class="btn-small btn-view" onclick="window.open('${problem.url}', '_blank')">View Solution</button>
                <button class="btn-small btn-delete" onclick="deleteProblem('${problem.id}')">Delete</button>
            </div>
        `;
        list.appendChild(card);
    });
}

function deleteProblem(id) {
    if (confirm('Delete this solution?')) {
        db.data[currentUser].problems = db.data[currentUser].problems.filter(p => p.id != id);
        saveDB();
        loadProblems();
    }
}

// ======================
// DATA MANAGEMENT
// ======================

function showDataInfo() {
    const data = localStorage.getItem('urbanAuditDB');
    const sizeInBytes = new Blob([data]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    const totalItems = db.data[currentUser] ? Object.keys(db.data[currentUser]).reduce((acc, key) => acc + db.data[currentUser][key].length, 0) : 0;
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3>💾 Data Storage Information</h3>
            
            <div class="modal-section">
                <div class="file-info">
                    <span><strong>Storage Type:</strong> Browser LocalStorage</span>
                    <span class="stat-badge success">Active</span>
                </div>
                <div class="file-info">
                    <span><strong>Storage Key:</strong> urbanAuditDB</strong></span>
                    <button class="btn-small btn-view" onclick="copyToClipboard('urbanAuditDB')">Copy</button>
                </div>
                <div class="file-info">
                    <span><strong>Current User:</strong> ${currentUser}</span>
                    <span class="tag">${totalItems} items</span>
                </div>
                <div class="file-info">
                    <span><strong>Total Size:</strong> ${sizeInKB} KB (${sizeInMB} MB)</span>
                    <span class="stat-badge ${sizeInMB < 5 ? 'success' : 'warning'}">${sizeInMB < 5 ? 'Healthy' : 'Large'}</span>
                </div>
            </div>
            
            <div class="modal-section">
                <h4>📊 Data Breakdown</h4>
                <div class="modal-section scrollable">
                    ${Object.keys(db.data[currentUser]).map(module => `
                        <div class="file-info">
                            <span>${module.charAt(0).toUpperCase() + module.slice(1)}</span>
                            <span class="tag">${db.data[currentUser][module].length} items</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="modal-section">
                <h4>🔧 How to Access Data</h4>
                <div class="data-viewer">
                    <strong>1.</strong> Open Browser Console (F12)<br>
                    <strong>2.</strong> Type: localStorage.getItem('urbanAuditDB')<br>
                    <strong>3.</strong> Copy the output to back up your data<br><br>
                    <strong>Export:</strong> JSON.stringify(JSON.parse(localStorage.getItem('urbanAuditDB')), null, 2)<br>
                    <strong>Clear:</strong> localStorage.removeItem('urbanAuditDB')
                </div>
            </div>
            
            <div class="modal-section" style="display:flex; gap:1rem; flex-wrap:wrap;">
                <button class="btn-primary" onclick="exportData()">📥 Export Data</button>
                <button class="btn-small btn-delete" onclick="clearUserData()">🗑️ Clear My Data</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    });
}

function exportData() {
    const dataStr = JSON.stringify(db, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `urban-audit-${currentUser}-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function clearUserData() {
    if (confirm(`Are you sure you want to clear all data for ${currentUser}? This cannot be undone!`)) {
        db.data[currentUser] = {
            posters: [],
            wardMaps: [],
            skywalks: [],
            surveys: [],
            interviews: [],
            mapillary: [],
            problems: []
        };
        saveDB();
        loadModuleData(document.querySelector('.nav-btn.active').textContent.trim().split(' ')[0].toLowerCase());
        alert('Your data has been cleared.');
        document.querySelector('.modal').remove();
    }
}

// Initialize on load
window.onload = function() {
    initDB();
};