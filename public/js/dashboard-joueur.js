   document.addEventListener('DOMContentLoaded', async () => {
            const u = await fetch('/api/me');
            const user = await u.json();
            if(!user.loggedIn) { window.location.href = '/login.html'; return; }
            document.getElementById('user-name').innerText = user.user.firstName + ' ' + user.user.lastName;
            
            // Chargement initial
            loadBookings();
            
            // Refresh auto Mercato si actif
            setInterval(() => {
                if(!document.getElementById('section-mercato').classList.contains('hidden')) {
                    loadMercato();
                }
            }, 5000);
        });

        function switchTab(tab) {
            document.querySelectorAll('button[id^="tab-"]').forEach(b => {
                b.classList.replace('border-neon','border-transparent');
                b.classList.replace('text-white','text-gray-500');
            });
            const activeBtn = document.getElementById(`tab-${tab}`);
            activeBtn.classList.replace('border-transparent','border-neon');
            activeBtn.classList.replace('text-gray-500','text-white');

            document.getElementById('section-my-matches').classList.add('hidden');
            document.getElementById('section-mercato').classList.add('hidden');
            document.getElementById(`section-${tab}`).classList.remove('hidden');

            if(tab === 'mercato') loadMercato();
            else loadBookings();
        }

        async function loadBookings() {
    try {
        // Ajouter un timestamp pour éviter le cache
        const res = await fetch('/api/reservations?t=' + Date.now());
        const list = await res.json();
        
        console.log(`📋 ${list.length} réservations chargées`);
        
        const container = document.getElementById('section-my-matches');
        container.innerHTML = '';
        
        if (list.length === 0) {
            container.innerHTML = `
                <div class="p-6 bg-[#111] rounded border border-white/5 text-center">
                    <div class="text-gray-500 text-sm mb-2">Aucun match prévu</div>
                    <button onclick="window.location.href='/reservation.html'" 
                            class="bg-neon text-black font-bold text-xs px-4 py-2 rounded hover:bg-white transition">
                        Réserver un terrain
                    </button>
                </div>`;
            return;
        }
        
        list.forEach(b => {
            const date = new Date(b.start_time);
            let statusBadge = '';
            let progressHtml = '';
            
            if (b.status === 'CONFIRMED') {
                statusBadge = '<span class="text-[9px] bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded font-bold uppercase">VALIDÉ</span>';
            } else if (b.status === 'PENDING_PAYMENT') {
                statusBadge = '<span class="text-[9px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded font-bold uppercase">EN ATTENTE</span>';
                const pct = Math.min((b.slots_paid / 8) * 100, 100);
                const color = b.slots_paid >= 8 ? 'bg-green-500' : 'bg-red-500';
                progressHtml = `
                    <div class="w-full bg-white/10 h-1 mt-2 rounded-full overflow-hidden">
                        <div class="${color} h-full transition-all duration-500" style="width: ${pct}%"></div>
                    </div>
                    <div class="flex justify-between mt-1 text-[8px] uppercase font-bold text-gray-500">
                        <span>Payés: ${b.slots_paid}</span>
                        <span>Min: 8</span>
                    </div>`;
            }

            container.innerHTML += `
                <div class="flex items-center bg-[#111] p-0 rounded-xl border border-white/5 overflow-hidden hover:border-neon/30 transition group relative">
                    <div class="bg-white/5 p-4 text-center min-w-[80px] h-full flex flex-col justify-center border-r border-white/5">
                        <span class="block text-white font-black text-xl leading-none">${date.getDate()}</span>
                        <span class="block text-gray-500 text-[10px] uppercase font-bold">${date.toLocaleDateString('fr-FR', {month:'short'})}</span>
                    </div>
                    <div class="flex-1 p-4">
                        <div class="flex items-center justify-between mb-1">
                            <div class="text-white font-bold text-sm uppercase tracking-wide">${b.pitch_name}</div>
                            ${statusBadge}
                        </div>
                        <div class="text-gray-400 text-xs mb-1 font-mono">${date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} • Code: <span class="text-neon font-bold select-all">${b.match_code}</span></div>
                        ${progressHtml}
                    </div>
                    <button onclick="window.location.href='/match.html?id=${b.match_id}'" class="bg-white text-black font-bold text-[10px] px-6 py-5 uppercase hover:bg-neon transition h-full absolute right-0 top-0 bottom-0 opacity-0 group-hover:opacity-100 translate-x-full group-hover:translate-x-0 duration-300">Accéder</button>
                </div>`;
        });
    } catch (e) { 
        console.error("Erreur loadBookings:", e); 
    }
}
       async function loadMercato() {
    try {
        const res = await fetch('/api/matches/public');
        const list = await res.json();
        
        console.log("🎮 Mercato - Données reçues:", list);
        console.log("🎮 Nombre de matchs:", list.length);
        
        const container = document.getElementById('section-mercato');
        container.innerHTML = '';
        
        if(list.length === 0) {
            container.innerHTML = '<div class="col-span-full p-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5"><div class="text-gray-400 font-bold mb-1">Mercato Calme</div><div class="text-xs text-gray-600">Aucun match public en attente de joueurs pour le moment.</div></div>';
            return;
        }
        
        list.forEach(m => {
            console.log("Match:", m.match_code, "Places:", m.slots_paid);
            
            const date = new Date(m.start_time);
            const missing = 10 - m.slots_paid;
            const pricePerHead = (m.total_price / 10).toFixed(0);

            container.innerHTML += `
                <div class="bg-[#111] border border-white/10 rounded-xl p-5 hover:border-neon transition group relative overflow-hidden">
                    <div class="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-2 py-1 uppercase rounded-bl shadow-lg">Place: ${missing}</div>
                    <div class="flex items-center gap-4 mb-3">
                        <img src="${m.captain_avatar || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-full border border-white/20 object-cover">
                        <div>
                            <div class="text-[10px] text-gray-500 font-bold uppercase">CAPITAINE</div>
                            <div class="text-white font-bold text-sm truncate w-32">${m.captain_name || 'Anonyme'}</div>
                        </div>
                    </div>
                    <div class="flex justify-between items-center border-t border-white/5 pt-3 mb-4">
                        <div>
                            <div class="text-lg font-orbitron font-bold text-white">${date.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                            <div class="text-[10px] text-gray-500 uppercase font-bold">${m.pitch_name}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-xl font-black text-neon">${pricePerHead}€</div>
                            <div class="text-[9px] text-gray-500 uppercase">/ Joueur</div>
                        </div>
                    </div>
                    <button onclick="joinMatchPay('${m.match_id}')" class="w-full bg-white/5 hover:bg-neon hover:text-black text-white font-bold py-3 rounded text-xs uppercase transition border border-white/10">Rejoindre & Payer</button>
                </div>`;
        });
    } catch (e) { 
        console.error("💥 Erreur loadMercato:", e); 
    }
}


async function joinLobby() {
    const codeInput = document.getElementById('lobbyCode');
    const code = codeInput.value.trim();
    
    if(!code) return alert("Veuillez entrer un code");
    
    // On demande au serveur si le code existe
    try {
        const res = await fetch(`/api/match/lookup/${code}`);
        const data = await res.json();
        
        if (data.found) {
            // S'il existe, on redirige vers le paiement
            window.location.href = `/payment.html?matchId=${data.matchId}`;
        } else {
            alert("❌ Code match introuvable");
        }
    } catch (e) {
        alert("Erreur réseau");
    }
}

      function joinMatchPay(matchId) {
    // Plus besoin de confirm() ici, la page de paiement servira de confirmation
    window.location.href = `/payment.html?matchId=${matchId}`;
}

        async function logout() { await fetch('/logout', { method: 'POST' }); window.location.href = '/login.html'; }