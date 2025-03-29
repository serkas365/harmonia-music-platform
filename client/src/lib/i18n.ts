import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// English translations
const enTranslations = {
  common: {
    search: "Search",
    home: "Home",
    library: "Library",
    store: "Store",
    settings: "Settings",
    liked: "Liked Songs",
    downloaded: "Downloaded",
    purchased: "Purchased",
    playlists: "Playlists",
    createPlaylist: "Create Playlist",
    premium: "Premium Plan",
    upgrade: "Upgrade to Ultimate for lossless audio",
    upgradeNow: "Upgrade Now",
    yourCollection: "Your Collection",
    newRelease: "NEW RELEASE",
    play: "Play",
    buy: "Buy",
    recentlyPlayed: "Recently Played",
    seeAll: "See All",
    topArtists: "Top Artists",
    followers: "followers",
    newReleases: "New Releases",
    madeForYou: "Made For You",
    loading: "Loading...",
    error: "Something went wrong",
    retry: "Retry",
  },
  auth: {
    login: "Login",
    register: "Register",
    email: "Email Address",
    username: "Username",
    password: "Password",
    confirmPassword: "Confirm Password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    signIn: "Sign In",
    signUp: "Sign Up",
    orContinueWith: "Or continue with",
    alreadyHaveAccount: "Already have an account?",
    dontHaveAccount: "Don't have an account?",
    termsAndPrivacy: "By signing in, you agree to our Terms of Service and Privacy Policy",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
  },
  player: {
    shuffle: "Shuffle",
    previous: "Previous",
    play: "Play",
    pause: "Pause",
    next: "Next",
    repeat: "Repeat",
    volume: "Volume",
    queue: "Queue",
    fullscreen: "Fullscreen",
  },
  tracks: {
    explicit: "Explicit",
    premium: "Premium",
    forPurchase: "For Purchase",
  },
  time: {
    updated: "Updated",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
  },
};

// French translations
const frTranslations = {
  common: {
    search: "Rechercher",
    home: "Accueil",
    library: "Bibliothèque",
    store: "Boutique",
    settings: "Paramètres",
    liked: "Chansons Aimées",
    downloaded: "Téléchargés",
    purchased: "Achetés",
    playlists: "Playlists",
    createPlaylist: "Créer une Playlist",
    premium: "Forfait Premium",
    upgrade: "Passez à Ultimate pour un son sans perte",
    upgradeNow: "Améliorer Maintenant",
    yourCollection: "Votre Collection",
    newRelease: "NOUVELLE SORTIE",
    play: "Lire",
    buy: "Acheter",
    recentlyPlayed: "Écoutés Récemment",
    seeAll: "Voir Tout",
    topArtists: "Artistes Populaires",
    followers: "abonnés",
    newReleases: "Nouvelles Sorties",
    madeForYou: "Conçu Pour Vous",
    loading: "Chargement...",
    error: "Une erreur s'est produite",
    retry: "Réessayer",
  },
  auth: {
    login: "Connexion",
    register: "S'inscrire",
    email: "Adresse Email",
    username: "Nom d'utilisateur",
    password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    rememberMe: "Se souvenir de moi",
    forgotPassword: "Mot de passe oublié?",
    signIn: "Se Connecter",
    signUp: "S'inscrire",
    orContinueWith: "Ou continuer avec",
    alreadyHaveAccount: "Vous avez déjà un compte?",
    dontHaveAccount: "Vous n'avez pas de compte?",
    termsAndPrivacy: "En vous connectant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité",
    terms: "Conditions d'utilisation",
    privacy: "Politique de confidentialité",
  },
  player: {
    shuffle: "Aléatoire",
    previous: "Précédent",
    play: "Lire",
    pause: "Pause",
    next: "Suivant",
    repeat: "Répéter",
    volume: "Volume",
    queue: "File d'attente",
    fullscreen: "Plein écran",
  },
  tracks: {
    explicit: "Explicite",
    premium: "Premium",
    forPurchase: "À Acheter",
  },
  time: {
    updated: "Mis à jour",
    daily: "Quotidien",
    weekly: "Hebdomadaire",
    monthly: "Mensuel",
  },
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: enTranslations,
      fr: frTranslations,
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
