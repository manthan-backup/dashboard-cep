// Database (LocalStorage)
let currentUser = null;
let db = {
    users: ['Manthan', 'Vihan', 'Nemi'],
    data: {}
};

// Initialize database
function initDB() {
    const stored = localStorage.getItem('urbanAuditDB');
    if (stored) {
        db = JSON.parse(stored);
    } else {
        // Initialize empty data for each user
        db.users.forEach(user => {
            db.data[user] = {
                posters: [],
                wardMaps: [],
                skywalks: [],
                surveys: [],
                interviews: [],
                mapillary: [],
                problems: []
            };
        });
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

// MODULE 1: POSTER UPLOAD
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
    const file = document.getElementById('posterFile').files[0];
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const poster = {
            id: Date.now(),
            title: title,
            description: desc,
            image: e.target.result,
            date: new Date().toLocaleDateString()
        };
        
        db.data[currentUser].posters.push(poster);
        saveDB();
        loadPosters();
        closePosterModal();
    };
    reader.readAsDataURL(file);
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
    const poster = db.data[currentUser].posters.find(p => p.id == id);
    if (poster) {
        window.open(poster.image, '_blank');
    }
}

function deletePoster(id) {
    if (confirm('Delete this poster?')) {
        db.data[currentUser].posters = db.data[currentUser].posters.filter(p => p.id != id);
        saveDB();
        loadPosters();
    }
}

// MODULE 2: WARD MAP
function openWardMapModal() {
    document.getElementById('wardMapModal').classList.add('active');
}

function closeWardMapModal() {
    document.getElementById('wardMapModal').classList.remove('active');
    document.getElementById('wardMapForm').reset();
}

document.getElementById('wardMapForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const map = {
        id: Date.now(),
        title: document.getElementById('mapTitle').value,
        url: document.getElementById('mapUrl').value,
        description: document.getElementById('mapDesc').value,
        date: new Date().toLocaleDateString()
    };
    
    db.data[currentUser].wardMaps.push(map);
    saveDB();
    loadWardMaps();
    closeWardMapModal();
});

function loadWardMaps() {
    const list = document.getElementById('wardMapList');
    const maps = db.data[currentUser].wardMaps;
    
    list.innerHTML = '';
    maps.forEach(map => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-title">🗺️ ${map.title}</div>
            <div class="card-desc">${map.description}</div>
            <div class="card-desc" style="color:#667eea;">${map.url}</div>
            <div class="card-actions">
                <button class="btn-small btn-view" onclick="window.open('${map.url}', '_blank')">Open Map</button>
                <button class="btn-small btn-delete" onclick="deleteWardMap('${map.id}')">Delete</button>
            </div>
        `;
        list.appendChild(card);
    });
}

function deleteWardMap(id) {
    if (confirm('Delete this map?')) {
        db.data[currentUser].wardMaps = db.data[currentUser].wardMaps.filter(m => m.id != id);
        saveDB();
        loadWardMaps();
    }
}

// MODULE 3: SKYWALK AUDIT
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
                ${audit.images.slice(0, 4).map(img => 
                    `<img src="${img}" class="gallery-image" onclick="window.open('${img}', '_blank')">`
                ).join('')}
            </div>
            <div class="card-actions" style="margin-top:1rem;">
                <button class="btn-small btn-delete" onclick="deleteSkywalk('${audit.id}')">Delete</button>
            </div>
        `;
        list.appendChild(card);
    });
}

function deleteSkywalk(id) {
    if (confirm('Delete this audit?')) {
        db.data[currentUser].skywalks = db.data[currentUser].skywalks.filter(a => a.id != id);
        saveDB();
        loadSkywalks();
    }
}

// MODULE 4: SURVEY ANALYTICS
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
    };
    reader.readAsText(file);
});

function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            data.push(row);
        }
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
    if (!survey) return;
    
    const canvas = document.getElementById('chartCanvas');
    canvas.style.display = 'block';
    
    // Simple chart showing first column data
    const labels = survey.data.rows.map((r, i) => `Response ${i + 1}`);
    const data = survey.data.rows.map(r => Object.values(r)[0]);
    
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: survey.data.headers[0],
                data: data.map(d => isNaN(d) ? 1 : parseFloat(d)),
                backgroundColor: '#667eea'
            }]
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

// MODULE 5: INTERVIEW MEDIA
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
    const file = document.getElementById('interviewFile').files[0];
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const interview = {
            id: Date.now(),
            title: title,
            description: desc,
            media: e.target.result,
            type: file.type.startsWith('video') ? 'video' : 'audio',
            date: new Date().toLocaleDateString()
        };
        
        db.data[currentUser].interviews.push(interview);
        saveDB();
        loadInterviews();
        closeInterviewModal();
    };
    reader.readAsDataURL(file);
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
    const audio = document.getElementById('audioElement');
    const title = document.getElementById('audioTitle');
    
    player.style.display = 'block';
    audio.src = interview.media;
    title.textContent = interview.title;
    audio.play();
}

function deleteInterview(id) {
    if (confirm('Delete this media?')) {
        db.data[currentUser].interviews = db.data[currentUser].interviews.filter(i => i.id != id);
        saveDB();
        loadInterviews();
    }
}

// MODULE 6: MAPILLARY MAPPING
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
    
    if (files.length === 0) {
        // No images, save directly
        const mapping = {
            id: Date.now(),
            title: title,
            url: url,
            images: [],
            date: new Date().toLocaleDateString()
        };
        
        db.data[currentUser].mapillary.push(mapping);
        saveDB();
        loadMapillary();
        closeMapillaryModal();
    } else {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                images.push(e.target.result);
                processed++;
                
                if (processed === files.length) {
                    const mapping = {
                        id: Date.now(),
                        title: title,
                        url: url,
                        images: images,
                        date: new Date().toLocaleDateString()
                    };
                    
                    db.data[currentUser].mapillary.push(mapping);
                    saveDB();
                    loadMapillary();
                    closeMapillaryModal();
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
                    ${mapping.images.map(img => 
                        `<img src="${img}" class="gallery-image" onclick="window.open('${img}', '_blank')">`
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

function deleteMapillary(id) {
    if (confirm('Delete this mapping?')) {
        db.data[currentUser].mapillary = db.data[currentUser].mapillary.filter(m => m.id != id);
        saveDB();
        loadMapillary();
    }
}

// MODULE 7: PROBLEM SOLVING
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

// Show Data Storage Info
function showDataInfo() {
    const data = localStorage.getItem('urbanAuditDB');
    const sizeInBytes = new Blob([data]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3>💾 Data Storage Information</h3>
            
            <div class="file-info">
                <span><strong>Storage Type:</strong> Browser LocalStorage</span>
                <span class="stat-badge success">Active</span>
            </div>
            
            <div class="file-info">
                <span><strong>Storage Key:</strong> urbanAuditDB</span>
                <button class="btn-small btn-view" onclick="copyToClipboard('urbanAuditDB')">Copy</button>
            </div>
            
            <div class="file-info">
                <span><strong>Current User:</strong> ${currentUser}</span>
                <span class="tag">${db.data[currentUser] ? Object.keys(db.data[currentUser]).reduce((acc, key) => acc + db.data[currentUser][key].length, 0) : 0} items</span>
            </div>
            
            <div class="file-info">
                <span><strong>Total Size:</strong> ${sizeInKB} KB (${sizeInMB} MB)</span>
                <span class="stat-badge ${sizeInMB < 5 ? 'success' : 'warning'}">${sizeInMB < 5 ? 'Healthy' : 'Large'}</span>
            </div>
            
            <h4 style="margin-top:1.5rem; margin-bottom:1rem;">📊 Data Breakdown:</h4>
            ${Object.keys(db.data[currentUser]).map(module => `
                <div class="file-info">
                    <span>${module.charAt(0).toUpperCase() + module.slice(1)}</span>
                    <span class="tag">${db.data[currentUser][module].length} items</span>
                </div>
            `).join('')}
            
            <h4 style="margin-top:1.5rem; margin-bottom:1rem;">🔧 How to Access Data:</h4>
            <div class="data-viewer">
                <strong>1. Open Browser Console (F12)</strong><br>
                2. Type: localStorage.getItem('urbanAuditDB')<br>
                3. Copy the output to backup your data<br><br>
                <strong>To Export:</strong><br>
                JSON.stringify(JSON.parse(localStorage.getItem('urbanAuditDB')), null, 2)<br><br>
                <strong>To Clear:</strong><br>
                localStorage.removeItem('urbanAuditDB')
            </div>
            
            <div style="margin-top:1.5rem; display:flex; gap:1rem;">
                <button class="btn-primary" onclick="exportData()">📥 Export Data</button>
                <button class="btn-small btn-delete" onclick="clearUserData()">🗑️ Clear My Data</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
}

// Export data
function exportData() {
    const dataStr = JSON.stringify(db, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `urban-audit-${currentUser}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Clear user data
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
