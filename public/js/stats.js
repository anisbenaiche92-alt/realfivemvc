document.addEventListener('DOMContentLoaded', async () => {
    // 1. VÉRIFICATION DE LA SESSION ET AFFICHAGE DU NOM
    const meRes = await fetch('/api/me');
    const meData = await meRes.json();

    if (!meData.loggedIn) {
        window.location.href = '/login.html';
        return;
    }

    // Affichage du nom dans la sidebar
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.innerText = `${meData.user.firstName} ${meData.user.lastName}`;
    }

    // 2. CHARGEMENT DES STATISTIQUES (KPIs + Fidélité + Historique + Radar)
    try {
        const res = await fetch('/api/stats/me');
        const data = await res.json();
        
        if (data.error) return;

        // --- PARTIE A : KPIs CLASSIQUES ---
        document.getElementById('stat-matches').innerText = data.totalMatches;
        document.getElementById('stat-wins').innerText = data.winRate + '%';
        document.getElementById('stat-goals').innerText = data.totalGoals;
        document.getElementById('stat-rating').innerText = data.avgRating;

        // --- PARTIE B : CARTE DE FIDÉLITÉ DYNAMIQUE ---
        if (data.fidelity) {
            const f = data.fidelity;

            // Remplissage de la carte visuelle
            document.getElementById('rank-label').innerText = `RANG : ${f.rank}`;
            document.getElementById('rating-display').innerText = f.note;
            document.getElementById('card-user-name').innerText = `${meData.user.firstName}_${meData.user.lastName}`;
            document.getElementById('card-matches').innerText = data.totalMatches;
            document.getElementById('card-streak').innerText = f.streak;
            document.getElementById('card-lvl').innerText = f.level;

            // Gestion de la barre d'XP
            document.getElementById('xp-text').innerText = `${f.xp} / 1000 XP`;
            document.getElementById('bar-fill').style.width = `${(f.xp / 1000) * 100}%`;

            // Génération de la Roadmap des récompenses (Paliers Admin)
            const roadmap = document.getElementById('rewards-roadmap');
            if (roadmap) {
                roadmap.innerHTML = '';
                f.rewards.forEach(reward => {
                    const isUnlocked = data.totalMatches >= reward.threshold;
                    roadmap.innerHTML += `
                        <div class="flex items-center gap-4 p-4 rounded-xl transition ${isUnlocked ? 'bg-neon/10 border border-neon/20' : 'bg-white/5 opacity-40 grayscale'}">
                            <div class="text-2xl">${isUnlocked ? '🎁' : '🔒'}</div>
                            <div class="flex-1">
                                <div class="text-xs font-bold text-white">${reward.threshold} MATCHS</div>
                                <div class="text-[10px] text-gray-400 uppercase tracking-wider">${reward.label}</div>
                            </div>
                            ${isUnlocked ? '<span class="text-[8px] font-black text-neon border border-neon px-2 py-1 rounded">DÉBLOQUÉ</span>' : ''}
                        </div>
                    `;
                });
            }

            // Affichage du prochain objectif
            const nextReward = f.rewards.find(r => r.threshold > data.totalMatches);
            const goalElement = document.getElementById('next-goal');
            if (goalElement) {
                goalElement.innerText = nextReward 
                    ? `PROCHAIN : ${nextReward.threshold} MATCHS (${nextReward.label})`
                    : "NIVEAU MAXIMUM DE FIDÉLITÉ ATTEINT";
            }
        }

        // --- PARTIE C : HISTORIQUE DES MATCHS ---
        const historyBody = document.getElementById('match-history');
        if (historyBody) {
            historyBody.innerHTML = '';
            if (data.history.length === 0) {
                historyBody.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-gray-600">Aucun match joué</td></tr>';
            }
            data.history.forEach(m => {
                let badgeColor = m.result === 'VICTOIRE' ? 'text-green-500 bg-green-500/10' : 
                                (m.result === 'DÉFAITE' ? 'text-red-500 bg-red-500/10' : 'text-gray-400 bg-white/5');
                historyBody.innerHTML += `
                    <tr class="border-b border-white/5 hover:bg-white/5 transition">
                        <td class="py-4 pl-2"><span class="text-[10px] font-bold px-2 py-1 rounded ${badgeColor}">${m.result}</span></td>
                        <td class="py-4 text-gray-400">${new Date(m.date).toLocaleDateString()}</td>
                        <td class="py-4 font-mono font-bold">${m.score}</td>
                        <td class="py-4 text-right pr-2 font-bold text-yellow-500">${m.myRating}</td>
                    </tr>
                `;
            });
        }

        // --- PARTIE D : GRAPHIQUE RADAR ---
        const chartCanvas = document.getElementById('statsChart');
        if (chartCanvas) {
            const ctx = chartCanvas.getContext('2d');
            new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: ['ATTAQUE', 'DÉFENSE', 'PHYSIQUE', 'VITESSE', 'TECHNIQUE', 'PASSE'],
                    datasets: [{
                        label: 'Performance',
                        data: [data.stats.atk, data.stats.def, data.stats.phy, data.stats.pac, data.stats.tec, data.stats.pas],
                        backgroundColor: 'rgba(239, 26, 45, 0.2)', // Rouge Neon
                        borderColor: '#EF1A2D',
                        pointBackgroundColor: '#EF1A2D',
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
                    plugins: { legend: { display: false } }
                }
            });
        }
    } catch (err) {
        console.error("Erreur lors du chargement des stats:", err);
    }
});



async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
    } catch (e) {
        console.error("Erreur déconnexion:", e);
        window.location.href = '/login.html'; // Redirection forcée
    }
}