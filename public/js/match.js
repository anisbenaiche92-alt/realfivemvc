  const matchId = new URLSearchParams(window.location.search).get('id');
        let currentUser = null;
        let matchDate = null;
        let lastMsgId = 0;

        // --- TACTIQUE 1-2-2 (ANTI-SUPERPOSITION) ---
        // Team A (Bas -> Haut)
        const slotsA = [
            {top:'92%', left:'50%'}, // Gardien
            {top:'78%', left:'20%'}, // Def G
            {top:'78%', left:'80%'}, // Def D
            {top:'60%', left:'30%'}, // Att G
            {top:'60%', left:'70%'}  // Att D
        ];

        // Team B (Haut -> Bas)
        const slotsB = [
            {top:'8%',  left:'50%'}, // Gardien
            {top:'22%', left:'80%'}, // Def D
            {top:'22%', left:'20%'}, // Def G
            {top:'40%', left:'70%'}, // Att D
            {top:'40%', left:'30%'}  // Att G
        ];

        // --- MOBILE NAV ---
        function switchTab(tab) {
            document.getElementById('panel-pitch').classList.add('mobile-hidden');
            document.getElementById('panel-squads').classList.add('mobile-hidden');
            document.getElementById('panel-chat').classList.add('mobile-hidden');
            
            document.querySelectorAll('.mobile-tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(`tab-${tab}`).classList.add('active');

            const target = document.getElementById(`panel-${tab}`);
            target.classList.remove('mobile-hidden');

            if(tab === 'chat') {
                const box = document.getElementById('chat-box');
                box.scrollTop = box.scrollHeight;
            }
        }

        function toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu');
            const overlay = document.getElementById('mobile-menu-overlay');
            if (menu.classList.contains('open')) {
                menu.classList.remove('open');
                overlay.classList.add('hidden');
            } else {
                menu.classList.add('open');
                overlay.classList.remove('hidden');
            }
        }

        // --- INIT ---
        document.addEventListener('DOMContentLoaded', async () => {
            if(!matchId) window.location.href='/';
            
            // Set Share Link
            document.getElementById('share-link-input').value = window.location.href;

            // Layout Reset (PC vs Mobile)
            window.addEventListener('resize', () => {
                if(window.innerWidth < 768) {
                    switchTab('pitch');
                }
            });

            const u = await fetch('/api/me');
            const userData = await u.json();
            if(!userData.loggedIn) { window.location.href='/login.html'; return; }
            currentUser = userData.user;
            
            loadData(); loadChat(); 
            setInterval(loadData, 2000); 
            setInterval(loadChat, 2000); 
            setInterval(updateTimer, 1000);
        });

// 1. Remplace la fonction loadData()
async function loadData() {
    try {
        const res = await fetch(`/api/match/${matchId}`);
        const data = await res.json();
        
        if(data.error) {
            if (data.error.includes("introuvable") || data.error.includes("expiré")) {
                window.location.href = '/dashboard-joueur.html';
                return;
            }
            return;
        }

        if (data.match.res_status === 'CANCELLED') {
            document.body.innerHTML = `<div class="h-screen flex items-center justify-center bg-black text-red-500 font-orbitron">MATCH ANNULÉ</div>`;
            return;
        }

        // --- INFO MATCH ---
        document.getElementById('match-code-desk').innerText = data.match.match_code;
        document.getElementById('match-code-mob').innerText = data.match.match_code;
        document.getElementById('match-venue').innerText = data.match.terrain_name || "TERRAIN";
        matchDate = new Date(data.match.start_time);

        const isCreator = (currentUser && data.match.creator_id === currentUser.id);

        // --- NOMS D'ÉQUIPES (Ne pas écraser si l'utilisateur tape) ---
        const inpA = document.getElementById('name-A');
        const inpB = document.getElementById('name-B');
        
        if (document.activeElement !== inpA) inpA.value = data.match.team_name_a || 'DOMICILE';
        if (document.activeElement !== inpB) inpB.value = data.match.team_name_b || 'EXTÉRIEUR';

        if (isCreator) {
            inpA.disabled = false;
            inpB.disabled = false;
            inpA.classList.add('cursor-text', 'hover:bg-white/5');
            inpB.classList.add('cursor-text', 'hover:bg-white/5');
        }

        // --- BOUTON PUBLIC (Logique Blindée) ---
        const btnDesk = document.getElementById('btn-public-desk');
        const btnMob = document.getElementById('btn-public-mob');
        
        if(isCreator) {
            // Force l'affichage (override le CSS hidden)
            btnDesk.style.display = 'flex';
            if(btnMob) btnMob.classList.remove('hidden');

            if(data.match.is_public) {
                // Mode PUBLIC -> Bouton pour rendre PRIVÉ (Vert)
                btnDesk.innerHTML = '<span class="text-green-500">●</span> <span class="hidden lg:inline">EN LIGNE</span>';
                btnDesk.className = "flex border border-green-500/50 text-green-500 bg-green-500/10 w-10 h-10 lg:w-auto lg:h-auto lg:px-4 lg:py-3 rounded items-center justify-center gap-2 text-xs font-bold uppercase hover:bg-green-500/20 transition shrink-0";
                if(btnMob) btnMob.innerText = "● RENDRE PRIVÉ";
            } else {
                // Mode PRIVÉ -> Bouton pour rendre PUBLIC (Gris)
                btnDesk.innerHTML = '<span class="text-gray-400">🌐</span> <span class="hidden lg:inline">PUBLIC</span>';
                btnDesk.className = "flex border border-dashed border-white/30 text-gray-400 w-10 h-10 lg:w-auto lg:h-auto lg:px-4 lg:py-3 rounded items-center justify-center gap-2 text-xs font-bold uppercase hover:text-white hover:border-white transition shrink-0";
                if(btnMob) btnMob.innerText = "🌐 RENDRE PUBLIC";
            }
        } else {
            btnDesk.style.display = 'none';
            if(btnMob) btnMob.classList.add('hidden');
        }

        renderLists(data.players, isCreator);
        renderPitch(data.players);

    } catch(e) { console.error("Erreur loadData:", e); }
}

// 2. Remplace la fonction renderLists()
function renderLists(players, isCreator) {
    const listA = document.getElementById('list-A');
    const listB = document.getElementById('list-B');
    listA.innerHTML = ''; listB.innerHTML = '';
    let cA=0, cB=0;

    players.forEach(p => {
        const isMe = (currentUser && p.id === currentUser.id);
        let btns = '';

        // --- BOUTONS TACTIQUES (Seulement pour le capitaine) ---
        if (isCreator) {
            if (p.team_side === 'A') {
                // Flèche BAS (vers B)
                btns += `<button onclick="movePlayer(${p.id}, 'B')" class="w-6 h-6 flex items-center justify-center rounded bg-white/5 text-gray-400 hover:text-red-500 hover:border-red-500 border border-white/10 transition ml-1 group-hover:border-white/30" title="Envoyer en B">▼</button>`;
            } else {
                // Flèche HAUT (vers A)
                btns += `<button onclick="movePlayer(${p.id}, 'A')" class="w-6 h-6 flex items-center justify-center rounded bg-white/5 text-gray-400 hover:text-neon hover:border-neon border border-white/10 transition ml-1 group-hover:border-white/30" title="Envoyer en A">▲</button>`;
            }
        }

        // --- BOUTONS SOCIAUX (Ami / Kick) ---
        if (!isMe) {
            if (!p.isFriend) btns += `<button class="w-6 h-6 flex items-center justify-center rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/30 transition ml-1" onclick="addFriend(${p.id})" title="Ajouter Ami">+</button>`;
            if (isCreator) btns += `<button class="w-6 h-6 flex items-center justify-center rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 transition ml-1" onclick="kick(${p.id})" title="Exclure">✕</button>`;
        }

        const paidIcon = p.has_paid ? 
            '<span class="text-neon ml-2 text-[10px]" title="Payé">✓</span>' : 
            '<span class="text-red-500 ml-2 text-[10px]" title="Non Payé">✕</span>';

        const item = `
            <div class="flex items-center justify-between bg-white/5 p-2 rounded border border-white/5 hover:border-white/20 transition group h-12">
                <div class="flex items-center gap-3 overflow-hidden">
                    <img src="${p.avatar_url || 'https://via.placeholder.com/40'}" class="w-8 h-8 rounded-full border border-white/10 object-cover shrink-0">
                    <div class="min-w-0 flex flex-col justify-center">
                        <div class="flex items-center">
                            <span class="text-xs font-bold text-white truncate max-w-[80px] leading-tight">${p.first_name}</span>
                            ${paidIcon}
                        </div>
                        <span class="text-[9px] text-gray-500 uppercase tracking-wider leading-tight">${p.position ? p.position.substring(0,3) : 'POLY'}</span>
                    </div>
                </div>
                <div class="flex items-center">
                    ${btns}
                </div>
            </div>`;

        if(p.team_side === 'A') { listA.innerHTML += item; cA++; }
        else if(p.team_side === 'B') { listB.innerHTML += item; cB++; }
    });

    // Mise à jour des compteurs
    document.getElementById('count-A').innerText = `${cA}/5`;
    document.getElementById('count-B').innerText = `${cB}/5`;
}

       function renderPitch(players) {
    const field = document.getElementById('field-players');
    field.innerHTML = '';
    let cA=0, cB=0;

    players.forEach(p => {
        let pos, cls;
        // On place les joueurs selon leur équipe (A ou B)
        if(p.team_side === 'A' && cA < 5) { pos = slotsA[cA++]; cls = 'team-A'; }
        else if(p.team_side === 'B' && cB < 5) { pos = slotsB[cB++]; cls = 'team-B'; }
        
        if(pos) {
            // CORRECTION : On ajoute le Nom et la Note dans le HTML
            field.innerHTML += `
                <div class="player-card ${cls}" style="top:${pos.top}; left:${pos.left}">
                    <div class="player-rating">${p.overall_rating || '6.0'}</div>
                    <img src="${p.avatar_url || 'https://via.placeholder.com/45'}" class="card-img">
                    <div class="player-name">${p.first_name}</div>
                </div>`;
        }
    });
}

        async function sendChat(e) {
            e.preventDefault();
            const input = document.getElementById('chatInput');
            const txt = input.value.trim();
            if(!txt) return;
            
            const box = document.getElementById('chat-box');
            box.innerHTML += `<div class="chat-msg me opacity-50"><div class="chat-bubble bg-neon/20 text-white">${txt}</div></div>`;
            box.scrollTop = box.scrollHeight;
            input.value = '';
            
            await fetch(`/api/match/${matchId}/chat`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ content: txt }) });
            loadChat(); 
        }

        async function loadChat() {
            try {
                const res = await fetch(`/api/match/${matchId}/chat`);
                const msgs = await res.json();
                if (msgs.length > 0 && msgs[msgs.length - 1].id === lastMsgId) return;
                if (msgs.length > 0) lastMsgId = msgs[msgs.length - 1].id;
                
                const box = document.getElementById('chat-box');
                const shouldScroll = box.scrollTop + box.clientHeight >= box.scrollHeight - 50;
                box.innerHTML = '';
                
                msgs.forEach(m => {
                    const me = m.sender_id === currentUser.id;
                    box.innerHTML += `
                        <div class="chat-msg ${me?'me':''}">
                            <div class="chat-bubble">
                                <div class="flex justify-between items-baseline gap-2 mb-1">
                                    <span class="text-[10px] font-bold ${me?'text-black':'text-neon'} uppercase">${m.first_name}</span>
                                    <span class="text-[8px] opacity-50">${m.time}</span>
                                </div>
                                ${m.content}
                            </div>
                        </div>`;
                });
                if(shouldScroll || msgs.length < 5) box.scrollTop = box.scrollHeight;
            } catch(e) {}
        }

        function updateTimer() {
            if(!matchDate) return;
            const diff = matchDate - new Date();
            const els = [document.getElementById('countdown-mob'), document.getElementById('countdown-desk')];
            
            if(diff <= 0) { 
                els.forEach(el => { if(el) { el.innerText = "00:00:00"; el.classList.add('text-neon', 'animate-pulse'); }});
                return; 
            }
            
            const h = Math.floor(diff/3600000);
            const m = Math.floor((diff%3600000)/60000);
            const s = Math.floor((diff%60000)/1000);
            const timeStr = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
            
            els.forEach(el => { if(el) el.innerText = timeStr; });
        }
        function addEmoji(e) { document.getElementById('chatInput').value += e; }

    async function togglePublic() {
    console.log("🔄 Toggle public appelé pour matchId:", matchId);
    
    if (!confirm("Voulez-vous changer la visibilité de ce match ?")) {
        return;
    }
    
    // Désactiver les boutons pendant la requête
    const btnDesk = document.getElementById('btn-public-desk');
    const btnMob = document.getElementById('btn-public-mob');
    btnDesk.disabled = true;
    if(btnMob) btnMob.disabled = true;
    
    try {
        const res = await fetch('/api/match/toggle-public', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ matchId: parseInt(matchId) }) 
        });
        
        console.log("📡 Status:", res.status);
        
        const data = await res.json();
        console.log("📦 Response:", data);
        
        if (data.success) {
            // Message clair et explicite
            const msg = data.is_public 
                ? "✅ Match maintenant PUBLIC (visible sur le Mercato)" 
                : "🔒 Match maintenant PRIVÉ (caché du Mercato)";
            alert(msg);
            
            // Attendre 300ms pour laisser la BDD se mettre à jour
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Recharger l'état
            await loadData();
            
            // Fermer le menu mobile si ouvert
            if (window.innerWidth < 768) {
                toggleMobileMenu();
            }
        } else {
            alert("❌ Erreur: " + (data.error || "Impossible de changer la visibilité"));
        }
        
    } catch(e) {
        console.error("💥 Erreur toggle:", e);
        alert("❌ Erreur réseau: " + e.message);
    } finally {
        // Réactiver les boutons dans tous les cas
        btnDesk.disabled = false;
        if(btnMob) btnMob.disabled = false;
    }
}

        async function openInviteModal() {
            document.getElementById('inviteModal').classList.remove('hidden');
            const list = document.getElementById('friends-list-modal');
            const res = await fetch('/api/friends');
            const friends = await res.json();
            list.innerHTML = '';
            if(!friends.length) { list.innerHTML = '<p class="text-xs text-gray-500 text-center">Aucun ami trouvé.</p>'; return; }
            friends.forEach(f => {
                list.innerHTML += `
                    <div class="flex items-center justify-between bg-white/5 p-3 rounded-lg mb-2" onclick="inviteFriend(${f.id})">
                        <div class="flex items-center gap-3">
                            <img src="${f.avatar_url || 'https://via.placeholder.com/30'}" class="w-8 h-8 rounded-full object-cover">
                            <span class="text-sm font-bold text-white">${f.first_name}</span>
                        </div>
                        <span class="text-[9px] border border-neon/50 text-neon px-2 py-1 rounded cursor-pointer hover:bg-neon hover:text-black transition">INVITER</span>
                    </div>`;
            });
        }

        async function inviteFriend(friendId) {
    try {
        const res = await fetch('/api/match/invite-friend-v2', { 
            method: 'POST', 
            headers: {'Content-Type':'application/json'}, 
            body: JSON.stringify({ matchId, friendId }) 
        });
        
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('inviteModal').classList.add('hidden');
            alert("✅ Invitation envoyée ! Ton ami recevra une notification.");
        } else {
            alert("❌ Erreur : " + (data.error || "Impossible d'inviter"));
        }
    } catch(e) {
        console.error(e);
        alert("❌ Erreur réseau");
    }
}
        async function changeSide(side) { await fetch('/api/match/change-side', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ matchId, side }) }); loadData(); }
       async function leaveMatch() {
    // Vérifier si l'utilisateur est le créateur
    const res = await fetch(`/api/match/${matchId}`);
    const data = await res.json();
    const isCreator = (data.match.creator_id === currentUser.id);
    
    let confirmMsg = "⚠️ Êtes-vous sûr de vouloir quitter ce match ?";
    
    if (isCreator) {
        confirmMsg = "🚨 ATTENTION : Vous êtes le capitaine !\n\n" +
                     "Si vous quittez, le match sera ANNULÉ pour tout le monde.\n\n" +
                     "Voulez-vous vraiment continuer ?";
    }
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    try {
        const leaveRes = await fetch('/api/match/leave', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ matchId }) 
        });
        
        const leaveData = await leaveRes.json();
        
        if (leaveData.success) {
            if (leaveData.cancelled) {
                alert("✅ Match annulé. Tous les joueurs ont été notifiés.");
            } else {
                alert("✅ Vous avez quitté le match");
            }
            
            // Rediriger vers le dashboard
            window.location.href = '/dashboard-joueur.html';
        } else {
            alert("❌ Erreur : " + (leaveData.error || "Impossible de quitter"));
        }
        
    } catch(e) {
        console.error("Erreur leaveMatch:", e);
        alert("❌ Erreur réseau");
    }
}
        async function kick(targetId) { if(confirm("Ejecter ?")) await fetch('/api/match/kick', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ matchId, targetId }) }); loadData(); }
        
        function copyCode() { 
            // Copie uniquement le CODE (ex: M-9911)
            const code = document.getElementById('match-code-desk').innerText;
            navigator.clipboard.writeText(code); 
            alert("Code copié : " + code); 
        }

        function copyShareLink() {
            // Copie l'URL complète
            const url = window.location.href;
            navigator.clipboard.writeText(url);
            alert("Lien copié !");
        }


  async function saveTeamNames() {
    const nameA = document.getElementById('name-A').value.trim();
    const nameB = document.getElementById('name-B').value.trim();
    
    // Validation basique
    if (!nameA || !nameB) {
        alert("❌ Les noms d'équipe ne peuvent pas être vides");
        loadData(); // Recharger les anciennes valeurs
        return;
    }
    
    try {
        const res = await fetch('/api/match/update-names', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ matchId, nameA, nameB })
        });
        
        const data = await res.json();
        
        if (data.success) {
            console.log("✅ Noms d'équipe sauvegardés");
            // Feedback visuel (flash vert/rouge)
            const inpA = document.getElementById('name-A');
            const inpB = document.getElementById('name-B');
            
            inpA.classList.add('ring-2', 'ring-neon');
            inpB.classList.add('ring-2', 'ring-red-500');
            
            setTimeout(() => {
                inpA.classList.remove('ring-2', 'ring-neon');
                inpB.classList.remove('ring-2', 'ring-red-500');
            }, 500);
        } else {
            alert("❌ Erreur : " + (data.error || "Impossible de sauvegarder"));
            loadData();
        }
    } catch(e) {
        console.error("Erreur saveTeamNames:", e);
        alert("❌ Erreur réseau");
        loadData();
    }
}

async function movePlayer(targetId, side) {
    console.log(`🔄 Déplacement joueur ${targetId} vers équipe ${side}`);
    
    // Désactiver TOUS les boutons de déplacement
    const allButtons = document.querySelectorAll('button[onclick*="movePlayer"]');
    allButtons.forEach(btn => btn.disabled = true);
    
    // Effet visuel immédiat
    document.body.style.cursor = 'wait';
    
    try {
        const res = await fetch('/api/match/move-player', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ matchId, targetId, side })
        });
        
        const data = await res.json();
        
        if(data.success) {
            console.log("✅ Joueur déplacé avec succès");
            // Attendre un peu pour la BDD
            await new Promise(resolve => setTimeout(resolve, 200));
            // Rafraîchir l'affichage
            await loadData();
        } else {
            alert("❌ " + (data.error || "Impossible de déplacer le joueur"));
            console.error("Erreur movePlayer:", data.error);
        }
    } catch(e) { 
        console.error("Erreur réseau movePlayer:", e);
        alert("❌ Erreur réseau lors du déplacement");
    } finally {
        document.body.style.cursor = 'default';
        // Réactiver les boutons après rechargement
        setTimeout(() => {
            const buttons = document.querySelectorAll('button[onclick*="movePlayer"]');
            buttons.forEach(btn => btn.disabled = false);
        }, 300);
    }
}