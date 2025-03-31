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
    cart: "Shopping Cart",
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
    nowPlaying: "Now Playing",
    upNext: "Up Next",
    history: "History",
    queueDescription: "Manage your playback queue",
    clearQueue: "Clear Queue",
    emptyQueue: "Your queue is empty",
    addSongsToQueue: "Add songs to your queue",
    addedToQueue: "Added to Queue",
    like: "Like",
    unlike: "Unlike",
    info: "Track Info",
    previewMode: "Preview Mode",
    previewLimitReached: "Preview time limit reached",
    previewPurchaseMessage: "Purchase the full track to continue listening",
    purchaseTrack: "Purchase Track",
    previewSeconds: "seconds only",
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
  cart: {
    yourCart: "Your Cart",
    cartEmpty: "Your cart is empty",
    browseStore: "Browse the store to add items to your cart",
    goToStore: "Go to Store",
    orderConfirmed: "Order Confirmed",
    receiptSent: "A receipt has been sent to",
    orderProcessing: "Order Processing",
    deliveredSoon: "Your digital items will be delivered to your library soon",
    downloadInstructions: "Download Instructions",
    accessLibrary: "You can access your purchased content from your library",
    viewPurchases: "View Purchases",
    continueShopping: "Continue Shopping",
    item: "Item",
    price: "Price",
    subtotal: "Subtotal",
    tax: "Tax (10%)",
    total: "Total",
    checkout: "Checkout",
    backToCart: "Back to Cart",
    orderSummary: "Order Summary",
    paymentMethod: "Payment Method",
    creditCard: "Credit Card",
    comingSoon: "Coming Soon",
    nameOnCard: "Name on Card",
    cardNumber: "Card Number",
    expiry: "Expiry (MM/YY)",
    cvc: "CVC",
    placeOrder: "Place Order",
    completeOrder: "Complete Order",
    items: "items",
    processingPayment: "Processing Payment",
    cartItems: "{{count}} items in cart",
    cartItems_one: "{{count}} item in cart",
    mobilePayment: "Mobile Payment",
    mobileNumber: "Mobile Number",
    provider: "Provider",
    mPesa: "M-Pesa",
    airtelMoney: "Airtel Money",
    mtnMoney: "MTN Money",
    orangeMoney: "Orange Money",
    mobilePlaceholder: "+XXX XXX XXX XXX",
    mobilePaymentProcessing: "Mobile payment processing coming soon. This is a placeholder.",
    // Stripe checkout translations
    paymentInformation: "Payment Information",
    securePaymentDescription: "Your payment is processed securely",
    secureTransaction: "Secure transaction - encrypted payment information",
    payNow: "Pay Now",
    processing: "Processing...",
    paymentError: "There was an error processing your payment",
    paymentFailed: "Payment Failed",
    paymentSuccess: "Payment Successful",
    orderProcessed: "Your order has been processed successfully",
    preparingCheckout: "Preparing checkout...",
    checkoutError: "Error setting up checkout",
    stripeNotConfigured: "Payment system is not properly configured",
    includedInPrice: "Included in price",
    itemCount: "{{count}} items",
    itemCount_one: "{{count}} item",
  },
  checkout: {
    secureCheckout: "Secure Checkout",
    enterDetails: "Enter your payment details to complete the purchase",
    paymentDetails: "Payment Details",
    secureConnection: "Your payment information is securely transmitted",
    namePlaceholder: "John Doe",
    nameOnCard: "Name on Card",
    cardNumber: "Card Number",
    expiryDate: "Expiry Date",
    cvc: "CVC",
    saveCard: "Save card for future purchases",
    backToCart: "Back to Cart",
    placeOrder: "Place Order",
    processing: "Processing...",
    orderContains: "Your order contains:",
    termsNotice: "By placing your order, you agree to our Terms of Service and Privacy Policy",
    errorTitle: "Form Error",
    nameRequired: "Name on card is required",
    cardNumberInvalid: "Please enter a valid 16-digit card number",
    expiryInvalid: "Please enter a valid expiry date (MM/YY)",
    cvcInvalid: "Please enter a valid 3-digit CVC code",
  },
  payment: {
    thankYou: "Thank You For Your Purchase!",
    orderConfirmed: "Your Order Is Confirmed",
    confirmationEmail: "A confirmation email has been sent to {{email}}",
    yourPurchase: "Your Purchase",
    availableLibrary: "Your purchased content is now available in your library",
    viewLibrary: "View in Library",
    whatNext: "What's Next?",
    explorePlatform: "Explore more music or continue shopping",
    backToHome: "Back to Home",
    continueShopping: "Continue Shopping",
  },
  store: {
    title: "Music Store",
    subtitle: "Browse and purchase tracks and albums",
    tracks: "Tracks",
    albums: "Albums",
    searchTracks: "Search tracks...",
    searchAlbums: "Search albums...",
    sortByPrice: "Sort by price",
    default: "Default order",
    priceLowHigh: "Price: Low to High",
    priceHighLow: "Price: High to Low",
    noTracksFound: "No tracks found",
    noAlbumsFound: "No albums found",
    tryDifferentSearch: "Try a different search term or browse all items",
    addToCart: "Add to Cart",
    addedToCart: "Added to Cart",
    buyAlbum: "Buy Album",
    buyTrack: "Buy Track",
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
    cart: "Panier",
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
    nowPlaying: "En cours de lecture",
    upNext: "À suivre",
    history: "Historique",
    queueDescription: "Gérer votre file d'attente",
    clearQueue: "Vider la file",
    emptyQueue: "Votre file d'attente est vide",
    addSongsToQueue: "Ajoutez des morceaux à votre file d'attente",
    addedToQueue: "Ajouté à la file d'attente",
    like: "J'aime",
    unlike: "Je n'aime plus",
    info: "Infos du morceau",
    previewMode: "Mode Aperçu",
    previewLimitReached: "Limite d'aperçu atteinte",
    previewPurchaseMessage: "Achetez le morceau complet pour continuer l'écoute",
    purchaseTrack: "Acheter le morceau",
    previewSeconds: "secondes seulement",
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
  cart: {
    yourCart: "Votre Panier",
    cartEmpty: "Votre panier est vide",
    browseStore: "Parcourez la boutique pour ajouter des articles à votre panier",
    goToStore: "Aller à la Boutique",
    orderConfirmed: "Commande Confirmée",
    receiptSent: "Un reçu a été envoyé à",
    orderProcessing: "Traitement de la Commande",
    deliveredSoon: "Vos articles numériques seront bientôt livrés dans votre bibliothèque",
    downloadInstructions: "Instructions de Téléchargement",
    accessLibrary: "Vous pouvez accéder à votre contenu acheté depuis votre bibliothèque",
    viewPurchases: "Voir les Achats",
    continueShopping: "Continuer les Achats",
    item: "Article",
    price: "Prix",
    subtotal: "Sous-total",
    tax: "Taxe (10%)",
    total: "Total",
    checkout: "Commander",
    backToCart: "Retour au Panier",
    orderSummary: "Résumé de la Commande",
    paymentMethod: "Moyen de Paiement",
    creditCard: "Carte de Crédit",
    comingSoon: "Bientôt Disponible",
    nameOnCard: "Nom sur la Carte",
    cardNumber: "Numéro de Carte",
    expiry: "Expiration (MM/AA)",
    cvc: "CVC",
    placeOrder: "Passer la Commande",
    items: "articles",
    completeOrder: "Finaliser la Commande",
    processingPayment: "Traitement du Paiement",
    cartItems: "{{count}} articles dans le panier",
    cartItems_one: "{{count}} article dans le panier",
    mobilePayment: "Paiement Mobile",
    mobileNumber: "Numéro Mobile",
    provider: "Fournisseur",
    mPesa: "M-Pesa",
    airtelMoney: "Airtel Money",
    mtnMoney: "MTN Money",
    orangeMoney: "Orange Money",
    mobilePlaceholder: "+XXX XXX XXX XXX",
    mobilePaymentProcessing: "Traitement des paiements mobiles à venir. Ceci est un texte provisoire.",
    // Stripe checkout translations
    paymentInformation: "Informations de Paiement",
    securePaymentDescription: "Votre paiement est traité en toute sécurité",
    secureTransaction: "Transaction sécurisée - informations de paiement cryptées",
    payNow: "Payer Maintenant",
    processing: "Traitement en cours...",
    paymentError: "Une erreur est survenue lors du traitement de votre paiement",
    paymentFailed: "Paiement Échoué",
    paymentSuccess: "Paiement Réussi",
    orderProcessed: "Votre commande a été traitée avec succès",
    preparingCheckout: "Préparation du paiement...",
    checkoutError: "Erreur lors de la configuration du paiement",
    stripeNotConfigured: "Le système de paiement n'est pas correctement configuré",
    includedInPrice: "Inclus dans le prix",
    itemCount: "{{count}} articles",
    itemCount_one: "{{count}} article",
  },
  checkout: {
    secureCheckout: "Paiement Sécurisé",
    enterDetails: "Entrez vos informations de paiement pour finaliser l'achat",
    paymentDetails: "Détails du Paiement",
    secureConnection: "Vos informations de paiement sont transmises en toute sécurité",
    namePlaceholder: "Jean Dupont",
    nameOnCard: "Nom sur la Carte",
    cardNumber: "Numéro de Carte",
    expiryDate: "Date d'Expiration",
    cvc: "CVC",
    saveCard: "Enregistrer la carte pour les achats futurs",
    backToCart: "Retour au Panier",
    placeOrder: "Passer la Commande",
    processing: "Traitement...",
    orderContains: "Votre commande contient :",
    termsNotice: "En passant votre commande, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité",
    errorTitle: "Erreur de Formulaire",
    nameRequired: "Le nom sur la carte est requis",
    cardNumberInvalid: "Veuillez entrer un numéro de carte valide à 16 chiffres",
    expiryInvalid: "Veuillez entrer une date d'expiration valide (MM/AA)",
    cvcInvalid: "Veuillez entrer un code CVC valide à 3 chiffres",
  },
  payment: {
    thankYou: "Merci Pour Votre Achat !",
    orderConfirmed: "Votre Commande Est Confirmée",
    confirmationEmail: "Un email de confirmation a été envoyé à {{email}}",
    yourPurchase: "Votre Achat",
    availableLibrary: "Votre contenu acheté est maintenant disponible dans votre bibliothèque",
    viewLibrary: "Voir dans la Bibliothèque",
    whatNext: "Et Après ?",
    explorePlatform: "Explorez plus de musique ou continuez vos achats",
    backToHome: "Retour à l'Accueil",
    continueShopping: "Continuer les Achats",
  },
  store: {
    title: "Boutique de Musique",
    subtitle: "Parcourir et acheter des morceaux et des albums",
    tracks: "Morceaux",
    albums: "Albums",
    searchTracks: "Rechercher des morceaux...",
    searchAlbums: "Rechercher des albums...",
    sortByPrice: "Trier par prix",
    default: "Ordre par défaut",
    priceLowHigh: "Prix: Croissant",
    priceHighLow: "Prix: Décroissant",
    noTracksFound: "Aucun morceau trouvé",
    noAlbumsFound: "Aucun album trouvé",
    tryDifferentSearch: "Essayez un autre terme de recherche ou parcourez tous les articles",
    addToCart: "Ajouter au Panier",
    addedToCart: "Ajouté au Panier",
    buyAlbum: "Acheter l'album",
    buyTrack: "Acheter le morceau",
  },
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      fr: {
        translation: frTranslations
      },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
