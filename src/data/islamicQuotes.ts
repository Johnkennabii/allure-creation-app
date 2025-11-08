// Citations islamiques sur le mariage
export const islamicMarriageQuotes = [
  {
    text: "Et parmi Ses signes, Il a créé pour vous, de vous-mêmes, des épouses pour que vous viviez en tranquillité auprès d'elles, et Il a mis entre vous affection et miséricorde.",
    source: "Coran, Sourate Ar-Rum (30:21)",
  },
  {
    text: "Le meilleur d'entre vous est celui qui est le meilleur avec sa femme, et je suis le meilleur d'entre vous avec mes femmes.",
    source: "Hadith rapporté par At-Tirmidhi",
  },
  {
    text: "La femme vertueuse est la meilleure richesse de ce monde.",
    source: "Hadith rapporté par Muslim",
  },
  {
    text: "Lorsqu'un homme se marie, il a complété la moitié de sa religion.",
    source: "Hadith rapporté par Al-Bayhaqi",
  },
  {
    text: "Les croyantes les plus parfaites en foi sont celles qui ont le meilleur comportement, et les meilleures d'entre elles sont celles qui sont les meilleures avec leurs maris.",
    source: "Hadith rapporté par At-Tirmidhi",
  },
  {
    text: "Le mariage est ma Sunna, et celui qui se détourne de ma Sunna n'est pas des miens.",
    source: "Hadith rapporté par Ibn Majah",
  },
  {
    text: "Elles sont un vêtement pour vous, et vous êtes un vêtement pour elles.",
    source: "Coran, Sourate Al-Baqarah (2:187)",
  },
  {
    text: "Le meilleur des biens est une langue qui invoque Allah, un cœur reconnaissant et une épouse croyante qui aide son mari dans sa foi.",
    source: "Hadith rapporté par At-Tirmidhi",
  },
  {
    text: "La meilleure des épouses est celle qui te réjouit quand tu la regardes, t'obéit quand tu lui ordonnes, et préserve ton honneur et tes biens en ton absence.",
    source: "Hadith rapporté par An-Nasa'i",
  },
  {
    text: "Traitez bien les femmes, car elles ont été créées d'une côte.",
    source: "Hadith rapporté par Al-Bukhari",
  },
  {
    text: "Le croyant qui a la foi la plus complète est celui qui a le meilleur comportement, et les meilleurs d'entre vous sont les meilleurs envers leurs épouses.",
    source: "Hadith rapporté par At-Tirmidhi",
  },
  {
    text: "Épousez celles qui sont aimantes et fécondes, car je me vanterai de votre grand nombre devant les autres nations.",
    source: "Hadith rapporté par Abu Dawud",
  },
  {
    text: "Aucun père n'a fait un meilleur cadeau à son enfant qu'une bonne éducation.",
    source: "Hadith rapporté par At-Tirmidhi",
  },
  {
    text: "La femme est mariée pour quatre raisons : sa richesse, sa lignée, sa beauté et sa religion. Choisis celle qui est pieuse, tu seras heureux.",
    source: "Hadith rapporté par Al-Bukhari et Muslim",
  },
  {
    text: "Qu'aucun croyant ne déteste une croyante. S'il déteste un de ses traits, il en appréciera un autre.",
    source: "Hadith rapporté par Muslim",
  },
  {
    text: "Parmi les croyants qui ont la foi la plus complète, il y a ceux qui ont le meilleur caractère et qui sont les plus doux avec leur famille.",
    source: "Hadith rapporté par At-Tirmidhi",
  },
  {
    text: "Le meilleur mariage est celui qui est le plus facile.",
    source: "Hadith rapporté par Ibn Hibban",
  },
  {
    text: "La pudeur et la foi vont de pair. Si l'une disparaît, l'autre disparaît aussi.",
    source: "Hadith rapporté par Al-Hakim",
  },
  {
    text: "Celui qui garantit ce qui est entre ses deux mâchoires (sa langue) et ce qui est entre ses deux jambes (sa chasteté), je lui garantis le Paradis.",
    source: "Hadith rapporté par Al-Bukhari",
  },
  {
    text: "Les meilleures des femmes sont celles qui te font plaisir quand tu les regardes, qui t'obéissent quand tu leur ordonnes, et qui protègent ton honneur et ton argent en ton absence.",
    source: "Hadith rapporté par An-Nasa'i",
  },
  {
    text: "Allah aime que lorsque l'un d'entre vous fait quelque chose, qu'il le fasse à la perfection.",
    source: "Hadith rapporté par Al-Bayhaqi",
  },
  {
    text: "La miséricorde n'est enlevée que des cœurs des malheureux.",
    source: "Hadith rapporté par Abu Dawud",
  },
  {
    text: "Le mariage est la moitié de la foi, alors craignez Allah dans l'autre moitié.",
    source: "Hadith rapporté par Al-Bayhaqi",
  },
  {
    text: "Une femme est mariée pour sa beauté, sa richesse, sa noblesse ou sa piété. Choisis celle qui est pieuse et tu prospéreras.",
    source: "Hadith rapporté par Al-Bukhari",
  },
  {
    text: "Le meilleur des gens est celui qui apprend le Coran et l'enseigne.",
    source: "Hadith rapporté par Al-Bukhari",
  },
  {
    text: "Soyez indulgents et ne soyez pas rigoureux, annoncez la bonne nouvelle et ne faites pas fuir les gens.",
    source: "Hadith rapporté par Al-Bukhari",
  },
  {
    text: "Celui qui croit en Allah et au Jour Dernier, qu'il dise du bien ou qu'il se taise.",
    source: "Hadith rapporté par Al-Bukhari et Muslim",
  },
  {
    text: "Le Prophète ﷺ a dit : 'Je recommande aux hommes de bien traiter les femmes.'",
    source: "Hadith rapporté par Al-Bukhari et Muslim",
  },
  {
    text: "La meilleure richesse est une langue qui mentionne Allah, un cœur reconnaissant, et une épouse croyante.",
    source: "Hadith rapporté par At-Tirmidhi et Ibn Majah",
  },
  {
    text: "Ne méprisez aucun bienfait, ne serait-ce que de rencontrer votre frère avec un visage souriant.",
    source: "Hadith rapporté par Muslim",
  },
  {
    text: "Les actions les plus aimées d'Allah sont celles qui sont régulières, même si elles sont petites.",
    source: "Hadith rapporté par Al-Bukhari et Muslim",
  },
];

/**
 * Obtient la citation islamique du jour basée sur la date
 */
export function getDailyQuote() {
  const today = new Date();
  // Utiliser le numéro du jour de l'année pour avoir une rotation annuelle
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const index = dayOfYear % islamicMarriageQuotes.length;
  return islamicMarriageQuotes[index];
}
