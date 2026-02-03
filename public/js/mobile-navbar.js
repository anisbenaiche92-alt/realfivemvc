document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;
    
    // Pas de navbar sur login ou match (le match a déjà sa propre barre)
    if (path === '/' || path.includes('login') || path.includes('match.html')) return;

    const navbarHTML = `
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-[#080808]/95 backdrop-blur-md border-t border-white/10 flex justify-between items-center h-[80px] z-[999] px-2 pb-safe transition-all duration-300">
        
        <a href="/dashboard-joueur.html" class="nav-item flex-1 flex flex-col items-center justify-center h-full text-gray-500 hover:text-neon transition group">
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            <span class="text-[9px] font-orbitron tracking-widest">HUB</span>
        </a>

        <a href="/reservation.html" class="nav-item flex-1 flex flex-col items-center justify-center h-full text-gray-500 hover:text-neon transition group">
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span class="text-[9px] font-orbitron tracking-widest">PLAY</span>
        </a>

        <a href="/stats.html" class="nav-item flex-1 flex flex-col items-center justify-center h-full text-gray-500 hover:text-neon transition group">
            <div class="relative">
                <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                </div>
            <span class="text-[9px] font-orbitron tracking-widest">STATS</span>
        </a>

        <a href="/friends.html" class="nav-item flex-1 flex flex-col items-center justify-center h-full text-gray-500 hover:text-neon transition group">
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            <span class="text-[9px] font-orbitron tracking-widest">TEAM</span>
        </a>

        <a href="/profile.html" class="nav-item flex-1 flex flex-col items-center justify-center h-full text-gray-500 hover:text-neon transition group">
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            <span class="text-[9px] font-orbitron tracking-widest">PROFIL</span>
        </a>

    </nav>`;

    // Injection
    document.body.insertAdjacentHTML('beforeend', navbarHTML);

    // Padding responsive (pb-24 sur mobile, 0 sur PC)
    const main = document.querySelector('main');
    if(main) main.classList.add('pb-24', 'md:pb-0');

    // Active State
    const links = document.querySelectorAll('.nav-item');
    links.forEach(link => {
        if(link.getAttribute('href') === path) {
            link.classList.remove('text-gray-500');
            link.classList.add('text-neon');
            const icon = link.querySelector('svg');
            if(icon) icon.style.filter = "drop-shadow(0 0 8px rgba(77,255,153,0.6))";
        }
    });
});