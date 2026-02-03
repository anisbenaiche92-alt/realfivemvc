  document.addEventListener('DOMContentLoaded', async () => {
            // 1. Charger les stats
            const res = await fetch('/api/stats/me');
            const data = await res.json();
            
            if(data.error) return;

            // 2. Remplir les KPIs
            document.getElementById('stat-matches').innerText = data.totalMatches;
            document.getElementById('stat-wins').innerText = data.winRate + '%';
            document.getElementById('stat-goals').innerText = data.totalGoals;
            document.getElementById('stat-rating').innerText = data.avgRating;

            // 3. Remplir l'historique
            const historyBody = document.getElementById('match-history');
            historyBody.innerHTML = '';
            
            if(data.history.length === 0) {
                historyBody.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-gray-600">Aucun match joué</td></tr>';
            }

            data.history.forEach(m => {
                let badgeColor = m.result === 'VICTOIRE' ? 'text-green-500 bg-green-500/10' : (m.result === 'DÉFAITE' ? 'text-red-500 bg-red-500/10' : 'text-gray-400 bg-white/5');
                
                historyBody.innerHTML += `
                    <tr class="border-b border-white/5 hover:bg-white/5 transition">
                        <td class="py-4 pl-2"><span class="text-[10px] font-bold px-2 py-1 rounded ${badgeColor}">${m.result}</span></td>
                        <td class="py-4 text-gray-400">${new Date(m.date).toLocaleDateString()}</td>
                        <td class="py-4 font-mono font-bold">${m.score}</td>
                        <td class="py-4 text-right pr-2 font-bold text-yellow-500">${m.myRating}</td>
                    </tr>
                `;
            });

            // 4. Initialiser le Graphique Radar
            const ctx = document.getElementById('statsChart').getContext('2d');
            new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: ['ATTAQUE', 'DÉFENSE', 'PHYSIQUE', 'VITESSE', 'TECHNIQUE', 'PASSE'],
                    datasets: [{
                        label: 'Stats',
                        data: [data.stats.atk, data.stats.def, data.stats.phy, data.stats.pac, data.stats.tec, data.stats.pas],
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
                    plugins: { legend: { display: false } }
                }
            });
        });