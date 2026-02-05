🏟️ RealFive | Ultimate Sports Management Ecosystem
RealFive est une plateforme SaaS de pointe conçue pour révolutionner la gestion des complexes sportifs (Foot5, Padel, Tennis, Basket). L'écosystème se divise en deux interfaces distinctes : une application utilisateur pour les joueurs et un centre de commande ultra-complet pour les gérants.

🌟 Points Forts de l'Écosystème
📱 Côté Joueur (User Experience)
Réservations simplifiées : Recherche de créneaux par sport, terrain et horaire.

Matchs Publics/Privés : Création de matchs ouverts à la communauté ou réservés aux amis.

Social & Équipes : Système d'amis, création d'équipes personnalisées avec logos et gestion de capitaines.

Portefeuille Virtuel : Paiement des sessions via un wallet interne ou système de split-payment.

Profil Athlète : Suivi des statistiques (buts, passes, notes) et historique des matchs.

💻 Côté Gérant (Command Center V2)
Dashboard Analytics : Monitoring du CA, taux d'occupation et croissance mensuelle.

Planning Pro (FullCalendar) : Vue optimisée avec affichage des terrains côte-à-côte et mode plein écran.

Gestion du Parc : Configuration technique des terrains (Indoor/Outdoor, Caméras, Éclairage).

CRM & Fidélité : Base de données clients, gestion des points de fidélité et tags (VIP, Régulier).

Sécurité & Discipline : Module de sanctions pour bannir les comportements inappropriés.

🛠️ Stack Technique
Backend : Node.js (Express.js).

Base de données : MySQL / MariaDB (Structure relationnelle complexe).

Design : Tailwind CSS (Thème Dark Premium / Orbitron Font).

Composants : FullCalendar 6, Chart.js, jsPDF (Facturation).

📦 Procédure d'Installation Directe
1. Prérequis Système
Installer Node.js (v16+) sur votre machine.

Disposer d'un serveur MySQL actif (via XAMPP, WAMP ou Docker).

2. Initialisation de la Base de Données
Lancez votre gestionnaire SQL (ex: phpMyAdmin).

Créez une base de données : realfive_db.

Importez le fichier realfive_db.sql situé à la racine du projet pour générer les 20+ tables nécessaires.

3. Installation du Projet
Dans votre terminal, accédez au dossier racine et installez les dépendances :

Bash
npm install
4. Configuration de la Connexion
Ouvrez le fichier config/db.js et mettez à jour vos identifiants :

JavaScript
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',      // Votre utilisateur
  password: '',      // Votre mot de passe
  database: 'realfive_db'
});
5. Démarrage de RealFive
Lancez le serveur Node :

Bash
npm start
Accès Joueur : http://localhost:3000

Accès Manager : http://localhost:3000/dashboard-pro.html

🔒 Sécurité & Rôles
Le système gère trois niveaux d'accès distincts :

JOUEUR : Accès limité aux réservations et au profil social.

PRO : Gestion d'un complexe spécifique et de son planning.

ADMIN : Accès global au système et configuration de l'application (RealFive SuperAdmin).

✉️ Propriété de RealFive - Solution de gestion sportive nouvelle génération.
