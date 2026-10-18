// Données du programme — extraites de mon_cadre.html (v3) puis nettoyées.
const PROGRAMS = {
 "1": {
  "0": {
   "name": "Dimanche",
   "type": "Repos",
   "label": "OFF — récup",
   "exos": [
    {
     "n": "Repos",
     "s": "—",
     "d": "Jour off complet. Yoga doux le soir si tu veux.",
     "t": ""
    }
   ]
  },
  "1": {
   "name": "Lundi",
   "type": "Jambes + fessiers",
   "label": "Bas du corps",
   "exos": [
    {
     "n": "Échauffement cardio",
     "s": "10 min",
     "d": "10 min tapis ou elliptique allure modérée.",
     "t": ""
    },
    {
     "n": "RC04 Abdos",
     "s": "3×10",
     "d": "Machine abdos, mains derrière la tête, tu enroules le buste vers l'avant.",
     "t": "Ventre plat."
    },
    {
     "n": "RC01 Abdos obliques",
     "s": "3×10",
     "d": "Assise, tu tournes le buste contre la résistance d'un côté puis de l'autre.",
     "t": "Taille fine."
    },
    {
     "n": "Hip Thrust machine",
     "s": "3×10",
     "d": "Dos appuyé, tu pousses les hanches vers le haut en serrant fort les fessiers. Pause 1s en haut.",
     "t": "TON exo n°1 : fesses galbées sans grossir les cuisses. Tu peux charger."
    },
    {
     "n": "Squat barre guidée (léger)",
     "s": "3×10",
     "d": "Barre sur les épaules, pieds largeur bassin. Descente fesses vers l'arrière jusqu'à cuisses parallèles, remontée. CHARGE LÉGÈRE.",
     "t": "Tonifie sans bâtir du quadriceps. Pousse sur les talons, serre les fesses en haut."
    },
    {
     "n": "Abducteurs (machine)",
     "s": "3×10",
     "d": "Assise, tu écartes les genoux contre la résistance. Contraction sur l'extérieur des fesses.",
     "t": "Le galbe latéral, l'effet fesses rondes. Zéro cuisse."
    },
    {
     "n": "Leg curl assis",
     "s": "3×10",
     "d": "Tu ramènes les talons sous le siège en pliant les genoux.",
     "t": "Arrière des cuisses : affine la jambe."
    }
   ]
  },
  "2": {
   "name": "Mardi",
   "type": "Course",
   "label": "Endurance fondamentale",
   "exos": [
    {
     "n": "Échauffement",
     "s": "5 min",
     "d": "Marche rapide progressive.",
     "t": "Ventoline 15 min avant si prescrite."
    },
    {
     "n": "Course endurance",
     "s": "MIN 20 min · MAX 35 min",
     "d": "ALLURE LENTE où tu peux parler. Cours le plus possible en continu, marche 1 min quand le souffle monte, puis reprends.",
     "t": "Construit ton endurance réelle. Vise +2-3 min de course continue chaque 2 semaines."
    },
    {
     "n": "Retour calme",
     "s": "5 min",
     "d": "Marche douce, respiration profonde.",
     "t": ""
    }
   ]
  },
  "3": {
   "name": "Mercredi",
   "type": "Haut léger + gainage",
   "label": "Skills + tronc",
   "exos": [
    {
     "n": "Échauffement cardio",
     "s": "10 min",
     "d": "10 min tapis ou elliptique + scapulaires + cercles bras.",
     "t": ""
    },
    {
     "n": "STREET — Traction assistée (RH05)",
     "s": "3×8",
     "d": "Machine assistée, coussin sous les genoux. Prise large, tu tires jusqu'à ce que le menton dépasse. Plus le poids est lourd, plus tu es aidée.",
     "t": "PALIERS vers la traction : grosse assistance → moyenne → légère → essai 1 traction. Force + tonicité, pas de volume."
    },
    {
     "n": "STREET — Dips assistés (RH05)",
     "s": "3×8",
     "d": "Même machine en mode dips. Tu descends coudes à 90°, tu remontes.",
     "t": "PALIERS : réduis l'assistance au fil des semaines. Tonifie les bras sans les grossir."
    },
    {
     "n": "RC02 Abdos guidés",
     "s": "3×10",
     "d": "Dos sur les coussins, sangles contre la poitrine, pieds bloqués, tu souffles en te regroupant.",
     "t": "Ventre plat."
    },
    {
     "n": "RC03 Lombaires sur banc",
     "s": "3×10",
     "d": "Banc à lombaires, tête en bas dans le prolongement de la colonne, dos plat, tu remontes le buste puis redescends.",
     "t": "Bas du dos solide = tenir debout, porter, pas de mal de dos."
    },
    {
     "n": "Gainage planche",
     "s": "3×30s",
     "d": "Sur les coudes, corps droit, abdos et fessiers serrés.",
     "t": "Le tronc solide = base de tout mouvement fonctionnel."
    },
    {
     "n": "RH10 Tirage horizontal (léger)",
     "s": "3×10",
     "d": "Tu tires la poignée vers le ventre en serrant les omoplates. CHARGE LÉGÈRE.",
     "t": "Posture. Léger = dos tonique, pas épais."
    }
   ]
  },
  "4": {
   "name": "Jeudi",
   "type": "Course",
   "label": "Intervalles doux",
   "exos": [
    {
     "n": "Échauffement",
     "s": "5-8 min",
     "d": "Marche rapide progressive puis quelques accélérations.",
     "t": "Ventoline avant."
    },
    {
     "n": "Intervalles 1 min / 1 min",
     "s": "MIN 6 cycles · MAX 10 cycles",
     "d": "1 min course un peu plus rapide / 1 min marche récup.",
     "t": "Travaille le souffle et la capacité à varier l'effort."
    },
    {
     "n": "Retour calme",
     "s": "5 min",
     "d": "Marche douce, respiration profonde.",
     "t": ""
    }
   ]
  },
  "5": {
   "name": "Vendredi",
   "type": "Jambes + fessiers + équilibre",
   "label": "Bas du corps + proprio",
   "exos": [
    {
     "n": "Échauffement cardio",
     "s": "10 min",
     "d": "10 min tapis ou elliptique.",
     "t": ""
    },
    {
     "n": "RC04 Abdos",
     "s": "3×10",
     "d": "Machine abdos, buste enroulé.",
     "t": "Ventre plat."
    },
    {
     "n": "RC01 Abdos obliques",
     "s": "3×10",
     "d": "Rotation du buste contre résistance.",
     "t": "Taille fine."
    },
    {
     "n": "Hip Thrust machine",
     "s": "3×10",
     "d": "Poussée hanches, contraction fessiers en haut.",
     "t": "Ton exo star pour les fesses."
    },
    {
     "n": "Squat barre guidée (léger)",
     "s": "3×10",
     "d": "Descente contrôlée, focus fessiers, charge légère.",
     "t": "On tonifie, pas de cuisses."
    },
    {
     "n": "Abducteurs (machine)",
     "s": "3×10",
     "d": "Écarter les genoux, contraction extérieur fesses.",
     "t": "Galbe latéral."
    },
    {
     "n": "Équilibre 1 pied",
     "s": "3×30s/pied",
     "d": "Debout sur un pied, gaine et tiens. En progressant, ferme les yeux.",
     "t": "Proprioception = éviter les entorses, stabilité, utile en rando."
    }
   ]
  },
  "6": {
   "name": "Samedi",
   "type": "Repos actif",
   "label": "Tennis / balade / rando",
   "exos": [
    {
     "n": "Activité libre",
     "s": "—",
     "d": "Tennis avec Nico, balade, ou une petite rando. Bouge pour le plaisir.",
     "t": "La marche/rando est ton meilleur entraînement fonctionnel."
    }
   ]
  }
 },
 "2": {
  "0": {
   "name": "Dimanche",
   "type": "Repos",
   "label": "OFF — récup",
   "exos": [
    {
     "n": "Repos",
     "s": "—",
     "d": "Jour off. Yoga doux si envie.",
     "t": ""
    }
   ]
  },
  "1": {
   "name": "Lundi",
   "type": "Jambes + fessiers",
   "label": "Bas du corps (+)",
   "exos": [
    {
     "n": "Échauffement cardio",
     "s": "10 min",
     "d": "10 min tapis ou elliptique.",
     "t": ""
    },
    {
     "n": "RC04 Abdos",
     "s": "3×10",
     "d": "Buste enroulé.",
     "t": "Ventre plat."
    },
    {
     "n": "RC01 Abdos obliques",
     "s": "3×10",
     "d": "Rotation buste.",
     "t": "Taille."
    },
    {
     "n": "Hip Thrust machine",
     "s": "3×10 lourd",
     "d": "Contraction max fessiers. Ici tu charges.",
     "t": "Fesses galbées : c'est là qu'on met l'intensité."
    },
    {
     "n": "Squat barre guidée",
     "s": "3×10",
     "d": "Descente contrôlée, focus fessiers, charge légère-modérée.",
     "t": "Tonique, pas de gros quadris."
    },
    {
     "n": "Abducteurs (machine)",
     "s": "3×10",
     "d": "Extérieur fesses.",
     "t": "Galbe latéral."
    },
    {
     "n": "Leg curl assis",
     "s": "3×10",
     "d": "Ischios.",
     "t": "Affine la jambe."
    }
   ]
  },
  "2": {
   "name": "Mardi",
   "type": "Course",
   "label": "Endurance (+)",
   "exos": [
    {
     "n": "Échauffement",
     "s": "5 min",
     "d": "Marche rapide progressive.",
     "t": "Ventoline avant."
    },
    {
     "n": "Course endurance",
     "s": "MIN 30 min · MAX 40 min",
     "d": "Allure lente, vise plus de course continue.",
     "t": "Objectif : 15-20 min continu en fin de phase."
    },
    {
     "n": "Retour calme",
     "s": "5 min",
     "d": "Marche douce.",
     "t": ""
    }
   ]
  },
  "3": {
   "name": "Mercredi",
   "type": "Haut léger + gainage",
   "label": "Skills + tronc (+)",
   "exos": [
    {
     "n": "Échauffement cardio",
     "s": "10 min",
     "d": "10 min tapis ou elliptique + scapulaires.",
     "t": ""
    },
    {
     "n": "STREET — Traction assistée (RH05)",
     "s": "3×8 assistance -",
     "d": "Réduis l'assistance vs phase 1. Menton au-dessus de la barre.",
     "t": "PALIERS : assistance moyenne → légère. Skill entretenu, pas de masse."
    },
    {
     "n": "STREET — Dips assistés (RH05)",
     "s": "3×8 assistance -",
     "d": "Réduis l'assistance.",
     "t": "Tonifie sans élargir."
    },
    {
     "n": "RC02 Abdos guidés",
     "s": "3×10",
     "d": "Regroupement du buste.",
     "t": "Ventre plat."
    },
    {
     "n": "RC03 Lombaires sur banc",
     "s": "3×10",
     "d": "Extension du buste contrôlée.",
     "t": "Dos solide."
    },
    {
     "n": "Gainage planche",
     "s": "3×40s",
     "d": "Corps droit, serré.",
     "t": "Tronc solide."
    },
    {
     "n": "RH10 Tirage horizontal (léger)",
     "s": "3×10",
     "d": "Charge légère, posture.",
     "t": "Dos tonique, pas épais."
    }
   ]
  },
  "4": {
   "name": "Jeudi",
   "type": "Course",
   "label": "Intervalles (+)",
   "exos": [
    {
     "n": "Échauffement",
     "s": "5-8 min",
     "d": "Marche rapide + accélérations.",
     "t": "Ventoline avant."
    },
    {
     "n": "Intervalles 2 min / 1 min",
     "s": "MIN 6 cycles · MAX 9 cycles",
     "d": "2 min course / 1 min marche.",
     "t": "Souffle + variation d'effort."
    },
    {
     "n": "Retour calme",
     "s": "5 min",
     "d": "Marche douce.",
     "t": ""
    }
   ]
  },
  "5": {
   "name": "Vendredi",
   "type": "Jambes + fessiers + équilibre",
   "label": "Bas du corps + proprio (+)",
   "exos": [
    {
     "n": "Échauffement cardio",
     "s": "10 min",
     "d": "10 min tapis ou elliptique.",
     "t": ""
    },
    {
     "n": "RC04 Abdos",
     "s": "3×10",
     "d": "Buste enroulé.",
     "t": "Ventre."
    },
    {
     "n": "RC01 Abdos obliques",
     "s": "3×10",
     "d": "Rotation.",
     "t": "Taille."
    },
    {
     "n": "Hip Thrust machine",
     "s": "3×10 lourd",
     "d": "Contraction max.",
     "t": "Exo star."
    },
    {
     "n": "Squat barre guidée",
     "s": "3×10",
     "d": "Contrôlé, fessiers.",
     "t": "Tonique."
    },
    {
     "n": "Abducteurs (machine)",
     "s": "3×10",
     "d": "Extérieur fesses.",
     "t": "Galbe."
    },
    {
     "n": "Équilibre 1 pied",
     "s": "3×40s/pied",
     "d": "Sur un pied, yeux fermés si tu peux.",
     "t": "Proprioception."
    }
   ]
  },
  "6": {
   "name": "Samedi",
   "type": "Repos actif",
   "label": "Tennis / balade / rando",
   "exos": [
    {
     "n": "Activité libre",
     "s": "—",
     "d": "Tennis, balade ou rando.",
     "t": "Ton meilleur entraînement fonctionnel."
    }
   ]
  }
 },
 "3": {
  "0": {
   "name": "Dimanche",
   "type": "Repos",
   "label": "OFF — récup",
   "exos": [
    {
     "n": "Repos",
     "s": "—",
     "d": "Jour off. Yoga doux si envie.",
     "t": ""
    }
   ]
  },
  "1": {
   "name": "Lundi",
   "type": "Jambes + fessiers",
   "label": "Bas du corps (max)",
   "exos": [
    {
     "n": "Échauffement cardio",
     "s": "10 min",
     "d": "10 min tapis ou elliptique.",
     "t": ""
    },
    {
     "n": "RC04 Abdos",
     "s": "3×10",
     "d": "Buste enroulé.",
     "t": "Ventre plat."
    },
    {
     "n": "RC01 Abdos obliques",
     "s": "3×10",
     "d": "Rotation.",
     "t": "Taille."
    },
    {
     "n": "Hip Thrust machine",
     "s": "3×10 lourd",
     "d": "Charge max fessiers.",
     "t": "Le pic pour les fesses."
    },
    {
     "n": "Squat barre guidée",
     "s": "3×10",
     "d": "Contrôlé, fessiers, charge modérée.",
     "t": "Tonique, jamais lourd sur les quadris."
    },
    {
     "n": "Abducteurs (machine)",
     "s": "3×10",
     "d": "Extérieur fesses.",
     "t": "Galbe max."
    },
    {
     "n": "Leg curl assis",
     "s": "3×10",
     "d": "Ischios.",
     "t": "Jambe affinée."
    }
   ]
  },
  "2": {
   "name": "Mardi",
   "type": "Course",
   "label": "Endurance longue",
   "exos": [
    {
     "n": "Échauffement",
     "s": "5 min",
     "d": "Marche rapide.",
     "t": "Ventoline avant."
    },
    {
     "n": "Course endurance",
     "s": "MIN 35 min · MAX 50 min",
     "d": "Course continue longue, allure douce.",
     "t": "Objectif : 25-30 min continu."
    },
    {
     "n": "Retour calme",
     "s": "5 min",
     "d": "Marche + respiration.",
     "t": ""
    }
   ]
  },
  "3": {
   "name": "Mercredi",
   "type": "Haut léger + gainage",
   "label": "Skills + tronc (max)",
   "exos": [
    {
     "n": "Échauffement cardio",
     "s": "10 min",
     "d": "10 min tapis ou elliptique + scapulaires.",
     "t": ""
    },
    {
     "n": "STREET — Traction assistée → stricte (RH05)",
     "s": "MIN 3×5 assistance légère · MAX essai 1-3 tractions",
     "d": "Assistance minimale, en MAX teste sans aide.",
     "t": "PALIERS : légère → 1 traction stricte → 3. Ton skill signature."
    },
    {
     "n": "STREET — Dips assistés → libres (RH05)",
     "s": "MIN 3×5 assistance légère · MAX essai 1-3 dips libres",
     "d": "Assistance minimale.",
     "t": "Skill, tonifié léger."
    },
    {
     "n": "RC02 Abdos guidés",
     "s": "3×10",
     "d": "Regroupement.",
     "t": "Ventre plat."
    },
    {
     "n": "RC03 Lombaires sur banc",
     "s": "3×10",
     "d": "Extension contrôlée.",
     "t": "Dos solide."
    },
    {
     "n": "Gainage planche",
     "s": "3×50s",
     "d": "Corps droit serré.",
     "t": "Tronc béton."
    },
    {
     "n": "RH10 Tirage horizontal (léger)",
     "s": "3×10",
     "d": "Posture, charge légère.",
     "t": "Dos tonique fin."
    }
   ]
  },
  "4": {
   "name": "Jeudi",
   "type": "Course",
   "label": "Intervalles + dénivelé",
   "exos": [
    {
     "n": "Échauffement",
     "s": "5-8 min",
     "d": "Marche rapide + accélérations.",
     "t": "Ventoline avant."
    },
    {
     "n": "Intervalles / côtes",
     "s": "MIN 6 cycles · MAX 10 cycles",
     "d": "2-3 min course (en côte ou tapis incliné) / 1 min récup.",
     "t": "Le dénivelé prépare la rando en montagne."
    },
    {
     "n": "Retour calme",
     "s": "5 min",
     "d": "Marche douce.",
     "t": ""
    }
   ]
  },
  "5": {
   "name": "Vendredi",
   "type": "Jambes + fessiers + équilibre",
   "label": "Bas du corps + proprio (max)",
   "exos": [
    {
     "n": "Échauffement cardio",
     "s": "10 min",
     "d": "10 min tapis ou elliptique.",
     "t": ""
    },
    {
     "n": "RC04 Abdos",
     "s": "3×10",
     "d": "Buste enroulé.",
     "t": "Ventre."
    },
    {
     "n": "RC01 Abdos obliques",
     "s": "3×10",
     "d": "Rotation.",
     "t": "Taille."
    },
    {
     "n": "Hip Thrust machine",
     "s": "3×10 lourd",
     "d": "Contraction max.",
     "t": "Exo star."
    },
    {
     "n": "Squat barre guidée",
     "s": "3×10",
     "d": "Contrôlé, fessiers.",
     "t": "Tonique."
    },
    {
     "n": "Abducteurs (machine)",
     "s": "3×10",
     "d": "Extérieur fesses.",
     "t": "Galbe."
    },
    {
     "n": "Équilibre dynamique",
     "s": "3×45s/pied",
     "d": "Sur un pied, yeux fermés ou en bougeant les bras.",
     "t": "Proprioception avancée, terrain technique."
    }
   ]
  },
  "6": {
   "name": "Samedi",
   "type": "Repos actif",
   "label": "Tennis / balade / rando",
   "exos": [
    {
     "n": "Activité libre",
     "s": "—",
     "d": "Rando conseillée : mets en pratique ta forme !",
     "t": "Ton objectif prend vie ici."
    }
   ]
  }
 }
};

const TESTS = [
 {
  "id": "pompes-mur",
  "name": "Pompes contre mur",
  "unit": "reps",
  "baseline": "OK déjà",
  "goal": "15 reps",
  "desc": "Max en 1 série stricte",
  "freq": 30
 },
 {
  "id": "squats",
  "name": "Squats poids du corps",
  "unit": "reps",
  "baseline": "OK déjà",
  "goal": "20 reps",
  "desc": "Max en 1 série stricte",
  "freq": 30
 },
 {
  "id": "planche",
  "name": "Planche sur les coudes",
  "unit": "sec",
  "baseline": "20 sec",
  "goal": "60 sec",
  "desc": "Position parfaite, max temps",
  "freq": 30
 },
 {
  "id": "pompes-genoux",
  "name": "Pompes genoux",
  "unit": "reps",
  "baseline": "0",
  "goal": "5 reps",
  "desc": "Max en 1 série stricte",
  "freq": 30
 },
 {
  "id": "avant-penche",
  "name": "Avant penché (cm du sol)",
  "unit": "cm",
  "baseline": "~50 cm",
  "goal": "~10 cm (chevilles)",
  "desc": "Distance mains-sol jambes tendues. Plus petit = mieux.",
  "freq": 30,
  "inverse": true
 },
 {
  "id": "pancake",
  "name": "Pancake (cm du sol)",
  "unit": "cm",
  "baseline": "~60 cm",
  "goal": "~30 cm",
  "desc": "Distance sternum-sol assise jambes écartées. Plus petit = mieux.",
  "freq": 30,
  "inverse": true
 },
 {
  "id": "marche",
  "name": "Marche continue",
  "unit": "min",
  "baseline": "90 min",
  "goal": "120 min",
  "desc": "Temps avant douleur ou fatigue",
  "freq": 14
 },
 {
  "id": "course",
  "name": "Course non-stop",
  "unit": "min",
  "baseline": "10 min en 1/1",
  "goal": "continu 5 min",
  "desc": "Course sans pause à allure douce",
  "freq": 14
 },
 {
  "id": "etages",
  "name": "Étages avant pause",
  "unit": "étages",
  "baseline": "2",
  "goal": "5",
  "desc": "Combien d'étages avant la 1re pause",
  "freq": 30
 }
];

const GOALS = [
 {
  "id": "poids",
  "title": "Poids 86 → 80 kg",
  "meta": "sur 6 mois",
  "desc": "Cible long terme : 65 kg en 2 ans. Perte progressive de 1 kg/mois en moyenne, avec paliers normaux.",
  "testKey": null,
  "baseValue": 86,
  "targetValue": 80
 },
 {
  "id": "force-haut",
  "title": "Progresser en force (haut du corps)",
  "meta": "Push + Pull",
  "desc": "Réduire l'assistance sur la traction et les dips (RH05) jusqu'à la première traction stricte, monter doucement le tirage horizontal (RH10).",
  "testKey": null
 },
 {
  "id": "force-bas",
  "title": "Progresser en force (jambes + fessiers)",
  "meta": "Legs",
  "desc": "Monter les charges sur le hip thrust et le squat guidé. Fessiers plus fermes, jambes plus toniques.",
  "testKey": null
 },
 {
  "id": "souplesse",
  "title": "Toucher chevilles jambes tendues",
  "meta": "souplesse",
  "desc": "Départ : mains aux genoux/tibias. 15 min/soir de souplesse suffisent.",
  "testKey": "avant-penche"
 },
 {
  "id": "sante",
  "title": "Bien-être global",
  "meta": "continu",
  "desc": "Hydratation, sommeil régulier, alimentation simple. L'eau se suit sur l'écran Aujourd'hui.",
  "testKey": null
 }
];

const FOODS = {
 "legumes": [
  "Brocoli",
  "Choux de Bruxelles",
  "Chou rouge",
  "Chou-fleur",
  "Chou kale",
  "Épinards",
  "Roquette",
  "Mâche",
  "Blettes",
  "Endive",
  "Cresson",
  "Courgette",
  "Aubergine",
  "Poivron",
  "Tomate",
  "Carotte",
  "Betterave",
  "Patate douce",
  "Potimarron",
  "Courge butternut",
  "Champignon",
  "Asperge",
  "Concombre",
  "Fenouil",
  "Haricots verts",
  "Poireau",
  "Oignon rouge",
  "Échalote",
  "Ail",
  "Radis",
  "Artichaut",
  "Céleri",
  "Navet"
 ],
 "fruits": [
  "Myrtilles",
  "Framboises",
  "Mûres",
  "Fraises",
  "Cerises",
  "Cassis",
  "Groseilles",
  "Pomme",
  "Poire",
  "Avocat",
  "Orange",
  "Citron",
  "Pamplemousse",
  "Mandarine",
  "Kiwi",
  "Grenade",
  "Ananas",
  "Banane",
  "Raisin rouge",
  "Papaye",
  "Mangue",
  "Abricot",
  "Pêche",
  "Prune",
  "Figue",
  "Melon",
  "Pastèque",
  "Goji"
 ],
 "prot": [
  "Saumon",
  "Sardines",
  "Maquereau",
  "Hareng",
  "Anchois",
  "Foie de morue",
  "Thon (modéré)",
  "Cabillaud",
  "Truite",
  "Crevettes",
  "Moules",
  "Poulet bio",
  "Dinde",
  "Œufs bio",
  "Tofu",
  "Tempeh",
  "Edamame",
  "Lentilles vertes",
  "Lentilles corail",
  "Pois chiches",
  "Haricots rouges",
  "Haricots blancs",
  "Quinoa (protéine)",
  "Spiruline"
 ],
 "cer": [
  "Quinoa",
  "Sarrasin",
  "Riz complet",
  "Riz noir",
  "Riz sauvage",
  "Avoine",
  "Millet",
  "Orge",
  "Épeautre",
  "Boulgour complet",
  "Pain complet au levain",
  "Pâtes complètes",
  "Pomme de terre",
  "Igname"
 ],
 "fat": [
  "Huile olive vierge",
  "Huile colza",
  "Huile lin",
  "Huile noix",
  "Avocat",
  "Olives",
  "Amandes",
  "Noix",
  "Noisettes",
  "Noix de cajou",
  "Noix du Brésil",
  "Noix de pécan",
  "Noix de macadamia",
  "Pistaches",
  "Graines chia",
  "Graines lin",
  "Graines courge",
  "Graines tournesol",
  "Graines sésame",
  "Tahini",
  "Beurre amande",
  "Beurre cacahuète naturel"
 ],
 "spice": [
  "Curcuma",
  "Gingembre",
  "Ail",
  "Cannelle",
  "Cumin",
  "Poivre noir",
  "Poivre Cayenne",
  "Paprika",
  "Origan",
  "Thym",
  "Basilic",
  "Persil",
  "Coriandre",
  "Romarin",
  "Sauge",
  "Menthe",
  "Laurier",
  "Clou de girofle",
  "Cardamome",
  "Anis étoilé",
  "Safran",
  "Curry",
  "Vanille",
  "Sumac"
 ],
 "bev": [
  "Thé vert",
  "Thé matcha",
  "Thé blanc",
  "Rooibos",
  "Tisane curcuma",
  "Tisane gingembre",
  "Tisane camomille",
  "Tisane menthe",
  "Eau citronnée",
  "Café (modéré)",
  "Lait amande",
  "Lait avoine",
  "Lait coco",
  "Kéfir",
  "Kombucha",
  "Jus de grenade",
  "Jus de cerise",
  "Eau de coco"
 ],
 "mod": [
  "Produits laitiers",
  "Viande rouge",
  "Gluten (blé classique)",
  "Alcool",
  "Café",
  "Sucres complets (miel, sirop érable)",
  "Œufs (si excès)",
  "Légumineuses (si troubles digestifs)"
 ],
 "no": [
  "Sucres raffinés",
  "Sodas",
  "Jus industriels",
  "Plats préparés",
  "Charcuteries",
  "Frites industrielles",
  "Margarine",
  "Huile tournesol",
  "Huile palme",
  "Pâtisseries indus",
  "Bonbons",
  "Fast-food",
  "Édulcorants artificiels",
  "Viandes transformées"
 ]
};

const BREATH = [
 {
  "id": "cohere",
  "name": "Cohérence cardiaque",
  "rhythm": "Inspire 5s · Expire 5s",
  "duration": 300,
  "tags": [
   "Calme",
   "Stress"
  ],
  "cycle": [
   [
    "Inspire",
    5000
   ],
   [
    "Expire",
    5000
   ]
  ],
  "benefits": "Équilibre le système nerveux. Réduit stress et anxiété. Standard scientifique. 3×/jour 5 min."
 },
 {
  "id": "box",
  "name": "Respiration carrée (Box)",
  "rhythm": "4s · 4s · 4s · 4s",
  "duration": 240,
  "tags": [
   "Focus",
   "Angoisse"
  ],
  "cycle": [
   [
    "Inspire",
    4000
   ],
   [
    "Tiens",
    4000
   ],
   [
    "Expire",
    4000
   ],
   [
    "Tiens",
    4000
   ]
  ],
  "benefits": "Calme rapide, focus. Avant entretien, décision difficile, montée d'angoisse. Navy SEALs."
 },
 {
  "id": "478",
  "name": "Respiration 4-7-8",
  "rhythm": "Inspire 4s · Tiens 7s · Expire 8s",
  "duration": 240,
  "tags": [
   "Sommeil",
   "Insomnie"
  ],
  "cycle": [
   [
    "Inspire",
    4000
   ],
   [
    "Tiens",
    7000
   ],
   [
    "Expire",
    8000
   ]
  ],
  "benefits": "Endort en quelques minutes, baisse le rythme cardiaque. Idéale au coucher."
 },
 {
  "id": "wim",
  "name": "Wim Hof simplifiée",
  "rhythm": "30 inspirations rapides",
  "duration": 180,
  "tags": [
   "Énergie",
   "Immunité"
  ],
  "cycle": [
   [
    "Inspire",
    1500
   ],
   [
    "Expire",
    1500
   ]
  ],
  "benefits": "Énergisante. Booste énergie + immunité. Le matin à jeun. Pas dans l'eau, stop si vertige."
 },
 {
  "id": "nadi",
  "name": "Nadi Shodhana (alternée)",
  "rhythm": "Narine D ↔ Narine G",
  "duration": 300,
  "tags": [
   "Focus",
   "Recentrage"
  ],
  "cycle": [
   [
    "Inspire",
    4000
   ],
   [
    "Expire",
    4000
   ]
  ],
  "benefits": "Clarté mentale, recentrage. Bouche un côté du nez, inspire de l'autre, alterne."
 },
 {
  "id": "ujjayi",
  "name": "Ujjayi (océan)",
  "rhythm": "Inspire 4s · Expire 6s gorge serrée",
  "duration": 300,
  "tags": [
   "Calme",
   "Méditation"
  ],
  "cycle": [
   [
    "Inspire",
    4000
   ],
   [
    "Expire",
    6000
   ]
  ],
  "benefits": "Calme profond, ancrage. Légère contraction gorge = son d'océan. Pour méditer."
 },
 {
  "id": "long-expire",
  "name": "Expiration longue",
  "rhythm": "Inspire 4s · Expire 8s",
  "duration": 240,
  "tags": [
   "Colère",
   "Calme"
  ],
  "cycle": [
   [
    "Inspire",
    4000
   ],
   [
    "Expire",
    8000
   ]
  ],
  "benefits": "Active le calme parasympathique. Quand colère ou frustration monte."
 },
 {
  "id": "diaphragm",
  "name": "Respiration ventrale",
  "rhythm": "Inspire 4s ventre · Expire 6s",
  "duration": 300,
  "tags": [
   "Asthme",
   "Base"
  ],
  "cycle": [
   [
    "Inspire",
    4000
   ],
   [
    "Expire",
    6000
   ]
  ],
  "benefits": "Réapprend à respirer correctement. Améliore l'asthme à l'effort sur le long terme."
 }
];
