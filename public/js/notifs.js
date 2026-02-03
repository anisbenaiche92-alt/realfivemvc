// public/js/notifs.js
window.utils = {
    init: () => {
        // CSS
        if (!document.querySelector('link[href*="notifs.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet'; link.href = '/css/notifs.css';
            document.head.appendChild(link);
        }
        // HTML Notifs
        if (!document.getElementById('toast-container')) {
            const d = document.createElement('div'); d.id = 'toast-container';
            document.body.appendChild(d);
        }
        // HTML Confirm
        if (!document.getElementById('sys-confirm-overlay')) {
            const m = document.createElement('div'); m.id = 'sys-confirm-overlay';
            m.innerHTML = `<div class="sys-confirm-box"><span style="font-size:3rem;">⚠️</span><h3 style="color:white;margin:10px 0;font-family:sans-serif;">CONFIRMATION</h3><p id="sys-confirm-msg" style="color:#888;margin-bottom:20px;">Sûr ?</p><div style="display:flex; gap:10px;"><button class="sys-btn sys-btn-no" id="sys-confirm-no">Annuler</button><button class="sys-btn sys-btn-yes" id="sys-confirm-yes">Confirmer</button></div></div>`;
            document.body.appendChild(m);
        }
    },

    // 1. NOTIFICATIONS
    toast: (type, msg) => {
        const c = document.getElementById('toast-container');
        if(!c) return;
        const e = document.createElement('div');
        e.className = `toast-item ${type}`;
        e.innerHTML = `<i>${type=='success'?'✔':'✖'}</i><div class="toast-content"><h4>${type=='success'?'SUCCÈS':'ERREUR'}</h4><p>${msg}</p></div>`;
        c.appendChild(e);
        setTimeout(() => { e.classList.add('toast-exit'); setTimeout(() => e.remove(), 300); }, 3000);
    },

    // 2. CONFIRMATION
    confirm: (msg) => {
        return new Promise(resolve => {
            const o = document.getElementById('sys-confirm-overlay');
            document.getElementById('sys-confirm-msg').innerText = msg;
            o.classList.add('active');
            const close = (v) => { o.classList.remove('active'); resolve(v); };
            
            // Clone pour nettoyer les anciens events
            const btnYes = document.getElementById('sys-confirm-yes');
            const btnNo = document.getElementById('sys-confirm-no');
            const newYes = btnYes.cloneNode(true); 
            const newNo = btnNo.cloneNode(true);
            btnYes.parentNode.replaceChild(newYes, btnYes);
            btnNo.parentNode.replaceChild(newNo, btnNo);

            newYes.onclick = () => close(true);
            newNo.onclick = () => close(false);
        });
    },

    // 3. SPINNER CHARGEMENT (Gestion globale)
    loading: (show) => {
        const el = document.getElementById('loading-indicator');
        if(el) { if(show) el.classList.remove('hidden'); else el.classList.add('hidden'); }
    },

    // 4. ANIMATION DES NOMBRES (Corrige le NaN)
    animateValue: (id, start, end, duration, suffix = '') => {
        const obj = document.getElementById(id);
        if(!obj) return;
        
        // Sécurité anti-NaN
        start = parseFloat(start) || 0;
        end = parseFloat(end) || 0;

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const val = Math.floor(progress * (end - start) + start);
            obj.innerHTML = val.toLocaleString('fr-FR') + ' ' + suffix;
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }
};

document.addEventListener('DOMContentLoaded', window.utils.init);