    let selectedDate = new Date().toISOString().split('T')[0];
    let selectedDuration = 1;
    let selectedTerrainId = null;
    let selectedTerrainName = "";
    let basePrice = 0;
    let selectedTime = null;
    let occupiedSlots = [];
    let selectedPaymentMode = 'SPLIT';
   

    
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const s = await fetch('/api/settings');
        const c = await s.json();
        if(c.primary_color) document.documentElement.style.setProperty('--primary-color', c.primary_color);
        if(c.company_name) document.getElementById('app-name').innerText = c.company_name;
    } catch(e){}

    const auth = await fetch('/api/me');
    const user = await auth.json();
    
    if(!user.loggedIn) {
        window.location.href = '/login.html';
    } else {
        // AJOUTE CETTE LIGNE : Affiche le nom dans la sidebar
        document.getElementById('user-name').innerText = user.user.firstName + ' ' + user.user.lastName;
    }

    generateDates();
    loadComplexes(); // On charge d'abord les complexes;
});

let selectedComplexId = null;

async function loadComplexes() {
    const sport = document.getElementById('filter-sport').value;
    // On suppose que ton API accepte un filtre ?sport=...
    const res = await fetch(`/api/complexes?sport=${sport || ''}`);
    const complexes = await res.json();
    const grid = document.getElementById('complexes-grid');
    grid.innerHTML = '';
    
    if(complexes.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10">Aucun complexe disponible pour ce sport.</div>';
        return;
    }

    complexes.forEach(c => {
        // On affiche les aménagements (Parking, Douche, etc.)
        let badges = '';
        if(c.amenities) {
            try {
                const am = JSON.parse(c.amenities);
                if(am.parking) badges += '<span class="text-[9px] bg-white/10 px-2 py-1 rounded">🅿️ Parking</span> ';
                if(am.shower) badges += '<span class="text-[9px] bg-white/10 px-2 py-1 rounded">🚿 Douches</span> ';
            } catch(e){}
        }

        grid.innerHTML += `
            <div class="pitch-card rounded-xl p-0 cursor-pointer overflow-hidden group relative h-64 md:h-72" onclick="selectComplex(this, ${c.id})">
                <img src="${c.cover_image_url || 'image/default-complex.jpg'}" class="w-full h-full object-cover transition duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6 flex flex-col justify-end border border-white/10 rounded-xl group-hover:border-neon/50 transition">
                    <div class="transform translate-y-2 group-hover:translate-y-0 transition duration-300">
                        <h4 class="font-orbitron font-black text-2xl text-white mb-1 uppercase italic">${c.name}</h4>
                        <p class="text-xs text-neon font-bold mb-3 flex items-center gap-1">📍 ${c.city} <span class="text-gray-500">•</span> ${c.zip_code || ''}</p>
                        <div class="flex flex-wrap gap-2 text-gray-300">${badges}</div>
                    </div>
                </div>
            </div>`;
    });
}

function selectComplex(el, id) {
    document.querySelectorAll('.pitch-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    selectedComplexId = id;
    document.getElementById('terrain-section').classList.remove('hidden');
    loadTerrainsForComplex(id);
}

async function loadTerrainsForComplex(complexId) {
    const sport = document.getElementById('filter-sport').value;
    const url = `/api/complexes/${complexId}/terrains?sport=${sport}&date=${selectedDate}&time_slot=${selectedTime || '10:00'}&duration=${selectedDuration}`;
    
    const res = await fetch(url);
    const terrains = await res.json();
    const grid = document.getElementById('terrains-grid');
    grid.innerHTML = '';
    
    terrains.forEach(t => {
        const features = [];
        if (t.features.camera) features.push('📹 Caméra');
        if (t.features.lighting) features.push('💡 Éclairage');
        if (t.maintenance_status && t.maintenance_status !== 'AVAILABLE') {
            return; 
        }
        
        grid.innerHTML += `
            <div class="pitch-card rounded-xl p-6 cursor-pointer ${!t.isAvailable ? 'opacity-50' : ''}" onclick="${t.isAvailable ? `selectTerrain(this, ${t.id}, '${t.name}', ${t.finalPrice})` : ''}">
                <div class="flex justify-between mb-3">
                    <span class="text-[10px] font-bold border border-neon bg-neon/10 px-2 py-1 rounded text-neon">${t.sport_type}</span>
                </div>
                <h4 class="font-orbitron font-bold text-lg text-white mb-2">${t.name}</h4>
                <div class="text-xs text-gray-400 space-y-1">
                    <div>${features.join(' • ')}</div>
                    <div>${t.is_indoor ? 'INDOOR' : 'OUTDOOR'}</div>
                    ${!t.isAvailable ? '<div class="text-red-500 font-bold">INDISPONIBLE</div>' : ''}
                </div>
            </div>`;
    setTimeout(() => {
    document.getElementById('terrain-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}, 100);
    });
}

    // 1. On demande au serveur les créneaux précis (ex: 08:30, 09:00...)
// ASSURE-TOI QUE TA FONCTION updateAvailability RESSEMBLE À ÇA :
async function updateAvailability() {
    if (!selectedTerrainId || !selectedDate) return;

    const loader = document.getElementById('slots-loader');
    const grid = document.getElementById('slots-grid');
    const empty = document.getElementById('slots-empty');

    if(loader) loader.classList.remove('hidden');
    if(grid) grid.classList.add('hidden');
    if(empty) empty.classList.add('hidden');

    try {
        // On appelle l'API slots
        const res = await fetch(`/api/slots?terrainId=${selectedTerrainId}&date=${selectedDate}&duration=${selectedDuration}`);
        const availableSlots = await res.json(); 
        
        // IMPORTANT : On passe le résultat à la fonction de génération
        generateTimeSlots(availableSlots);
        
        if(loader) loader.classList.add('hidden');
        if(grid) grid.classList.remove('hidden');
    } catch (e) { console.error("Erreur check dispo", e); }
}

function setPaymentMode(mode) {
    selectedPaymentMode = mode;
    document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`pay-${mode.toLowerCase()}`).classList.add('active');
    updateBar();
}
   // DANS reservation.html (Remplace la fonction generateDates)

function generateDates() {
    const container = document.getElementById('date-scroll');
    const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    
    container.innerHTML = '';

    for(let i=0; i<14; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        
        // --- CORRECTION ABSOLUE DU FORMAT DATE (YYYY-MM-DD) ---
        // On construit la chaîne manuellement pour éviter les problèmes de fuseau horaire
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Ajoute un 0 si besoin (ex: 01)
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`; 
        // ------------------------------------------------------
        
        const dayName = i === 0 ? 'AUJ' : days[d.getDay()];
        const dayNum = d.getDate();

        const el = document.createElement('div');
        el.className = `date-card p-4 rounded-xl min-w-[80px] text-center flex flex-col items-center justify-center flex-shrink-0 ${i===0 ? 'active' : ''}`;
        
        // Force la sélection de la première date (Aujourd'hui) au chargement
        if (i === 0) selectedDate = dateStr;

        el.onclick = () => selectDate(el, dateStr);
        el.innerHTML = `
            <span class="text-[10px] font-bold mb-1 opacity-60">${dayName}</span>
            <span class="text-xl font-orbitron font-bold">${dayNum}</span>
        `;
        container.appendChild(el);
    }
}

    function selectDate(el, date) {
        document.querySelectorAll('.date-card').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
        selectedDate = date;
        if(selectedTerrainId) updateAvailability();
        document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
        selectedTime = null;
        updateBar();
    }

    function setDuration(hours) {
    selectedDuration = hours;
    document.querySelectorAll('.duration-btn').forEach(b => {
        b.classList.remove('active', 'text-gray-400');
        // On utilise l'ID dur-1, dur-1.5 ou dur-2
        if(b.id === `dur-${hours}`) b.classList.add('active');
        else b.classList.add('text-gray-400');
    });
    if(selectedTerrainId) generateTimeSlots(); 
    updateBar();
}

   
    function selectTerrain(el, id, name, price) {
        document.querySelectorAll('.pitch-card').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
        selectedTerrainId = id;
        selectedTerrainName = name;
        basePrice = parseFloat(price);
        updateAvailability();
    }

   // REMPLACE TOUTE LA FONCTION generateTimeSlots PAR CELLE-CI :
// DANS reservation.js

function generateTimeSlots(slots) {
    const grid = document.getElementById('slots-grid');
    const empty = document.getElementById('slots-empty');
    grid.innerHTML = '';

    if (!slots || slots.length === 0) {
        if(empty) empty.classList.remove('hidden');
        return;
    }

   slots.forEach(slot => {
    // On divise par 10 pour l'affichage individuel
    const individualPrice = slot.price / 10; 

    const btn = document.createElement('button');
    btn.className = 'time-slot-btn p-3 rounded-xl flex flex-col items-center justify-center gap-1 border border-white/5 transition hover:border-neon bg-black/20';
    
    // On garde slot.price (le total) pour les calculs de paiement, 
    // mais on affiche individualPrice
    btn.onclick = () => selectTime(btn, slot.time, slot.price);

    btn.innerHTML = `
        <span class="text-[12px] font-bold text-white font-orbitron tracking-wider">${slot.time}</span>
        <span class="text-[10px] font-bold text-gray-400">${individualPrice.toFixed(2)}€</span>
    `;
    
    grid.appendChild(btn);
});
}

// REMPLACE TOUTE LA FONCTION selectTime PAR CELLE-CI :
function selectTime(btn, time, priceVal) {
    // 1. Gestion visuelle de la sélection (Règle l'erreur classList)
    document.querySelectorAll('.time-slot-btn').forEach(b => {
        b.classList.remove('selected', 'border-neon', 'bg-neon/10');
    });
    btn.classList.add('selected', 'border-neon', 'bg-neon/10');
    
    // 2. Enregistrement des données
    selectedTime = time;
    
    // IMPORTANT : On divise par 10 pour afficher 7€ au lieu de 70€
    basePrice = priceVal / 10; 
    
    // 3. Affichage de la barre de réservation (On ne cherche plus 'payment-section')
    const bookingBar = document.getElementById('booking-bar');
    if (bookingBar) {
        bookingBar.classList.remove('translate-y-full');
    }
    
    // 4. Mise à jour de l'affichage du prix
    updateBar();
}

// reservation.js

// DANS reservation.js
function updateBar() {
    // On affiche le prix pour 1 personne (ex: 7.00 €)
    const displayPriceEl = document.getElementById('display-price');
    if (displayPriceEl) {
        displayPriceEl.innerText = basePrice.toFixed(2) + ' €';
    }

    if (selectedTime) {
        const summaryEl = document.getElementById('selection-summary');
        if (summaryEl) {
            summaryEl.innerText = `${selectedTerrainName} • ${selectedTime} (1 place)`;
        }
    }
}
  // DANS RESERVATION.HTML

function confirmBooking() {
    if(!selectedTerrainId || !selectedDate || !selectedTime) {
        alert("Veuillez sélectionner un terrain, une date et une heure.");
        return;
    }

    const params = new URLSearchParams({
        mode: 'creation',
        terrainId: selectedTerrainId,
        terrainName: selectedTerrainName,
        date: selectedDate,
        time: selectedTime,
        duration: selectedDuration,
        unitPrice: basePrice.toFixed(2) // Envoie 7.00
    });

    window.location.href = '/payment.html?' + params.toString();
}