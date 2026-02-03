    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get('matchId');
    const mode = urlParams.get('mode'); // 'creation' ou null
    let currentPrice = 0; // Pour stocker le prix avant réduc
    let appliedPromo = null; // Stocke le code appliqué
    
    // Variables pour la création
    let creationData = {}; 

    document.addEventListener('DOMContentLoaded', async () => {
        // CAS 1 : C'est une invitation ou un paiement en retard (Le match existe déjà)
        if (matchId) {
            loadExistingMatch(matchId);
        } 
        // CAS 2 : C'est une nouvelle réservation (Le match N'EXISTE PAS encore)
        else if (mode === 'creation') {
            loadCreationDetails();
        } 
        else {
            window.location.href = '/dashboard-joueur.html';
        }
    });

    async function loadExistingMatch(id) {
        const res = await fetch(`/api/payment/details?matchId=${id}`);
        const data = await res.json();

        if(data.error) { alert(data.error); window.location.href = '/dashboard-joueur.html'; return; }

        document.getElementById('match-code').innerText = data.match_code;
        document.getElementById('match-date').innerText = new Date(data.start_time).toLocaleString();
        
        setupPriceUI(data.amount_to_pay);
    }

    function loadCreationDetails() {
        // On récupère les infos de l'URL
        creationData = {
            terrainId: urlParams.get('terrainId'),
            date: urlParams.get('date'),
            time: urlParams.get('time'),
            duration: urlParams.get('duration'),
            paymentMode: urlParams.get('paymentMode'),
            // Note: On recalculera le vrai prix côté serveur pour sécurité, 
            // mais on utilise celui de l'URL pour l'affichage
            displayPrice: parseFloat(urlParams.get('price')) 
        };

        const dateObj = new Date(creationData.date + 'T' + creationData.time);
        
        document.getElementById('match-code').innerText = "NOUVEAU";
        document.getElementById('match-date').innerText = dateObj.toLocaleDateString() + ' ' + creationData.time;
        
        // Calcul du prix à afficher
        let priceToShow = 0;
        if(creationData.paymentMode === 'SPLIT') {
            priceToShow = creationData.displayPrice / 10;
        } else {
            priceToShow = creationData.displayPrice;
        }
        
        setupPriceUI(priceToShow);
    }

    function setupPriceUI(amount) {
        currentPrice = amount;
        if (amount === 0) {
            document.getElementById('amount-due').innerText = "0.00 €";
            document.getElementById('payment-methods').innerHTML = `
                <div class="bg-green-500/10 border border-green-500/30 p-4 rounded-lg text-center">
                    <p class="text-green-500 font-bold text-sm uppercase">✅ ACCÈS GRATUIT / DÉJÀ PAYÉ</p>
                </div>`;
            document.getElementById('pay-btn').innerText = "ACCÉDER AU MATCH";
        } else {
            document.getElementById('amount-due').innerText = amount.toFixed(2) + " €";
        }
    }

    function selectMethod(method) {
        // Selection visuelle (Optionnel)
    }

    async function processPayment() {
        const btn = document.getElementById('pay-btn');
        btn.innerText = "TRAITEMENT...";
        btn.disabled = true;

        let url, body;

        // LOGIQUE DIFFERENTE SELON LE CAS
        if (matchId) {
            // Cas Existant : On confirme juste le paiement
            url = '/api/payment/confirm';
            body = { matchId, method: 'CASH' };
        } else {
            // Cas Création : On CRÉE le match ET on PAIE en même temps
            url = '/api/match/create-and-pay';
            body = { 
                ...creationData, 
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
                // On redirige vers le match (data.matchId sera renvoyé par le serveur dans les 2 cas)
                window.location.href = `/match.html?id=${data.matchId || matchId}`;
            } else {
                alert("Erreur: " + data.error);
                btn.disabled = false;
                btn.innerText = "RÉESSAYER";
            }
        } catch(e) {
            alert("Erreur réseau");
            btn.disabled = false;
            btn.innerText = "RÉESSAYER";
        }
    }


   async function applyPromo() {
    const codeInput = document.getElementById('promo-input');
    const code = codeInput.value.trim();
    const msg = document.getElementById('promo-msg');
    
    if(!code) return;

    // 1. Feedback visuel de chargement
    msg.classList.remove('hidden', 'text-red-500', 'text-[#4DFF99]'); // Reset couleurs
    msg.className = "text-[10px] mt-2 text-gray-400 font-bold animate-pulse";
    msg.innerText = "Vérification en cours...";

    // 2. Préparation des données pour le serveur (CRUCIAL POUR ÉVITER L'ERREUR 500)
    // On doit envoyer la durée et le terrain pour que le backend calcule le tarif horaire
    const payload = {
        code: code,
        amount: currentPrice, // Le prix affiché actuellement
        
        // On pioche dans creationData qui a été rempli au chargement de la page
        terrain_id: creationData ? creationData.terrainId : null,
        
        // On reconstruit la date complète (YYYY-MM-DD + T + HH:mm)
        start_time: (creationData && creationData.date && creationData.time) 
                    ? `${creationData.date}T${creationData.time}` 
                    : null,
                    
        // La durée en minutes (ex: 60 ou 90)
        duration: creationData ? creationData.duration : 60 
    };

    try {
        const res = await fetch('/api/payment/verify-promo', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload) // <--- C'est ici qu'on envoie tout le paquet
        });
        
        const data = await res.json();

        if (data.valid) {
            // === SUCCÈS ===
            msg.className = "text-[10px] mt-2 text-[#4DFF99] font-bold"; // Vert Néon
            msg.innerHTML = `<i class="fa-solid fa-check-circle mr-1"></i> ${data.label}`;
            
            // Mise à jour visuelle du prix (Barré + Nouveau prix)
            document.getElementById('amount-due').innerHTML = `
                <div class="flex flex-col items-end leading-none">
                    <span class="line-through text-gray-500 text-xs mb-1">${parseFloat(currentPrice).toFixed(2)} €</span>
                    <span class="text-[#4DFF99]">${data.newPrice} €</span>
                </div>
            `;
            
            // Important : On stocke le code validé pour l'envoi final (processPayment)
            appliedPromo = code; 

        } else {
            // === ERREUR (Code invalide, expiré, ou bug serveur) ===
            msg.className = "text-[10px] mt-2 text-red-500 font-bold";
            msg.innerHTML = `<i class="fa-solid fa-circle-exclamation mr-1"></i> ${data.error || "Code non valide"}`;
            
            // On remet le prix normal
            document.getElementById('amount-due').innerText = parseFloat(currentPrice).toFixed(2) + " €";
            appliedPromo = null;
        }
    } catch(e) {
        console.error("Erreur Promo:", e);
        msg.className = "text-[10px] mt-2 text-red-500 font-bold";
        msg.innerText = "Erreur de connexion au serveur";
        
        // Reset prix par sécurité
        document.getElementById('amount-due').innerText = parseFloat(currentPrice).toFixed(2) + " €";
        appliedPromo = null;
    }
}