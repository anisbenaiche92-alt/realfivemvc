     document.addEventListener('DOMContentLoaded', async () => {
            // Config God Mode
            try {
                const s = await fetch('/api/settings');
                const c = await s.json();
                if(c.primary_color) document.documentElement.style.setProperty('--primary-color', c.primary_color);
                if(c.company_name) document.getElementById('app-name').innerText = c.company_name;
            } catch(e){}
            
            loadProfile();
        });

        function showTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.getElementById(`tab-${tabId}`).classList.remove('hidden');
            
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            document.getElementById(`btn-${tabId}`).classList.add('active');
        }

        function previewAvatar(event) {
            const file = event.target.files[0];
            if(file) document.getElementById('avatarPreview').src = URL.createObjectURL(file);
        }

        async function loadProfile() {
            const res = await fetch('/api/profile');
            const u = await res.json();

            document.getElementById('user-name').innerText = `${u.first_name} ${u.last_name}`;
            
            // Remplissage Champs
            document.getElementById('firstName').value = u.first_name || '';
            document.getElementById('lastName').value = u.last_name || '';
            document.getElementById('email').value = u.email || '';
            document.getElementById('phone').value = u.phone || '';
            document.getElementById('bio').value = u.bio || '';
            document.getElementById('position').value = u.position || 'Polyvalent';
            document.getElementById('jerseyNumber').value = u.jersey_number || '';
            document.getElementById('notifyEmail').checked = !!u.notify_email;
            
            document.getElementById('displayName').innerText = `${u.first_name} ${u.last_name}`;
            if(u.avatar_url) document.getElementById('avatarPreview').src = u.avatar_url;
        }

        async function saveProfile(e) {
            e.preventDefault();
            const formData = new FormData();
            
            // Champs texte
            formData.append('first_name', document.getElementById('firstName').value);
            formData.append('last_name', document.getElementById('lastName').value);
            formData.append('phone', document.getElementById('phone').value);
            formData.append('bio', document.getElementById('bio').value);
            formData.append('position', document.getElementById('position').value);
            formData.append('jersey_number', document.getElementById('jerseyNumber').value);
            formData.append('notify_email', document.getElementById('notifyEmail').checked);
            
            // Avatar
            const file = document.getElementById('avatarInput').files[0];
            if(file) formData.append('avatar', file);

            const res = await fetch('/api/profile', { method: 'POST', body: formData });
            if(res.ok) {
                alert("✅ Profil sauvegardé !");
                location.reload();
            } else {
                alert("Erreur sauvegarde");
            }
        }

        async function changePassword(e) {
            e.preventDefault();
            const oldP = document.getElementById('oldPass').value;
            const newP = document.getElementById('newPass').value;

            const res = await fetch('/api/profile/password', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ oldPassword: oldP, newPassword: newP })
            });
            
            const data = await res.json();
            alert(data.message || data.error);
        }

        async function deleteAccount() {
            const confirmName = prompt("Pour confirmer, tapez SUPPRIMER :");
            if(confirmName === "SUPPRIMER") {
                await fetch('/api/profile/delete', { method: 'POST' });
                window.location.href = '/index.html';
            }
        }


        async function logout() {
    try {
        // Appelle la route définie dans index.js
        const res = await fetch('/logout', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await res.json();
        
        // Redirige l'utilisateur vers la page de connexion comme indiqué par le serveur
        if (data.redirect) {
            window.location.href = data.redirect;
        } else {
            window.location.href = '/login.html';
        }
    } catch (e) {
        console.error("Erreur lors de la déconnexion :", e);
        // Au cas où le serveur est injoignable, on force le retour à l'index
        window.location.href = '/index.html';
    }
}