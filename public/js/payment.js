/**
 * CORE PAIEMENT - REALFIVE
 * Gestion : Création de match, Invitation, Codes Promo, et Étapes
 */

const urlParams = new URLSearchParams(window.location.search);
const matchId = urlParams.get('matchId');
const mode = urlParams.get('mode'); // 'creation' ou null
let currentStep = 1;
let slotsToPay = 1;
let unitPrice = 0; // Prix pour 1 personne
let appliedPromo = null; 
let creationData = {}; 
let userHasPhone = false;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. VÉRIFICATION AUTHENTIFICATION ET TÉLÉPHONE
    try {
        const auth = await fetch('/api/me');
        const user = await auth.json();
        if(user.loggedIn && user.user.phone) {
            userHasPhone = true;
            document.getElementById('user-phone').value = user.user.phone;
        }
    } catch(e) { console.error("Erreur auth", e); }

    // 2. CHARGEMENT DES DONNÉES SELON LE CAS
    if (matchId) {
        // Cas : On rejoint un match (on paye forcément 1 place)
        loadExistingMatch(matchId);
        // On peut cacher l'étape 1 (choix des places) car on paye pour soi
        document.getElementById('step-1').classList.add('hidden');
        document.getElementById('step-2').classList.remove('hidden');
        currentStep = 2;
        updateDots(2);
    } 
    else if (mode === 'creation') {
        loadCreationDetails();
    } 
    else {
        window.location.href = '/dashboard-joueur.html';
    }
});

/**
 * CHARGEMENT : MATCH EXISTANT (Invitation)
 */
async function loadExistingMatch(id) {
    const res = await fetch(`/api/payment/details?matchId=${id}`);
    const data = await res.json();
    if(data.error) { alert(data.error); window.location.href = '/dashboard-joueur.html'; return; }

    unitPrice = data.amount_to_pay;
    slotsToPay = 1;
    updatePriceDisplay();
}

/**
 * CHARGEMENT : NOUVELLE RÉSERVATION
 */
function loadCreationDetails() {
    creationData = {
        terrainId: urlParams.get('terrainId'),
        date: urlParams.get('date'),
        time: urlParams.get('time'),
        duration: urlParams.get('duration'),
        // On récupère le prix unitaire passé par reservation.js
        unitPrice: parseFloat(urlParams.get('unitPrice')) || (parseFloat(urlParams.get('price')) / 10)
    };

    unitPrice = creationData.unitPrice;
    updatePriceDisplay();
}

/**
 * NAVIGATION : SYSTÈME DE STEPS
 */
function goToStep(step) {
    // Validation téléphone à l'étape 2
    if(currentStep === 2 && step === 3) {
        const phone = document.getElementById('user-phone').value;
        if(!phone || phone.length < 10) {
            alert("Veuillez entrer un numéro de téléphone valide.");
            return;
        }
    }

    document.getElementById(`step-${currentStep}`).classList.add('hidden');
    document.getElementById(`step-${step}`).classList.remove('hidden');
    updateDots(step);
    currentStep = step;

    if(step === 3 && document.getElementById('summary-slots')) {
        document.getElementById('summary-slots').innerText = `Pour ${slotsToPay} place${slotsToPay > 1 ? 's' : ''}`;
    }
}

function updateDots(step) {
    for(let i=1; i<=3; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if(dot) dot.className = (i <= step) ? "w-10 h-1.5 bg-neon rounded-full transition-all" : "w-10 h-1.5 bg-white/10 rounded-full";
    }
}

/**
 * COMPTEUR DE PLACES
 */
function updateSlots(delta) {
    let newVal = slotsToPay + delta;
    if (newVal >= 1 && newVal <= 10) {
        slotsToPay = newVal;
        document.getElementById('slots-count').value = slotsToPay;
        updatePriceDisplay();
    }
}

function updatePriceDisplay() {
    const total = unitPrice * slotsToPay;
    const el = document.getElementById('final-price-display');
    if(el) el.innerText = total.toFixed(2) + " €";
    
    // On met aussi à jour la variable globale pour les promos
    currentPrice = total; 
}

/**
 * LOGIQUE DES CODES PROMOS (CONSERVÉE)
 */
async function applyPromo() {
    const code = document.getElementById('promo-input').value.trim();
    const msg = document.getElementById('promo-msg');
    if(!code) return;

    msg.classList.remove('hidden');
    msg.innerText = "Vérification...";

    const payload = {
        code: code,
        amount: unitPrice * slotsToPay,
        terrain_id: creationData.terrainId,
        start_time: `${creationData.date}T${creationData.time}`,
        duration: creationData.duration
    };

    try {
        const res = await fetch('/api/payment/verify-promo', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.valid) {
            msg.className = "text-[10px] mt-2 text-[#4DFF99] font-bold";
            msg.innerHTML = `✅ ${data.label}`;
            document.getElementById('final-price-display').innerHTML = `
                <span class="line-through text-gray-500 text-xs mr-2">${(unitPrice * slotsToPay).toFixed(2)}€</span>
                <span>${data.newPrice}€</span>
            `;
            appliedPromo = code;
        } else {
            msg.className = "text-[10px] mt-2 text-red-500 font-bold";
            msg.innerText = data.error || "Code invalide";
            appliedPromo = null;
            updatePriceDisplay();
        }
    } catch(e) { console.error(e); }
}

/**
 * VALIDATION FINALE ET ENVOI
 */
async function processPayment() {
    const btn = document.getElementById('pay-btn');
    const phone = document.getElementById('user-phone').value;
    btn.innerText = "TRAITEMENT...";
    btn.disabled = true;

    let url, body;

    if (matchId) {
        url = '/api/payment/confirm';
        body = { matchId, method: 'CASH', phone };
    } else {
        url = '/api/match/create-and-pay';
        body = { 
            ...creationData, 
            slotsToPay,
            phone,
            method: 'CASH', 
            promoCode: appliedPromo 
        };
    }

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if(data.success) {
            window.location.href = `/match.html?id=${data.matchId || matchId}&code=${data.code || ''}`;
        } else {
            alert("Erreur: " + data.error);
            btn.disabled = false;
            btn.innerText = "RÉESSAYER";
        }
    } catch(e) {
        alert("Erreur réseau");
        btn.disabled = false;
    }
}