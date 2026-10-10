
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';

import {
  initializeFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
/* =========================
   1. Firebase configuration
========================= */

const firebaseConfig = {
  apiKey: 'AIzaSyCKfFnoYNCIS1f4hmf5V5xjQeWWFjaX3QY',
  authDomain: 'lovesecrets-15dc9.firebaseapp.com',
  projectId: 'lovesecrets-15dc9',
  appId: '1:218616651690:web:0df39a63a60161d5f855d3'
};

let db = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

/* =========================
   2. Question bank
========================= */

const questions = [
  ['شو أكتر شي بيحسّن مزاجي بسرعة؟', 'الشخصية'],
  ['شو التصرف اللي بيجرحني؟', 'المشاعر'],
  ['شو أهم شي عندي بالعلاقة؟', 'الثقة'],
  ['لما أكون زعلان، بفضّل أحكي ولا آخد وقت لحالي؟', 'التواصل'],
  ['شو حلم نفسي أحققه؟', 'المستقبل'],
  ['شو الشي اللي ما بقبل فيه بعلاقة؟', 'الحدود'],
  ['شو أكثر شي بخلّيني أحس بالأمان؟', 'الثقة'],
  ['شو نوع المفاجآت اللي بحبها؟', 'ذكرياتنا'],
  ['كيف بفضّل نحل الخلاف؟', 'التواصل'],
  ['شو الشي اللي بتمنى الناس يفهموه عني؟', 'الشخصية'],
  ['شو ذكرى بتخلّيني أبتسم؟', 'ذكرياتنا'],
  ['شو الشي اللي بخاف أخسره؟', 'المشاعر'],
  ['شو معنى الاعتذار الصادق بالنسبة إلي؟', 'التواصل'],
  ['شو التصرف اللي بخليني أفقد الثقة؟', 'الثقة'],
  ['شو حدودي الشخصية اللي لازم تنحترم؟', 'الحدود'],
  ['شو الشي اللي بخليني أحس إني مهم؟', 'المشاعر'],
  ['شو عادة نفسي أغيّرها؟', 'الشخصية'],
  ['شو موضوع بحب نحكي عنه أكثر؟', 'التواصل'],
  ['شو المكان اللي بحب أروحه؟', 'ذكرياتنا'],
  ['لما أحتاج دعم، كيف توقف جنبي؟', 'التواصل'],
  ['شو الشي اللي بخليني أحتاج مساحة؟', 'الحدود'],
  ['شو أكثر صفة بحبها بحالي؟', 'الشخصية'],
  ['شو بعتبره خيانة للثقة؟', 'الثقة'],
  ['شو خطوة صغيرة بتفرّحني؟', 'المشاعر']
];

/* =========================
   3. Application state
========================= */

const $ = id => document.getElementById(id);

let selected = [];
let custom = [];
let quiz = null;
let index = 0;
let answers = [];
let result = null;
let busy = false;

/* =========================
   4. Helpers
========================= */

function view(id) {
  ['home', 'builder', 'quiz', 'share', 'result'].forEach(name => {
    const element = $(name);
    if (element) element.hidden = name !== id;
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function msg(id, message) {
  const element = $(id);
  if (!element) return;

  element.textContent = message;
  element.hidden = false;
}

function hideMsg(id) {
  const element = $(id);
  if (element) element.hidden = true;
}

function norm(value) {
  return String(value || '')
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/[.,!?؟،؛:]+/g, '')
    .replace(/\s+/g, ' ');
}

function code() {
  return String(
    Math.floor(100000 + Math.random() * 900000)
  );
}

function setBusy(buttonId, state, text = '') {
  const button = $(buttonId);
  if (!button) return;

  button.disabled = state;

  if (text) {
    button.textContent = state
      ? 'يرجى الانتظار...'
      : text;
  }
}

function safeText(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function shuffleQuestions(items) {
  return items.map(item => ({ ...item }));
}

/* =========================
   5. Render question bank
========================= */

function renderBank() {
  const host = $('bank');
  if (!host) return;

  host.replaceChildren();

  questions.forEach((question, i) => {
    const label = document.createElement('label');
    label.className = 'opt';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selected.includes(i);

    checkbox.addEventListener('change', () => {
      if (
        checkbox.checked &&
        selected.length + custom.length >= 20
      ) {
        checkbox.checked = false;
        msg('builderStatus', 'الحد الأقصى هو 20 سؤالًا.');
        return;
      }

      hideMsg('builderStatus');

      if (checkbox.checked) {
        if (!selected.includes(i)) selected.push(i);
      } else {
        selected = selected.filter(n => n !== i);
      }
    });

    const text = document.createElement('span');
    text.append(document.createTextNode(question[0]));

    const small = document.createElement('small');
    small.textContent = question[1];

    text.append(small);
    label.append(checkbox, text);
    host.append(label);
  });

  custom.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'opt';

    const text = document.createElement('span');
    text.textContent = '✓ ' + item.q;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'حذف';
    remove.setAttribute('aria-label', 'حذف السؤال المخصص');

    remove.addEventListener('click', () => {
      custom.splice(i, 1);
      renderBank();
    });

    div.append(text, remove);
    host.append(div);
  });
}

/* =========================
   6. Start quiz creation
========================= */

if ($('create')) {
  $('create').onclick = () => {
    selected = [];
    custom = [];

    if ($('creator')) $('creator').value = '';
    if ($('customQ')) $('customQ').value = '';
    if ($('customA')) $('customA').value = '';

    renderBank();
    hideMsg('builderStatus');
    view('builder');
  };
}

/* =========================
   7. Add custom question
========================= */

if ($('addCustom')) {
  $('addCustom').onclick = () => {
    const q = safeText($('customQ')?.value, 250);
    const a = safeText($('customA')?.value, 250);

    if (!q || !a) {
      msg('builderStatus', 'اكتب السؤال والإجابة الصحيحة.');
      return;
    }

    if (selected.length + custom.length >= 20) {
      msg('builderStatus', 'وصلت إلى الحد الأقصى: 20 سؤالًا.');
      return;
    }

    custom.push({ q, a });

    if ($('customQ')) $('customQ').value = '';
    if ($('customA')) $('customA').value = '';

    hideMsg('builderStatus');
    renderBank();
  };
}

/* =========================
   8. Publish quiz
========================= */

if ($('publish')) {
  $('publish').onclick = async () => {
    if (busy) return;

    const total = selected.length + custom.length;

    if (total < 5) {
      msg('builderStatus', 'اختر 5 أسئلة على الأقل.');
      return;
    }

    if (!db) {
      msg(
        'builderStatus',
        'تعذر الاتصال بـ Firebase. تحقق من إعداداته.'
      );
      return;
    }

    busy = true;
    setBusy('publish', true, 'إنشاء الاختبار');
    hideMsg('builderStatus');

    const qs = [
      ...selected.map(i => ({
        q: questions[i][0],
        a: ''
      })),
      ...custom.map(item => ({
        q: item.q,
        a: item.a
      }))
    ];

    try {
      let quizCode = null;
      let ref = null;

      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = code();
        const candidateRef = doc(db, 'quizzes', candidate);
        const snapshot = await getDoc(candidateRef);

        if (!snapshot.exists()) {
          quizCode = candidate;
          ref = candidateRef;
          break;
        }
      }

      if (!ref || !quizCode) {
        throw new Error('تعذر إنشاء رمز فريد. حاول مرة أخرى.');
      }

      await setDoc(ref, {
        creator: safeText($('creator')?.value, 32),
        questions: qs,
        createdAt: serverTimestamp()
      });

      if ($('code')) $('code').textContent = quizCode;

      const shareURL = new URL(window.location.href);
      shareURL.searchParams.set('code', quizCode);

      if ($('shareUrl')) {
        $('shareUrl').value = shareURL.href;
      }

      hideMsg('shareStatus');
      view('share');
    } catch (error) {
      console.error('Publish quiz error:', error);

      msg(
        'builderStatus',
        'تعذر إنشاء الاختبار. تحقق من اتصال الإنترنت وقواعد Firestore. ' +
        (error.code || error.message || '')
      );
    } finally {
      busy = false;
      setBusy('publish', false, 'إنشاء الاختبار');
    }
  };
}

/* =========================
   9. Open an existing quiz
========================= */

async function join(inputCode) {
  const quizCode = String(inputCode || '').trim();

  if (!/^\d{6}$/.test(quizCode)) {
    alert('أدخل رمزًا صحيحًا مكوّنًا من 6 أرقام.');
    return;
  }

  if (!db) {
    alert('تعذر الاتصال بـ Firebase. تحقق من الإعدادات.');
    return;
  }

  try {
    const snapshot = await getDoc(
      doc(db, 'quizzes', quizCode)
    );

    if (!snapshot.exists()) {
      alert('لم نعثر على اختبار بهذا الرمز.');
      return;
    }

    const data = snapshot.data();

    if (
      !Array.isArray(data.questions) ||
      data.questions.length < 1 ||
      data.questions.length > 20
    ) {
      alert('بيانات الاختبار غير صالحة.');
      return;
    }

    const validQuestions = data.questions.every(item =>
      item &&
      typeof item.q === 'string' &&
      typeof item.a === 'string'
    );

    if (!validQuestions) {
      alert('تعذر قراءة أسئلة الاختبار.');
      return;
    }

    quiz = {
      code: quizCode,
      creator: safeText(data.creator, 32),
      questions: shuffleQuestions(data.questions)
    };

    index = 0;
    answers = Array(quiz.questions.length).fill('');
    result = null;

    drawQ();
    view('quiz');
  } catch (error) {
    console.error('Join quiz error:', error);
    alert('تعذر فتح الاختبار. تحقق من اتصالك وقواعد Firestore.');
  }
}

if ($('joinForm')) {
  $('joinForm').onsubmit = event => {
    event.preventDefault();
    join($('joinCode')?.value);
  };
}

/* =========================
   10. Display current question
========================= */

function drawQ() {
  if (!quiz || !quiz.questions[index]) return;

  if ($('progress')) {
    $('progress').textContent =
      `السؤال ${index + 1} من ${quiz.questions.length}`;
  }

  if ($('question')) {
    $('question').textContent = quiz.questions[index].q;
  }

  if ($('answer')) {
    $('answer').value = answers[index] || '';
    $('answer').focus();
  }

  if ($('next')) {
    $('next').textContent =
      index === quiz.questions.length - 1
        ? 'عرض النتيجة ♥'
        : 'التالي ←';
  }

  if ($('skip')) {
    $('skip').textContent = 'تخطي السؤال';
  }
}

/* =========================
   11. Calculate and display result
========================= */

function finish() {
  if (!quiz) return;

  const items = quiz.questions.map((question, i) => {
    const answer = answers[i] || '';
    const expected = question.a || '';

    return {
      q: question.q,
      a: answer || 'تم تخطي السؤال',
      expected,
      correct: Boolean(expected) &&
        norm(expected) === norm(answer),
      answered: Boolean(answer)
    };
  });

  const gradedItems = items.filter(item => item.expected);
  const correctCount = gradedItems.filter(item => item.correct).length;
  const answeredCount = items.filter(item => item.answered).length;

  result = {
    score: correctCount,
    total: items.length,
    gradedTotal: gradedItems.length,
    answeredCount,
    items
  };

  if ($('resultTitle')) {
    $('resultTitle').textContent = quiz.creator
      ? 'نتيجتك مع ' + quiz.creator
      : 'خلصت الاختبار!';
  }

  if ($('score')) {
    if (gradedItems.length > 0) {
      $('score').textContent =
        `${correctCount} / ${gradedItems.length} إجابة صحيحة`;
    } else {
      $('score').textContent =
        `أجبت عن ${answeredCount} من ${items.length} سؤالًا`;
    }
  }

  const review = $('review');

  if (review) {
    review.replaceChildren();

    items.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'review';

      const heading = document.createElement('b');
      heading.textContent = `${i + 1}. ${item.q}`;

      const answer = document.createElement('p');
      answer.textContent = 'إجابتك: ' + item.a;

      div.append(heading, answer);

      if (item.expected) {
        const expected = document.createElement('p');
        expected.textContent =
          'الإجابة المحددة: ' + item.expected;

        const status = document.createElement('p');
        status.textContent = item.correct
          ? '✓ إجابة صحيحة'
          : '✗ إجابة غير مطابقة';

        div.append(expected, status);
      } else {
        const note = document.createElement('p');
        note.textContent =
          'سؤال شخصي مفتوح؛ لا توجد إجابة نموذجية محددة.';
        div.append(note);
      }

      review.append(div);
    });
  }

  view('result');
}

/* =========================
   12. Next and skip
========================= */

if ($('next')) {
  $('next').onclick = () => {
    if (!quiz) return;

    answers[index] = safeText($('answer')?.value, 500);

    if (index < quiz.questions.length - 1) {
      index++;
      drawQ();
    } else {
      finish();
    }
  };
}

if ($('skip')) {
  $('skip').onclick = () => {
    if (!quiz) return;

    answers[index] = '';

    if (index < quiz.questions.length - 1) {
      index++;
      drawQ();
    } else {
      finish();
    }
  };
}

/* =========================
   13. Copy link and code
========================= */

async function copy(text, statusId, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    msg(statusId, successMessage);
  } catch (error) {
    console.error('Clipboard error:', error);
    msg(statusId, 'تعذر النسخ تلقائيًا؛ انسخ النص يدويًا.');
  }
}

if ($('copyLink')) {
  $('copyLink').onclick = () =>
    copy(
      $('shareUrl')?.value || '',
      'shareStatus',
      'تم نسخ رابط الاختبار!'
    );
}

if ($('copyCode')) {
  $('copyCode').onclick = () =>
    copy(
      $('code')?.textContent || '',
      'shareStatus',
      'تم نسخ رمز الاختبار!'
    );
}

/* =========================
   14. Share result
========================= */

if ($('shareResult')) {
  $('shareResult').onclick = async () => {
    if (!result) return;

    const text = result.gradedTotal > 0
      ? `نتيجتي في LOVESECRETS: ${result.score}/${result.gradedTotal} ♥`
      : `أجبت عن ${result.answeredCount} من ${result.total} سؤالًا في LOVESECRETS ♥`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LOVESECRETS',
          text
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share error:', error);
          alert(text);
        }
      }
    } else {
      alert(text);
    }
  };
}

/* =========================
   15. Return to home
========================= */

document.querySelectorAll('[data-home]').forEach(button => {
  button.onclick = () => {
    history.replaceState({}, '', location.pathname);
    quiz = null;
    result = null;
    view('home');
  };
});

/* =========================
   16. Initialize the app
========================= */

renderBank();

const initialCode =
  new URLSearchParams(window.location.search).get('code');

if (initialCode) {
  if ($('joinCode')) $('joinCode').value = initialCode;
  join(initialCode);
} else {
  view('home');
}
