// Renders index / privacy / terms / support for the app named in ?app=<slug>, using apps.json.
// Language: ?lang=en|ru, otherwise the browser language.

const params = new URLSearchParams(location.search);
const slug = params.get("app");
const lang = ["en", "ru"].includes(params.get("lang"))
  ? params.get("lang")
  : (navigator.language || "en").toLowerCase().startsWith("ru") ? "ru" : "en";
const page = document.body.dataset.page;
const root = document.getElementById("root");

const UI = {
  en: {
    privacy: "Privacy Policy", terms: "Terms of Use", support: "Support", legal: "Legal & support",
    updated: "Last updated: ", notFound: "App not found", allApps: "All apps", choose: "Choose an app",
  },
  ru: {
    privacy: "Политика конфиденциальности", terms: "Условия использования", support: "Поддержка",
    legal: "Правовая информация и поддержка", updated: "Последнее обновление: ", notFound: "Приложение не найдено",
    allApps: "Все приложения", choose: "Выберите приложение",
  },
};
const t = UI[lang];

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) if (child) node.append(child);
  return node;
}

function href(file, options = {}) {
  const query = new URLSearchParams();
  const app = "app" in options ? options.app : slug;
  if (app) query.set("app", app);
  if (options.lang || params.get("lang")) query.set("lang", options.lang || lang);
  const text = query.toString();
  return `./${file}${text ? `?${text}` : ""}`;
}

function applyAccent(app) {
  const dark = matchMedia("(prefers-color-scheme: dark)").matches;
  const color = (dark && app.accentDark) || app.accent;
  if (!/^#[0-9a-f]{6}$/i.test(color || "")) return;
  const channels = [1, 3, 5].map((index) => parseInt(color.slice(index, index + 2), 16)).join(", ");
  document.documentElement.style.setProperty("--accent", color);
  document.documentElement.style.setProperty("--tint", `rgba(${channels}, .14)`);
}

function langSwitch() {
  const file = `${page}.html`;
  return el("div", { class: "bar" }, el("nav", { class: "lang", "aria-label": "Language" }, ["en", "ru"].map((code) =>
    el("a", { href: href(file, { lang: code }), "aria-current": String(code === lang), text: code.toUpperCase() }))));
}

function header(title, subtitle, mark) {
  return el("header", {}, [
    el("div", { class: "mark", "aria-hidden": "true", text: mark }),
    el("h1", { text: title }),
    subtitle ? el("p", { class: "sub", text: subtitle }) : null,
  ]);
}

function sections(list) {
  const card = el("div", { class: "card" });
  let number = 0;
  for (const section of list.filter(Boolean)) {
    if (section.h) card.append(el("h2", { text: `${++number}. ${section.h}` }));
    for (const text of section.p || []) card.append(el("p", { text }));
    if (section.ul?.length) card.append(el("ul", {}, section.ul.map((text) => el("li", { text }))));
    if (section.mail) card.append(el("p", {}, el("a", { href: `mailto:${section.mail}`, text: section.mail })));
  }
  return card;
}

function footer(app) {
  const others = ["privacy", "terms", "support"].filter((name) => name !== page);
  const links = [el("a", { href: href("index.html"), text: `← ${app.name}` })];
  for (const name of others) links.push(" · ", el("a", { href: href(`${name}.html`), text: t[name] }));
  return el("footer", {}, links);
}

function updatedLine(app) {
  const date = new Date(`${app.updated}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const text = date.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { year: "numeric", month: "long", day: "numeric" });
  return el("p", { class: "updated", text: t.updated + text });
}

const PERMISSIONS = {
  en: {
    camera: "Camera — to take photos or scan documents inside the app. Images stay in the app.",
    photos: "Photos — only the images you pick yourself; the app does not get access to your library.",
    files: "Files — only the documents you choose to import.",
    notifications: "Notifications — to deliver the reminders and alerts you turned on.",
    biometrics: "Face ID / Touch ID — to lock the app. Biometric data is handled by the system and never reaches the app.",
    location: "Location — used only for the features that need it and only while you use them.",
    microphone: "Microphone — only while you record or dictate inside the app.",
    contacts: "Contacts — only for the feature that needs them; they are not uploaded.",
    tracking: "Tracking (ATT) — asked only to measure advertising; you can decline.",
  },
  ru: {
    camera: "Камера — чтобы фотографировать или сканировать документы внутри приложения. Снимки остаются в приложении.",
    photos: "Фото — только те изображения, которые вы выбираете сами; доступа к медиатеке приложение не получает.",
    files: "Файлы — только документы, которые вы решили импортировать.",
    notifications: "Уведомления — чтобы показывать напоминания и оповещения, которые вы включили.",
    biometrics: "Face ID / Touch ID — для блокировки приложения. Биометрические данные обрабатывает система, приложению они недоступны.",
    location: "Геопозиция — только для функций, которым она нужна, и только во время их использования.",
    microphone: "Микрофон — только во время записи или диктовки в приложении.",
    contacts: "Контакты — только для функции, которой они нужны; на серверы они не загружаются.",
    tracking: "Отслеживание (ATT) — запрашивается только для измерения рекламы; можно отказаться.",
  },
};

function privacy(app, contact) {
  const data = app.data || {};
  const onDevice = data.storage !== "cloud";
  const notes = app.privacyNotes?.[lang] || [];
  const permissions = (data.permissions || []).map((key) => PERMISSIONS[lang][key]).filter(Boolean);
  const partners = (app.thirdParties || []).map((item) => `${item.name} — ${item.purpose?.[lang] || ""}`);
  const name = app.name;

  if (lang === "ru") {
    return [
      { p: [`Настоящая Политика описывает, как приложение ${name} («Приложение», «мы») обрабатывает информацию. Используя Приложение, вы соглашаетесь с этой Политикой.`] },
      { h: "Кратко о главном", p: [app.about?.ru, onDevice
        ? "Всё, что вы добавляете в Приложение, хранится на вашем устройстве. У нас нет серверов с вашими данными и нет к ним доступа."
        : "Мы обрабатываем только те данные, которые нужны для работы Приложения, и не продаём их."].filter(Boolean) },
      { h: "Какие данные обрабатываются", ul: [
        onDevice
          ? "Ваш контент (документы, фотографии, записи, заметки) — хранится локально на устройстве и не передаётся нам."
          : "Ваш контент — хранится на наших серверах в объёме, необходимом для работы и синхронизации Приложения.",
        data.account
          ? "Данные аккаунта (например, адрес электронной почты) — для входа и восстановления доступа."
          : "Регистрация не требуется: мы не запрашиваем имя, адрес электронной почты или номер телефона.",
        data.subscriptions ? "Статус подписки — Приложение получает его от App Store на устройстве. Платёжные данные обрабатывает Apple; мы их не видим." : null,
        data.analytics
          ? "Обезличенная статистика использования и отчёты о сбоях — чтобы исправлять ошибки и улучшать Приложение."
          : "Аналитика и трекеры в Приложении отсутствуют.",
        data.ads ? "Рекламные идентификаторы — для показа и измерения рекламы, только с вашего разрешения." : "Рекламы в Приложении нет.",
        ...notes,
      ] },
      permissions.length ? { h: "Разрешения", p: ["Приложение запрашивает доступ только тогда, когда он нужен функции, и работает без тех разрешений, в которых вы отказали:"], ul: permissions } : null,
      { h: "Третьи стороны", p: ["Покупки и подписки обрабатывает Apple в соответствии со своей политикой конфиденциальности."],
        ul: partners.length ? partners : [data.analytics || data.ads ? "" : "Другим сторонам данные не передаются."].filter(Boolean) },
      { h: "Хранение и удаление", p: [onDevice
        ? "Данные хранятся на устройстве, пока вы не удалите их в Приложении или не удалите само Приложение. Они могут попасть в резервную копию вашего устройства (iCloud или компьютер) — ею управляете вы и Apple."
        : `Данные хранятся, пока вы пользуетесь Приложением. Чтобы удалить их, напишите нам: ${contact}.`] },
      { h: "Дети", p: ["Приложение не предназначено для детей младше 13 лет, и мы сознательно не собираем их данные."] },
      { h: "Ваши права", p: [onDevice
        ? "Ваши данные находятся у вас: вы можете изменить, экспортировать или удалить их в любой момент прямо в Приложении."
        : "Вы можете запросить доступ к своим данным, их исправление или удаление, написав нам."] },
      { h: "Изменения", p: ["Мы можем обновлять эту Политику. Актуальная версия всегда доступна на этой странице с датой последнего обновления."] },
      { h: "Контакты", p: ["По вопросам конфиденциальности:"], mail: contact },
    ];
  }
  return [
    { p: [`This Policy explains how the ${name} app (the "App", "we") handles information. By using the App you agree to this Policy.`] },
    { h: "In short", p: [app.about?.en, onDevice
      ? "Everything you add to the App is stored on your device. We run no servers holding your data and have no access to it."
      : "We process only the data needed to run the App and never sell it."].filter(Boolean) },
    { h: "Data that is processed", ul: [
      onDevice
        ? "Your content (documents, photos, records, notes) — stored locally on your device and never sent to us."
        : "Your content — stored on our servers to the extent needed to run and sync the App.",
      data.account
        ? "Account data (such as your email address) — to sign you in and restore access."
        : "No sign-up: we do not ask for your name, email address or phone number.",
      data.subscriptions ? "Subscription status — the App reads it from the App Store on your device. Payment details are handled by Apple; we never see them." : null,
      data.analytics
        ? "Anonymous usage statistics and crash reports — to fix bugs and improve the App."
        : "The App contains no analytics and no trackers.",
      data.ads ? "Advertising identifiers — to show and measure ads, only with your permission." : "The App shows no ads.",
      ...notes,
    ] },
    permissions.length ? { h: "Permissions", p: ["The App asks for access only when a feature needs it and keeps working without the permissions you decline:"], ul: permissions } : null,
    { h: "Third parties", p: ["Purchases and subscriptions are processed by Apple under its own privacy policy."],
      ul: partners.length ? partners : [data.analytics || data.ads ? "" : "No data is shared with anyone else."].filter(Boolean) },
    { h: "Retention and deletion", p: [onDevice
      ? "Data stays on your device until you delete it in the App or delete the App itself. It may be included in your device backup (iCloud or computer), which is controlled by you and Apple."
      : `Data is kept while you use the App. To have it deleted, write to us: ${contact}.`] },
    { h: "Children", p: ["The App is not directed to children under 13 and we do not knowingly collect their data."] },
    { h: "Your rights", p: [onDevice
      ? "Your data is in your hands: you can edit, export or delete it at any time right in the App."
      : "You can ask us for access to your data, its correction or deletion."] },
    { h: "Changes", p: ["We may update this Policy. The current version is always available on this page with the date of the last update."] },
    { h: "Contact", p: ["Privacy questions:"], mail: contact },
  ];
}

function terms(app, contact) {
  const name = app.name;
  const notes = app.termsNotes?.[lang] || [];
  const subscriptions = app.data?.subscriptions;

  if (lang === "ru") {
    return [
      { p: [`Настоящие Условия регулируют использование приложения ${name} («Приложение»). Устанавливая и используя Приложение, вы принимаете эти Условия. Если вы с ними не согласны, не используйте Приложение.`] },
      { h: "Лицензия", p: ["Вам предоставляется личная, неисключительная, непередаваемая лицензия на использование Приложения на устройствах Apple, которыми вы владеете или управляете, в соответствии с правилами App Store. Запрещается копировать, изменять, декомпилировать Приложение и использовать его в незаконных целях."] },
      subscriptions ? { h: "Подписка и оплата", ul: [
        "Часть функций доступна по автоматически возобновляемой подписке. Период и цена каждого варианта показываются в Приложении до покупки.",
        "Оплата списывается с вашего Apple ID при подтверждении покупки.",
        "Подписка продлевается автоматически, если не отменить её не позднее чем за 24 часа до конца текущего периода. Плата за продление списывается в течение 24 часов до его окончания.",
        "Если предлагается бесплатный пробный период, по его окончании подписка становится платной, если вы не отменили её заранее.",
        "Управлять подпиской и отменить её можно в настройках Apple ID. Удаление Приложения подписку не отменяет.",
        "Возвраты осуществляет Apple по своим правилам.",
      ] } : null,
      { h: "Ваш контент", p: ["Контент, который вы добавляете в Приложение, принадлежит вам. Вы отвечаете за его законность и за сохранность резервных копий."] },
      notes.length ? { h: "Важная информация", p: notes } : null,
      { h: "Отказ от гарантий", p: ["Приложение предоставляется «как есть», без каких-либо гарантий, в пределах, допускаемых законом. Мы не гарантируем бесперебойную и безошибочную работу."] },
      { h: "Ограничение ответственности", p: ["В максимальной степени, допускаемой законом, мы не несём ответственности за косвенные убытки, утрату данных или упущенную выгоду, связанные с использованием Приложения."] },
      { h: "Изменения", p: ["Мы можем изменять Приложение и эти Условия. Продолжая пользоваться Приложением после обновления Условий, вы соглашаетесь с новой редакцией."] },
      { h: "Контакты", p: ["Вопросы по Условиям:"], mail: contact },
    ];
  }
  return [
    { p: [`These Terms govern your use of the ${name} app (the "App"). By installing and using the App you accept these Terms. If you do not agree, do not use the App.`] },
    { h: "Licence", p: ["You are granted a personal, non-exclusive, non-transferable licence to use the App on Apple devices you own or control, subject to the App Store rules. You may not copy, modify or reverse-engineer the App or use it for unlawful purposes."] },
    subscriptions ? { h: "Subscription and payment", ul: [
      "Some features require an auto-renewable subscription. The length and price of each option are shown in the App before purchase.",
      "Payment is charged to your Apple ID at confirmation of purchase.",
      "The subscription renews automatically unless it is cancelled at least 24 hours before the end of the current period. Renewal is charged within 24 hours before the period ends.",
      "If a free trial is offered, the subscription becomes paid when the trial ends unless you cancel beforehand.",
      "You can manage and cancel the subscription in your Apple ID settings. Deleting the App does not cancel it.",
      "Refunds are handled by Apple under its own rules.",
    ] } : null,
    { h: "Your content", p: ["Content you add to the App belongs to you. You are responsible for its lawfulness and for keeping backups."] },
    notes.length ? { h: "Important information", p: notes } : null,
    { h: "Disclaimer", p: ["The App is provided \"as is\", without warranties of any kind, to the extent permitted by law. We do not guarantee uninterrupted or error-free operation."] },
    { h: "Limitation of liability", p: ["To the maximum extent permitted by law, we are not liable for indirect damages, loss of data or lost profits arising from the use of the App."] },
    { h: "Changes", p: ["We may change the App and these Terms. By continuing to use the App after the Terms are updated you accept the new version."] },
    { h: "Contact", p: ["Questions about these Terms:"], mail: contact },
  ];
}

function support(app, contact) {
  const ru = lang === "ru";
  const subject = encodeURIComponent(`${app.name} — ${ru ? "поддержка" : "support"}`);
  const contactCard = el("div", { class: "card" }, [
    el("h2", { text: ru ? "Напишите нам" : "Contact us" }),
    el("p", { text: ru
      ? "Отвечаем обычно в течение 1–2 рабочих дней. Укажите модель устройства, версию iOS и версию приложения — так мы поможем быстрее."
      : "We usually reply within 1–2 business days. Mention your device model, iOS version and app version so we can help faster." }),
    el("a", { class: "button", href: `mailto:${contact}?subject=${subject}`, text: contact }),
  ]);

  const questions = (app.faq || []).map((item) => ({ q: item.q?.[lang], a: item.a?.[lang] }));
  if (app.data?.subscriptions) {
    questions.push(
      ru
        ? { q: "Как отменить подписку?", a: "Настройки → ваше имя → Подписки → выберите приложение → Отменить подписку. Доступ сохранится до конца оплаченного периода." }
        : { q: "How do I cancel the subscription?", a: "Settings → your name → Subscriptions → choose the app → Cancel Subscription. Access remains until the end of the paid period." },
      ru
        ? { q: "Подписка оплачена, но не активна", a: "Откройте экран подписки в приложении и нажмите «Восстановить покупки». Убедитесь, что вошли в тот же Apple ID, с которого оформляли подписку." }
        : { q: "I paid but the subscription is not active", a: "Open the subscription screen in the app and tap Restore Purchases. Make sure you are signed in with the Apple ID used for the purchase." },
      ru
        ? { q: "Как вернуть деньги?", a: "Возвраты оформляет Apple: reportaproblem.apple.com → войдите → выберите покупку → «Запросить возврат средств»." }
        : { q: "How do I get a refund?", a: "Refunds are handled by Apple: reportaproblem.apple.com → sign in → choose the purchase → Request a refund." },
    );
  }
  const answered = questions.filter((item) => item.q && item.a);
  const faqCard = answered.length
    ? el("div", { class: "card" }, [
        el("h2", { text: ru ? "Частые вопросы" : "Frequently asked questions" }),
        ...answered.map((item) => el("details", {}, [el("summary", { text: item.q }), el("p", { text: item.a })])),
        el("p"),
      ])
    : null;
  return [contactCard, faqCard];
}

function renderIndex(registry) {
  if (slug && registry.apps[slug]) {
    const app = registry.apps[slug];
    applyAccent(app);
    document.title = `${app.name} — ${t.legal}`;
    root.append(langSwitch(), header(app.name, app.tagline?.[lang] || t.legal, app.name.charAt(0)),
      el("div", { class: "links" }, ["privacy", "terms", "support"].map((name) =>
        el("a", { href: href(`${name}.html`), text: t[name] }))),
      el("footer", {}, el("a", { href: href("index.html", { app: null }), text: t.allApps })));
    return;
  }
  document.title = t.legal;
  root.append(langSwitch(), header(t.legal, t.choose, "§"),
    el("div", { class: "links" }, Object.entries(registry.apps).map(([key, app]) =>
      el("a", { href: href("index.html", { app: key }) }, [app.name, el("small", { text: app.tagline?.[lang] || "" })]))));
}

function render(registry) {
  if (page === "index") return renderIndex(registry);
  const app = slug ? registry.apps[slug] : null;
  if (!app) {
    document.title = t.notFound;
    root.append(langSwitch(), header(t.notFound, "", "?"),
      el("div", { class: "links" }, el("a", { href: href("index.html", { app: null }), text: t.allApps })));
    return;
  }
  const contact = app.contact || registry.contact;
  applyAccent(app);
  document.title = `${t[page]} — ${app.name}`;
  root.append(langSwitch(), header(t[page], app.name, app.name.charAt(0)));
  if (page === "support") {
    for (const card of support(app, contact)) if (card) root.append(card);
  } else {
    root.append(updatedLine(app) || "", sections(page === "privacy" ? privacy(app, contact) : terms(app, contact)));
  }
  root.append(footer(app));
}

document.documentElement.lang = lang;
fetch("./apps.json", { cache: "no-cache" })
  .then((response) => response.json())
  .then(render)
  .catch(() => root.append(el("p", { class: "updated", text: "Could not load the page. Please try again later." })));
