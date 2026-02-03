        async function handleReset(e) {
            e.preventDefault();
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            const p1 = document.getElementById('new_pass').value;
            const p2 = document.getElementById('confirm_pass').value;
            const msg = document.getElementById('msg');

            if(p1 !== p2) { msg.innerText = "Les mots de passe ne correspondent pas"; msg.className = "text-red-500 text-center text-xs mt-4 font-bold"; return; }
            if(!token) { msg.innerText = "Lien invalide (Token manquant)"; msg.className = "text-red-500 text-center text-xs mt-4 font-bold"; return; }

            try {
                const res = await fetch('/reset-password-confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, newPassword: p1 })
                });
                const data = await res.json();
                
                if(data.success) {
                    msg.innerText = "MOT DE PASSE MODIFIÉ ! REDIRECTION...";
                    msg.className = "text-neon text-center text-xs mt-4 font-bold";
                    setTimeout(() => window.location.href = '/login.html', 2000);
                } else {
                    msg.innerText = data.error || "Erreur";
                    msg.className = "text-red-500 text-center text-xs mt-4 font-bold";
                }
            } catch(e) { msg.innerText = "Erreur serveur"; }
        }