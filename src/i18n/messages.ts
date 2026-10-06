import type {
  LocalizedString,
  LocalizedStrings,
} from '@internationalized/string'

// The words the library writes itself and React Aria has no message for: the
// pending ring's name, a collection's loading-more row, CopyField's button and
// its announcement, a field's character limit, and a search view's back
// button. Everything else a control
// says comes from React Aria's own tables, so these are the strings this table
// has to carry.
//
// One entry per locale React Aria ships, so a locale it localises reads here
// too. React Aria's dictionary falls back from a regional locale to its
// language and then to English, so `fr-CA` reads French and a locale neither
// table has reads English.
//
// The translations were drafted for this table rather than taken from a
// translation service, and each one wants a native speaker's eye before it is
// trusted; a call site can always pass its own words through the prop beside
// each one.

type LibraryMessage =
  | 'back'
  | 'characterLimit'
  | 'copied'
  | 'copy'
  | 'loading'
  | 'loadingMore'

type PluralForms = Partial<
  Record<Intl.LDMLPluralRule, (count: string) => string>
> & { other: (count: string) => string }

/**
 * A message that takes the count's form from the plural rule it falls under.
 * The caller hands over the count already written in the locale's digits and
 * the rule `Intl.PluralRules` gave it, since the formatter's own plural and
 * number helpers are not part of its public API.
 */
function plural(forms: PluralForms): LocalizedString {
  const byRule = new Map(Object.entries(forms))
  return (args) => {
    const count = String(args?.count ?? '')
    const form = byRule.get(String(args?.rule ?? 'other')) ?? forms.other
    return form(count)
  }
}

const MESSAGES: LocalizedStrings<LibraryMessage, LocalizedString> = {
  'ar-AE': {
    back: 'رجوع',
    characterLimit: plural({
      few: (n) => `حتى ${n} أحرف`,
      many: (n) => `حتى ${n} حرفًا`,
      one: () => 'حتى حرف واحد',
      other: (n) => `حتى ${n} حرف`,
      two: () => 'حتى حرفين',
      zero: (n) => `حتى ${n} حرف`,
    }),
    copied: 'تم النسخ',
    copy: 'نسخ',
    loading: 'جارٍ التحميل',
    loadingMore: 'جارٍ تحميل المزيد',
  },
  'bg-BG': {
    back: 'Назад',
    characterLimit: plural({
      one: (n) => `До ${n} знак`,
      other: (n) => `До ${n} знака`,
    }),
    copied: 'Копирано',
    copy: 'Копиране',
    loading: 'Зареждане',
    loadingMore: 'Зареждане на още',
  },
  'cs-CZ': {
    back: 'Zpět',
    characterLimit: plural({
      few: (n) => `Nejvýše ${n} znaky`,
      many: (n) => `Nejvýše ${n} znaku`,
      one: (n) => `Nejvýše ${n} znak`,
      other: (n) => `Nejvýše ${n} znaků`,
    }),
    copied: 'Zkopírováno',
    copy: 'Kopírovat',
    loading: 'Načítání',
    loadingMore: 'Načítání dalších',
  },
  'da-DK': {
    back: 'Tilbage',
    characterLimit: plural({ other: (n) => `Op til ${n} tegn` }),
    copied: 'Kopieret',
    copy: 'Kopiér',
    loading: 'Indlæser',
    loadingMore: 'Indlæser flere',
  },
  'de-DE': {
    back: 'Zurück',
    characterLimit: plural({ other: (n) => `Bis zu ${n} Zeichen` }),
    copied: 'Kopiert',
    copy: 'Kopieren',
    loading: 'Wird geladen',
    loadingMore: 'Weitere werden geladen',
  },
  'el-GR': {
    back: 'Πίσω',
    characterLimit: plural({
      one: (n) => `Έως ${n} χαρακτήρας`,
      other: (n) => `Έως ${n} χαρακτήρες`,
    }),
    copied: 'Αντιγράφηκε',
    copy: 'Αντιγραφή',
    loading: 'Φόρτωση',
    loadingMore: 'Φόρτωση περισσότερων',
  },
  'en-US': {
    back: 'Back',
    characterLimit: plural({
      one: (n) => `Up to ${n} character`,
      other: (n) => `Up to ${n} characters`,
    }),
    copied: 'Copied',
    copy: 'Copy',
    loading: 'Loading',
    loadingMore: 'Loading more',
  },
  'es-ES': {
    back: 'Atrás',
    characterLimit: plural({
      one: (n) => `Hasta ${n} carácter`,
      other: (n) => `Hasta ${n} caracteres`,
    }),
    copied: 'Copiado',
    copy: 'Copiar',
    loading: 'Cargando',
    loadingMore: 'Cargando más',
  },
  'et-EE': {
    back: 'Tagasi',
    characterLimit: plural({
      one: (n) => `Kuni ${n} märk`,
      other: (n) => `Kuni ${n} märki`,
    }),
    copied: 'Kopeeritud',
    copy: 'Kopeeri',
    loading: 'Laadimine',
    loadingMore: 'Laaditakse veel',
  },
  'fi-FI': {
    back: 'Takaisin',
    characterLimit: plural({
      one: (n) => `Enintään ${n} merkki`,
      other: (n) => `Enintään ${n} merkkiä`,
    }),
    copied: 'Kopioitu',
    copy: 'Kopioi',
    loading: 'Ladataan',
    loadingMore: 'Ladataan lisää',
  },
  'fr-FR': {
    back: 'Retour',
    characterLimit: plural({
      one: (n) => `Jusqu’à ${n} caractère`,
      other: (n) => `Jusqu’à ${n} caractères`,
    }),
    copied: 'Copié',
    copy: 'Copier',
    loading: 'Chargement',
    loadingMore: 'Chargement de la suite',
  },
  'he-IL': {
    back: 'חזרה',
    characterLimit: plural({
      one: () => 'עד תו אחד',
      other: (n) => `עד ${n} תווים`,
      two: () => 'עד שני תווים',
    }),
    copied: 'הועתק',
    copy: 'העתק',
    loading: 'טוען',
    loadingMore: 'טוען עוד',
  },
  'hr-HR': {
    back: 'Natrag',
    characterLimit: plural({
      few: (n) => `Najviše ${n} znaka`,
      one: (n) => `Najviše ${n} znak`,
      other: (n) => `Najviše ${n} znakova`,
    }),
    copied: 'Kopirano',
    copy: 'Kopiraj',
    loading: 'Učitavanje',
    loadingMore: 'Učitava se još',
  },
  'hu-HU': {
    back: 'Vissza',
    characterLimit: plural({ other: (n) => `Legfeljebb ${n} karakter` }),
    copied: 'Másolva',
    copy: 'Másolás',
    loading: 'Betöltés',
    loadingMore: 'Továbbiak betöltése',
  },
  'it-IT': {
    back: 'Indietro',
    characterLimit: plural({
      one: (n) => `Fino a ${n} carattere`,
      other: (n) => `Fino a ${n} caratteri`,
    }),
    copied: 'Copiato',
    copy: 'Copia',
    loading: 'Caricamento',
    loadingMore: 'Caricamento di altri elementi',
  },
  'ja-JP': {
    back: '戻る',
    characterLimit: plural({ other: (n) => `最大 ${n} 文字` }),
    copied: 'コピーしました',
    copy: 'コピー',
    loading: '読み込み中',
    loadingMore: 'さらに読み込み中',
  },
  'ko-KR': {
    back: '뒤로',
    characterLimit: plural({ other: (n) => `최대 ${n}자` }),
    copied: '복사됨',
    copy: '복사',
    loading: '로드 중',
    loadingMore: '더 로드하는 중',
  },
  'lt-LT': {
    back: 'Atgal',
    characterLimit: plural({
      few: (n) => `Ne daugiau kaip ${n} simboliai`,
      many: (n) => `Ne daugiau kaip ${n} simbolio`,
      one: (n) => `Ne daugiau kaip ${n} simbolis`,
      other: (n) => `Ne daugiau kaip ${n} simbolių`,
    }),
    copied: 'Nukopijuota',
    copy: 'Kopijuoti',
    loading: 'Įkeliama',
    loadingMore: 'Įkeliama daugiau',
  },
  'lv-LV': {
    back: 'Atpakaļ',
    characterLimit: plural({
      one: (n) => `Līdz ${n} rakstzīmei`,
      other: (n) => `Līdz ${n} rakstzīmēm`,
      zero: (n) => `Līdz ${n} rakstzīmēm`,
    }),
    copied: 'Nokopēts',
    copy: 'Kopēt',
    loading: 'Notiek ielāde',
    loadingMore: 'Notiek papildu ielāde',
  },
  'nb-NO': {
    back: 'Tilbake',
    characterLimit: plural({ other: (n) => `Opptil ${n} tegn` }),
    copied: 'Kopiert',
    copy: 'Kopier',
    loading: 'Laster inn',
    loadingMore: 'Laster inn flere',
  },
  'nl-NL': {
    back: 'Terug',
    characterLimit: plural({
      one: (n) => `Maximaal ${n} teken`,
      other: (n) => `Maximaal ${n} tekens`,
    }),
    copied: 'Gekopieerd',
    copy: 'Kopiëren',
    loading: 'Laden',
    loadingMore: 'Meer laden',
  },
  'pl-PL': {
    back: 'Wstecz',
    characterLimit: plural({
      few: (n) => `Maksymalnie ${n} znaki`,
      many: (n) => `Maksymalnie ${n} znaków`,
      one: (n) => `Maksymalnie ${n} znak`,
      other: (n) => `Maksymalnie ${n} znaku`,
    }),
    copied: 'Skopiowano',
    copy: 'Kopiuj',
    loading: 'Ładowanie',
    loadingMore: 'Ładowanie kolejnych',
  },
  'pt-BR': {
    back: 'Voltar',
    characterLimit: plural({
      one: (n) => `Até ${n} caractere`,
      other: (n) => `Até ${n} caracteres`,
    }),
    copied: 'Copiado',
    copy: 'Copiar',
    loading: 'Carregando',
    loadingMore: 'Carregando mais',
  },
  'pt-PT': {
    back: 'Voltar',
    characterLimit: plural({
      one: (n) => `Até ${n} carácter`,
      other: (n) => `Até ${n} caracteres`,
    }),
    copied: 'Copiado',
    copy: 'Copiar',
    loading: 'A carregar',
    loadingMore: 'A carregar mais',
  },
  'ro-RO': {
    back: 'Înapoi',
    characterLimit: plural({
      few: (n) => `Maximum ${n} caractere`,
      one: (n) => `Maximum ${n} caracter`,
      other: (n) => `Maximum ${n} de caractere`,
    }),
    copied: 'Copiat',
    copy: 'Copiați',
    loading: 'Se încarcă',
    loadingMore: 'Se încarcă mai multe',
  },
  'ru-RU': {
    back: 'Назад',
    characterLimit: plural({
      few: (n) => `Не более ${n} символов`,
      many: (n) => `Не более ${n} символов`,
      one: (n) => `Не более ${n} символа`,
      other: (n) => `Не более ${n} символа`,
    }),
    copied: 'Скопировано',
    copy: 'Копировать',
    loading: 'Загрузка',
    loadingMore: 'Загрузка ещё',
  },
  'sk-SK': {
    back: 'Späť',
    characterLimit: plural({
      few: (n) => `Najviac ${n} znaky`,
      many: (n) => `Najviac ${n} znaku`,
      one: (n) => `Najviac ${n} znak`,
      other: (n) => `Najviac ${n} znakov`,
    }),
    copied: 'Skopírované',
    copy: 'Kopírovať',
    loading: 'Načítava sa',
    loadingMore: 'Načítavajú sa ďalšie',
  },
  'sl-SI': {
    back: 'Nazaj',
    characterLimit: plural({
      few: (n) => `Največ ${n} znaki`,
      one: (n) => `Največ ${n} znak`,
      other: (n) => `Največ ${n} znakov`,
      two: (n) => `Največ ${n} znaka`,
    }),
    copied: 'Kopirano',
    copy: 'Kopiraj',
    loading: 'Nalaganje',
    loadingMore: 'Nalaganje več',
  },
  'sr-SP': {
    back: 'Nazad',
    characterLimit: plural({
      few: (n) => `Najviše ${n} znaka`,
      one: (n) => `Najviše ${n} znak`,
      other: (n) => `Najviše ${n} znakova`,
    }),
    copied: 'Kopirano',
    copy: 'Kopiraj',
    loading: 'Učitavanje',
    loadingMore: 'Učitavanje još',
  },
  'sv-SE': {
    back: 'Tillbaka',
    characterLimit: plural({ other: (n) => `Högst ${n} tecken` }),
    copied: 'Kopierat',
    copy: 'Kopiera',
    loading: 'Läser in',
    loadingMore: 'Läser in fler',
  },
  'tr-TR': {
    back: 'Geri',
    characterLimit: plural({ other: (n) => `En fazla ${n} karakter` }),
    copied: 'Kopyalandı',
    copy: 'Kopyala',
    loading: 'Yükleniyor',
    loadingMore: 'Daha fazlası yükleniyor',
  },
  'uk-UA': {
    back: 'Назад',
    characterLimit: plural({
      few: (n) => `Не більше ${n} символів`,
      many: (n) => `Не більше ${n} символів`,
      one: (n) => `Не більше ${n} символу`,
      other: (n) => `Не більше ${n} символу`,
    }),
    copied: 'Скопійовано',
    copy: 'Копіювати',
    loading: 'Завантаження',
    loadingMore: 'Завантаження ще',
  },
  'zh-CN': {
    back: '返回',
    characterLimit: plural({ other: (n) => `最多 ${n} 个字符` }),
    copied: '已复制',
    copy: '复制',
    loading: '正在加载',
    loadingMore: '正在加载更多',
  },
  'zh-TW': {
    back: '返回',
    characterLimit: plural({ other: (n) => `最多 ${n} 個字元` }),
    copied: '已複製',
    copy: '複製',
    loading: '正在載入',
    loadingMore: '正在載入更多',
  },
}

export type { LibraryMessage }

export { MESSAGES }
