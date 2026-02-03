     const video = document.getElementById('intro-video');
        const introScreen = document.getElementById('intro-screen');
        const mainSite = document.getElementById('main-site');
        const flash = document.querySelector('.flash-overlay');
        const impactTime = 5.9; 
        let hasImpacted = false;

        document.addEventListener('DOMContentLoaded', async () => {
            // 1. CHARGEMENT DE LA CONFIG (Sans méthode de secours)
            try {
                const response = await fetch('/api/settings');
                // Si le serveur a le bon code (Étape 1), ceci renverra le JSON correct
                const config = await response.json();
                applyConfig(config);
            } catch (e) {
                console.error("Erreur critique : Impossible de charger la configuration.", e);
            }

            // 2. GESTION DE L'INTRO
            if (sessionStorage.getItem('introSeen')) {
                skipIntro();
            } else {
                startIntro();
            }
        });

        function applyConfig(config) {
            if(!config.primary_color) return;
            document.documentElement.style.setProperty('--primary-color', config.primary_color);
            document.title = `${config.company_name} | ${config.city}`;
            
            document.getElementById('app-name').innerText = config.company_name;
            document.getElementById('complex-name-bold').innerText = config.company_name;
            document.getElementById('app-city-header').innerText = config.city;
            document.getElementById('full-address').innerText = config.city;
            document.getElementById('opening-date').innerText = `Ouverture ${config.opening_date}`;
            
            if(config.hero_title) {
                const words = config.hero_title.split(' ');
                const mid = Math.ceil(words.length / 2);
                document.getElementById('hero-title-1').innerText = words.slice(0, mid).join(' ');
                document.getElementById('hero-title-2').innerText = words.slice(mid).join(' ');
            }
        }

        // --- FONCTIONS VIDÉO ---
        function startIntro() {
            video.load();
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    const unlock = () => { video.play(); document.removeEventListener('click', unlock); };
                    document.addEventListener('click', unlock);
                });
            }
            video.addEventListener('timeupdate', () => {
                if (video.currentTime >= impactTime && !hasImpacted) triggerTransition();
            });
            video.addEventListener('ended', () => { if (!hasImpacted) triggerTransition(); });
        }

        function triggerTransition() {
            if (hasImpacted) return;
            hasImpacted = true;
            gsap.to(video, { filter: "brightness(2) contrast(1.5)", scale: 1.05, duration: 0.1 });
            const tl = gsap.timeline();
            tl.to(flash, { opacity: 1, duration: 0.05, onComplete: () => {
                video.pause();
                introScreen.style.display = 'none';
                mainSite.style.display = 'block';
                document.body.style.overflowX = "hidden";
                document.body.style.overflowY = "auto";
                sessionStorage.setItem('introSeen', 'true');

                showToast();
            }})
            .to(mainSite, { opacity: 1, duration: 0.5, ease: "power2.out" })
            .to(flash, { opacity: 0, duration: 0.8 });
        }

        function skipIntro() {
            introScreen.style.display = 'none';
            mainSite.style.display = 'block';
            mainSite.style.opacity = '1';
            document.body.style.overflowX = "hidden";
            document.body.style.overflowY = "auto";

            showToast();
        }



        // --- GESTION DE LA NOTIFICATION PROMO ---

function showToast() {
    // Petit délai pour ne pas agresser l'utilisateur tout de suite
    const toast = document.getElementById('promo-toast');
    if(toast) {
        toast.style.display = 'block';
        // Animation d'entrée magnifique avec GSAP
        gsap.to(toast, { 
            y: 0, 
            opacity: 1, 
            duration: 1, 
            delay: 1.5, // Apparaît 1.5s après l'arrivée sur le site
            ease: "elastic.out(1, 0.75)" 
        });
    }
}

function closeToast() {
    const toast = document.getElementById('promo-toast');
    gsap.to(toast, { y: 50, opacity: 0, duration: 0.5, onComplete: () => {
        toast.style.display = 'none';
    }});
}

function copyCode() {
    const code = document.getElementById('code-text').innerText;
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('btn-copy');
        const originalText = btn.innerText;
        
        // Feedback visuel "Copié !"
        btn.innerText = "C'EST BON !";
        btn.style.backgroundColor = "#fff";
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = "#EF1A2D";
        }, 2000);
    });
}