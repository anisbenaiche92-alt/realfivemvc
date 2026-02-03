/**
 * ANITRIX DASHBOARD V2 - CORE ENGINE (FIXED)
 */

// STATE MANAGEMENT
const state = {
    terrains: [],
    stats: {},          
    chartInstance: null,
    calendarInstance: null,
    currentView: 'dashboard'
};
// ==========================================
// 1. ROUTER & NAVIGATION
// ==========================================
// ==========================================
// 1. ROUTER & NAVIGATION
// ==========================================
const router = {
    navigate: (viewId) => {
        // Masquer toutes les vues
        document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('hidden'));
        const target = document.getElementById(`view-${viewId}`);
        if(target) target.classList.remove('hidden');

        // Mettre à jour la navigation
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        const navBtn = document.getElementById(`nav-${viewId}`);
        if(navBtn) navBtn.classList.add('active');

        // Titres
        const titles = {
            'dashboard': 'VUE GLOBALE',
            'calendar': 'PLANNING',
            'crm': 'BASE CLIENTS',
            'terrains': 'PARC TERRAINS',
            'finance': 'COMPTABILITÉ',
            'marketing': 'MARKETING & PROMOS',
            'sanctions': 'GESTION SANCTIONS', // NOUVEAU
            'settings': 'CONFIGURATION'
        };
        document.getElementById('page-title').innerText = titles[viewId] || 'DASHBOARD';
        
        // Chargement des données
        if(viewId === 'dashboard') analytics.loadStats();
       if(viewId === 'calendar') calendarManager.init();
        if(viewId === 'crm') crm.load();
        if(viewId === 'terrains') terrainManager.load();
        if(viewId === 'finance') financeManager.load();
        if(viewId === 'marketing') marketingManager.load();
        if(viewId === 'sanctions') sanctionsManager.load(); // NOUVEAU

        state.currentView = viewId;
        localStorage.setItem('lastView', viewId);
    },

    init: () => {
        console.log("🚀 Initialisation du Dashboard...");
        // Charger les données de base
        analytics.loadStats();
        calendarManager.init();
        // Aller sur la vue par défaut
        router.navigate('dashboard');
    }
};
// ==========================================
// 2. ANALYTICS MANAGER (FIXED NaN)
// ==========================================
const analytics = {
    loadStats: async () => {
        utils.loading(true);
        try {
            const res = await fetch('/api/admin/stats');
            const data = await res.json();
            
            // Safe Parsing
            const currentRev = Number(data.revenue?.current || 0);
            const bookings = Number(data.bookings_count || 0);
            const occupancy = Number(data.occupancy || 0);

            utils.animateValue('kpi-revenue', 0, currentRev, 1000, '€');
            utils.animateValue('kpi-bookings', 0, bookings, 1000, '');
            document.getElementById('kpi-occupancy').innerText = occupancy + '%';
            
            const growthEl = document.getElementById('kpi-growth');
            const growth = Number(data.revenue?.growth || 0);
            growthEl.innerText = (growth > 0 ? '+' : '') + growth + '%';
            growthEl.className = `text-xs font-bold px-2 py-0.5 rounded-full ${growth >= 0 ? 'text-[#4DFF99] bg-[#4DFF99]/10' : 'text-red-500 bg-red-500/10'}`;

            analytics.renderChart(30);
            analytics.renderDoughnut(data.sports_dist || []);
            const resPlayers = await fetch('/api/admin/users/search?q=');
            const players = await resPlayers.json();
            const select = document.getElementById('sanction-player');
             if(select) {
               select.innerHTML = '<option value="">-- Sélectionner --</option>' + 
                players.map(p => `<option value="${p.id}">${p.first_name} ${p.last_name} (${p.email})</option>`).join('');
    }

        } catch(e) { console.error("KPI Error:", e); }
        utils.loading(false);
    },

    renderChart: async (days) => {
        try {
            const res = await fetch(`/api/admin/chart-data?days=${days}`);
            const data = await res.json();
            
            const ctx = document.getElementById('mainChart').getContext('2d');
            if(state.chartInstance) state.chartInstance.destroy();

            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(77, 255, 153, 0.2)');
            gradient.addColorStop(1, 'rgba(77, 255, 153, 0)');

            state.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Chiffre d\'Affaires',
                        data: data.data,
                        borderColor: '#4DFF99',
                        backgroundColor: gradient,
                        borderWidth: 2,
                        pointBackgroundColor: '#000',
                        pointBorderColor: '#4DFF99',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: '#666' } },
                        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#666' } }
                    }
                }
            });
        } catch(e) { console.error("Chart Error", e); }
    },

   renderDoughnut: (dist) => {
    const canvas = document.getElementById('doughnutChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Détruire l'ancien graphique s'il existe
    if(state.doughnutInstance) {
        state.doughnutInstance.destroy();
    }

    state.doughnutInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: dist.map(d => d.sport_type),
            datasets: [{
                data: dist.map(d => d.count),
                backgroundColor: ['#4DFF99', '#3B82F6', '#A855F7', '#F59E0B'],
                borderWidth: 0
            }]
        },
        options: { cutout: '80%', plugins: { legend: { display: false } } }
    });
}
};

// ==========================================
// 3. CALENDAR MANAGER
// ==========================================
const calendarManager = {
    init: () => {
        const el = document.getElementById('calendar');
       state.calendarInstance = new FullCalendar.Calendar(el, {
    initialView: 'timeGridWeek',
    locale: 'fr',
    headerToolbar: false,
    slotDuration: '00:30:00', // Durée des créneaux
    slotMinTime: '08:00:00',   // Heure de début
    slotMaxTime: '23:59:00',   // Heure de fin
    allDaySlot: false,
    editable: true,
    selectable: true,
    
    // --- LES NOUVELLES LIGNES À VÉRIFIER ---
    slotEventOverlap: false,   // Force le côte-à-côte
    eventOrder: 'pitch_id',    // Organisation par terrain
    expandRows: true,          // Remplit l'espace vertical
    handleWindowResize: true,  // S'adapte à la taille de l'écran

    // Pour l'affichage pro du texte dans les bulles
    eventContent: (arg) => {
    const p = arg.event.extendedProps;
    const timeText = arg.timeText || '';
    
    return {
        html: `
            <div class="flex flex-col h-full w-full overflow-hidden leading-none px-1 py-0.5">
                <div class="flex justify-between items-center mb-0.5">
                    <span class="text-[9px] font-mono opacity-80">${timeText}</span>
                </div>
                <div class="font-black text-[10px] uppercase truncate" style="line-height:1.1">
                    ${p.pitch_name}
                </div>
                <div class="text-[9px] font-medium truncate opacity-90">
                    ${p.first_name} ${p.last_name}
                </div>
            </div>
        `
    };
},
            
            // CHARGEMENT avec classes CSS personnalisées
           // DANS dashboard-pro.js -> calendarManager -> events

events: async (info, success, fail) => {
    try {
        // 1. AJOUT DU TIMESTAMP (?t=...) pour forcer le navigateur à ne pas utiliser le cache
        const res = await fetch('/api/admin/reservations?t=' + Date.now());
        const data = await res.json();
        
        const allEvents = data.map(r => {
            // 2. CORRECTION DES STATUTS : On ajoute 'PENDING_PAYMENT'
            let statusClass = 'fc-event-confirmed';
            
            // Si c'est en attente (classique ou paiement), on met ORANGE
            if(r.status === 'PENDING' || r.status === 'PENDING_PAYMENT') {
                statusClass = 'fc-event-pending';
            }
            
            if(r.status === 'CANCELLED') {
                statusClass = 'fc-event-cancelled';
            }
            
            return {
                id: r.id,
                title: `${r.pitch_name}\n${r.first_name} ${r.last_name}`,
                start: r.start_time,
                end: r.end_time,
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                className: statusClass,
                extendedProps: { ...r }
            };
        });
        
        // Appliquer les filtres admin (si on veut masquer les annulés par ex)
        const filteredEvents = calendarManager.applyFilters(allEvents);
        success(filteredEvents);
        
        // Mettre à jour les stats après avoir reçu les VRAIES nouvelles données
        setTimeout(() => calendarManager.updateStats(), 100);
    } catch(e) { fail(e); }
},
            
            // Rendu personnalisé du contenu de l'événement
            eventContent: (arg) => {
                const props = arg.event.extendedProps;
                const timeText = arg.timeText;
                
                return {
                    html: `
                        <div class="fc-event-main-frame">
                            <div class="fc-event-time">${timeText}</div>
                            <div class="fc-event-title-container">
                                <div class="fc-event-title fc-sticky">
                                    <strong>${props.pitch_name || 'Terrain'}</strong><br>
                                    ${props.first_name || ''} ${props.last_name || ''}
                                </div>
                            </div>
                        </div>
                    `
                };
            },

            // DRAG & DROP (Déplacer)
            eventDrop: async (info) => {
                // 1. Demander confirmation
                if(!await window.utils.confirm("Déplacer cette réservation ?")) return info.revert();

                // 2. Fonction sécurisée pour convertir en SQL
                const toLocalSQL = (date) => {
                    if (!date) return null; // Sécurité anti-crash
                    const offset = date.getTimezoneOffset() * 60000;
                    return new Date(date.getTime() - offset).toISOString().slice(0, 19).replace('T', ' ');
                };

                // 3. Gestion du cas "Date de fin inconnue" (Le bug que vous avez)
                let newStart = info.event.start;
                let newEnd = info.event.end;

                // Si FullCalendar perd la date de fin, on la recalcule (Début + 1h par défaut)
                if (!newEnd) {
                    newEnd = new Date(newStart.getTime() + (60 * 60 * 1000)); // Ajoute 1h (en millisecondes)
                }

                try {
                    // 4. Envoi au serveur
                    const res = await fetch('/api/admin/reservations/move', {
                        method: 'PUT', 
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            id: info.event.id,
                            start_time: toLocalSQL(newStart),
                            end_time: toLocalSQL(newEnd)
                        })
                    });

                    const data = await res.json();

                    if (res.ok && data.success) {
                        window.utils.toast('success', 'Réservation déplacée avec succès');
                        analytics.loadStats(); // Met à jour les stats
                    } else {
                        throw new Error(data.error || "Erreur serveur");
                    }
                } catch (e) {
                    console.error("Erreur Move:", e);
                    window.utils.toast('error', "Impossible de déplacer : " + e.message);
                    info.revert(); // Remet la réservation à sa place si échec
                }
            },
            // CLIC SUR CRÉNEAU VIDE (Créer)
            select: (info) => modals.open('resa', info),

            // CLIC SUR RÉSERVATION EXISTANTE (Voir Détails)
            eventClick: (info) => {
                calendarManager.openDetails(info.event);
            }
        });
        state.calendarInstance.render();
    },


   toggleFullscreen: () => {
    const wrapper = document.getElementById('calendar-wrapper');
    const isFullscreen = wrapper.classList.toggle('calendar-fullscreen');
    
    // Gérer le scroll du body pour éviter le double scroll en plein écran
    document.body.style.overflow = isFullscreen ? 'hidden' : '';

    // Mettre à jour l'icône sur tous les boutons de plein écran
    const icons = document.querySelectorAll('i.fa-expand, i.fa-compress');
    icons.forEach(icon => {
        if (isFullscreen) {
            icon.classList.replace('fa-expand', 'fa-compress');
        } else {
            icon.classList.replace('fa-compress', 'fa-expand');
        }
    });

    // Indispensable pour que FullCalendar recalcule sa nouvelle taille
    setTimeout(() => {
        if (state.calendarInstance) {
            state.calendarInstance.updateSize();
        }
    }, 100);
},
    // Affiche la modale avec les infos
    openDetails: (event) => {
        const p = event.extendedProps;
        const start = new Date(event.start);
        const end = new Date(event.end);

        // Remplissage des champs
        document.getElementById('det-id').value = event.id;
        document.getElementById('det-client').innerText = p.first_name + ' ' + p.last_name;
        document.getElementById('det-contact').innerText = (p.email || '') + ' • ' + (p.phone || '');
        document.getElementById('det-terrain').innerText = p.pitch_name;
        document.getElementById('det-date').innerText = start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        
        // Format Heure (ex: 14:00 - 15:00)
        const timeStr = start.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) + ' - ' + end.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
        document.getElementById('det-time').innerText = timeStr;
        
        document.getElementById('det-code').innerText = p.match_code || '---';
        document.getElementById('det-price').innerText = parseFloat(p.total_price).toLocaleString() + ' €';

        // Gestion du statut (Couleur & Texte)
        const statusBadge = document.getElementById('det-status');
        const btnCancel = document.getElementById('btn-cancel-resa');

        if(p.status === 'CONFIRMED') {
            statusBadge.className = 'text-[10px] font-bold uppercase px-2 py-1 rounded bg-[#4DFF99]/20 text-[#4DFF99]';
            statusBadge.innerText = 'CONFIRMÉ';
            btnCancel.classList.remove('hidden'); // On peut annuler
        } else if (p.status === 'CANCELLED') {
            statusBadge.className = 'text-[10px] font-bold uppercase px-2 py-1 rounded bg-red-500/20 text-red-500';
            statusBadge.innerText = 'ANNULÉ';
            btnCancel.classList.add('hidden'); // Déjà annulé
        } else {
            statusBadge.className = 'text-[10px] font-bold uppercase px-2 py-1 rounded bg-yellow-500/20 text-yellow-500';
            statusBadge.innerText = p.status;
            btnCancel.classList.remove('hidden');
        }

        // Afficher la modale
        const el = document.getElementById('modal-details');
        el.classList.remove('hidden');
    },

    // Action Annuler
    cancelResa: async () => {
        const id = document.getElementById('det-id').value;
        if(!confirm("Voulez-vous vraiment annuler cette réservation ? (Irréversible)")) return;

        try {
            const res = await fetch('/api/admin/reservations/cancel', { 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ id })
            });
            const data = await res.json();

            if(data.success) {
                modals.close('details');
                state.calendarInstance.refetchEvents(); // Rafraîchit le calendrier
                analytics.load(); // Met à jour les KPIs
                utils.toast('Succès', 'Réservation annulée');
            } else {
                alert("Erreur lors de l'annulation");
            }
        } catch(e) { console.error(e); alert("Erreur serveur"); }
    },

    // Création (Fonction existante conservée)
    createResa: async () => {
        const btn = document.querySelector('#modal-resa .btn-primary');
        const originalText = btn.innerText;
        btn.innerText = "Traitement...";
        try {
            const payload = {
                client_name: document.getElementById('resa-client-name').value,
                terrain_id: document.getElementById('resa-terrain').value,
                start_time: document.getElementById('resa-start').value,
                end_time: document.getElementById('resa-end').value,
                price_override: document.getElementById('resa-price').value,
                source: document.querySelector('input[name="resa-source"]:checked').value
            };
            const res = await fetch('/api/admin/reservations/create', {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
            });
            const data = await res.json();
            if(data.success) {
                modals.close('resa');
                state.calendarInstance.refetchEvents();
                analytics.load();
                utils.toast('Succès', 'Réservation créée !');
            } else { alert("Erreur: " + data.error); }
        } catch(e) { alert("Erreur serveur"); }
        btn.innerText = originalText;
    },

    applyFilters: (events) => {
        return events.filter(event => {
            const props = event.extendedProps;
            
            // 1. Filtre par Terrain (si sélectionné)
            // Note: on utilise != au lieu de !== car l'ID peut être string ou number
            if (calendarManager.filters.terrain && props.pitch_id != calendarManager.filters.terrain) {
                return false;
            }

            // 2. Filtre par Statut
            if (calendarManager.filters.statuses.length > 0 && !calendarManager.filters.statuses.includes(props.status)) {
                return false;
            }

            return true;
        });
    },

    // État des filtres
    filters: {
        terrain: '',
        statuses: ['CONFIRMED', 'PENDING']
    },

    // Changer de vue
    switchView: (viewType) => {
        if(!state.calendarInstance) return;
        state.calendarInstance.changeView(viewType);
        
        // Mettre à jour les boutons actifs
        document.querySelectorAll('.cal-view-btn').forEach(btn => btn.classList.remove('active'));
        const btnId = viewType === 'timeGridWeek' ? 'view-week' : 
                      viewType === 'timeGridDay' ? 'view-day' : 'view-list';
        document.getElementById(btnId)?.classList.add('active');
    },

    // Filtrer par terrain
    filterByTerrain: () => {
        const select = document.getElementById('filter-terrain');
        calendarManager.filters.terrain = select.value;
        state.calendarInstance?.refetchEvents();
        calendarManager.updateStats();
    },

    // Toggle statut
    toggleStatus: (status) => {
        const btn = document.querySelector(`[data-status="${status}"]`);
        const idx = calendarManager.filters.statuses.indexOf(status);
        
        if(idx > -1) {
            calendarManager.filters.statuses.splice(idx, 1);
            btn.classList.remove('active');
        } else {
            calendarManager.filters.statuses.push(status);
            btn.classList.add('active');
        }
        
        state.calendarInstance?.refetchEvents();
        calendarManager.updateStats();
    },

    // Mettre à jour les statistiques
    updateStats: () => {
        if(!state.calendarInstance) return;
        
        const events = state.calendarInstance.getEvents();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        // Aujourd'hui
        const todayEvents = events.filter(e => {
            const eventDate = new Date(e.start);
            return eventDate >= today && eventDate < new Date(today.getTime() + 86400000);
        });
        document.getElementById('cal-stat-today').textContent = todayEvents.length;
        
        // Cette semaine
        const weekEvents = events.filter(e => {
            const eventDate = new Date(e.start);
            return eventDate >= weekStart && eventDate < weekEnd;
        });
        document.getElementById('cal-stat-week').textContent = weekEvents.length;
        
        // Taux d'occupation (simplifié)
        const totalSlots = state.terrains.length * 14 * 7; // 14h par jour, 7 jours
        const occupiedSlots = weekEvents.length;
        const rate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;
        document.getElementById('cal-stat-rate').textContent = rate + '%';
        
        // Prochain créneau
        const upcoming = events
            .filter(e => new Date(e.start) > now)
            .sort((a, b) => new Date(a.start) - new Date(b.start))[0];
        
        if(upcoming) {
            const time = new Date(upcoming.start).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
            document.getElementById('cal-stat-next').textContent = time;
            document.getElementById('cal-stat-next-terrain').textContent = upcoming.extendedProps.pitch_name || 'Terrain';
        } else {
            document.getElementById('cal-stat-next').textContent = '--:--';
            document.getElementById('cal-stat-next-terrain').textContent = 'Aucun';
        }
    },

    // Export du planning
    exportView: () => {
        const events = state.calendarInstance.getEvents();
        let csv = 'Date,Heure Début,Heure Fin,Terrain,Client,Statut,Prix\n';
        
        events.forEach(e => {
            const props = e.extendedProps;
            const start = new Date(e.start);
            const end = new Date(e.end);
            
            csv += `${start.toLocaleDateString('fr-FR')},`;
            csv += `${start.toLocaleTimeString('fr-FR')},`;
            csv += `${end.toLocaleTimeString('fr-FR')},`;
            csv += `"${props.pitch_name || 'N/A'}",`;
            csv += `"${props.first_name || ''} ${props.last_name || ''}",`;
            csv += `${props.status},`;
            csv += `${props.total_price || '0'}€\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planning_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        
        utils.toast('success', 'Planning exporté avec succès');
    },

    // Impression
    printView: () => {
        window.print();
    },

    toggleFullscreen: () => {
        const wrapper = document.getElementById('calendar-wrapper');
        const icon = document.querySelector('button[onclick="calendarManager.toggleFullscreen()"] i');
        
        // Bascule la classe
        wrapper.classList.toggle('calendar-fullscreen');
        
        // Change l'icône (Optionnel, pour le style)
        if (wrapper.classList.contains('calendar-fullscreen')) {
            icon.classList.remove('fa-expand');
            icon.classList.add('fa-compress');
        } else {
            icon.classList.remove('fa-compress');
            icon.classList.add('fa-expand');
        }

        // IMPORTANT : Force FullCalendar à recalculer la taille immédiatement
        setTimeout(() => {
            state.calendarInstance.updateSize();
        }, 100);
    },
};

// Ajout de la fonction close pour la nouvelle modale dans l'objet modals

// ==========================================
// 4. CRM MANAGER
// ==========================================
const crm = {
    load: () => crm.search(''),
    search: async (q = '') => {
        const input = document.getElementById('crm-search');
        const query = q || input.value;
        const res = await fetch(`/api/admin/users/search?q=${query}`);
        const users = await res.json();
        const tbody = document.getElementById('crm-table-body');
        tbody.innerHTML = users.map(u => `
            <tr class="group hover:bg-white/5 transition">
                <td class="p-5">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-xs border border-white/10 text-white">
                            ${(u.first_name || 'U')[0]}${(u.last_name || 'N')[0]}
                        </div>
                        <div>
                            <div class="font-bold text-white text-sm">${u.first_name} ${u.last_name}</div>
                            <div class="text-[10px] text-gray-500">${u.friend_code || '#NO-CODE'}</div>
                        </div>
                    </div>
                </td>
                <td class="p-5">
                    <div class="text-xs text-gray-300">${u.email}</div>
                    <div class="text-xs text-gray-500">${u.phone || '-'}</div>
                </td>
                <td class="p-5"><span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${u.client_tag==='VIP'?'bg-yellow-500/20 text-yellow-500':'bg-gray-800 text-gray-400'}">${u.client_tag||'STD'}</span></td>
                <td class="p-5 font-mono text-xs text-[#4DFF99] font-bold">${u.total_spent||0} €</td>
                <td class="p-5 text-right"><button class="text-gray-400 hover:text-white"><i class="fa-solid fa-ellipsis-vertical"></i></button></td>
            </tr>
        `).join('');
    }
};

// ==========================================
// 5. TERRAIN MANAGER (CRUD AJOUTÉ)
// ==========================================
// ==========================================
// 5. TERRAIN MANAGER (COMPLETE EDIT)
// ==========================================
const terrainManager = {
    load: async () => {
        const res = await fetch('/api/admin/terrains');
        const terrains = await res.json();
        state.terrains = terrains; 
        
        const grid = document.getElementById('terrains-grid');
        let html = `
        <div onclick="terrainManager.openModal()" class="glass-card p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 border-dashed border-2 border-white/20 min-h-[200px] group transition">
            <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <i class="fa-solid fa-plus text-2xl text-gray-500 group-hover:text-[#4DFF99]"></i>
            </div>
            <span class="font-bold text-gray-500 group-hover:text-white uppercase text-xs tracking-widest">Ajouter un Terrain</span>
        </div>`;

        html += terrains.map(t => {
            const isMaint = t.maintenance_status !== 'AVAILABLE';
            // Parsing des features (JSON ou string)
            let feats = { lighting: false, heating: false };
            try { feats = typeof t.features === 'string' ? JSON.parse(t.features) : t.features || {}; } catch(e){}

              return `
            <div class="glass-card p-6 relative overflow-hidden group">
                <div class="flex justify-between items-start mb-4">
                    <span class="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded uppercase backdrop-blur-md border border-white/5">${t.sport_type}</span>
                    <div class="flex gap-2">
                        ${t.is_indoor ? '<span title="Indoor" class="text-gray-500"><i class="fa-solid fa-warehouse"></i></span>' : '<span title="Outdoor" class="text-yellow-500"><i class="fa-solid fa-sun"></i></span>'}
                        ${t.has_camera ? '<span title="Caméra" class="text-red-500 animate-pulse"><i class="fa-solid fa-video"></i></span>' : ''}
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="font-orbitron font-bold text-xl text-white mb-1 truncate">${t.name}</h3>
                    <p class="text-xs text-gray-400 font-mono">${t.surface_type || 'Surface Standard'}</p>
                </div>

                <div class="flex items-end justify-between border-t border-white/10 pt-4">
                    <div>
                        <div class="font-orbitron font-bold text-xl text-[#4DFF99]">${t.hourly_rate}€</div>
                        <div class="text-[10px] text-gray-500 uppercase font-bold">${isMaint ? '🔴 Maintenance' : '🟢 Disponible'}</div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="terrainManager.openModal(${t.id})" class="w-8 h-8 rounded bg-white/5 hover:bg-white/20 text-white transition flex items-center justify-center" title="Modifier">
                            <i class="fa-solid fa-pen text-xs"></i>
                        </button>
                        <button onclick="terrainManager.toggleMaint(${t.id}, '${isMaint ? 'AVAILABLE' : 'MAINTENANCE'}')" class="w-8 h-8 rounded bg-white/5 hover:bg-white/20 ${isMaint ? 'text-red-500' : 'text-gray-400'} transition flex items-center justify-center" title="Maintenance">
                            <i class="fa-solid fa-wrench text-xs"></i>
                        </button>
                        <button onclick="terrainManager.delete(${t.id})" class="w-8 h-8 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 transition flex items-center justify-center" title="Supprimer">
                            <i class="fa-solid fa-trash text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
        grid.innerHTML = html;
    },
    
    openModal: (id = null) => {
        const modal = document.getElementById('modal-terrain');
        const title = document.getElementById('modal-terrain-title');
        
        // Reset form
        document.getElementById('terrain-id').value = '';
        document.getElementById('t-name').value = '';
        document.getElementById('t-price').value = '';
        document.getElementById('t-camera').checked = false;
        document.getElementById('feat-lighting').checked = false;
        document.getElementById('feat-heating').checked = false;
        
        if(id) {
            const t = state.terrains.find(x => x.id === id);
            title.innerText = "MODIFIER TERRAIN";
            document.getElementById('terrain-id').value = t.id;
            document.getElementById('t-name').value = t.name;
            document.getElementById('t-sport').value = t.sport_type;
            document.getElementById('t-price').value = t.hourly_rate;
            document.getElementById('t-surface').value = t.surface_type || 'Synthétique';
            document.getElementById('t-indoor').value = t.is_indoor ? "1" : "0";
            document.getElementById('t-camera').checked = !!t.has_camera;
            
            let f = {};
            try { f = typeof t.features === 'string' ? JSON.parse(t.features) : t.features || {}; } catch(e){}
            document.getElementById('feat-lighting').checked = !!f.lighting;
            document.getElementById('feat-heating').checked = !!f.heating;
        } else {
            title.innerText = "AJOUTER TERRAIN";
        }
        
        modals.open('terrain');
    },

    save: async () => {
        const id = document.getElementById('terrain-id').value;
        const payload = {
            name: document.getElementById('t-name').value,
            sport_type: document.getElementById('t-sport').value,
            hourly_rate: document.getElementById('t-price').value,
            surface_type: document.getElementById('t-surface').value,
            is_indoor: document.getElementById('t-indoor').value === "1" ? 1 : 0,
            has_camera: document.getElementById('t-camera').checked ? 1 : 0,
            features: {
                lighting: document.getElementById('feat-lighting').checked ? 1 : 0,
                heating: document.getElementById('feat-heating').checked ? 1 : 0
            }
        };

        if(!payload.name || !payload.hourly_rate) return alert("Nom et Prix requis");

        const url = id ? `/api/admin/terrains/${id}` : '/api/admin/terrains/add';
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if(data.success) {
                modals.close('terrain');
                terrainManager.load();
                utils.toast('Succès', 'Terrain enregistré');
            } else {
                alert("Erreur: " + data.error);
            }
        } catch(e) { console.error(e); }
    },

    toggleMaint: async (id, status) => {
        if(!confirm(`Confirmer ${status === 'MAINTENANCE' ? 'la maintenance' : 'la réouverture'} ?`)) return;
        await fetch(`/api/admin/terrains/toggle`, {
             method: 'POST', headers: {'Content-Type': 'application/json'},
             body: JSON.stringify({id, maintenance_status: status})
        });
        terrainManager.load();
    },

    delete: async (id) => {
        if(!confirm("Êtes-vous sûr de vouloir supprimer ce terrain ?")) return;
        
        try {
            const res = await fetch(`/api/admin/terrains/${id}`, { method: 'DELETE' });
            const data = await res.json();
            
            if(data.success) {
                utils.toast('Succès', 'Terrain supprimé');
                terrainManager.load(); // Recharge la liste pour le faire disparaître
            } else {
                alert("Erreur : " + (data.error || "Impossible de supprimer"));
            }
        } catch(e) {
            alert("Erreur serveur lors de la suppression");
        }
    }
};



// ==========================================
// 6. FINANCE MANAGER (COMPTABILITÉ & PDF)
// ==========================================
const financeManager = {
    load: async () => {
        window.utils.loading(true);
        try {
            const res = await fetch('/api/admin/finance/overview');
            const data = await res.json();

            // Update KPIs
            document.getElementById('fin-revenue').innerText = parseFloat(data.stats.revenue).toLocaleString() + ' €';
            document.getElementById('fin-pending').innerText = parseFloat(data.stats.pending).toLocaleString() + ' €';
            document.getElementById('fin-cash').innerText = parseFloat(data.stats.cash).toLocaleString() + ' €';
            document.getElementById('fin-card').innerText = parseFloat(data.stats.card).toLocaleString() + ' €';

            // Render Table
            const tbody = document.getElementById('finance-table-body');
            tbody.innerHTML = data.transactions.map(t => {
                const date = new Date(t.created_at).toLocaleDateString('fr-FR');
                const statusClass = t.payment_status === 'PAID' ? 'text-[#4DFF99] bg-[#4DFF99]/10' : 'text-red-500 bg-red-500/10';
                const statusLabel = t.payment_status === 'PAID' ? 'PAYÉ' : 'IMPAYÉ';
                
                return `
                <tr class="hover:bg-white/5 transition group">
                    <td class="p-4 text-gray-400 font-mono text-xs">${date}</td>
                    <td class="p-4 font-bold text-white">${t.first_name} ${t.last_name}</td>
                    <td class="p-4 text-xs text-gray-400">${t.terrain_name}</td>
                    <td class="p-4 font-orbitron font-bold">${t.total_price} €</td>
                    <td class="p-4"><span class="px-2 py-1 rounded text-[10px] font-bold ${statusClass}">${statusLabel}</span></td>
                    <td class="p-4 text-right">
                        <button onclick="financeManager.printInvoice(${t.id})" class="text-gray-500 hover:text-white transition" title="Télécharger Facture PDF">
                            <i class="fa-solid fa-file-invoice"></i>
                        </button>
                    </td>
                </tr>`;
            }).join('');

        } catch(e) { console.error(e); }
        window.utils.loading(false);
    },

    // Génération PDF Client (Utilise jsPDF inclus dans le head)
    printInvoice: async (id) => {
        try {
            window.utils.loading(true);
            const res = await fetch(`/api/admin/finance/invoice/${id}`);
            const data = await res.json();
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Header Stylé
            doc.setFillColor(10, 10, 10);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(77, 255, 153); // Neon
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text(data.complex_name || "REALFIVE", 20, 25);
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text("FACTURE", 180, 25, { align: 'right' });

            // Info Client & Complexe
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.text(`Émetteur: ${data.complex_name}`, 20, 50);
            doc.text(`Adresse: ${data.complex_address || 'Non renseignée'}`, 20, 55);
            
            doc.text(`Client: ${data.first_name} ${data.last_name}`, 140, 50);
            doc.text(`Email: ${data.email}`, 140, 55);

            // Détails Transaction
            doc.setDrawColor(200);
            doc.line(20, 70, 190, 70);
            
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Désignation", 20, 80);
            doc.text("Montant", 180, 80, { align: 'right' });
            
            doc.setFont("helvetica", "normal");
            doc.text(`Réservation: ${data.terrain_name}`, 20, 90);
            doc.text(`${new Date(data.start_time).toLocaleString('fr-FR')}`, 20, 95);
            doc.text(`${data.total_price} €`, 180, 90, { align: 'right' });

            doc.line(20, 105, 190, 105);

            // Total
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(`TOTAL: ${data.total_price} €`, 180, 115, { align: 'right' });
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Statut: ${data.payment_status === 'PAID' ? 'PAYÉ' : 'EN ATTENTE'}`, 180, 122, { align: 'right' });

            // Save
            doc.save(`facture_${id}.pdf`);
            window.utils.toast('success', 'Facture téléchargée');

        } catch(e) { 
            console.error(e); 
            window.utils.toast('error', 'Erreur génération PDF'); 
        }
        window.utils.loading(false);
    },

    // Export CSV simple
    exportCSV: () => {
        const rows = [];
        // Headers
        rows.push(['Date', 'Client', 'Terrain', 'Montant', 'Statut']);
        
        // Data from DOM (plus simple ici pour l'exemple)
        document.querySelectorAll('#finance-table-body tr').forEach(tr => {
            const cols = tr.querySelectorAll('td');
            rows.push([
                cols[0].innerText, // Date
                cols[1].innerText, // Client
                cols[2].innerText, // Terrain
                cols[3].innerText.replace(' €', ''), // Montant
                cols[4].innerText  // Statut
            ]);
        });

        let csvContent = "data:text/csv;charset=utf-8," 
            + rows.map(e => e.join(";")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "finance_export.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.utils.toast('success', 'Export CSV généré');
    }
};
// ==========================================
// 7. UTILS
// ==========================================
const utils = {
    loading: (show) => {
        const el = document.getElementById('loading-indicator');
        if(el) { if(show) el.classList.remove('hidden'); else el.classList.add('hidden'); }
    },
    animateValue: (id, start, end, duration, suffix = '') => {
        const obj = document.getElementById(id);
        if(!obj) return;
        // Fix: Ensure inputs are numbers
        start = Number(start);
        end = Number(end);
        if(isNaN(end)) end = 0;

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const val = Math.floor(progress * (end - start) + start);
            obj.innerHTML = val.toLocaleString() + ' ' + suffix;
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    },
    toast: (title, msg) => { console.log(`TOAST: ${title} - ${msg}`); }
};

const modals = {
    open: (id, data = null) => {
        const el = document.getElementById(`modal-${id}`);
        if(el) el.classList.remove('hidden');
        if(id === 'resa') {
            const select = document.getElementById('resa-terrain');
            select.innerHTML = state.terrains
                .filter(t => t.maintenance_status === 'AVAILABLE') 
                .map(t => `<option value="${t.id}">${t.name} (${t.sport_type})</option>`).join('');
            if(data && data.start) {
                const toIso = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                document.getElementById('resa-start').value = toIso(data.start);
                document.getElementById('resa-end').value = toIso(data.end);
            }
        }
    },
    close: (id) => { document.getElementById(`modal-${id}`).classList.add('hidden'); }
};

document.addEventListener('DOMContentLoaded', () => {
    router.init();
    terrainManager.load().then(() => { 
        calendarManager.init(); 
        
        // Charger les terrains dans le filtre
        const filterSelect = document.getElementById('filter-terrain');
        if(filterSelect && state.terrains) {
            state.terrains.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = t.name;
                filterSelect.appendChild(opt);
            });
        }
    });
    
    document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const wrapper = document.getElementById('calendar-wrapper');
        if (wrapper.classList.contains('calendar-fullscreen')) {
            calendarManager.toggleFullscreen();
        }
    }
});
    
    // Mettre à jour les stats du calendrier toutes les 30 secondes
    setInterval(() => {
        if(state.currentView === 'calendar' && state.calendarInstance) {
            calendarManager.updateStats();
        }
    }, 30000);
});




// A AJOUTER DANS L'OBJET Router (dans navigate)
// if(viewId === 'marketing') marketingManager.load();

// A AJOUTER COMME NOUVEL OBJET MANAGER
const marketingManager = {
    load: async () => {
        try {
            const res = await fetch('/api/admin/marketing/promos');
            const promos = await res.json();
            const tbody = document.getElementById('promo-table-body');
            
            if (!promos || promos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-500 italic">Aucun code promo actif actuellement.</td></tr>';
                return;
            }

            tbody.innerHTML = promos.map(p => {
    // LOGIQUE D'AFFICHAGE INTELLIGENTE
    let valueDisplay, tagColor;

    if (p.discount_type === 'PERCENT') {
        valueDisplay = `-${p.value}%`;
        tagColor = 'text-blue-400 bg-blue-400/10';
    } else if (p.discount_type === 'HOURLY_FIXED') {
        // C'est ici qu'on gère le forfait 5€
        valueDisplay = `${p.value}€ /H`; 
        tagColor = 'text-purple-400 bg-purple-400/10 border border-purple-500/20';
    } else {
        valueDisplay = `-${p.value}€`;
        tagColor = 'text-[#4DFF99] bg-[#4DFF99]/10';
    }

    return `
    <tr class="hover:bg-white/5 transition border-b border-white/5 last:border-0">
        <td class="p-4">
            <span class="font-bold text-white font-mono tracking-wider bg-white/5 px-3 py-1 rounded border border-white/10 select-all">${p.code}</span>
        </td>
        <td class="p-4">
            <span class="text-xs font-bold px-2 py-1 rounded ${tagColor}">${valueDisplay}</span>
        </td>
        <td class="p-4 text-xs text-gray-300">
            <span class="${p.current_uses >= p.max_uses ? 'text-red-500 font-bold' : ''}">${p.current_uses}</span> 
            <span class="text-gray-600">/</span> 
            ${p.max_uses}
        </td>
        <td class="p-4 text-xs text-gray-400">
            ${new Date(p.expires_at).toLocaleDateString('fr-FR')}
        </td>
        <td class="p-4 text-right">
            <button onclick="marketingManager.delete(${p.id})" class="w-8 h-8 rounded bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition flex items-center justify-center ml-auto">
                <i class="fa-solid fa-trash text-xs"></i>
            </button>
        </td>
    </tr>
`}).join('');
        } catch(e) { console.error("Erreur chargement promos", e); }
    },

    create: async () => {
        const code = document.getElementById('promo-code').value.toUpperCase();
        const type = document.getElementById('promo-type').value;
        const value = document.getElementById('promo-value').value;
        const max_uses = document.getElementById('promo-uses').value;
        const expires_at = document.getElementById('promo-date').value;

        if(!code || !value || !max_uses || !expires_at) {
            return alert("Veuillez remplir tous les champs.");
        }

        try {
            const res = await fetch('/api/admin/marketing/promos', {
                method: 'POST', 
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ code, type, value, max_uses, expires_at })
            });
            
            const data = await res.json();
            if(data.success) {
                modals.close('promo');
                marketingManager.load();
                // Reset form
                document.getElementById('promo-code').value = '';
                document.getElementById('promo-value').value = '';
                utils.toast('Succès', 'Code Promo créé !');
            } else {
                alert("Erreur: " + (data.error || "Impossible de créer le code"));
            }
        } catch(e) { alert("Erreur serveur"); }
    },

    delete: async (id) => {
        if(!confirm("Supprimer définitivement ce code promo ?")) return;
        await fetch(`/api/admin/marketing/promos/${id}`, { method: 'DELETE' });
        marketingManager.load();
    }
};

// ==========================================
// SETTINGS MANAGER
// ==========================================
const settingsManager = {
    saveComplexInfo: async () => {
        const data = {
            name: document.getElementById('settings-name').value,
            phone: document.getElementById('settings-phone').value,
            address: document.getElementById('settings-address').value,
            email: document.getElementById('settings-email').value,
            website: document.getElementById('settings-website').value
        };
        
        try {
            const res = await fetch('/api/admin/my-complex', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if(result.success) {
                utils.toast('success', 'Informations sauvegardées');
            }
        } catch(e) {
            utils.toast('error', 'Erreur de sauvegarde');
        }
    },

    saveHours: async () => {
        utils.toast('success', 'Horaires sauvegardés');
    },

    savePricing: async () => {
        const data = {
            price_day: document.getElementById('settings-price-day').value,
            price_night: document.getElementById('settings-price-night').value,
            price_weekend: document.getElementById('settings-price-weekend').value
        };
        
        try {
            const res = await fetch('/api/admin/pricing/simple', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            utils.toast('success', 'Tarifs sauvegardés');
        } catch(e) {
            utils.toast('error', 'Erreur de sauvegarde');
        }
    },

    savePreferences: async () => {
        utils.toast('success', 'Préférences sauvegardées');
    },

    addAdmin: () => {
        utils.toast('info', 'Fonctionnalité en cours de développement');
    },

    exportAllData: () => {
        utils.toast('info', 'Export en cours...');
    },

    exportReservations: () => {
        calendarManager.exportView();
    },

    exportClients: async () => {
        utils.toast('info', 'Export clients en cours...');
    },

    exportFinances: async () => {
        utils.toast('info', 'Export finances en cours...');
    }
};



// === SANCTIONS MANAGER === //
const sanctionsManager = {
    load: async () => {
        utils.loading(true);
        try {
            const res = await fetch('/api/admin/sanctions');
            const data = await res.json();
            
            const tbody = document.getElementById('sanctions-table-body');
            tbody.innerHTML = '';
            
            data.forEach(s => {
                const isActive = s.is_active && (!s.end_date || new Date(s.end_date) > new Date());
                const badge = isActive 
                    ? '<span class="sanction-badge active"><i class="fa-solid fa-ban"></i> ACTIF</span>'
                    : '<span class="sanction-badge expired"><i class="fa-solid fa-check"></i> EXPIRÉ</span>';
                
                tbody.innerHTML += `
                    <tr>
                        <td class="font-bold">${s.player_name}</td>
                        <td class="text-sm text-gray-400">${s.player_email}</td>
                        <td class="text-sm">${s.reason}</td>
                        <td>${badge}</td>
                        <td class="text-sm text-gray-400">${s.end_date || 'Permanent'}</td>
                        <td>
                            ${isActive ? `
                                <button onclick="sanctionsManager.lift(${s.id})" class="btn-icon text-green-500 hover:text-green-400">
                                    <i class="fa-solid fa-unlock"></i>
                                </button>
                            ` : ''}
                            <button onclick="sanctionsManager.delete(${s.id})" class="btn-icon text-red-500 hover:text-red-400">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        } catch(e) {
            console.error(e);
        }
        utils.loading(false);
    },
    
    create: async () => {
        const payload = {
            user_id: document.getElementById('sanction-player').value,
            reason: document.getElementById('sanction-reason').value,
            ban_type: document.getElementById('sanction-type').value,
            end_date: document.getElementById('sanction-end-date').value || null
        };
        
        if(!payload.user_id || !payload.reason) {
            utils.toast('error', 'Remplissez tous les champs');
            return;
        }
        
        try {
            const res = await fetch('/api/admin/sanctions/create', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if(data.success) {
                modals.close('sanction');
                sanctionsManager.load();
                utils.toast('success', 'Sanction créée avec succès');
            }
        } catch(e) {
            utils.toast('error', 'Erreur lors de la création');
        }
    },
    
    lift: async (id) => {
        if(!await utils.confirm('Lever cette sanction ?')) return;
        
        try {
            const res = await fetch(`/api/admin/sanctions/${id}`, {method: 'DELETE'});
            const data = await res.json();
            
            if(data.success) {
                sanctionsManager.load();
                utils.toast('success', 'Sanction levée');
            }
        } catch(e) {
            utils.toast('error', 'Erreur');
        }
    },
    
    delete: async (id) => {
        if(!await utils.confirm('Supprimer définitivement cette sanction ?')) return;
        
        try {
            const res = await fetch(`/api/admin/sanctions/${id}`, {method: 'DELETE'});
            const data = await res.json();
            
            if(data.success) {
                sanctionsManager.load();
                utils.toast('success', 'Sanction supprimée');
            }
        } catch(e) {
            utils.toast('error', 'Erreur');
        }
    }
};


// Mettre à jour les données (pas juste les stats) toutes les 10 secondes
setInterval(() => {
    if(state.currentView === 'calendar' && state.calendarInstance) {
        console.log("🔄 Actualisation automatique du planning...");
        // C'est cette commande qui va re-déclencher la fonction 'events' ci-dessus
        state.calendarInstance.refetchEvents(); 
    }
}, 10000); // Réduit à 10s pour plus de réactivité (au lieu de 30s)