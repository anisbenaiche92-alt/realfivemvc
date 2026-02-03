    document.addEventListener('DOMContentLoaded', async () => {
    const u = await fetch('/api/me');
    const user = await u.json();

    // AJOUTE CETTE LIGNE : Elle affiche le nom dans la sidebar
    if (user.loggedIn) {
        document.getElementById('user-name').innerText = user.user.firstName + ' ' + user.user.lastName;
    }

    document.getElementById('my-code').innerText = user.user.friendCode || '---';
    loadMatchInvitations();
    loadFriendRequests();
    loadFriends();
});

async function loadMatchInvitations() {
    try {
        const res = await fetch('/api/match/invitations/pending');
        const invitations = await res.json();
        
        const section = document.getElementById('match-invitations-section');
        const grid = document.getElementById('match-invitations-grid');
        const count = document.getElementById('invitations-count');
        
        count.innerText = `(${invitations.length})`;
        
        if (invitations.length === 0) {
            section.classList.add('hidden');
            return;
        }
        
        section.classList.remove('hidden');
        grid.innerHTML = '';
        
        invitations.forEach(inv => {
            const matchDate = new Date(inv.start_time);
            const isFree = inv.payment_mode === 'FULL' && inv.slots_paid >= 10;
            
            grid.innerHTML += `
                <div class="bg-gradient-to-r from-neon/5 to-transparent border border-neon/20 p-4 rounded-xl flex items-center justify-between hover:border-neon/50 transition group">
                    <div class="flex items-center gap-4">
                        <img src="${inv.sender_avatar || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-full object-cover border-2 border-neon/30">
                        <div>
                            <div class="text-white font-bold text-sm">${inv.sender_name} t'invite</div>
                            <div class="text-xs text-gray-400">
                                ${matchDate.toLocaleDateString()} à ${matchDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            </div>
                            <div class="text-[10px] text-neon font-mono mt-1">Code: ${inv.match_code}</div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        ${isFree ? 
                            `<button onclick="acceptInvitation(${inv.id}, ${inv.match_id}, true)" class="bg-neon text-black font-bold text-xs px-4 py-2 rounded hover:bg-white transition">
                                ✓ GRATUIT
                            </button>` :
                            `<button onclick="acceptInvitation(${inv.id}, ${inv.match_id}, false)" class="bg-neon/20 text-neon border border-neon font-bold text-xs px-4 py-2 rounded hover:bg-neon hover:text-black transition">
                                Voir & Payer
                            </button>`
                        }
                        <button onclick="declineInvitation(${inv.id})" class="bg-red-500/10 text-red-500 border border-red-500/30 font-bold text-xs px-3 py-2 rounded hover:bg-red-500 hover:text-white transition">
                            ✕
                        </button>
                    </div>
                </div>`;
        });
        
    } catch(e) {
        console.error("Erreur chargement invitations:", e);
    }
}

async function acceptInvitation(invitationId, matchId, isFree) {
    try {
        const res = await fetch('/api/match/invitation/respond', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ invitationId, action: 'ACCEPTED' })
        });
        
        const data = await res.json();
        
        if (data.success) {
            if (isFree) {
                alert("✅ Tu as rejoint le match gratuitement !");
                window.location.href = '/payment.html?matchId=' + matchId;
            } else {
                alert("✅ Invitation acceptée ! Tu vas être redirigé pour payer ta part.");
                window.location.href = '/payment.html?matchId=' + matchId;
            }
        } else {
            alert("❌ Erreur : " + (data.error || "Impossible d'accepter"));
        }
    } catch(e) {
        alert("❌ Erreur réseau");
    }
}

async function declineInvitation(invitationId) {
    if (!confirm("Refuser cette invitation ?")) return;
    
    try {
        await fetch('/api/match/invitation/respond', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ invitationId, action: 'DECLINED' })
        });
        
        loadMatchInvitations();
    } catch(e) {
        alert("❌ Erreur");
    }
}


        async function loadFriends() {
            try {
                const res = await fetch('/api/friends');
                const friends = await res.json();
                const grid = document.getElementById('friends-grid');
                document.getElementById('friend-count').innerText = `(${friends.length})`;
                grid.innerHTML = '';

                if(friends.length === 0) {
                    grid.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                        <p class="text-gray-500 mb-2">Ta liste d'amis est vide.</p>
                        <p class="text-gray-600 text-xs">Partage ton code pour commencer !</p>
                    </div>`;
                    return;
                }

                friends.forEach(f => {
                   grid.innerHTML += `
    <div onclick="openFriendProfile(${f.id})" class="bg-[#111] border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-neon/40 hover:bg-white/5 transition group cursor-pointer">
        <div class="relative">
            <img src="${f.avatar_url || 'https://via.placeholder.com/50'}" class="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-neon/50 transition">
        </div>
        <div class="flex-1 min-w-0">
            <div class="font-bold text-white text-sm truncate group-hover:text-neon transition">${f.first_name} ${f.last_name}</div>
            <div class="text-[10px] text-gray-500 font-mono tracking-wider">${f.friend_code}</div>
        </div>
        <button onclick="event.stopPropagation(); removeFriend(${f.id})" class="text-gray-600 hover:text-red-500 transition px-2" title="Retirer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
    </div>`;
                });
            } catch(e) { console.error(e); }
        }

        async function addFriendByCode() {
            const code = document.getElementById('friendCodeInput').value.trim();
            if(!code) return;
            // Simulation UI pour feedback immédiat
            const btn = document.querySelector('button[onclick="addFriendByCode()"]');
            const originalText = btn.innerText;
            btn.innerText = "...";
            
            try {
                const res = await fetch('/api/friends/add-by-code', {
                    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ code })
                });
                const d = await res.json();
                if(d.success) { 
                    loadFriends(); 
                    document.getElementById('friendCodeInput').value = ''; 
                    alert("Ami ajouté !");
                } else {
                    alert(d.error || "Erreur lors de l'ajout");
                }
            } catch(e) { alert("Erreur réseau"); }
            btn.innerText = originalText;
        }

        function copyMyCode() {
            const code = document.getElementById('my-code').innerText;
            navigator.clipboard.writeText(code);
            // Petit feedback visuel
            const el = document.getElementById('my-code');
            el.classList.add('text-neon');
            setTimeout(() => el.classList.remove('text-neon'), 500);
            alert("ID copié : " + code);
        }
        // --- GESTION DEMANDES D'AMIS ---
async function loadFriendRequests() {
    try {
        const res = await fetch('/api/friends/requests');
        const reqs = await res.json();
        
        const section = document.getElementById('friend-requests-section');
        const grid = document.getElementById('friend-requests-grid');
        const count = document.getElementById('friend-requests-count');
        
        count.innerText = `(${reqs.length})`;

        if (reqs.length === 0) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');
        grid.innerHTML = '';

        reqs.forEach(r => {
            grid.innerHTML += `
                <div class="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <img src="${r.avatar_url || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-full object-cover">
                        <div>
                            <div class="text-white font-bold text-sm">${r.first_name} ${r.last_name}</div>
                            <div class="text-[10px] text-gray-400">Veut t'ajouter en ami</div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="respondFriend(${r.id}, 'ACCEPT')" class="bg-neon text-black font-bold text-xs px-3 py-2 rounded hover:bg-white transition">ACCEPTER</button>
                        <button onclick="respondFriend(${r.id}, 'DECLINE')" class="bg-red-500/10 text-red-500 border border-red-500/30 font-bold text-xs px-3 py-2 rounded">✕</button>
                    </div>
                </div>`;
        });
    } catch(e) { console.error(e); }
}

async function respondFriend(requestId, action) {
    try {
        await fetch('/api/friends/respond', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ requestId, action })
        });
        loadFriendRequests();
        loadFriends(); // Recharger la liste d'amis si accepté
    } catch(e) { alert("Erreur"); }
}

// --- GESTION PROFIL AMI ---
let friendChart = null;

async function openFriendProfile(friendId) {
    // Afficher modal loading ou vider ancienne data
    document.getElementById('friendProfileModal').classList.remove('hidden');
    
    try {
        const res = await fetch(`/api/stats/user/${friendId}`);
        const data = await res.json();
        
        if(data.error) { alert("Erreur données"); return; }

        // Remplir les infos
        const info = data.info;
        const stats = data.stats;

        document.getElementById('fp-avatar').src = info.avatar_url || 'https://via.placeholder.com/64';
        document.getElementById('fp-name').innerText = info.first_name + ' ' + info.last_name;
        document.getElementById('fp-position').innerText = info.position || 'Polyvalent';
        document.getElementById('fp-number').innerText = '#' + (info.jersey_number || '--');
        
        document.getElementById('fp-rating').innerText = stats.rating;
        document.getElementById('fp-matches').innerText = stats.matches;
        document.getElementById('fp-goals').innerText = stats.goals;

        // GRAPHIQUE RADAR
        const ctx = document.getElementById('friendRadarChart').getContext('2d');
        
        if(friendChart) friendChart.destroy(); // Détruire l'ancien graphique

        friendChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['ATK', 'DEF', 'PHY', 'VIT', 'TEC', 'PAS'],
                datasets: [{
                    label: 'Stats',
                    data: [stats.radar.atk, stats.radar.def, stats.radar.phy, stats.radar.pac, stats.radar.tec, stats.radar.pas],
                    backgroundColor: 'rgba(77, 255, 153, 0.2)',
                    borderColor: '#4DFF99',
                    pointBackgroundColor: '#4DFF99',
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255,255,255,0.1)' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        pointLabels: { color: 'white', font: { family: 'Orbitron', size: 10 } },
                        ticks: { display: false, backdropColor: 'transparent' },
                        suggestedMin: 0, suggestedMax: 100
                    }
                },
                plugins: { legend: { display: false } },
                maintainAspectRatio: false
            }
        });

    } catch(e) {
        console.error(e);
        alert("Impossible de charger le profil");
        closeProfileModal();
    }
}

function closeProfileModal() {
    document.getElementById('friendProfileModal').classList.add('hidden');
}


async function removeFriend(friendId) {
    // 1. Empêcher le clic de traverser (pour ne pas ouvrir le profil)
    if (window.event) {
        window.event.cancelBubble = true;
        window.event.stopPropagation();
    }

    if (!confirm("Voulez-vous vraiment retirer cet ami ?")) return;

    try {
        const res = await fetch('/api/friends/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friendId: friendId })
        });

        const data = await res.json();

        if (data.success) {
            // 2. Si ça a marché, on recharge la liste immédiatement
            await loadFriends();
        } else {
            alert("Erreur : " + (data.error || "Impossible de supprimer"));
        }
    } catch (e) {
        console.error(e);
        alert("Erreur connexion serveur");
    }
}