const UNSELECTED_AMOUNT = "미가입";

let state = null;

const elements = {
  productSections: document.getElementById("productSections"),
  totalPremium: document.getElementById("totalPremium"),
  footerPremium: document.getElementById("footerPremium"),
  guideBar: document.getElementById("guideBar"),
  guideTitle: document.getElementById("guideTitle"),
  guideMessage: document.getElementById("guideMessage"),
  guideDetailBtn: document.getElementById("guideDetailBtn"),
  guideDismissBtn: document.getElementById("guideDismissBtn"),
  scrim: document.getElementById("scrim"),
  termSheet: document.getElementById("termSheet"),
  comparisonDrawer: document.getElementById("comparisonDrawer"),
  consultCard: document.getElementById("consultCard"),
  aiChatSheet: document.getElementById("aiChatSheet"),
  consultTitle: document.getElementById("consultTitle"),
  consultLead: document.getElementById("consultLead"),
  consultContextTitle: document.getElementById("consultContextTitle"),
  consultCallCta: document.getElementById("consultCallCta"),
  consultBackBtn: document.getElementById("consultBackBtn"),
  termSheetTitle: document.getElementById("termSheetTitle"),
  termPlainSummary: document.getElementById("termPlainSummary"),
  termFit: document.getElementById("termFit"),
  termLegal: document.getElementById("termLegal"),
  termExamplesBlock: document.getElementById("termExamplesBlock"),
  termExamples: document.getElementById("termExamples"),
  openAiChatFromTerm: document.getElementById("openAiChatFromTerm"),
  openConsultFromTerm: document.getElementById("openConsultFromTerm"),
  comparisonTitle: document.getElementById("comparisonTitle"),
  comparisonPoints: document.getElementById("comparisonPoints"),
  comparisonCaution: document.getElementById("comparisonCaution"),
  comparisonAiChatBtn: document.getElementById("comparisonAiChatBtn"),
  comparisonConsultBtn: document.getElementById("comparisonConsultBtn"),
  consultContext: document.getElementById("consultContext"),
  aiChatTitle: document.getElementById("aiChatTitle"),
  aiChatLead: document.getElementById("aiChatLead"),
  aiChatHero: document.getElementById("aiChatHero"),
  aiChatPresetList: document.getElementById("aiChatPresetList"),
  aiChatMessages: document.getElementById("aiChatMessages"),
  aiChatInput: document.getElementById("aiChatInput"),
  aiChatSendBtn: document.getElementById("aiChatSendBtn"),
  aiChatCloseBtn: document.getElementById("aiChatCloseBtn"),
  openOverview: document.getElementById("openOverview")
};

let highlightObserver = null;
let highlightHintBubble = null;
let lastScrollY = 0;
let aiResponseTimer = null;
let aiTypingTimer = null;

function resetInitialScrollPosition() {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
  });
}

function createInitialState() {
  const categoryList = window.prototypeData.categories || [];
  const seededRiders = window.prototypeData.riders.map((rider) => ({
    ...rider,
    enabled: typeof rider.enabled === "boolean" ? rider.enabled : rider.selectedAmount !== UNSELECTED_AMOUNT
  }));
  const defaultOpenSections = categoryList.length
    ? categoryList
        .filter((category) => (category.label || category.majorCategory || "").includes("암"))
        .map((category) => category.majorCategory)
    : [...new Set(window.prototypeData.riders
        .map((rider) => rider.section)
        .filter((section) => typeof section === "string" && section.includes("암")))];
  const defaultOpenMiddleGroups = new Set(
    seededRiders.map((rider) =>
      getMiddleGroupKey(
        rider.majorCategory || rider.section || "기타",
        rider.middleCategory || rider.section || "기타"
      )
    )
  );

  return {
    riders: seededRiders,
    currentTermId: null,
    currentComparisonId: null,
    currentConsultSource: null,
    currentAiSource: null,
    aiMessages: [],
    aiPending: false,
    aiTyping: false,
    lastGuideContext: null,
    openSections: new Set(defaultOpenSections),
    openMiddleGroups: defaultOpenMiddleGroups,
    revealedHighlightKeys: new Set(),
    hasShownHighlightHint: false
  };
}

function formatWon(value) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatWonNumber(value) {
  return value.toLocaleString("ko-KR");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function findRider(riderId) {
  return state.riders.find((item) => item.id === riderId);
}

function getFirstJoinableAmount(rider) {
  return rider.options.find((option) => option !== UNSELECTED_AMOUNT) || rider.selectedAmount;
}

function getGuideTriggerForAmountChange(previousAmount, nextAmount) {
  if (nextAmount === UNSELECTED_AMOUNT) return "toggle_off";
  if (previousAmount === UNSELECTED_AMOUNT) return "toggle_on";
  return "amount_change";
}

function computeTotalPremium() {
  return state.riders.reduce((sum, rider) => {
    if (!rider.enabled) return sum;
    return sum + rider.premium;
  }, 54881);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termHasVisibleContent(termId) {
  const term = window.prototypeData.terms[termId];
  if (!term) return false;

  return Boolean(
    term.plainSummary ||
      term.fitCase ||
      term.legalNotice ||
      ((term.detailExamples || []).filter(Boolean).length > 0)
  );
}

function highlightTerms(text, termIds, contextKey = "") {
  return (termIds || []).reduce((result, termId) => {
    const term = window.prototypeData.terms[termId];
    if (!term || !termHasVisibleContent(termId)) return result;
    let matchIndex = 0;
    return term.aliases.reduce((inner, alias) => {
      const pattern = new RegExp(`(${escapeRegExp(alias)})`, "g");
      return inner.replace(
        pattern,
        (matched) => {
          matchIndex += 1;
          const highlightKey = `${contextKey}-${termId}-${matchIndex}`;
          return `<button class="term-highlight" data-term-id="${termId}" data-highlight-key="${highlightKey}" type="button">${matched}</button>`;
        }
      );
    }, result);
  }, text);
}

function groupBySection(riders) {
  return riders.reduce((acc, rider) => {
    if (!acc[rider.section]) acc[rider.section] = [];
    acc[rider.section].push(rider);
    return acc;
  }, {});
}

function getCategoryList() {
  if (window.prototypeData.categories?.length) {
    return window.prototypeData.categories;
  }

  const discovered = [...new Set(state.riders.map((rider) => rider.majorCategory || rider.section || "기타"))];
  return discovered.map((majorCategory, index) => ({
    majorCategory,
    label: majorCategory,
    chipSummary: "",
    description: "",
    order: (index + 1) * 10
  }));
}

function getCategoryGroupList(majorCategory) {
  const configuredGroups = (window.prototypeData.categoryGroups || [])
    .filter((group) => group.majorCategory === majorCategory)
    .sort((left, right) => left.order - right.order);

  const configuredMiddleCategories = new Set(configuredGroups.map((group) => group.middleCategory));
  const riderMiddleCategories = [...new Set(state.riders
    .filter((rider) => (rider.majorCategory || rider.section || "기타") === majorCategory)
    .map((rider) => rider.middleCategory || rider.section || "기타"))];

  const inferredGroups = riderMiddleCategories
    .filter((middleCategory) => !configuredMiddleCategories.has(middleCategory))
    .map((middleCategory, index) => ({
      majorCategory,
      middleCategory,
      label: middleCategory,
      order: 1000 + index
    }));

  return [...configuredGroups, ...inferredGroups];
}

function groupRidersByCategory(riders) {
  return riders.reduce((acc, rider) => {
    const majorCategory = rider.majorCategory || rider.section || "기타";
    const middleCategory = rider.middleCategory || rider.section || "기타";

    if (!acc[majorCategory]) {
      acc[majorCategory] = {};
    }

    if (!acc[majorCategory][middleCategory]) {
      acc[majorCategory][middleCategory] = [];
    }

    acc[majorCategory][middleCategory].push(rider);
    return acc;
  }, {});
}

function getMiddleGroupKey(majorCategory, middleCategory) {
  return `${majorCategory}::${middleCategory}`;
}

function renderChipSummary(chipSummary) {
  const chips = (chipSummary || "")
    .split(",")
    .map((chip) => chip.trim())
    .filter(Boolean);

  if (!chips.length) {
    return "";
  }

  return chips.map((chip) => `<span class="desc-chip">${chip}</span>`).join("");
}

function renderSections() {
  const grouped = groupRidersByCategory(state.riders);
  const categoryList = getCategoryList().filter((category) => grouped[category.majorCategory]);

  elements.productSections.innerHTML = categoryList
    .map((category) => {
      const majorCategory = category.majorCategory;
      const middleGroups = getCategoryGroupList(majorCategory);
      const totalCount = Object.values(grouped[majorCategory] || {}).reduce((sum, riders) => sum + riders.length, 0);
      const isOpen = state.openSections.has(majorCategory);
      const middleGroupMarkup = middleGroups
        .filter((group) => (grouped[majorCategory]?.[group.middleCategory] || []).length)
        .map((group) => {
          const riders = grouped[majorCategory][group.middleCategory];
          const middleGroupKey = getMiddleGroupKey(majorCategory, group.middleCategory);
          const isMiddleOpen = state.openMiddleGroups.has(middleGroupKey);

          return `
            <div class="middle-group">
              <div class="middle-head">
                <h3 class="middle-title">${group.label}</h3>
                <label class="switch-wrap middle-switch">
                  <input
                    type="checkbox"
                    data-middle-toggle="${middleGroupKey}"
                    ${isMiddleOpen ? "checked" : ""}
                  />
                  <span class="switch-ui"></span>
                </label>
              </div>
              <ul class="data-list" style="display: ${isMiddleOpen ? "block" : "none"};">
                ${riders.map(renderRiderRow).join("")}
              </ul>
            </div>
          `;
        })
        .join("");

      const chipSummary = category.chipSummary || middleGroups.map((group) => group.label).join(", ");
      const chipMarkup = renderChipSummary(chipSummary);

      return `
        <div class="group-info-box ${isOpen ? "open" : ""}">
          <div class="title">
            <button class="tog" data-section-toggle="${majorCategory}" type="button">
              ${category.label}
              <span class="desc-category">${chipMarkup}</span>
              <span class="offscreen">${isOpen ? "열림" : "닫힘"}</span>
              <p class="desc">${category.description || ""}</p>
            </button>
          </div>
          <div class="cont-trty" style="display: ${isOpen ? "block" : "none"};">
            <div class="info-box">
              ${middleGroupMarkup}
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderRiderRow(rider) {
  const compareButton = rider.compareId
    ? `<button type="button" class="mini-link" data-compare-id="${rider.compareId}" data-rider-id="${rider.id}">비교 보기</button>`
    : "";
  const descriptionMarkup = rider.description
    ? `<p class="guide-inline">${highlightTerms(rider.description, rider.termIds, `${rider.id}-desc`)}</p>`
    : "";
  const helpTermId = (rider.termIds || []).find((termId) => termHasVisibleContent(termId)) || "";
  const helpButton = helpTermId
    ? `
          <div class="tooltip replacement">
            <div class="tooltip-btn">
              <button type="button" class="btn-help is-guide" aria-label="보험길잡이 설명 열기" data-term-id="${helpTermId}"></button>
              <span class="ico-arrow"></span>
            </div>
          </div>
        `
    : "";
  return `
    <li class="${rider.selectedAmount !== UNSELECTED_AMOUNT ? "" : "off"}">
      <div class="item">
        <div class="item-copy">
          <span>${highlightTerms(rider.label, rider.termIds, `${rider.id}-label`)}</span>
          ${helpButton}
          ${descriptionMarkup}
          ${compareButton ? `<div class="inline-actions">${compareButton}</div>` : ""}
        </div>
        <div class="val">
          <button type="button" class="btn-more btn--black">
            <span>
              <select data-amount-id="${rider.id}">
                ${rider.options
                  .map(
                    (option) => `<option value="${option}" ${option === rider.selectedAmount ? "selected" : ""}>${option}</option>`
                  )
                  .join("")}
              </select>
            </span>
          </button>
        </div>
      </div>
    </li>
  `;
}

function renderPremium() {
  const total = computeTotalPremium();
  elements.totalPremium.textContent = formatWon(total);
  elements.footerPremium.textContent = formatWon(total);
}

function getOverlayPanels() {
  return [elements.guideBar, elements.termSheet, elements.comparisonDrawer, elements.consultCard, elements.aiChatSheet];
}

function showGuide(triggerType, riderId) {
  const rider = findRider(riderId);
  const guide = window.prototypeData.guideMessages[triggerType];
  if (!rider || !guide) return;

  elements.guideTitle.textContent = `${rider.label} · ${guide.title}`;
  elements.guideMessage.textContent = `${guide.message} ${rider.helper}`;
  state.lastGuideContext = { riderId, compareId: rider.compareId, termId: rider.termIds[0] || null };
  openOverlay(elements.guideBar);
}

function hideGuide() {
  closeOverlay(elements.guideBar);
}

function updateRiderToggle(riderId, enabled) {
  state.riders = state.riders.map((rider) => {
    if (rider.id !== riderId) return rider;
    const nextAmount = enabled && rider.selectedAmount === UNSELECTED_AMOUNT ? getFirstJoinableAmount(rider) : rider.selectedAmount;
    return {
      ...rider,
      enabled,
      selectedAmount: enabled ? nextAmount : UNSELECTED_AMOUNT
    };
  });
  renderAll();
  showGuide(enabled ? "toggle_on" : "toggle_off", riderId);
}

function updateRiderAmount(riderId, amount) {
  const rider = findRider(riderId);
  if (!rider) return;
  const triggerType = getGuideTriggerForAmountChange(rider.selectedAmount, amount);

  state.riders = state.riders.map((rider) => {
    if (rider.id !== riderId) return rider;
    return {
      ...rider,
      enabled: amount !== UNSELECTED_AMOUNT,
      selectedAmount: amount
    };
  });
  renderAll();
  showGuide(triggerType, riderId);
}

function toggleMiddleGroup(middleGroupKey, isOpen) {
  if (isOpen) {
    state.openMiddleGroups.add(middleGroupKey);
  } else {
    state.openMiddleGroups.delete(middleGroupKey);
  }
  renderSections();
  setupHighlightAnimations();
}

function openOverlay(target) {
  hideHighlightHintBubble();
  getOverlayPanels().forEach((panel) => {
    if (panel !== target) panel.classList.add("hidden");
  });
  elements.scrim.classList.remove("hidden");
  target.classList.remove("hidden");
}

function closeOverlay(target) {
  target.classList.add("hidden");
  if (getOverlayPanels().every((panel) => panel.classList.contains("hidden"))) {
    elements.scrim.classList.add("hidden");
  }
}

function openTermSheet(termId) {
  const term = window.prototypeData.terms[termId];
  if (!term || !termHasVisibleContent(termId)) return;
  state.currentTermId = termId;
  elements.termSheetTitle.textContent = term.label;
  elements.termPlainSummary.textContent = term.plainSummary;
  elements.termFit.textContent = term.fitCase;
  elements.termLegal.textContent = term.legalNotice;
  elements.termExamples.innerHTML = (term.detailExamples || []).map((item) => `<li>${item}</li>`).join("");
  elements.termExamplesBlock.classList.toggle("hidden", !(term.detailExamples || []).length);
  openOverlay(elements.termSheet);
}

function openComparison(compareId) {
  const comparison = window.prototypeData.comparisons[compareId];
  if (!comparison) return;
  state.currentComparisonId = compareId;
  elements.comparisonTitle.textContent = comparison.title;
  elements.comparisonPoints.innerHTML = comparison.differencePoints.map((point) => `<li>${point}</li>`).join("");
  elements.comparisonCaution.textContent = comparison.caution;
  openOverlay(elements.comparisonDrawer);
}

function getSupportContext(source) {
  const lines = [];
  let title = "AI가 먼저 쉽게 설명해드릴게요";
  let intro = "지금 보고 있는 보장 내용을 먼저 쉬운 말로 정리해드릴게요.";
  let followUp = "궁금한 점을 한 문장으로 물어보시면 현재 화면 기준으로 이어서 설명해드릴게요.";

  if (source.type === "rider") {
    const rider = findRider(source.id);
    if (rider) {
      title = `${rider.label}부터 같이 볼게요`;
      intro = rider.helper || `${rider.label}은 가입금액과 보장 구조를 같이 보는 게 핵심이에요.`;
      followUp = rider.consultTopic || "보장 범위와 가입금액 중 헷갈리는 부분부터 물어보세요.";
      lines.push(`현재 보고 있던 항목: ${rider.label}`);
      lines.push(`현재 선택 상태: ${rider.enabled ? rider.selectedAmount : UNSELECTED_AMOUNT}`);
      lines.push(`상담으로 넘길 주제: ${rider.consultTopic}`);
      lines.push(`막힌 포인트: ${rider.helper}`);
    }
  }

  if (source.type === "term") {
    const term = window.prototypeData.terms[source.id];
    if (term) {
      title = `${term.label}을 쉬운 말로 먼저 볼게요`;
      intro = term.plainSummary || `${term.label}의 핵심부터 간단히 설명해드릴게요.`;
      followUp = term.fitCase
        ? `${term.fitCase} 세부 인정 기준은 약관 확인이 필요해요.`
        : "필요 보장인지, 어떤 상황에서 주로 보는지 중심으로 같이 보면 이해가 쉬워져요.";
      lines.push(`궁금했던 용어: ${term.label}`);
      lines.push("필요했던 설명 유형: 쉬운 설명 및 차이 비교");
      if (term.fitCase) lines.push(`주로 보는 상황: ${term.fitCase}`);
    }
  }

  if (source.type === "comparison") {
    const comparison = window.prototypeData.comparisons[source.id];
    if (comparison) {
      title = `${comparison.title} 차이부터 짚어볼게요`;
      intro = comparison.differencePoints[0] || `${comparison.title}의 핵심 차이부터 설명해드릴게요.`;
      followUp = comparison.caution || "무엇이 더 낫다보다 보장 범위와 횟수 차이를 같이 보는 게 중요해요.";
      lines.push(`비교 중인 항목: ${comparison.title}`);
      lines.push(`비교 포인트: ${comparison.differencePoints[0]}`);
    }
  }

  if (state.lastGuideContext) {
    const rider = findRider(state.lastGuideContext.riderId);
    if (rider) {
      lines.push(`직전 조작 맥락: ${rider.label} 변경 후 설명 확인`);
    }
  }

  return {
    title,
    intro,
    followUp,
    lines: [...new Set(lines.filter(Boolean))]
  };
}

function openConsult(source) {
  state.currentConsultSource = source;
  const context = getSupportContext(source);
  const consultTemplate = window.prototypeData.consultTemplate || {};

  elements.consultTitle.innerHTML = consultTemplate.title || "";
  elements.consultLead.textContent = consultTemplate.introCopy || "";
  elements.consultContextTitle.textContent = consultTemplate.contextBlockTitle || "";
  elements.consultCallCta.textContent = consultTemplate.primaryCta || "상담 예약하기";
  elements.consultContext.innerHTML = context.lines.map((line) => `<li>${line}</li>`).join("");
  openOverlay(elements.consultCard);
}

function renderAiChatMessages() {
  const hasConversation = state.aiMessages.length > 0;
  elements.aiChatHero.classList.toggle("hidden", hasConversation);
  elements.aiChatMessages.classList.toggle("is-empty", !hasConversation);
  const messageMarkup = state.aiMessages
    .map(
      (message) => `
        <article class="ai-chat-message ${message.role}">
          <p>${escapeHtml(message.text).replace(/\n/g, "<br />")}${message.isTyping ? '<span class="ai-chat-caret" aria-hidden="true"></span>' : ""}</p>
        </article>
      `
    )
    .join("");
  const pendingMarkup = state.aiPending
    ? `
        <article class="ai-chat-message assistant ai-chat-message-loading" aria-live="polite">
          <div class="ai-chat-loading-bubble">
            <span class="ai-chat-loading-label">답변 생성중</span>
            <span class="ai-chat-loading-dots" aria-hidden="true">
              <span></span><span></span><span></span>
            </span>
          </div>
        </article>
      `
    : "";
  elements.aiChatMessages.innerHTML = `${messageMarkup}${pendingMarkup}`;
  const isBusy = state.aiPending || state.aiTyping;
  elements.aiChatInput.disabled = isBusy;
  elements.aiChatSendBtn.disabled = isBusy;
  elements.aiChatPresetList.querySelectorAll("[data-ai-preset]").forEach((button) => {
    button.disabled = isBusy;
  });

  requestAnimationFrame(() => {
    elements.aiChatMessages.scrollTop = elements.aiChatMessages.scrollHeight;
  });
}

function buildAiReply(question, source) {
  const context = getSupportContext(source);
  const normalizedQuestion = question.replace(/\s+/g, " ").trim();
  const questionHint = normalizedQuestion ? `질문하신 "${normalizedQuestion}" 기준으로 보면, ` : "";

  return `${questionHint}${context.intro} ${context.followUp}`;
}

function getAiPresetQuestions(source) {
  if (source.type === "comparison") {
    return [
      "둘의 핵심 차이가 뭐야?",
      "어떤 경우에 더 많이 써?",
      "같이 보면 좋은 기준이 뭐야?"
    ];
  }

  if (source.type === "term") {
    return [
      "이 보장은 쉽게 말하면 뭐야?",
      "언제 많이 궁금해해?",
      "약관에서 특히 봐야 할 건 뭐야?"
    ];
  }

  return [
    "이 항목은 왜 넣는 거야?",
    "가입금액은 어떻게 보면 돼?",
    "같이 비교하면 좋은 보장이 있어?"
  ];
}

function getAiChatOpening(source) {
  if (source.type === "comparison") {
    const comparison = window.prototypeData.comparisons[source.id];
    return comparison?.title
      ? `${comparison.title}에 대해서 어떤 점이 궁금하세요?`
      : "비교 중인 보장에 대해서 어떤 점이 궁금하세요?";
  }

  if (source.type === "term") {
    const term = window.prototypeData.terms[source.id];
    return term?.label
      ? `${term.label}에 대해서 어떤 점이 궁금하세요?`
      : "지금 보고 있는 보장에 대해서 어떤 점이 궁금하세요?";
  }

  const rider = findRider(source.id);
  return rider?.label
    ? `${rider.label}에 대해서 어떤 점이 궁금하세요?`
    : "팩건강보험에 대해서 어떤 점이 궁금하세요?";
}

function renderAiChatPresets(source) {
  const presets = getAiPresetQuestions(source);
  elements.aiChatPresetList.innerHTML = presets
    .map(
      (preset) => `
        <button class="ai-chat-preset" type="button" data-ai-preset="${escapeHtml(preset)}">
          ${escapeHtml(preset)}
        </button>
      `
    )
    .join("");
}

function resetAiChatAsync() {
  if (aiResponseTimer) {
    window.clearTimeout(aiResponseTimer);
    aiResponseTimer = null;
  }

  if (aiTypingTimer) {
    window.clearTimeout(aiTypingTimer);
    aiTypingTimer = null;
  }

  state.aiPending = false;
  state.aiTyping = false;
}

function openAiChat(source) {
  resetAiChatAsync();
  state.currentAiSource = source;
  elements.aiChatTitle.textContent = getAiChatOpening(source);
  elements.aiChatLead.textContent = "지금 보고 있던 보장 맥락을 반영해서 자주 묻는 질문부터 빠르게 답해드릴게요.";
  renderAiChatPresets(source);

  state.aiMessages = [];

  elements.aiChatInput.value = "";
  renderAiChatMessages();
  openOverlay(elements.aiChatSheet);

  requestAnimationFrame(() => {
    elements.aiChatInput.focus();
  });
}

function submitAiQuestion(question) {
  if (!question || !state.currentAiSource || state.aiPending || state.aiTyping) return;

  state.aiMessages.push({ role: "user", text: question });
  state.aiPending = true;
  renderAiChatMessages();

  aiResponseTimer = window.setTimeout(() => {
    const fullReply = buildAiReply(question, state.currentAiSource);
    state.aiPending = false;
    state.aiTyping = true;
    state.aiMessages.push({
      role: "assistant",
      text: "",
      isTyping: true
    });
    aiResponseTimer = null;
    renderAiChatMessages();

    let currentIndex = 0;
    const typeNextChunk = () => {
      const currentMessage = state.aiMessages[state.aiMessages.length - 1];
      if (!currentMessage) return;

      const step = fullReply[currentIndex] === "\n" ? 1 : Math.min(fullReply.length - currentIndex, 2 + Math.floor(Math.random() * 4));
      currentIndex += step;
      currentMessage.text = fullReply.slice(0, currentIndex);
      renderAiChatMessages();

      if (currentIndex < fullReply.length) {
        aiTypingTimer = window.setTimeout(typeNextChunk, 24);
        return;
      }

      currentMessage.isTyping = false;
      state.aiTyping = false;
      aiTypingTimer = null;
      renderAiChatMessages();

      requestAnimationFrame(() => {
        elements.aiChatInput.focus();
      });
    };

    typeNextChunk();
  }, 3000);
}

function sendAiChatMessage() {
  const question = elements.aiChatInput.value.trim();
  if (!question) return;
  submitAiQuestion(question);
  elements.aiChatInput.value = "";
}

function reopenSupportOrigin(source) {
  resetAiChatAsync();
  if (!source) return;

  if (source.type === "term" && source.id) {
    openTermSheet(source.id);
    return;
  }

  if (source.type === "comparison" && source.id) {
    openComparison(source.id);
    return;
  }

  closeOverlay(elements.consultCard);
  closeOverlay(elements.aiChatSheet);
}

function toggleSection(sectionName) {
  if (state.openSections.has(sectionName)) {
    state.openSections.delete(sectionName);
  } else {
    state.openSections.add(sectionName);
  }
  renderSections();
  setupHighlightAnimations();
}

function ensureHighlightHintBubble() {
  if (highlightHintBubble) return highlightHintBubble;

  highlightHintBubble = document.createElement("div");
  highlightHintBubble.className = "highlight-hint-bubble";
  highlightHintBubble.textContent = "쉬운 설명 확인해보세요";
  document.body.appendChild(highlightHintBubble);
  return highlightHintBubble;
}

function hideHighlightHintBubble(immediate = false) {
  if (!highlightHintBubble) return;
  highlightHintBubble.classList.remove("is-visible");

  if (immediate) {
    highlightHintBubble.style.opacity = "0";
    highlightHintBubble.style.removeProperty("--bubble-pointer-left");
  }
}

function getPrimaryHighlightHintTarget() {
  const integratedCancerHighlights = [...document.querySelectorAll('.term-highlight[data-term-id="integratedCancer"][data-highlight-key]')]
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    })
    .sort((left, right) => left.getBoundingClientRect().top - right.getBoundingClientRect().top);

  if (integratedCancerHighlights.length) {
    return integratedCancerHighlights[0];
  }

  return [...document.querySelectorAll(".term-highlight[data-highlight-key]")]
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    })
    .sort((left, right) => left.getBoundingClientRect().top - right.getBoundingClientRect().top)[0] || null;
}

function updatePrimaryHighlightHintBubble() {
  const target = getPrimaryHighlightHintTarget();
  if (!target) {
    hideHighlightHintBubble(true);
    return;
  }

  const bubble = ensureHighlightHintBubble();
  const rect = target.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const bubbleWidth = bubble.offsetWidth || 160;
  const bubbleHeight = bubble.offsetHeight || 34;

  if (rect.bottom < 0 || rect.top > viewportHeight) {
    hideHighlightHintBubble(true);
    return;
  }

  const left = Math.min(viewportWidth - bubbleWidth - 12, Math.max(12, rect.left - 10));
  const top = Math.max(10, rect.top - 46);
  const pointerLeft = Math.min(
    bubbleWidth - 18,
    Math.max(16, rect.left - left + 6)
  );

  bubble.style.removeProperty("opacity");
  bubble.style.left = `${left}px`;
  bubble.style.top = `${top}px`;
  bubble.style.setProperty("--bubble-pointer-left", `${pointerLeft}px`);

  const stickyBar = document.querySelector(".bottom-area.__plan.info-calc-bottom");
  const stickyTop = stickyBar ? stickyBar.getBoundingClientRect().top : viewportHeight;
  const bubbleBottom = top + bubbleHeight;
  const fadeStartTop = stickyTop - 72;
  const fadeEndTop = stickyTop - 24;
  const viewportFadeStartTop = 60;
  const viewportFadeEndTop = 12;
  const viewportFadeStartBottom = viewportHeight - 72;
  const viewportFadeEndBottom = viewportHeight - 24;
  let opacity = 1;

  if (bubbleBottom >= fadeStartTop) {
    const progress = Math.min(1, Math.max(0, (bubbleBottom - fadeStartTop) / Math.max(1, fadeEndTop - fadeStartTop)));
    opacity = Math.min(opacity, 1 - progress);
  }

  if (top <= viewportFadeStartTop) {
    const progress = Math.min(1, Math.max(0, (viewportFadeStartTop - top) / Math.max(1, viewportFadeStartTop - viewportFadeEndTop)));
    opacity = Math.min(opacity, 1 - progress);
  }

  if (bubbleBottom >= viewportFadeStartBottom) {
    const progress = Math.min(1, Math.max(0, (bubbleBottom - viewportFadeStartBottom) / Math.max(1, viewportFadeEndBottom - viewportFadeStartBottom)));
    opacity = Math.min(opacity, 1 - progress);
  }

  bubble.style.opacity = `${Math.max(0, opacity)}`;

  requestAnimationFrame(() => {
    bubble.classList.add("is-visible");
  });
}

function handleProductSectionClick(event) {
  const sectionToggle = event.target.closest("[data-section-toggle]");
  if (sectionToggle) {
    toggleSection(sectionToggle.dataset.sectionToggle);
    return;
  }

  const termButton = event.target.closest("[data-term-id]");
  if (termButton) {
    hideHighlightHintBubble();
    openTermSheet(termButton.dataset.termId);
    return;
  }

  const compareButton = event.target.closest("[data-compare-id]");
  if (compareButton) {
    openComparison(compareButton.dataset.compareId);
    return;
  }

  const consultButton = event.target.closest("[data-consult-rider-id]");
  if (consultButton) {
    openConsult({ type: "rider", id: consultButton.dataset.consultRiderId });
  }
}

function handleProductSectionChange(event) {
  const middleToggle = event.target.closest("[data-middle-toggle]");
  if (middleToggle) {
    toggleMiddleGroup(middleToggle.dataset.middleToggle, middleToggle.checked);
    return;
  }

  const toggle = event.target.closest("[data-toggle-id]");
  if (toggle) {
    updateRiderToggle(toggle.dataset.toggleId, toggle.checked);
    return;
  }

  const amountSelect = event.target.closest("[data-amount-id]");
  if (amountSelect) {
    updateRiderAmount(amountSelect.dataset.amountId, amountSelect.value);
  }
}

function renderAll() {
  renderSections();
  renderPremium();
  setupHighlightAnimations();
}

function setupHighlightAnimations() {
  if (highlightObserver) highlightObserver.disconnect();

  const highlights = document.querySelectorAll(".term-highlight[data-highlight-key]");
  if (!highlights.length) return;
  updatePrimaryHighlightHintBubble();

  const isHighlightActuallyVisible = (element) => {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const centerY = rect.top + rect.height / 2;
    const centerX = rect.left + rect.width / 2;

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      centerY >= 0 &&
      centerY <= viewportHeight &&
      centerX >= 0 &&
      centerX <= viewportWidth
    );
  };

  const revealHighlight = (element) => {
    const key = element.dataset.highlightKey;
    if (!key || state.revealedHighlightKeys.has(key)) {
      element.classList.add("is-revealed");
      element.classList.remove("revealed");
      return;
    }
    state.revealedHighlightKeys.add(key);
    element.classList.add("is-revealed");
    element.classList.add("revealed");
    element.addEventListener(
      "animationend",
      () => {
        element.classList.remove("revealed");
      },
      { once: true }
    );
  };

  highlights.forEach((element) => {
    if (state.revealedHighlightKeys.has(element.dataset.highlightKey)) {
      element.classList.add("is-revealed");
      element.classList.remove("revealed");
    }
  });

  if (!("IntersectionObserver" in window)) {
    highlights.forEach(revealHighlight);
    return;
  }

  highlightObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (!isHighlightActuallyVisible(entry.target)) return;
        revealHighlight(entry.target);
        highlightObserver.unobserve(entry.target);
      });
    },
    {
      root: null,
      threshold: 0,
      rootMargin: "0px"
    }
  );

  highlights.forEach((element) => {
    if (!element.classList.contains("revealed")) {
      highlightObserver.observe(element);
    }
  });
}

function bindEvents() {
  elements.productSections.addEventListener("click", handleProductSectionClick);
  elements.productSections.addEventListener("change", handleProductSectionChange);

  window.addEventListener(
    "scroll",
    () => {
      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      updatePrimaryHighlightHintBubble();
      lastScrollY = currentScrollY;
    },
    { passive: true }
  );

  elements.guideDismissBtn.addEventListener("click", hideGuide);
  elements.guideDetailBtn.addEventListener("click", () => {
    if (!state.lastGuideContext) return;
    if (state.lastGuideContext.compareId) {
      openComparison(state.lastGuideContext.compareId);
    } else if (state.lastGuideContext.termId) {
      openTermSheet(state.lastGuideContext.termId);
    }
  });

  elements.openConsultFromTerm.addEventListener("click", () => {
    if (state.currentTermId) openConsult({ type: "term", id: state.currentTermId });
  });

  elements.openAiChatFromTerm.addEventListener("click", () => {
    if (state.currentTermId) openAiChat({ type: "term", id: state.currentTermId });
  });

  elements.comparisonAiChatBtn.addEventListener("click", () => {
    if (state.currentComparisonId) openAiChat({ type: "comparison", id: state.currentComparisonId });
  });

  elements.comparisonConsultBtn.addEventListener("click", () => {
    if (state.currentComparisonId) openConsult({ type: "comparison", id: state.currentComparisonId });
  });

  elements.aiChatSendBtn.addEventListener("click", sendAiChatMessage);
  elements.aiChatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.isComposing) {
      event.preventDefault();
      sendAiChatMessage();
    }
  });

  elements.aiChatPresetList.addEventListener("click", (event) => {
    const presetButton = event.target.closest("[data-ai-preset]");
    if (!presetButton) return;
    submitAiQuestion(presetButton.dataset.aiPreset);
  });

  elements.consultBackBtn.addEventListener("click", () => {
    reopenSupportOrigin(state.currentConsultSource);
  });

  elements.scrim.addEventListener("click", () => {
    resetAiChatAsync();
    closeOverlay(elements.guideBar);
    closeOverlay(elements.termSheet);
    closeOverlay(elements.comparisonDrawer);
    closeOverlay(elements.consultCard);
    closeOverlay(elements.aiChatSheet);
  });

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.close;
      closeOverlay(document.getElementById(id));
    });
  });

  elements.openOverview.addEventListener("click", () => {
    const firstTermId = window.prototypeData.terms.integratedCancer
      ? "integratedCancer"
      : Object.keys(window.prototypeData.terms)[0];
    if (firstTermId) openTermSheet(firstTermId);
  });
}

async function bootstrapApp() {
  resetInitialScrollPosition();

  if (typeof window.loadPrototypeData === "function") {
    window.prototypeData = await window.loadPrototypeData();
  }

  state = createInitialState();
  renderAll();
  bindEvents();
}

bootstrapApp().catch((error) => {
  console.error("보험길잡이 데이터를 불러오지 못했습니다.", error);
  state = createInitialState();
  renderAll();
  bindEvents();
});
