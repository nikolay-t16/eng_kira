(function () {
  "use strict";

  const KEY = "kira-reading-v1";
  const { letters, words, sentences, steps } = window.KIRA;
  const SIMILAR = {
    b: ["d", "p", "h"],
    d: ["b", "p"],
    p: ["b", "d"],
    n: ["m", "h", "u"],
    m: ["n"],
    a: ["e", "o", "c"],
    e: ["a", "i"],
    i: ["l", "e"],
    l: ["i", "t"],
    c: ["o", "e", "a"],
    o: ["a", "c", "u"],
    u: ["n", "a", "o"],
    h: ["n", "b"],
    f: ["t", "l"],
    t: ["f", "l"],
    g: ["o", "c"],
    s: ["c", "a"],
    r: ["n", "h"],
  };
  const REVIEW = [
    "sat", "pat", "tap", "pin", "pan", "sit", "nap", "tin", "ant", "mat", "map",
    "dad", "mad", "sad", "sam", "cat", "dog", "cap", "pot", "mop", "sun", "red",
    "hen", "pen", "bed", "cup", "bus", "run", "rat", "net", "hat", "bag", "bat",
    "fan", "log", "leg", "hot", "hop",
  ];

  const state = {
    screen: "home",
    stepId: null,
    activityIndex: 0,
    summary: "",
    stepFirst: 0,
    stepTotal: 0,
  };
  let session = {};
  let playGen = 0;
  let currentAudio = null;

  const app = document.getElementById("app");
  document.addEventListener("click", onClick);
  document.addEventListener("change", onChange);

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (raw && typeof raw === "object" && raw.steps) return raw;
    } catch (err) {
      /* keep a fresh path */
    }
    return { unlockAll: false, steps: {} };
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function doneSet(stepId) {
    const data = load();
    return new Set((data.steps[stepId] && data.steps[stepId].done) || []);
  }

  function stepById(id) {
    return steps.find(function (step) { return step.id === id; });
  }

  function stepComplete(step) {
    return doneSet(step.id).size >= step.activities.length;
  }

  function stepUnlocked(index) {
    const data = load();
    if (data.unlockAll || index === 0) return true;
    return stepComplete(steps[index - 1]);
  }

  function continueTarget() {
    for (let i = 0; i < steps.length; i += 1) {
      if (!stepUnlocked(i)) break;
      const done = doneSet(steps[i].id);
      for (let a = 0; a < steps[i].activities.length; a += 1) {
        if (!done.has(a)) return { step: steps[i], index: a, stepIndex: i };
      }
    }
    return null;
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function play(src) {
    return new Promise(function (resolve) {
      if (currentAudio) {
        currentAudio.onended = null;
        currentAudio.onerror = null;
        currentAudio.pause();
      }
      const audio = new Audio(src);
      currentAudio = audio;
      let settled = false;
      const done = function (ok) {
        if (settled) return;
        settled = true;
        resolve(ok);
      };
      const timer = setTimeout(function () { done(true); }, 7000);
      audio.onended = function () { clearTimeout(timer); done(true); };
      audio.onerror = function () { clearTimeout(timer); done(false); };
      audio.play().catch(function () { clearTimeout(timer); done(false); });
    });
  }

  function stopAudio() {
    playGen += 1;
    if (currentAudio) currentAudio.pause();
    session.playing = false;
  }

  function phonemeSrc(letter) {
    return "audio/p/" + letter.toLowerCase() + ".wav";
  }

  function wordSrc(id) {
    return "audio/w/" + id + ".mp3";
  }

  function sentenceSrc(id) {
    return "audio/s/" + id + ".mp3";
  }

  function speaker() {
    return '<button type="button" class="sound" data-act="hear-current" aria-label="Слушать">' +
      '<svg viewBox="0 0 24 24"><path d="M4 10h4l5-4v12l-5-4H4z"/><path d="M16 9a4 4 0 010 6"/><path d="M18 7a7 7 0 010 10"/></svg></button>';
  }

  function picHTML(emoji) {
    if (emoji === "MAT") return '<span class="mat" role="img" aria-label="коврик"></span>';
    if (emoji === "RED") return '<span class="reddot" role="img" aria-label="красный"></span>';
    return '<span class="emo">' + emoji + "</span>";
  }

  function wordHTML(audioId, show) {
    const word = words[audioId];
    if (!word || word.tricky) return esc(show);
    const punct = /[.!?]$/.test(show) ? show.slice(-1) : "";
    const chars = word.letters.slice();
    if (show[0] && show[0] !== show[0].toLowerCase()) chars[0] = chars[0].toUpperCase();
    const body = chars.map(function (ch, index) {
      const cls = index === word.vowelAt ? "vowel" : "";
      return '<span class="' + cls + '">' + esc(ch) + "</span>";
    }).join("");
    return body + punct;
  }

  function letterOptions(answer, pool) {
    const options = [answer];
    (SIMILAR[answer] || []).forEach(function (item) {
      if (options.length < 3 && pool.indexOf(item) !== -1 && options.indexOf(item) === -1) {
        options.push(item);
      }
    });
    shuffle(pool).forEach(function (item) {
      if (options.length < 3 && options.indexOf(item) === -1) options.push(item);
    });
    return shuffle(options);
  }

  function wordOptions(answer, pool) {
    const answerEmoji = words[answer].emoji;
    let others = pool.filter(function (id) {
      return id !== answer && words[id].emoji && words[id].emoji !== answerEmoji;
    });
    if (others.length < 2) {
      others = REVIEW.filter(function (id) {
        return id !== answer && words[id].emoji !== answerEmoji;
      });
    }
    return shuffle([answer].concat(shuffle(others).slice(0, 2)));
  }

  function initSession(activity) {
    session = { playing: false, audioError: false, first: 0, total: 0 };
    if (activity.type === "teach-letters") {
      session.i = 0;
      session.heard = false;
    } else if (activity.type === "quiz-letters") {
      session.i = 0;
      session.mark = null;
      session.locked = false;
      session.rounds = activity.answers.map(function (answer) {
        return { answer: answer, options: letterOptions(answer, activity.pool) };
      });
      session.total = session.rounds.length;
    } else if (activity.type === "meet-words" || activity.type === "tricky") {
      session.i = 0;
      session.blended = false;
      session.heard = false;
      session.lit = -1;
    } else if (activity.type === "quiz-words") {
      const pool = activity.review ? shuffle(REVIEW).slice(0, 8) : activity.words.slice();
      session.i = 0;
      session.mark = null;
      session.locked = false;
      session.rounds = pool.map(function (answer) {
        return { answer: answer, options: wordOptions(answer, pool) };
      });
      session.total = session.rounds.length;
    } else if (activity.type === "pairs") {
      session.i = 0;
      session.mark = null;
      session.locked = false;
      session.items = activity.items.map(function (item) {
        return {
          ru: item.ru,
          emoji: item.emoji,
          answer: item.word,
          options: shuffle([item.word, item.other]),
        };
      });
      session.total = session.items.length;
    } else if (activity.type === "phrases") {
      session.i = 0;
      session.mark = null;
      session.locked = false;
      session.highlight = -1;
      session.total = activity.ids.length;
    } else if (activity.type === "book") {
      session.page = 0;
      session.phase = "read";
      session.q = 0;
      session.mark = null;
      session.locked = false;
      session.highlight = -1;
    } else if (activity.type === "traps") {
      session.i = 0;
      session.mark = null;
      session.locked = false;
      session.total = activity.items.length;
    }
  }

  function startActivity(stepId, index) {
    stopAudio();
    if (index === 0) {
      state.stepFirst = 0;
      state.stepTotal = 0;
    }
    state.screen = "activity";
    state.stepId = stepId;
    state.activityIndex = index;
    state.summary = "";
    initSession(stepById(stepId).activities[index]);
    render();
  }

  function finishActivity() {
    if (session.total) {
      state.stepFirst += session.first;
      state.stepTotal += session.total;
    }
    const data = load();
    const prev = (data.steps[state.stepId] && data.steps[state.stepId].done) || [];
    const done = new Set(prev);
    done.add(state.activityIndex);
    data.steps[state.stepId] = { done: Array.from(done) };
    save(data);
    const step = stepById(state.stepId);
    const last = state.activityIndex === step.activities.length - 1;
    if (!last) {
      startActivity(state.stepId, state.activityIndex + 1);
      return;
    }
    state.screen = "done";
    state.summary = state.stepTotal ? state.stepFirst + " из " + state.stepTotal + " сразу" : "";
    stopAudio();
    render();
  }

  function currentActivity() {
    return stepById(state.stepId).activities[state.activityIndex];
  }

  async function runBlend(word) {
    const my = ++playGen;
    session.playing = true;
    session.audioError = false;
    session.lit = -1;
    render();
    for (let i = 0; i < word.letters.length; i += 1) {
      if (playGen !== my) return;
      session.lit = i;
      render();
      const ok = await play(phonemeSrc(word.letters[i]));
      if (!ok) {
        session.audioError = true;
        break;
      }
      await wait(220);
    }
    if (playGen !== my) return;
    session.lit = -1;
    session.blended = true;
    session.playing = false;
    render();
  }

  async function runWord(id) {
    const my = ++playGen;
    session.playing = true;
    session.audioError = false;
    render();
    const ok = await play(wordSrc(id));
    if (playGen !== my) return;
    session.playing = false;
    session.heard = true;
    session.audioError = !ok;
    render();
  }

  async function runPhrase(sentence, slow) {
    const my = ++playGen;
    session.playing = true;
    session.audioError = false;
    session.highlight = -1;
    render();
    if (slow) {
      for (let i = 0; i < sentence.tokens.length; i += 1) {
        if (playGen !== my) return;
        session.highlight = i;
        render();
        const token = sentence.tokens[i];
        const word = words[token.audio];
        if (!word.tricky) {
          for (let n = 0; n < word.letters.length; n += 1) {
            if (playGen !== my) return;
            const ok = await play(phonemeSrc(word.letters[n]));
            if (!ok) session.audioError = true;
            await wait(140);
          }
        }
        if (playGen !== my) return;
        const okWord = await play(wordSrc(token.audio));
        if (!okWord) session.audioError = true;
        await wait(180);
      }
    }
    if (playGen !== my) return;
    session.highlight = -1;
    render();
    const ok = await play(sentenceSrc(sentenceIdFromCurrent()));
    if (playGen !== my) return;
    session.playing = false;
    if (!ok) session.audioError = true;
    render();
  }

  function sentenceIdFromCurrent() {
    const activity = currentActivity();
    if (activity.type === "phrases") return activity.ids[session.i];
    if (activity.type === "book" && session.phase === "read") {
      return activity.pages[session.page].sentence;
    }
    if (activity.type === "book") return activity.questions[session.q];
    return "";
  }

  function advanceRound(listName) {
    session.i += 1;
    session.mark = null;
    session.locked = false;
    session.tried = false;
    session.status = "";
    if (session.i >= session[listName].length) finishActivity();
    else render();
  }

  function onClick(event) {
    const node = event.target.closest("[data-act]");
    if (!node || node.disabled) return;
    const act = node.dataset.act;
    if (act === "guide") {
      stopAudio();
      state.screen = "guide";
      render();
    } else if (act === "home") {
      stopAudio();
      state.screen = "home";
      render();
    } else if (act === "continue") {
      const target = continueTarget();
      if (target) startActivity(target.step.id, target.index);
      else startActivity(steps[0].id, 0);
    } else if (act === "open-step") {
      const index = Number(node.dataset.index);
      if (!stepUnlocked(index)) return;
      startActivity(steps[index].id, 0);
    } else if (act === "reset") {
      if (window.confirm("Стереть звёзды и начать путь сначала?")) {
        localStorage.removeItem(KEY);
        render();
      }
    } else if (act === "next-done") {
      const index = steps.indexOf(stepById(state.stepId));
      if (index < steps.length - 1 && stepUnlocked(index + 1)) startActivity(steps[index + 1].id, 0);
      else {
        state.screen = "home";
        render();
      }
    } else if (act === "finish") {
      finishActivity();
    } else if (act === "hear-current") {
      hearCurrent();
    } else if (act === "teach-next") {
      const activity = currentActivity();
      if (session.i < activity.letters.length - 1) {
        session.i += 1;
        session.heard = false;
        render();
      } else finishActivity();
    } else if (act === "pick") {
      pick(node.dataset.value);
    } else if (act === "blend") {
      runBlend(words[currentActivity().words[session.i]]);
    } else if (act === "whole-word") {
      const activity = currentActivity();
      const id = activity.type === "tricky" ? activity.words[session.i] : activity.words[session.i];
      runWord(id);
    } else if (act === "meet-next") {
      const activity = currentActivity();
      const list = activity.words;
      if (session.i < list.length - 1) {
        session.i += 1;
        session.blended = false;
        session.heard = false;
        session.lit = -1;
        render();
      } else finishActivity();
    } else if (act === "phrase-slow" || act === "phrase-full" || act === "book-play") {
      const id = sentenceIdFromCurrent();
      runPhrase(sentences[id], act !== "phrase-full");
    } else if (act === "book-next") {
      const activity = currentActivity();
      if (session.page < activity.pages.length - 1) {
        session.page += 1;
        session.highlight = -1;
        render();
      } else {
        session.phase = "ask";
        session.q = 0;
        session.mark = null;
        session.locked = false;
        render();
      }
    } else if (act === "hint-word") {
      hintWord();
    }
  }

  function hearCurrent() {
    const activity = currentActivity();
    if (!activity) return;
    if (activity.type === "teach-letters") {
      const id = activity.letters[session.i];
      play(phonemeSrc(id)).then(function (ok) {
        session.heard = true;
        session.audioError = !ok;
        render();
      });
    } else if (activity.type === "quiz-letters") {
      play(phonemeSrc(session.rounds[session.i].answer));
    } else if (activity.type === "tricky") {
      runWord(activity.words[session.i]);
    } else if (activity.type === "traps") {
      const answer = activity.items[session.i].answer;
      if (answer.length === 1) play(phonemeSrc(answer));
    }
  }

  function hintWord() {
    const activity = currentActivity();
    session.tried = true;
    if (activity.type === "quiz-words") {
      const id = session.rounds[session.i].answer;
      const word = words[id];
      const my = ++playGen;
      session.playing = true;
      render();
      (async function () {
        if (!word.tricky) {
          for (let i = 0; i < word.letters.length; i += 1) {
            if (playGen !== my) return;
            await play(phonemeSrc(word.letters[i]));
            await wait(140);
          }
        }
        if (playGen !== my) return;
        await play(wordSrc(id));
        session.playing = false;
        render();
      })();
    } else if (activity.type === "pairs") {
      play(wordSrc(session.items[session.i].answer));
      session.tried = true;
    }
  }

  function pick(value) {
    if (session.locked || session.playing) return;
    const activity = currentActivity();
    session.mark = value;
    if (activity.type === "quiz-letters" || activity.type === "quiz-words") {
      const round = session.rounds[session.i];
      if (value === round.answer) onCorrect(activity.type === "quiz-letters" ? "rounds" : "rounds");
      else {
        session.tried = true;
        session.status = "bad";
        render();
        if (activity.type === "quiz-letters") play(phonemeSrc(round.answer));
      }
      return;
    }
    if (activity.type === "pairs") {
      if (value === session.items[session.i].answer) onCorrect("items");
      else {
        session.tried = true;
        session.status = "bad";
        render();
      }
      return;
    }
    if (activity.type === "traps") {
      if (value === activity.items[session.i].answer) onCorrect("items-fixed");
      else {
        session.tried = true;
        session.status = "bad";
        render();
      }
      return;
    }
    if (activity.type === "phrases" || (activity.type === "book" && session.phase === "ask")) {
      const ok = nodeOk(value);
      if (ok) {
        if (!session.tried) session.first += 1;
        session.locked = true;
        session.status = "ok";
        render();
        const id = sentenceIdFromCurrent();
        play(sentenceSrc(id)).then(function () {
          setTimeout(nextPhraseOrQuestion, 400);
        });
      } else {
        session.tried = true;
        session.status = "bad";
        render();
      }
    }
  }

  function nodeOk(value) {
    const activity = currentActivity();
    const sentence = sentences[sentenceIdFromCurrent()];
    const index = Number(value);
    return Boolean(sentence.options[index] && sentence.options[index].ok);
  }

  function nextPhraseOrQuestion() {
    const activity = currentActivity();
    session.mark = null;
    session.locked = false;
    session.tried = false;
    session.status = "";
    if (activity.type === "phrases") {
      session.i += 1;
      if (session.i >= activity.ids.length) finishActivity();
      else render();
      return;
    }
    session.q += 1;
    if (session.q >= activity.questions.length) finishActivity();
    else render();
  }

  /* traps use activity.items, not session.items. Advance specially. */
  const originalAdvance = advanceRound;
  function advanceRoundFixed(listName) {
    if (listName === "items-fixed") {
      const activity = currentActivity();
      session.i += 1;
      session.mark = null;
      session.locked = false;
      session.tried = false;
      session.status = "";
      if (session.i >= activity.items.length) finishActivity();
      else render();
      return;
    }
    originalAdvance(listName);
  }

  function onChange(event) {
    if (event.target.dataset.act !== "toggle-unlock") return;
    const data = load();
    data.unlockAll = event.target.checked;
    save(data);
    render();
  }

  function render() {
    if (state.screen === "home") app.innerHTML = homeHTML();
    else if (state.screen === "guide") app.innerHTML = guideHTML();
    else if (state.screen === "done") app.innerHTML = doneHTML();
    else app.innerHTML = activityHTML();
  }

  function homeHTML() {
    const target = continueTarget();
    const finished = steps.filter(stepComplete).length;
    let part = "";
    const path = steps.map(function (step, index) {
      const unlocked = stepUnlocked(index);
      const complete = stepComplete(step);
      const current = target && target.step.id === step.id;
      const done = doneSet(step.id);
      let head = "";
      if (step.part !== part) {
        part = step.part;
        head = '<div class="part">' + esc(part) + "</div>";
      }
      const dots = step.activities.map(function (_, n) {
        return '<i class="' + (done.has(n) ? "on" : "") + '"></i>';
      }).join("");
      return head +
        '<button type="button" class="step' + (complete ? " done" : "") + (current ? " current" : "") +
        (unlocked ? "" : " locked") + '" data-act="open-step" data-index="' + index + '"' +
        (unlocked ? "" : " disabled") + ">" +
        '<span class="num">' + (complete ? "★" : index + 1) + "</span>" +
        "<span><b>" + esc(step.title) + "</b><small>" + esc(step.blurb) + " · " + step.minutes + " мин</small></span>" +
        '<span class="dots">' + dots + "</span></button>";
    }).join("");
    const label = !target
      ? "Пройти сначала"
      : (finished === 0 && target.index === 0 && target.stepIndex === 0
        ? "Начать с самых первых звуков"
        : "Продолжить · " + target.step.title);
    return '<header class="top"><div class="brand"><div class="mark">a</div><div><h1>Кира читает</h1>' +
      '<p class="lede">Сначала звук, потом слово</p></div></div>' +
      '<button type="button" class="ghost" data-act="guide">Для взрослых</button></header>' +
      '<section class="hero"><p>Один шаг — одно занятие. Если устала, останавливаемся.</p>' +
      '<div class="row"><button type="button" class="solid" data-act="continue">' + esc(label) + "</button></div>" +
      '<div class="progress-line"><span style="width:' + Math.round(finished / steps.length * 100) + '%"></span></div>' +
      '<p class="muted">Готово шагов: ' + finished + " из " + steps.length + "</p></section>" +
      '<div class="path">' + path + "</div>";
  }

  function activityHTML() {
    const step = stepById(state.stepId);
    const activity = currentActivity();
    const index = steps.indexOf(step);
    return '<header class="activity-head"><div><p class="kicker">Шаг ' + (index + 1) + " из " + steps.length +
      " · " + (state.activityIndex + 1) + "/" + step.activities.length + "</p><h2>" + esc(step.title) +
      "</h2></div><button type=\"button\" class=\"ghost\" data-act=\"home\">Закрыть</button></header>" +
      bodyHTML(activity) + errorHTML();
  }

  function errorHTML() {
    return session.audioError
      ? '<p class="error">Звук не включился. Нажми кнопку ещё раз.</p>'
      : "";
  }

  function bodyHTML(activity) {
    if (activity.type === "intro") return introHTML();
    if (activity.type === "teach-letters") return teachHTML(activity);
    if (activity.type === "quiz-letters") return quizLettersHTML();
    if (activity.type === "meet-words") return meetHTML(activity);
    if (activity.type === "tricky") return trickyHTML(activity);
    if (activity.type === "quiz-words") return quizWordsHTML();
    if (activity.type === "pairs") return pairsHTML();
    if (activity.type === "phrases") return phraseHTML(activity);
    if (activity.type === "book") return bookHTML(activity);
    if (activity.type === "traps") return trapsHTML(activity);
    return "";
  }

  function introHTML() {
    return '<section class="panel"><p class="kicker">Перед буквами</p>' +
      "<p class=\"hint\">Английские буквы другие. Некоторые похожи на русские, но звучат иначе.</p>" +
      "<p class=\"hint\">Мы не учим названия «эй, би, си». Сразу учим звук, из которого получается слово.</p>" +
      "<p class=\"hint\">Звук говорим коротко. Потом складываем: с-а-т, и только потом всё слово.</p>" +
      '<div class="row"><button type="button" class="solid" data-act="finish">К первым звукам</button></div></section>';
  }

  function teachHTML(activity) {
    const id = activity.letters[session.i];
    const letter = letters[id];
    const upper = id.toUpperCase();
    return '<section class="letter-card center"><p class="kicker">Звук ' + (session.i + 1) + " из " +
      activity.letters.length + "</p>" +
      '<div class="forms"><span class="big-letter">' + esc(id) + "</span>" +
      (upper !== id ? '<span class="big-letter minor">' + esc(upper) + "</span>" : "") + "</div>" +
      speaker() +
      '<p class="hint">' + esc(letter.hint) + "</p>" +
      (letter.trap ? '<div class="trap">' + esc(letter.trap) + "</div>" : "") +
      '<div class="row" style="justify-content:center"><button type="button" class="solid" data-act="teach-next"' +
      (session.heard ? "" : " disabled") + ">Дальше</button></div>" +
      (session.heard ? "" : '<p class="muted">Сначала послушай звук.</p>') +
      "</section>";
  }

  function quizLettersHTML() {
    const round = session.rounds[session.i];
    const choices = round.options.map(function (option) {
      const cls = session.mark === option ? (option === round.answer ? "ok" : "bad") : "";
      return '<button type="button" class="choice ' + cls + '" data-act="pick" data-value="' + esc(option) + '">' +
        esc(option) + "</button>";
    }).join("");
    return '<section class="panel center"><p class="kicker">Какая это буква?</p>' +
      speaker() +
      '<p class="hint">Послушай и нажми букву.</p>' +
      '<div class="choices">' + choices + "</div>" +
      feedbackHTML() + "</section>";
  }

  function meetHTML(activity) {
    const id = activity.words[session.i];
    const word = words[id];
    const tiles = word.letters.map(function (ch, index) {
      const cls = (index === word.vowelAt ? "vowel" : "") + (session.lit === index ? " on" : "");
      return '<button type="button" class="tile ' + cls + '" data-act="play-letter" data-letter="' +
        esc(ch.toLowerCase()) + '">' + esc(ch) + "</button>";
    }).join("");
    const meaning = session.heard
      ? '<div class="meaning">' + (word.emoji ? picHTML(word.emoji) : "") +
        "<strong>" + esc(word.ru) + "</strong>" +
        (word.note ? '<p class="note">' + esc(word.note) + "</p>" : "") + "</div>"
      : "";
    return '<section class="panel center"><p class="kicker">Слово ' + (session.i + 1) + " из " +
      activity.words.length + "</p>" +
      (activity.legend ? '<p class="legend"><b>Красная</b> буква — гласная, сердце слова.</p>' : "") +
      '<p class="hint">Сначала скажи слово сама. Потом проверь по звукам.</p>' +
      '<div class="tiles">' + tiles + "</div>" +
      '<div class="row" style="justify-content:center">' +
      '<button type="button" class="soft" data-act="blend"' + (session.playing ? " disabled" : "") + ">По звукам</button>" +
      '<button type="button" class="solid" data-act="whole-word"' +
      (session.blended && !session.playing ? "" : " disabled") + ">Слитно</button></div>" +
      meaning +
      (session.heard
        ? '<div class="row" style="justify-content:center"><button type="button" class="solid" data-act="meet-next">Дальше</button></div>'
        : "") +
      "</section>";
  }

  function trickyHTML(activity) {
    const id = activity.words[session.i];
    const word = words[id];
    const forms = (word.forms || [word.text]).map(function (form) {
      return '<span class="big-letter' + (form === word.text ? "" : " minor") + '">' + esc(form) + "</span>";
    }).join("");
    return '<section class="letter-card center"><p class="kicker">Запоминаем целиком · ' +
      (session.i + 1) + " из " + activity.words.length + "</p>" +
      '<div class="forms">' + forms + "</div>" +
      speaker() +
      '<p class="hint">' + esc(word.note) + "</p>" +
      '<div class="meaning"><strong>' + esc(word.ru) + "</strong></div>" +
      '<div class="row" style="justify-content:center"><button type="button" class="solid" data-act="meet-next"' +
      (session.heard ? "" : " disabled") + ">Дальше</button></div></section>";
  }

  function quizWordsHTML() {
    const round = session.rounds[session.i];
    const choices = round.options.map(function (id) {
      const cls = session.mark === id ? (id === round.answer ? "ok" : "bad") : "";
      return '<button type="button" class="choice ' + cls + '" data-act="pick" data-value="' + esc(id) + '">' +
        picHTML(words[id].emoji) + "</button>";
    }).join("");
    const revealed = session.status === "ok" || (session.mark && session.mark === round.answer);
    return '<section class="panel center"><p class="kicker">Прочитай и выбери картинку</p>' +
      '<div class="tiles">' + tilesStatic(round.answer) + "</div>" +
      '<div class="choices">' + choices + "</div>" +
      feedbackHTML() +
      (revealed ? "" : '<button type="button" class="ghost" data-act="hint-word">Подсказка по звукам</button>') +
      "</section>";
  }

  function tilesStatic(id) {
    const word = words[id];
    return word.letters.map(function (ch, index) {
      const cls = index === word.vowelAt ? "vowel" : "";
      return '<span class="tile ' + cls + '">' + esc(ch) + "</span>";
    }).join("");
  }

  function pairsHTML() {
    const item = session.items[session.i];
    const choices = item.options.map(function (id) {
      const cls = session.mark === id ? (id === item.answer ? "ok" : "bad") : "";
      return '<button type="button" class="choice word ' + cls + '" data-act="pick" data-value="' + esc(id) + '">' +
        wordHTML(id, words[id].text) + "</button>";
    }).join("");
    return '<section class="panel center"><p class="kicker">Какое это слово?</p>' +
      picHTML(item.emoji) +
      "<p class=\"hint\">" + esc(item.ru) + "</p>" +
      '<div class="choices two">' + choices + "</div>" +
      feedbackHTML() +
      '<button type="button" class="ghost" data-act="hint-word">Послушать слово</button></section>';
  }

  function phraseHTML(activity) {
    const id = activity.ids[session.i];
    return '<section class="panel center"><p class="kicker">Фраза ' + (session.i + 1) + " из " +
      activity.ids.length + "</p>" +
      '<p class="hint">Сначала прочитайте вслух. Потом можно включить звук.</p>' +
      sentenceBlock(id) +
      '<div class="row" style="justify-content:center">' +
      '<button type="button" class="soft" data-act="phrase-slow">По звукам</button>' +
      '<button type="button" class="ghost" data-act="phrase-full">Целиком</button></div>' +
      questionHTML(sentences[id]) + "</section>";
  }

  function sentenceBlock(id) {
    const sentence = sentences[id];
    const tokens = sentence.tokens.map(function (token, index) {
      const on = session.highlight === index ? " on" : "";
      return '<button type="button" class="tok' + on + '" data-act="say" data-audio="' + esc(token.audio) + '">' +
        wordHTML(token.audio, token.show) + "</button>";
    }).join("");
    return '<div class="sentence" lang="en">' + tokens + "</div>";
  }

  function questionHTML(sentence) {
    const choices = sentence.options.map(function (option, index) {
      const cls = session.mark === String(index) ? (option.ok ? "ok" : "bad") : "";
      const inner = option.emoji ? picHTML(option.emoji) : esc(option.text || "");
      return '<button type="button" class="choice ' + cls + '" data-act="pick" data-value="' + index + '">' +
        inner + "</button>";
    }).join("");
    const width = sentence.options.length === 2 ? "two" : "";
    return '<p class="hint">' + esc(sentence.q) + "</p>" +
      '<div class="choices ' + width + '">' + choices + "</div>" +
      feedbackHTML() +
      (session.status === "ok" ? '<p class="muted">' + esc(sentence.ru) + "</p>" : "");
  }

  function bookHTML(activity) {
    if (session.phase === "ask") {
      const id = activity.questions[session.q];
      return '<section class="panel center"><p class="kicker">Вопрос по книжке</p>' +
        sentenceBlock(id) + questionHTML(sentences[id]) + "</section>";
    }
    const page = activity.pages[session.page];
    return '<section class="panel center"><p class="page-no">' + esc(activity.title) + " · " +
      (session.page + 1) + " / " + activity.pages.length + "</p>" +
      '<div class="scene">' + page.scene + "</div>" +
      sentenceBlock(page.sentence) +
      '<div class="row" style="justify-content:center">' +
      '<button type="button" class="soft" data-act="book-play">Послушать</button>' +
      '<button type="button" class="solid" data-act="book-next">' +
      (session.page === activity.pages.length - 1 ? "К вопросам" : "Дальше") +
      "</button></div></section>";
  }

  function trapsHTML(activity) {
    const item = activity.items[session.i];
    const choices = item.options.map(function (option) {
      const cls = session.mark === option ? (option === item.answer ? "ok" : "bad") : "";
      const letter = option.length === 1;
      return '<button type="button" class="choice ' + (letter ? "" : "text ") + cls +
        '" data-act="pick" data-value="' + esc(option) + '">' + esc(option) + "</button>";
    }).join("");
    const shown = item.show
      ? '<div class="big-letter">' + esc(item.show) + "</div>"
      : speaker();
    return '<section class="panel center"><p class="kicker">Ловушка ' + (session.i + 1) + " из " +
      activity.items.length + "</p>" + shown +
      '<p class="hint">' + esc(item.q) + "</p>" +
      '<div class="choices' + (item.options.length === 2 ? " two" : "") + '">' + choices + "</div>" +
      feedbackHTML() + "</section>";
  }

  function feedbackHTML() {
    if (session.status === "ok") return '<p class="feedback ok">Верно</p>';
    if (session.status === "bad") return '<p class="feedback bad">Посмотри ещё раз</p>';
    return '<p class="feedback"></p>';
  }

  function doneHTML() {
    const step = stepById(state.stepId);
    const title = "Шаг готов";
    const text = "Дальше не обязательно сегодня. Один шаг уже занятие.";
    const nextLabel = "Следующий шаг";
    const score = state.summary ? "<p>С первой попытки: " + esc(state.summary) + ".</p>" : "";
    return '<section class="done center"><p class="kicker">' + esc(step.title) + "</p><h2>" + title + "</h2>" +
      "<p class=\"hint\">" + text + "</p>" + score +
      '<div class="row" style="justify-content:center">' +
      '<button type="button" class="solid" data-act="next-done">' + nextLabel + "</button>" +
      '<button type="button" class="ghost" data-act="home">На сегодня хватит</button></div></section>';
  }

  function guideHTML() {
    const data = load();
    return '<header class="top"><div><h1>Для взрослых</h1><p class="lede">Как вести чтение</p></div>' +
      '<button type="button" class="ghost" data-act="home">К шагам</button></header>' +
      '<div class="guide">' +
      "<section><h2>Пять минут, не больше</h2><ol>" +
      "<li>Один шаг тренажёра. Пока он идёт с запинкой, следующий не открываем.</li>" +
      "<li>Кира нажимает буквы слева направо и говорит звуки сама.</li>" +
      "<li>Взрослый повторяет звук своим голосом: коротко, без «э» на конце. «С», не «сэ» и не «эс».</li>" +
      "<li>Кнопку «слитно» нажимаем после того, как она попробовала прочитать.</li>" +
      "<li>Ошибку не заменяем готовым словом. Снова по буквам.</li>" +
      "<li>Устала — «на сегодня хватит». На середине шага прогресс уже сохранён.</li>" +
      "</ol><p>Голос в тренажёре роботный нарочно: один и тот же звук каждый раз. Живой голос рядом важнее. У b, d и g у робота почти нет звука без короткого голоса следом, поэтому они чуть длиннее остальных согласных.</p></section>" +
      "<section><h2>Почему с самого начала</h2>" +
      "<p>По-русски Кира читать умеет. Английское чтение — другие буквы и другие звуки. Названия из песенки ABC («эй, би, си») на старте мешают: по ним слово не собирается.</p>" +
      "<p>Похожие буквы — отдельные ловушки: B это «б», не «в». P это «п», не «р». H это выдох, не «н». C в этих словах «к», не «с».</p>" +
      "<p>Этот путь — только короткие гласные и слова из трёх звуков. Буквосочетания sh, ch, th и длинные гласные начнём, когда эти шаги читаются без подсказки.</p></section>" +
      "<section><h2>Онлайн-уроки</h2>" +
      "<p>Каждый день одно и то же: наш следующий шаг, потом одна игра. Чужие уроки не заменяют складывание звуков.</p>" +
      '<a class="link-card" href="https://www.teachyourmonster.org/teach-your-monster-to-read/" target="_blank" rel="noopener">' +
      "<b>1. Teach Your Monster to Read — главный урок</b>" +
      "<span>Бесплатно на компьютере. Учётка взрослого. Начать со Stage 1, First Steps: звуки, слияние, первые слова. 10 минут. Произношение британское, для старта нормально.</span></a>" +
      '<a class="link-card" href="https://www.starfall.com/h/ltr-classic/" target="_blank" rel="noopener">' +
      "<b>2. Starfall, Learn to Read — когда захочется историю</b>" +
      "<span>Бесплатно, без учётки. Книга 1, Zac the Rat, и дальше по номерам. Есть звук. Часть слов впереди наших шагов, поэтому сидеть рядом. Не вместо игры с монстром.</span></a>" +
      '<a class="link-card" href="https://www.starfall.com/h/abcs/" target="_blank" rel="noopener">' +
      "<b>Если путаются сами фигуры букв</b>" +
      "<span>Алфавит Starfall. Только чтобы узнать форму, не чтобы учить названия наизусть.</span></a>" +
      '<a class="link-card" href="https://abc.duolingo.com/" target="_blank" rel="noopener">' +
      "<b>3. Duolingo ABC — по желанию, с телефона</b>" +
      "<span>Бесплатно, без рекламы, уроки по пять минут. Интерфейс на английском, на первых порах нужен взрослый рядом.</span></a>" +
      '<a class="link-card" href="https://learnenglishkids.britishcouncil.org/" target="_blank" rel="noopener">' +
      "<b>Позже: British Council, LearnEnglish Kids</b>" +
      "<span>Песни и короткие истории на слух. Это уже не первый учебник чтения.</span></a></section>" +
      "<section><h2>На этой неделе</h2><ul>" +
      "<li>День 1: наш шаг «s a t p» и регистрация в Teach Your Monster, самое начало Stage 1.</li>" +
      "<li>Дальше каждый день: следующий наш шаг и 10 минут того же Stage 1, пока игра сама не откроет Stage 2.</li>" +
      "<li>Starfall, Zac the Rat — в любой день, когда она просит книжку. Одну книгу, со звуком.</li>" +
      "</ul><p>Если в игре встретится звук, которого у нас ещё не было, пусть играет. Наш путь всё равно держит самый простой порядок.</p></section>" +
      "<section><h2>На этом компьютере</h2>" +
      "<p>Открывай файл index.html в браузере. Прогресс хранится здесь, в этом браузере.</p>" +
      '<label class="check"><input type="checkbox" data-act="toggle-unlock"' +
      (data.unlockAll ? " checked" : "") + "> Открыть все шаги сразу</label>" +
      '<button type="button" class="ghost" data-act="reset">Стереть прогресс</button>' +
      '<p class="muted">Шрифт Andika, SIL Open Font License. Звуки собраны голосом eSpeak.</p></section></div>';
  }

  /* Letter tiles inside a word should speak too. Delegated above only handles
     data-act values we know; play-letter is handled here so the meet screen
     stays interactive while the main click switch stays small. */
  document.addEventListener("click", function (event) {
    const node = event.target.closest("[data-act='play-letter']");
    if (!node || session.playing) return;
    play(phonemeSrc(node.dataset.letter));
  });
  document.addEventListener("click", function (event) {
    const node = event.target.closest("[data-act='say']");
    if (!node || session.playing) return;
    play(wordSrc(node.dataset.audio));
  });

  /* The traps path called a placeholder name. Wire the real advance. */
  function onCorrect(listName) {
    if (!session.tried) session.first += 1;
    session.locked = true;
    session.status = "ok";
    render();
    const activity = currentActivity();
    let src = null;
    if (activity.type === "quiz-letters") src = phonemeSrc(session.rounds[session.i].answer);
    if (activity.type === "quiz-words") src = wordSrc(session.rounds[session.i].answer);
    if (activity.type === "pairs") src = wordSrc(session.items[session.i].answer);
    if (activity.type === "traps" && activity.items[session.i].answer.length === 1) {
      src = phonemeSrc(activity.items[session.i].answer);
    }
    const after = function () {
      if (activity.type === "traps") advanceRoundFixed("items-fixed");
      else advanceRound(listName);
    };
    if (!src) setTimeout(after, 450);
    else play(src).then(function () { setTimeout(after, 350); });
  }

  render();
})();
