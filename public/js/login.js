 let currentMode = 'login'; // login, register, recovery, otp_verify, otp_2fa
    let tempEmail = ''; // Stocke l'email pour l'étape 2

    function switchTab(mode) {
        currentMode = mode;
        document.getElementById('otp-section').classList.add('hidden');
        document.getElementById('credentials-fields').classList.remove('hidden');
        document.getElementById('message').innerText = "";
        
        const btn = document.getElementById('submit-btn');
        const passConfirm = document.getElementById('confirm_password');

        if (mode === 'login') {
            document.getElementById('register-fields').classList.add('hidden');
            passConfirm.classList.add('hidden');
            btn.innerText = "ENTRER DANS L'ARÈNE";
            document.getElementById('forgot-link').classList.remove('hidden');
            updateTabStyles(document.getElementById('tab-login'), document.getElementById('tab-register'));
        } else if (mode === 'register') {
            document.getElementById('register-fields').classList.remove('hidden');
            passConfirm.classList.remove('hidden');
            document.getElementById('forgot-link').classList.add('hidden');
            btn.innerText = "CRÉER MON JOUEUR";
            updateTabStyles(document.getElementById('tab-register'), document.getElementById('tab-login'));
        }
    }

    function updateTabStyles(active, inactive) {
        active.classList.add('bg-[#222]', 'text-white', 'shadow-lg');
        active.classList.remove('text-gray-500');
        inactive.classList.remove('bg-[#222]', 'text-white', 'shadow-lg');
        inactive.classList.add('text-gray-500');
    }

    function toggleRecoveryMode() {
        currentMode = 'recovery';
        document.getElementById('register-fields').classList.add('hidden');
        document.getElementById('password-container').classList.add('hidden');
        document.getElementById('submit-btn').innerText = "ENVOYER LIEN RESET";
        document.getElementById('message').innerText = "Entrez votre email pour recevoir le lien";
    }

    // Affiche l'écran de saisie du code
    function showOtpScreen(type) {
        currentMode = type; // 'otp_verify' ou 'otp_2fa'
        document.getElementById('credentials-fields').classList.add('hidden');
        document.getElementById('register-fields').classList.add('hidden');
        document.getElementById('otp-section').classList.remove('hidden');
        document.getElementById('submit-btn').innerText = "VALIDER LE CODE";
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const btn = document.getElementById('submit-btn');
        const msg = document.getElementById('message');
        const emailInput = document.getElementById('email').value;
        const passwordInput = document.getElementById('password').value;
        const otpInput = document.getElementById('otp_code').value;

        btn.style.opacity = "0.7";
        msg.innerText = "";

        let url = '';
        let body = {};

        // --- ROUTING LOGIQUE ---
        if (currentMode === 'login') {
            url = '/login';
            body = { email: emailInput, password: passwordInput };
        } 
        else if (currentMode === 'register') {
            const confirmPass = document.getElementById('confirm_password').value;
            if (passwordInput !== confirmPass) {
                msg.innerText = "LES MOTS DE PASSE NE CORRESPONDENT PAS";
                msg.className = "text-red-500 text-center text-xs font-bold";
                btn.style.opacity = "1";
                return;
            }
            url = '/register';
            body = { 
                email: emailInput, 
                password: passwordInput,
                first_name: document.getElementById('first_name').value,
                last_name: document.getElementById('last_name').value,
                phone: document.getElementById('phone').value
            };
        }
        else if (currentMode === 'otp_verify') {
            url = '/verify-account';
            body = { email: tempEmail, code: otpInput };
        }
        else if (currentMode === 'otp_2fa') {
            url = '/login-2fa';
            body = { email: tempEmail, code: otpInput };
        }
        else if (currentMode === 'recovery') {
            url = '/forgot-password';
            body = { email: emailInput };
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Erreur inconnue");

            // --- GESTION DES REPONSES ---
            
            // 1. Inscription réussie -> Demande validation
            if (data.step === 'VERIFY_EMAIL') {
                tempEmail = data.email;
                showOtpScreen('otp_verify');
                msg.innerText = "CODE ENVOYÉ ! VÉRIFIEZ VOS MAILS";
                msg.className = "text-neon text-center text-xs font-bold";
            }
            // 2. Login correct -> Demande 2FA
            else if (data.step === '2FA_REQUIRED') {
                tempEmail = data.email;
                showOtpScreen('otp_2fa');
                msg.innerText = "SÉCURITÉ ACTIVÉE : CODE ENVOYÉ";
                msg.className = "text-neon text-center text-xs font-bold";
            }
            // 3. Succès final (Login 2FA ou Validation compte)
            else if (data.redirect) {
                window.location.href = data.redirect;
            }
            else if (data.success) {
                // Validation compte OK -> Retour login
                msg.innerText = data.message;
                msg.className = "text-neon text-center text-xs font-bold";
                setTimeout(() => switchTab('login'), 2000);
            }
            else {
                msg.innerText = data.message || "Action effectuée";
            }

        } catch (error) {
            msg.className = "text-center text-xs mt-6 h-4 font-bold tracking-wide text-red-500";
            msg.innerText = error.message.toUpperCase();
        } finally {
            btn.style.opacity = "1";
        }
    }