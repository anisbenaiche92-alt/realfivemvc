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


async function loadData() {
    try {
        const res = await fetch(`/api/match/${matchId}`);
        const data = await res.json();
        
        // 1. Gestion des erreurs de récupération
        if(data.error) {
            if (data.error.includes("introuvable") || data.error.includes("expiré")) {
                window.location.href = '/dashboard-joueur.html';
                return;
            }
            return;
        }

        // 2. Gestion du match annulé
        if (data.match.res_status === 'CANCELLED') {
            document.body.innerHTML = `<div class="h-screen flex items-center justify-center bg-black text-red-500 font-orbitron text-center">MATCH ANNULÉ</div>`;
            return;
        }

        // 3. Mise à jour des informations de base dans le header
        document.getElementById('match-code-desk').innerText = data.match.match_code;
        document.getElementById('match-code-mob').innerText = data.match.match_code;
        document.getElementById('match-venue').innerText = data.match.terrain_name || "TERRAIN";
        matchDate = new Date(data.match.start_time);

        const isCreator = (currentUser && data.match.creator_id === currentUser.id);

        // 4. Synchronisation des noms d'équipes (A et B)
        const inpA = document.getElementById('name-A');
        const inpB = document.getElementById('name-B');
        if (document.activeElement !== inpA) inpA.value = data.match.team_name_a || 'DOMICILE';
        if (document.activeElement !== inpB) inpB.value = data.match.team_name_b || 'EXTÉRIEUR';

        if (isCreator) {
            inpA.disabled = false; 
            inpB.disabled = false;
        }

        // 5. Gestion de la visibilité du bouton Public/Privé pour le capitaine
        const btnDesk = document.getElementById('btn-public-desk');
        const btnMob = document.getElementById('btn-public-mob');
        
        if(isCreator) {
            btnDesk.style.display = 'flex';
            if(btnMob) btnMob.classList.remove('hidden');
            if(data.match.is_public) {
                btnDesk.innerHTML = '<span class="text-green-500">●</span> <span class="hidden lg:inline">EN LIGNE</span>';
                btnDesk.className = "flex border border-green-500/50 text-green-500 bg-green-500/10 px-4 py-3 rounded items-center justify-center gap-2 text-xs font-bold uppercase hover:bg-green-500/20 transition shrink-0";
            } else {
                btnDesk.innerHTML = '<span class="text-gray-400">🌐</span> <span class="hidden lg:inline">PUBLIC</span>';
                btnDesk.className = "flex border border-dashed border-white/30 text-gray-400 px-4 py-3 rounded items-center justify-center gap-2 text-xs font-bold uppercase hover:text-white hover:border-white transition shrink-0";
            }
        } else {
            if(btnDesk) btnDesk.style.display = 'none';
            if(btnMob) btnMob.classList.add('hidden');
        }

        // 6. Mise à jour des listes de joueurs et du terrain tactique
        renderLists(data.players, isCreator);
        renderPitch(data.players);

        // 7. --- LOGIQUE DE SCORE, CLÔTURE ET SYSTÈME DE VOTE EN DIRECT ---
        const headerDisplay = document.getElementById('header-main-display');
        const statusDot = document.getElementById('status-dot');

        if (data.match.status === 'PLAYED') {
            // CAS A : Le score a été validé. On affiche le résultat final.
            if (headerDisplay) {
                headerDisplay.innerHTML = `
                    <div class="flex items-center gap-4">
                        <span class="text-neon font-orbitron text-3xl font-black">${data.match.score_home}</span>
                        <span class="text-white font-orbitron text-xl opacity-30">-</span>
                        <span class="text-red-500 font-orbitron text-3xl font-black">${data.match.score_away}</span>
                    </div>`;
            }
            if(statusDot) {
                statusDot.classList.remove('bg-neon', 'animate-pulse');
                statusDot.classList.add('bg-gray-500'); 
            }
            document.getElementById('match-venue').innerText = "MATCH TERMINÉ";

            // --- NOUVEAU : ACTIVATION DU BOUTON DE VOTE POUR TOUS LES JOUEURS ---
            if (!document.getElementById('open-vote-btn')) {
                const voteBtn = document.createElement('button');
                voteBtn.id = 'open-vote-btn';
                voteBtn.className = "fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white text-black font-black px-8 py-4 rounded-full shadow-neon z-[60] uppercase text-sm animate-pulse";
                voteBtn.innerText = "⭐ Voter pour les rôles (XP)";
                voteBtn.onclick = () => showVotingSystem(data.players);
                document.body.appendChild(voteBtn);
            }

            // --- LIVE DASHBOARD : Actualisation du tableau des votes en temps réel ---
            // Cette fonction va chercher les votes en BDD et met à jour ton tableau de stats
            refreshLiveVotes(data.players); 

        } else {
            // CAS B : Le match est physiquement fini (heure passée) mais le score n'est pas encore saisi.
            const now = new Date();
            const matchEndTime = new Date(data.match.end_time);
            const isCaptain = (currentUser && data.match.creator_id === currentUser.id);
            const isAdmin = (currentUser && currentUser.role === 'ADMIN');

            if (now > matchEndTime && (isCaptain || isAdmin)) {
                // Ouverture automatique de la modal de saisie des buts pour le capitaine/admin
                const modal = document.getElementById('scoreModal');
                if (modal && modal.classList.contains('hidden')) {
                    openScoreModal(data);
                }
            }
        }

        // 8. Vérification de l'affichage du bouton de secours (Saisir les Scores)
        checkAdminScoreButton(data);

    } catch(e) { 
        console.error("Erreur dans loadData:", e); 
    }
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
                    <div class="player-rating">${p.overall_rating || '5.0'}</div>
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

// --- ADMIN SCORE SUBMISSION ---  MATCH Terminé 


let currentPlayersData = []; // Pour stocker les joueurs localement

// Modifier la fonction loadData pour inclure le bouton Admin
// Dans match.js
// Dans match.js
async function checkAdminScoreButton(data) {
    const now = new Date();
    const matchEndTime = new Date(data.match.end_time);
    
    // On définit qui est le capitaine (celui qui a réservé)
    const isCaptain = (currentUser && data.match.creator_id === currentUser.id);
    const isAdmin = (currentUser && currentUser.role === 'ADMIN');

    // La popup s'affiche si l'utilisateur est ADMIN OU CAPITAINE, 
    // que le match est fini et qu'il n'est pas déjà marqué "PLAYED"
    if ((isAdmin || isCaptain) && now > matchEndTime && data.match.status !== 'PLAYED') {
        if (!document.getElementById('admin-score-btn')) {
            const btn = document.createElement('button');
            btn.id = 'admin-score-btn';
            btn.className = "fixed bottom-24 right-8 z-[50] bg-yellow-500 text-black font-black px-6 py-3 rounded-full shadow-2xl animate-bounce uppercase text-xs";
            btn.innerText = "Saisir les Scores 🏆";
            btn.onclick = () => openScoreModal(data);
            document.body.appendChild(btn);
        }
    }
}

function openScoreModal(data) {
    currentPlayersData = data.players;
    document.getElementById('label-teamA').innerText = data.match.team_name_a;
    document.getElementById('label-teamB').innerText = data.match.team_name_b;
    
    const listA = document.getElementById('players-list-scoreA');
    const listB = document.getElementById('players-list-scoreB');
    listA.innerHTML = ''; listB.innerHTML = '';

    data.players.forEach(p => {
        const row = `
            <div class="flex items-center justify-between bg-white/5 p-2 rounded">
                <span class="text-xs text-white truncate w-24">${p.first_name}</span>
                <input type="number" data-user-id="${p.id}" class="player-goal-input w-12 bg-black border border-white/10 text-white text-center rounded text-xs" value="0" min="0">
            </div>`;
        if(p.team_side === 'A') listA.innerHTML += row;
        else listB.innerHTML += row;
    });

    document.getElementById('scoreModal').classList.remove('hidden');
}

async function submitFinalScore(e) {
    e.preventDefault();
    const scoreA = parseInt(document.getElementById('final-scoreA').value);
    const scoreB = parseInt(document.getElementById('final-scoreB').value);
    
    const goalsData = {};
    document.querySelectorAll('.player-goal-input').forEach(input => {
        goalsData[input.dataset.userId] = parseInt(input.value);
    });

    try {
        const res = await fetch('/api/match/update-score-full', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ matchId, scoreA, scoreB, goalsData })
        });
        const result = await res.json();
        if(result.success) {
            alert("✅ Scores validés et XP distribuée !");
            window.location.reload();
        }
    } catch(e) { alert("Erreur lors de la validation"); }
}


function showVotingSystem(players) {
    const targets = players.filter(p => p.id !== currentUser.id);
    
    let html = `
    <div id="vote-overlay" class="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex flex-col items-center justify-center p-4 overflow-y-auto">
        <h2 class="font-orbitron text-xl md:text-2xl font-black text-white mb-8 tracking-tighter">QUI A BRILLE SUR LE TERRAIN ?</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl">`;

    targets.forEach(p => {
        html += `
        <div class="bg-white/5 border border-white/10 p-5 rounded-2xl text-center hover:bg-white/10 transition shadow-2xl">
            <div class="relative w-16 h-16 mx-auto mb-3">
                <img src="${p.avatar_url || '/image/default-avatar.png'}" class="w-full h-full rounded-full border-2 border-neon object-cover">
                <div class="absolute -bottom-1 -right-1 bg-neon text-black text-[8px] font-black px-1 rounded-full">${p.overall_rating || '5.0'}</div>
            </div>
            <h3 class="font-orbitron font-bold text-white uppercase text-sm mb-4">${p.first_name}</h3>
            
            <div class="grid grid-cols-2 gap-2">
                <button onclick="sendVote(${p.id}, 'mvp')" class="text-[9px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 py-2 rounded font-black hover:bg-yellow-500 hover:text-black transition">🥇 MVP</button>
                <button onclick="sendVote(${p.id}, 'worst')" class="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 py-2 rounded font-black hover:bg-red-500 hover:text-white transition">💀 PIRE</button>
                <button onclick="sendVote(${p.id}, 'strat')" class="text-[9px] bg-blue-500/10 text-blue-500 border border-blue-500/20 py-2 rounded font-black hover:bg-blue-500 hover:text-white transition">🧠 STRAT.</button>
                <button onclick="sendVote(${p.id}, 'fairplay')" class="text-[9px] bg-green-500/10 text-green-500 border border-green-500/20 py-2 rounded font-black hover:bg-green-500 hover:text-white transition">🤝 FAIRPLAY</button>
                <button onclick="sendVote(${p.id}, 'clutch')" class="text-[9px] bg-purple-500/10 text-purple-500 border border-purple-500/20 py-2 rounded font-black hover:bg-purple-500 hover:text-white transition">⚡ CLUTCH</button>
                <button onclick="sendVote(${p.id}, 'reveal')" class="text-[9px] bg-orange-500/10 text-orange-500 border border-orange-500/20 py-2 rounded font-black hover:bg-orange-500 hover:text-white transition">🌟 RÉVÉL.</button>
            </div>
        </div>`;
    });

    html += `</div>
        <button onclick="document.getElementById('vote-overlay').remove()" class="mt-10 px-8 py-3 border border-white/20 rounded-full text-gray-400 font-bold uppercase text-[10px] tracking-widest hover:text-white hover:border-white transition">Fermer</button>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

async function sendVote(targetId, category) {
    try {
        const res = await fetch('/api/match/vote', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ matchId, targetId, category })
        });
        const data = await res.json();
        if(data.success) {
            alert("✅ Vote enregistré ! XP distribuée.");
        } else {
            alert("⚠️ " + data.error);
        }
    } catch(e) { alert("Erreur réseau"); }
}


async function refreshLiveVotes(players) {
    try {
        const res = await fetch(`/api/match/${matchId}/votes`);
        const votesData = await res.json();

        // 1. Initialisation du Tally (compteur)
        const tally = {};
        players.forEach(p => {
            tally[p.id] = { name: p.first_name, mvp:0, worst:0, strat:0, fairplay:0, clutch:0, reveal:0 };
        });

        // 2. Remplissage avec les données réelles
        votesData.forEach(v => {
            if (tally[v.target_id]) tally[v.target_id][v.category] = v.count;
        });

        // 3. Calcul des Leaders (pour les boîtes du haut)
        const categories = ['mvp', 'worst', 'strat', 'fairplay', 'clutch', 'reveal'];
        const leaders = {};
        categories.forEach(cat => {
            let max = 0; let leader = "--";
            players.forEach(p => {
                if(tally[p.id][cat] > max) { max = tally[p.id][cat]; leader = tally[p.id].name; }
                else if(tally[p.id][cat] === max && max > 0) { leader += " & " + tally[p.id].name; }
            });
            leaders[cat] = leader;
        });

        // 4. Construction du HTML (Style FIFA / Maquette)
        let html = `
        <div class="current-winners flex flex-wrap justify-center gap-3 mb-6">
            <div class="winner-box-match"><span>🥇 MVP</span><strong>${leaders.mvp}</strong></div>
            <div class="winner-box-match"><span>💀 PIRE</span><strong>${leaders.worst}</strong></div>
            <div class="winner-box-match"><span>🧠 STRAT.</span><strong>${leaders.strat}</strong></div>
        </div>

        <div class="live-dashboard-match bg-black/40 border border-red-500/20 rounded-xl p-6">
            <h3 class="text-red-500 font-orbitron text-[10px] tracking-[3px] mb-6 text-center uppercase">📊 Statistiques de fin de match</h3>
            <table class="w-full text-center text-[11px]">
                <thead>
                    <tr class="text-gray-500 uppercase border-b border-white/5">
                        <th class="pb-4 text-left">Joueur</th>
                        <th class="pb-4">MVP</th><th class="pb-4">PIRE</th><th class="pb-4">STRAT</th>
                        <th class="pb-4">FAIR</th><th class="pb-4">CLUTCH</th><th class="pb-4">RÉVÉL</th>
                    </tr>
                </thead>
                <tbody class="text-white">`;

        players.forEach(p => {
            const s = tally[p.id];
            html += `
                <tr class="border-b border-white/5 hover:bg-white/5 transition">
                    <td class="py-4 text-left font-bold">${s.name}</td>
                    <td class="${s.mvp > 0 ? 'text-yellow-500 font-black' : 'opacity-30'}">${s.mvp}</td>
                    <td class="${s.worst > 0 ? 'text-red-500' : 'opacity-30'}">${s.worst}</td>
                    <td class="opacity-80">${s.strat}</td><td class="opacity-80">${s.fairplay}</td>
                    <td class="opacity-80">${s.clutch}</td><td class="opacity-80">${s.reveal}</td>
                </tr>`;
        });

        html += `</tbody></table></div>`;
        
        const container = document.getElementById('live-vote-results');
        if (container) container.innerHTML = html;

    } catch(e) { console.error("Erreur refresh votes:", e); }
}