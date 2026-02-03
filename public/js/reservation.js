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
                    <div class="text-lg font-bold text-white">${t.finalPrice}€/h</div>
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

    async function updateAvailability() {
        if (!selectedTerrainId || !selectedDate) return;

        const loader = document.getElementById('slots-loader');
        const grid = document.getElementById('slots-grid');
        const empty = document.getElementById('slots-empty');

        loader.classList.remove('hidden');
        grid.classList.add('hidden');
        empty.classList.add('hidden');

        try {
            const res = await fetch(`/api/reservations/check?terrain_id=${selectedTerrainId}&date=${selectedDate}`);
            occupiedSlots = await res.json(); 
            generateTimeSlots();
            
            loader.classList.add('hidden');
            grid.classList.remove('hidden');
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

    function generateTimeSlots() {
        const grid = document.getElementById('slots-grid');
        grid.innerHTML = '';
        
        for(let h=10; h<=22; h++) {
            const time = `${h}:00`;
            const isTaken = occupiedSlots.includes(h);
            let durationConflict = false;
            if (selectedDuration === 2) {
                if (occupiedSlots.includes(h+1) || h === 22) durationConflict = true;
            }

            const btn = document.createElement('button');
            // J'applique ici la classe CSS 'time-slot-btn' que j'ai définie dans le <style>
            btn.className = 'time-slot-btn py-4 rounded-xl text-sm font-bold w-full';
            btn.innerText = time;
            
            if (isTaken || durationConflict) {
                btn.disabled = true;
                btn.innerText = "COMPLET";
            } else {
                btn.onclick = () => selectTime(btn, time);
            }
            grid.appendChild(btn);
        }
    }

   function selectTime(btn, time) {
    document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedTime = time;
    
    // Afficher la section paiement
    document.getElementById('payment-section').classList.remove('hidden');
    
    document.getElementById('booking-bar').classList.remove('translate-y-full');
    updateBar();
}

   function updateBar() {
    const total = basePrice * selectedDuration;
    const splitAmount = (total / 10).toFixed(2);
    
    // Mise à jour des prix affichés
    document.getElementById('split-price').innerText = splitAmount + ' €';
    document.getElementById('full-price').innerText = total.toFixed(2) + ' €';
    
    // Prix final selon le mode
    const finalPrice = selectedPaymentMode === 'SPLIT' ? splitAmount : total.toFixed(2);
    document.getElementById('display-price').innerText = finalPrice + ' €';
    
    if(selectedTime) {
        const startH = parseInt(selectedTime.split(':')[0]);
        const mode = selectedPaymentMode === 'SPLIT' ? '(Paiement Partagé)' : '(Paiement Intégral)';
        document.getElementById('selection-summary').innerText = `${selectedTerrainName} • ${selectedDate} • ${startH}h-${startH+selectedDuration}h ${mode}`;
    }
}

  // DANS RESERVATION.HTML

function confirmBooking() {
    // On ne contacte plus le serveur ici. On passe juste les infos à la page suivante.
    if(!selectedTerrainId || !selectedDate || !selectedTime) {
        alert("Veuillez sélectionner un terrain, une date et une heure.");
        return;
    }

    // On construit l'URL avec toutes les infos nécessaires pour la création future
    const params = new URLSearchParams({
        mode: 'creation', // Pour dire à la page paiement que c'est une nouvelle créa
        terrainId: selectedTerrainId,
        terrainName: selectedTerrainName, // On passe le nom pour l'affichage
        date: selectedDate,
        time: selectedTime,
        duration: selectedDuration,
        paymentMode: selectedPaymentMode,
        price: basePrice * selectedDuration // Juste pour l'affichage, le backend recalculera
    });

    window.location.href = '/payment.html?' + params.toString();
}