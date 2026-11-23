/* Stage 1 only: short vowels and words you can sound out.
   Audio ids must match scripts/make_audio.py. */
(function () {
  const letters = {
    s: { hint: "Тихий длинный звук, как змея. Не говори «эс».", sound: "ссс" },
    a: { hint: "Короткое «э». Не русская «а» и не название «эй».", sound: "э" },
    t: { hint: "Короткий звук «т». Не «ти».", sound: "т" },
    p: {
      hint: "Короткий звук «п». Не «пи».",
      sound: "п",
      trap: "Похожа на русскую «р», но это «п».",
    },
    i: {
      hint: "Короткое «и». Не «ай». Маленькая i с точкой, большая I с чёрточками сверху и снизу. Это одна буква.",
      sound: "и",
    },
    n: { hint: "Короткий звук «н».", sound: "н" },
    m: { hint: "Короткий звук «м». Губы вместе.", sound: "м" },
    d: {
      hint: "Короткий звук «д». Не «ди».",
      sound: "д",
      trap: "Животик слева, палочка справа. В слове bed это правая спинка кровати.",
    },
    g: { hint: "Короткий звук «г». Не «дж».", sound: "г" },
    o: { hint: "Короткое «о», как середина dog. Не «оу».", sound: "о" },
    c: {
      hint: "В этих словах звук «к». Не «с».",
      sound: "к",
      trap: "Похожа на русскую «с», а говорит «к».",
    },
    e: { hint: "Звук «э». Не «и» и не «эй».", sound: "э" },
    u: { hint: "Короткое «а». Не «у» и не «ю».", sound: "а" },
    r: {
      hint: "Мягкое английское «р». Язык не дрожит и не бьётся.",
      sound: "р",
      trap: "Это не русская «р». Звук тянется, язык спокойный.",
    },
    h: {
      hint: "Лёгкий выдох, почти шёпот. Не «х» и не «н».",
      sound: "выдох",
      trap: "Похожа на русскую «н». Это не «н».",
    },
    b: {
      hint: "Короткий звук «б». Не «би».",
      sound: "б",
      trap: "Похожа на русскую «в», но это «б». Животик справа. В слове bed это левая спинка кровати.",
    },
    f: { hint: "Короткий звук «ф». Зубы на губе.", sound: "ф" },
    l: {
      hint: "Короткий звук «л».",
      sound: "л",
      trap: "Маленькая l — палочка с хвостиком. Большая I сверху и снизу с чёрточками.",
    },
  };

  const words = {
    sat: { text: "sat", letters: ["s", "a", "t"], vowelAt: 1, ru: "сел, села", emoji: "🪑" },
    pat: { text: "pat", letters: ["p", "a", "t"], vowelAt: 1, ru: "хлопает", emoji: "👏" },
    tap: { text: "tap", letters: ["t", "a", "p"], vowelAt: 1, ru: "кран", emoji: "🚰" },
    pin: { text: "pin", letters: ["p", "i", "n"], vowelAt: 1, ru: "булавка", emoji: "📌" },
    pan: { text: "pan", letters: ["p", "a", "n"], vowelAt: 1, ru: "сковорода", emoji: "🍳" },
    sit: { text: "sit", letters: ["s", "i", "t"], vowelAt: 1, ru: "сидит", emoji: "🧘" },
    nap: { text: "nap", letters: ["n", "a", "p"], vowelAt: 1, ru: "дремлет", emoji: "😴" },
    tin: { text: "tin", letters: ["t", "i", "n"], vowelAt: 1, ru: "банка", emoji: "🥫" },
    ant: { text: "ant", letters: ["a", "n", "t"], vowelAt: 0, ru: "муравей", emoji: "🐜" },
    mat: { text: "mat", letters: ["m", "a", "t"], vowelAt: 1, ru: "коврик", emoji: "MAT" },
    map: { text: "map", letters: ["m", "a", "p"], vowelAt: 1, ru: "карта", emoji: "🗺️" },
    dad: { text: "dad", letters: ["d", "a", "d"], vowelAt: 1, ru: "папа", emoji: "👨" },
    mad: { text: "mad", letters: ["m", "a", "d"], vowelAt: 1, ru: "злится", emoji: "😠" },
    sad: { text: "sad", letters: ["s", "a", "d"], vowelAt: 1, ru: "грустит", emoji: "😢" },
    and: { text: "and", letters: ["a", "n", "d"], vowelAt: 0, ru: "и" },
    sam: { text: "Sam", letters: ["S", "a", "m"], vowelAt: 1, ru: "Сэм", emoji: "👦" },
    cat: { text: "cat", letters: ["c", "a", "t"], vowelAt: 1, ru: "кот", emoji: "🐱" },
    dog: { text: "dog", letters: ["d", "o", "g"], vowelAt: 1, ru: "собака", emoji: "🐶" },
    cap: { text: "cap", letters: ["c", "a", "p"], vowelAt: 1, ru: "кепка", emoji: "🧢" },
    pot: { text: "pot", letters: ["p", "o", "t"], vowelAt: 1, ru: "кастрюля", emoji: "🍲" },
    mop: { text: "mop", letters: ["m", "o", "p"], vowelAt: 1, ru: "швабра", emoji: "🧹" },
    on: { text: "on", letters: ["o", "n"], vowelAt: 0, ru: "на" },
    sun: { text: "sun", letters: ["s", "u", "n"], vowelAt: 1, ru: "солнце", emoji: "☀️" },
    red: { text: "red", letters: ["r", "e", "d"], vowelAt: 1, ru: "красный", emoji: "RED" },
    hen: { text: "hen", letters: ["h", "e", "n"], vowelAt: 1, ru: "курица", emoji: "🐔" },
    pen: { text: "pen", letters: ["p", "e", "n"], vowelAt: 1, ru: "ручка", emoji: "🖊️" },
    bed: { text: "bed", letters: ["b", "e", "d"], vowelAt: 1, ru: "кровать", emoji: "🛏️" },
    cup: { text: "cup", letters: ["c", "u", "p"], vowelAt: 1, ru: "чашка", emoji: "🥛" },
    bus: { text: "bus", letters: ["b", "u", "s"], vowelAt: 1, ru: "автобус", emoji: "🚌" },
    run: { text: "run", letters: ["r", "u", "n"], vowelAt: 1, ru: "бежит", emoji: "🏃" },
    rat: { text: "rat", letters: ["r", "a", "t"], vowelAt: 1, ru: "крыса", emoji: "🐀" },
    net: { text: "net", letters: ["n", "e", "t"], vowelAt: 1, ru: "сетка", emoji: "🥅" },
    hat: { text: "hat", letters: ["h", "a", "t"], vowelAt: 1, ru: "шляпа", emoji: "🎩" },
    bag: { text: "bag", letters: ["b", "a", "g"], vowelAt: 1, ru: "сумка", emoji: "👜" },
    bat: { text: "bat", letters: ["b", "a", "t"], vowelAt: 1, ru: "летучая мышь", emoji: "🦇" },
    fan: { text: "fan", letters: ["f", "a", "n"], vowelAt: 1, ru: "вентилятор", emoji: "🌀" },
    log: { text: "log", letters: ["l", "o", "g"], vowelAt: 1, ru: "бревно", emoji: "🪵" },
    leg: { text: "leg", letters: ["l", "e", "g"], vowelAt: 1, ru: "нога", emoji: "🦵" },
    hot: { text: "hot", letters: ["h", "o", "t"], vowelAt: 1, ru: "горячий", emoji: "🔥" },
    hop: { text: "hop", letters: ["h", "o", "p"], vowelAt: 1, ru: "прыгает", emoji: "🐰" },
    fat: { text: "fat", letters: ["f", "a", "t"], vowelAt: 1, ru: "пухлый", note: "A fat cat — пухлый кот." },
    big: { text: "big", letters: ["b", "i", "g"], vowelAt: 1, ru: "большой", note: "A big bus — большой автобус." },
    a: {
      text: "a",
      tricky: true,
      forms: ["a", "A"],
      ru: "один, одна, какое-то",
      note: "В фразе звучит коротко «э». Это не звук буквы a из sat и не название «эй». В начале фразы пишется большая A.",
    },
    the: {
      text: "the",
      tricky: true,
      forms: ["the", "The"],
      ru: "этот, эта, это",
      note: "Буквы th вместе — другой звук. Пока не разбираем, запоминаем слово целиком.",
    },
    I: {
      text: "I",
      tricky: true,
      forms: ["I"],
      ru: "я",
      note: "Та самая буква i, только большая. Здесь это целое слово «я». Читается «ай», не короткое «и».",
    },
    see: {
      text: "see",
      tricky: true,
      forms: ["see"],
      ru: "вижу",
      note: "Две буквы ee — один длинный звук «и». Пока запоминаем слово целиком.",
    },
  };

  function opt(emoji, ok) {
    return { emoji: emoji, ok: ok };
  }

  const sentences = {
    "a-pin": {
      tokens: [
        { show: "A", audio: "a" },
        { show: "pin.", audio: "pin" },
      ],
      ru: "Какая-то булавка.",
      q: "Что это?",
      options: [opt("📌", true), opt("🍳", false), opt("🐜", false)],
    },
    "a-pan": {
      tokens: [
        { show: "A", audio: "a" },
        { show: "pan.", audio: "pan" },
      ],
      ru: "Какая-то сковорода.",
      q: "Что это?",
      options: [opt("🍳", true), opt("📌", false), opt("😴", false)],
    },
    "a-nap": {
      tokens: [
        { show: "A", audio: "a" },
        { show: "nap.", audio: "nap" },
      ],
      ru: "Кто-то дремлет.",
      q: "Что происходит?",
      options: [opt("😴", true), opt("👏", false), opt("🐜", false)],
    },
    "sam-sat": {
      tokens: [
        { show: "Sam", audio: "sam" },
        { show: "sat.", audio: "sat" },
      ],
      ru: "Сэм сел.",
      q: "Кто сел?",
      options: [opt("👦", true), opt("👨", false), opt("🐜", false)],
    },
    "dad-sat": {
      tokens: [
        { show: "Dad", audio: "dad" },
        { show: "sat.", audio: "sat" },
      ],
      ru: "Папа сел.",
      q: "Кто сел?",
      options: [opt("👨", true), opt("👦", false), opt("🗺️", false)],
    },
    "a-sad-dad": {
      tokens: [
        { show: "A", audio: "a" },
        { show: "sad", audio: "sad" },
        { show: "dad.", audio: "dad" },
      ],
      ru: "Грустный папа.",
      q: "Какой папа?",
      options: [opt("😢", true), opt("😠", false), opt("😄", false)],
    },
    "sam-and-dad": {
      tokens: [
        { show: "Sam", audio: "sam" },
        { show: "and", audio: "and" },
        { show: "Dad", audio: "dad" },
        { show: "sat.", audio: "sat" },
      ],
      ru: "Сэм и папа сели.",
      q: "Кто сел?",
      options: [opt("👦👨", true), opt("👦", false), opt("👨", false)],
    },
    "a-cat-sat": {
      tokens: [
        { show: "A", audio: "a" },
        { show: "cat", audio: "cat" },
        { show: "sat.", audio: "sat" },
      ],
      ru: "Кот сел.",
      q: "Кто сел?",
      options: [opt("🐱", true), opt("🐶", false), opt("👦", false)],
    },
    "dog-on-mat": {
      tokens: [
        { show: "A", audio: "a" },
        { show: "dog", audio: "dog" },
        { show: "sat", audio: "sat" },
        { show: "on", audio: "on" },
        { show: "a", audio: "a" },
        { show: "mat.", audio: "mat" },
      ],
      ru: "Собака села на коврик.",
      q: "Кто сел на коврик?",
      options: [opt("🐶", true), opt("🐱", false), opt("👦", false)],
    },
    "sam-on-map": {
      tokens: [
        { show: "Sam", audio: "sam" },
        { show: "sat", audio: "sat" },
        { show: "on", audio: "on" },
        { show: "a", audio: "a" },
        { show: "map.", audio: "map" },
      ],
      ru: "Сэм сел на карту.",
      q: "На чём сидит Сэм?",
      options: [opt("🗺️", true), opt("MAT", false), opt("🍲", false)],
    },
    "cat-on-pot": {
      tokens: [
        { show: "A", audio: "a" },
        { show: "cat", audio: "cat" },
        { show: "sat", audio: "sat" },
        { show: "on", audio: "on" },
        { show: "a", audio: "a" },
        { show: "pot.", audio: "pot" },
      ],
      ru: "Кот сел на кастрюлю.",
      q: "На чём кот?",
      options: [opt("🍲", true), opt("🗺️", false), opt("MAT", false)],
    },
    "cat-and-dog": {
      tokens: [
        { show: "A", audio: "a" },
        { show: "cat", audio: "cat" },
        { show: "and", audio: "and" },
        { show: "a", audio: "a" },
        { show: "dog.", audio: "dog" },
      ],
      ru: "Кот и собака.",
      q: "Кто здесь?",
      options: [opt("🐱🐶", true), opt("🐱", false), opt("🐶", false)],
    },
    "a-red-hen": {
      tokens: [
        { show: "A", audio: "a" },
        { show: "red", audio: "red" },
        { show: "hen.", audio: "hen" },
      ],
      ru: "Рыжая курица.",
      q: "Кто это?",
      options: [opt("🐔", true), opt("🐀", false), opt("🖊️", false)],
    },
    "the-cat-sat": {
      tokens: [
        { show: "The", audio: "the" },
        { show: "cat", audio: "cat" },
        { show: "sat.", audio: "sat" },
      ],
      ru: "Этот кот сел.",
      q: "Кто сел?",
      options: [opt("🐱", true), opt("🐶", false), opt("☀️", false)],
    },
    "the-red-hen": {
      tokens: [
        { show: "The", audio: "the" },
        { show: "red", audio: "red" },
        { show: "hen", audio: "hen" },
        { show: "sat.", audio: "sat" },
      ],
      ru: "Рыжая курица села.",
      q: "Кто сел?",
      options: [opt("🐔", true), opt("🐱", false), opt("☀️", false)],
    },
    "the-sun": {
      tokens: [
        { show: "The", audio: "the" },
        { show: "sun.", audio: "sun" },
      ],
      ru: "Это солнце.",
      q: "Что это?",
      options: [opt("☀️", true), opt("🐔", false), opt("🥛", false)],
    },
    "a-fat-cat": {
      tokens: [
        { show: "A", audio: "a" },
        { show: "fat", audio: "fat" },
        { show: "cat.", audio: "cat" },
      ],
      ru: "Пухлый кот.",
      q: "Кто это?",
      options: [opt("🐱", true), opt("🐶", false), opt("🎩", false)],
    },
    "a-big-bag": {
      tokens: [
        { show: "A", audio: "a" },
        { show: "big", audio: "big" },
        { show: "bag.", audio: "bag" },
      ],
      ru: "Большая сумка.",
      q: "Что большое?",
      options: [opt("👜", true), opt("🦇", false), opt("🦵", false)],
    },
    "hat-on-cat": {
      tokens: [
        { show: "The", audio: "the" },
        { show: "hat", audio: "hat" },
        { show: "sat", audio: "sat" },
        { show: "on", audio: "on" },
        { show: "the", audio: "the" },
        { show: "cat.", audio: "cat" },
      ],
      ru: "Шляпа села на кота.",
      q: "Что на коте?",
      options: [opt("🎩", true), opt("🪵", false), opt("🥛", false)],
    },
    "dog-on-log": {
      tokens: [
        { show: "A", audio: "a" },
        { show: "dog", audio: "dog" },
        { show: "sat", audio: "sat" },
        { show: "on", audio: "on" },
        { show: "a", audio: "a" },
        { show: "log.", audio: "log" },
      ],
      ru: "Собака села на бревно.",
      q: "На чём собака?",
      options: [opt("🪵", true), opt("🎩", false), opt("🛏️", false)],
    },
    "i-see-cat": {
      tokens: [
        { show: "I", audio: "I" },
        { show: "see", audio: "see" },
        { show: "a", audio: "a" },
        { show: "cat.", audio: "cat" },
      ],
      ru: "Я вижу кота.",
      q: "Кого видно?",
      options: [opt("🐱", true), opt("🐶", false), opt("☀️", false)],
    },
    "i-see-sun": {
      tokens: [
        { show: "I", audio: "I" },
        { show: "see", audio: "see" },
        { show: "the", audio: "the" },
        { show: "sun.", audio: "sun" },
      ],
      ru: "Я вижу солнце.",
      q: "Что видно?",
      options: [opt("☀️", true), opt("🐱", false), opt("🚌", false)],
    },
    "i-see-hen": {
      tokens: [
        { show: "I", audio: "I" },
        { show: "see", audio: "see" },
        { show: "a", audio: "a" },
        { show: "red", audio: "red" },
        { show: "hen.", audio: "hen" },
      ],
      ru: "Я вижу рыжую курицу.",
      q: "Кто рыжий?",
      options: [opt("🐔", true), opt("🚌", false), opt("🐀", false)],
    },
    "i-see-bus": {
      tokens: [
        { show: "I", audio: "I" },
        { show: "see", audio: "see" },
        { show: "a", audio: "a" },
        { show: "big", audio: "big" },
        { show: "bus.", audio: "bus" },
      ],
      ru: "Я вижу большой автобус.",
      q: "Что большое?",
      options: [opt("🚌", true), opt("☀️", false), opt("🐱", false)],
    },
    "i-see-rat": {
      tokens: [
        { show: "I", audio: "I" },
        { show: "see", audio: "see" },
        { show: "a", audio: "a" },
        { show: "rat.", audio: "rat" },
      ],
      ru: "Я вижу крысу.",
      q: "Кого видно?",
      options: [opt("🐀", true), opt("🐔", false), opt("🚌", false)],
    },
    "the-fat-cat-sat": {
      tokens: [
        { show: "The", audio: "the" },
        { show: "fat", audio: "fat" },
        { show: "cat", audio: "cat" },
        { show: "sat.", audio: "sat" },
      ],
      ru: "Пухлый кот сел.",
      q: "Кто сел?",
      options: [opt("🐱", true), opt("🐶", false), opt("🎩", false)],
    },
    "cat-on-hat": {
      tokens: [
        { show: "The", audio: "the" },
        { show: "cat", audio: "cat" },
        { show: "sat", audio: "sat" },
        { show: "on", audio: "on" },
        { show: "a", audio: "a" },
        { show: "hat.", audio: "hat" },
      ],
      ru: "Кот сел на шляпу.",
      q: "На чём кот?",
      options: [opt("🎩", true), opt("🪵", false), opt("🛏️", false)],
    },
    "cat-on-dog": {
      tokens: [
        { show: "The", audio: "the" },
        { show: "cat", audio: "cat" },
        { show: "sat", audio: "sat" },
        { show: "on", audio: "on" },
        { show: "the", audio: "the" },
        { show: "dog.", audio: "dog" },
      ],
      ru: "Кот сел на собаку.",
      q: "Кто сидел сверху?",
      options: [opt("🐱", true), opt("🐶", false), opt("🎩", false)],
    },
  };

  const early = ["s", "a", "t", "p"];
  const withIn = early.concat(["i", "n"]);
  const withMd = withIn.concat(["m", "d"]);
  const withOgc = withMd.concat(["o", "g", "c"]);
  const withEr = withOgc.concat(["e", "r"]);
  const withU = withEr.concat(["u"]);
  const withHb = withU.concat(["h", "b"]);
  const all = withHb.concat(["f", "l"]);

  const steps = [
    {
      id: "s1",
      part: "Звуки",
      title: "s a t p",
      minutes: 6,
      blurb: "Четыре звука, из них уже слова",
      activities: [
        { type: "intro" },
        { type: "teach-letters", letters: ["s", "a", "t", "p"] },
        { type: "quiz-letters", answers: ["s", "a", "t", "p", "a", "t", "s", "p"], pool: early },
        { type: "meet-words", words: ["sat", "pat", "tap"], legend: true },
        { type: "quiz-words", words: ["sat", "pat", "tap"] },
      ],
    },
    {
      id: "s2",
      part: "Звуки",
      title: "i n",
      minutes: 6,
      blurb: "Новая гласная. Смотри в середину слова",
      activities: [
        { type: "teach-letters", letters: ["i", "n"] },
        { type: "quiz-letters", answers: ["i", "n", "i", "a", "n", "s"], pool: withIn },
        { type: "meet-words", words: ["pin", "pan", "sit", "nap", "tin", "ant"] },
        {
          type: "pairs",
          items: [
            { ru: "сел", emoji: "🪑", word: "sat", other: "sit" },
            { ru: "сидит", emoji: "🧘", word: "sit", other: "sat" },
            { ru: "булавка", emoji: "📌", word: "pin", other: "pan" },
            { ru: "сковорода", emoji: "🍳", word: "pan", other: "pin" },
          ],
        },
        { type: "quiz-words", words: ["pin", "pan", "sit", "nap", "tin", "ant"] },
      ],
    },
    {
      id: "s3",
      part: "Слова целиком",
      title: "слово a",
      minutes: 4,
      blurb: "Одно слово пока не собираем по звукам",
      activities: [
        { type: "tricky", words: ["a"] },
        { type: "phrases", ids: ["a-pin", "a-pan", "a-nap"] },
      ],
    },
    {
      id: "s4",
      part: "Звуки",
      title: "m d",
      minutes: 6,
      blurb: "И слово and — это «и»",
      activities: [
        { type: "teach-letters", letters: ["m", "d"] },
        { type: "quiz-letters", answers: ["m", "d", "m", "n", "d", "a"], pool: withMd },
        { type: "meet-words", words: ["mat", "map", "dad", "mad", "sad", "and", "sam"] },
        { type: "quiz-words", words: ["mat", "map", "dad", "mad", "sad", "sam"] },
        { type: "phrases", ids: ["sam-sat", "dad-sat", "a-sad-dad", "sam-and-dad"] },
      ],
    },
    {
      id: "s5",
      part: "Звуки",
      title: "o g c",
      minutes: 7,
      blurb: "Буква c здесь говорит «к»",
      activities: [
        { type: "teach-letters", letters: ["o", "g", "c"] },
        { type: "quiz-letters", answers: ["o", "g", "c", "o", "c", "a"], pool: withOgc },
        { type: "meet-words", words: ["cat", "dog", "cap", "pot", "mop", "on"] },
        {
          type: "pairs",
          items: [
            { ru: "хлопает", emoji: "👏", word: "pat", other: "pot" },
            { ru: "кастрюля", emoji: "🍲", word: "pot", other: "pat" },
            { ru: "карта", emoji: "🗺️", word: "map", other: "mop" },
            { ru: "швабра", emoji: "🧹", word: "mop", other: "map" },
          ],
        },
        { type: "quiz-words", words: ["cat", "dog", "cap", "pot", "mop"] },
      ],
    },
    {
      id: "s6",
      part: "Фразы",
      title: "первые фразы",
      minutes: 5,
      blurb: "Слова, которые уже читаются, встают в ряд",
      activities: [
        { type: "phrases", ids: ["a-cat-sat", "dog-on-mat", "sam-on-map", "cat-on-pot", "cat-and-dog"] },
      ],
    },
    {
      id: "s7",
      part: "Звуки",
      title: "e r",
      minutes: 6,
      blurb: "Ещё одна гласная и английская r",
      activities: [
        { type: "teach-letters", letters: ["e", "r"] },
        { type: "quiz-letters", answers: ["e", "r", "e", "i", "r", "a"], pool: withEr },
        { type: "meet-words", words: ["red", "hen", "pen", "bed", "rat", "net"] },
        {
          type: "pairs",
          items: [
            { ru: "булавка", emoji: "📌", word: "pin", other: "pen" },
            { ru: "ручка", emoji: "🖊️", word: "pen", other: "pin" },
            { ru: "сковорода", emoji: "🍳", word: "pan", other: "pen" },
            { ru: "крыса", emoji: "🐀", word: "rat", other: "sat" },
          ],
        },
        { type: "quiz-words", words: ["red", "hen", "pen", "bed", "rat", "net"] },
      ],
    },
    {
      id: "s8",
      part: "Звуки",
      title: "u",
      minutes: 5,
      blurb: "Короткое «а» в sun и cup",
      activities: [
        { type: "teach-letters", letters: ["u"] },
        { type: "quiz-letters", answers: ["u", "a", "u", "o", "e", "u"], pool: withU },
        { type: "meet-words", words: ["sun", "cup", "bus", "run"] },
        {
          type: "pairs",
          items: [
            { ru: "кепка", emoji: "🧢", word: "cap", other: "cup" },
            { ru: "чашка", emoji: "🥛", word: "cup", other: "cap" },
          ],
        },
        { type: "quiz-words", words: ["sun", "cup", "bus", "run"] },
      ],
    },
    {
      id: "s9",
      part: "Слова целиком",
      title: "слово the",
      minutes: 4,
      blurb: "Второе слово, которое запоминаем картинкой",
      activities: [
        { type: "tricky", words: ["the"] },
        { type: "phrases", ids: ["the-cat-sat", "the-red-hen", "the-sun"] },
      ],
    },
    {
      id: "s10",
      part: "Звуки",
      title: "h b",
      minutes: 6,
      blurb: "Две буквы, которые легко спутать с русскими",
      activities: [
        { type: "teach-letters", letters: ["h", "b"] },
        { type: "quiz-letters", answers: ["h", "b", "h", "n", "b", "d"], pool: withHb },
        { type: "meet-words", words: ["hat", "hot", "bat", "hop", "big", "bag"] },
        {
          type: "pairs",
          items: [
            { ru: "шляпа", emoji: "🎩", word: "hat", other: "hot" },
            { ru: "горячий", emoji: "🔥", word: "hot", other: "hat" },
            { ru: "сумка", emoji: "👜", word: "bag", other: "big" },
            { ru: "большой", emoji: "🚌", word: "big", other: "bag" },
          ],
        },
        { type: "quiz-words", words: ["hat", "hot", "bat", "hop", "bag"] },
      ],
    },
    {
      id: "s11",
      part: "Звуки",
      title: "f l",
      minutes: 6,
      blurb: "Последние звуки этого этапа",
      activities: [
        { type: "teach-letters", letters: ["f", "l"] },
        { type: "quiz-letters", answers: ["f", "l", "f", "t", "l", "i"], pool: all },
        { type: "meet-words", words: ["fan", "fat", "log", "leg"] },
        {
          type: "pairs",
          items: [
            { ru: "бревно", emoji: "🪵", word: "log", other: "leg" },
            { ru: "нога", emoji: "🦵", word: "leg", other: "log" },
            { ru: "летучая мышь", emoji: "🦇", word: "bat", other: "hat" },
            { ru: "шляпа", emoji: "🎩", word: "hat", other: "bat" },
          ],
        },
        { type: "quiz-words", words: ["fan", "log", "leg"] },
        { type: "phrases", ids: ["a-fat-cat", "a-big-bag", "hat-on-cat", "dog-on-log"] },
      ],
    },
    {
      id: "s12",
      part: "Слова целиком",
      title: "I see",
      minutes: 5,
      blurb: "«Я вижу». Два слова запоминаем целиком",
      activities: [
        { type: "tricky", words: ["I", "see"] },
        { type: "phrases", ids: ["i-see-cat", "i-see-sun", "i-see-hen", "i-see-bus", "i-see-rat"] },
      ],
    },
    {
      id: "s13",
      part: "Книжки",
      title: "A fat cat",
      minutes: 5,
      blurb: "Пять строк. Читаем сами, звук потом",
      activities: [
        {
          type: "book",
          title: "A fat cat",
          pages: [
            { sentence: "a-fat-cat", scene: "🐱" },
            { sentence: "the-fat-cat-sat", scene: "🐱🪑" },
            { sentence: "cat-on-hat", scene: "🐱🎩" },
            { sentence: "dog-on-log", scene: "🐶🪵" },
            { sentence: "cat-on-dog", scene: "🐱🐶" },
          ],
          questions: ["cat-on-dog", "dog-on-log"],
        },
      ],
    },
    {
      id: "s14",
      part: "Книжки",
      title: "I see",
      minutes: 5,
      blurb: "Вторая книжка, те же слова",
      activities: [
        {
          type: "book",
          title: "I see",
          pages: [
            { sentence: "i-see-cat", scene: "👀🐱" },
            { sentence: "i-see-hen", scene: "👀🐔" },
            { sentence: "i-see-sun", scene: "👀☀️" },
            { sentence: "i-see-bus", scene: "👀🚌" },
            { sentence: "i-see-rat", scene: "👀🐀" },
          ],
          questions: ["i-see-hen", "i-see-bus"],
        },
      ],
    },
    {
      id: "s15",
      part: "Книжки",
      title: "ловушки",
      minutes: 6,
      blurb: "Буквы, которые притворяются русскими, и любые слова",
      activities: [
        {
          type: "traps",
          items: [
            {
              q: "Какая буква говорит «б»? Она похожа на русскую «в».",
              options: ["b", "h", "p"],
              answer: "b",
            },
            {
              q: "Какая буква говорит «п»? Она похожа на русскую «р».",
              options: ["p", "d", "b"],
              answer: "p",
            },
            {
              q: "Какая буква — лёгкий выдох? Она похожа на русскую «н».",
              options: ["h", "n", "b"],
              answer: "h",
            },
            {
              q: "Какая буква в слове cat говорит «к»? Она похожа на русскую «с».",
              options: ["c", "s", "o"],
              answer: "c",
            },
            {
              q: "Где животик у этой буквы?",
              show: "b",
              options: ["справа", "слева"],
              answer: "справа",
            },
            {
              q: "Где животик у этой буквы?",
              show: "d",
              options: ["слева", "справа"],
              answer: "слева",
            },
          ],
        },
        { type: "quiz-words", review: true },
      ],
    },
  ];

  window.KIRA = { letters: letters, words: words, sentences: sentences, steps: steps };
})();
