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
  termSheetTitle: document.getElementById("termSheetTitle"),
  termPlainSummary: document.getElementById("termPlainSummary"),
  termWhy: document.getElementById("termWhy"),
  termFit: document.getElementById("termFit"),
  termCaution: document.getElementById("termCaution"),
  termLegal: document.getElementById("termLegal"),
  termExamplesBlock: document.getElementById("termExamplesBlock"),
  termExamples: document.getElementById("termExamples"),
  openCompareFromTerm: document.getElementById("openCompareFromTerm"),
  openConsultFromTerm: document.getElementById("openConsultFromTerm"),
  comparisonTitle: document.getElementById("comparisonTitle"),
  comparisonLeftTitle: document.getElementById("comparisonLeftTitle"),
  comparisonRightTitle: document.getElementById("comparisonRightTitle"),
  comparisonLeftFit: document.getElementById("comparisonLeftFit"),
  comparisonRightFit: document.getElementById("comparisonRightFit"),
  comparisonPoints: document.getElementById("comparisonPoints"),
  comparisonCaution: document.getElementById("comparisonCaution"),
  comparisonConsultBtn: document.getElementById("comparisonConsultBtn"),
  consultContext: document.getElementById("consultContext"),
  openOverview: document.getElementById("openOverview")
};

let highlightObserver = null;
let highlightHintBubble = null;
let lastScrollY = 0;

function createInitialState() {
  const categoryList = window.prototypeData.categories || [];

  return {
    riders: window.prototypeData.riders.map((rider) => ({
      ...rider,
      enabled: typeof rider.enabled === "boolean" ? rider.enabled : rider.selectedAmount !== UNSELECTED_AMOUNT
    })),
    currentTermId: null,
    currentComparisonId: null,
    currentConsultSource: null,
    lastGuideContext: null,
    openSections: new Set(categoryList.length ? [] : window.prototypeData.riders.map((rider) => rider.section)),
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

function highlightTerms(text, termIds, contextKey = "") {
  return termIds.reduce((result, termId) => {
    const term = window.prototypeData.terms[termId];
    if (!term) return result;
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

          return `
            <div class="middle-group">
              <div class="middle-head">
                <h3 class="middle-title">${group.label}</h3>
                <span class="middle-count">${riders.length}개</span>
              </div>
              <ul class="data-list">
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
  const helpTermId = rider.termIds[0] || "";
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
    <li class="${rider.enabled ? "" : "off"}">
      <div class="item">
        <div class="item-copy">
          <span>${highlightTerms(rider.label, rider.termIds, `${rider.id}-label`)}</span>
          ${helpButton}
          <p class="guide-inline">${highlightTerms(rider.description, rider.termIds, `${rider.id}-desc`)}</p>
          <div class="inline-actions">
            ${compareButton}
          </div>
        </div>
        <div class="val">
          <label class="switch-wrap">
            <input type="checkbox" data-toggle-id="${rider.id}" ${rider.enabled ? "checked" : ""} />
            <span class="switch-ui"></span>
          </label>
          <button type="button" class="btn-more btn--black">
            <span>
              <select data-amount-id="${rider.id}" ${!rider.enabled ? "disabled" : ""}>
                ${rider.options
                  .map(
                    (option) => `<option value="${option}" ${option === rider.selectedAmount ? "selected" : ""}>${option}</option>`
                  )
                  .join("")}
              </select>
            </span>
          </button>
          <p class="txt-fee">${rider.premium ? `월 ${formatWon(rider.premium)}` : ""}</p>
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

function showGuide(triggerType, riderId) {
  const rider = findRider(riderId);
  const guide = window.prototypeData.guideMessages[triggerType];
  if (!rider || !guide) return;

  elements.guideTitle.textContent = `${rider.label} · ${guide.title}`;
  elements.guideMessage.textContent = `${guide.message} ${rider.helper}`;
  elements.guideBar.classList.remove("hidden");
  state.lastGuideContext = { riderId, compareId: rider.compareId, termId: rider.termIds[0] || null };
}

function hideGuide() {
  elements.guideBar.classList.add("hidden");
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

function openOverlay(target) {
  hideHighlightHintBubble();
  [elements.termSheet, elements.comparisonDrawer, elements.consultCard].forEach((panel) => {
    if (panel !== target) panel.classList.add("hidden");
  });
  elements.scrim.classList.remove("hidden");
  target.classList.remove("hidden");
}

function closeOverlay(target) {
  target.classList.add("hidden");
  if ([elements.termSheet, elements.comparisonDrawer, elements.consultCard].every((panel) => panel.classList.contains("hidden"))) {
    elements.scrim.classList.add("hidden");
  }
}

function openTermSheet(termId) {
  const term = window.prototypeData.terms[termId];
  if (!term) return;
  state.currentTermId = termId;
  elements.termSheetTitle.textContent = term.label;
  elements.termPlainSummary.textContent = term.plainSummary;
  elements.termWhy.textContent = term.whyItMatters;
  elements.termFit.textContent = term.fitCase;
  elements.termCaution.textContent = term.caution;
  elements.termLegal.textContent = term.legalNotice;
  elements.termExamples.innerHTML = (term.detailExamples || []).map((item) => `<li>${item}</li>`).join("");
  elements.termExamplesBlock.classList.toggle("hidden", !(term.detailExamples || []).length);
  elements.openCompareFromTerm.disabled = !(term.compareTargets || []).length;
  openOverlay(elements.termSheet);
}

function openComparison(compareId) {
  const comparison = window.prototypeData.comparisons[compareId];
  if (!comparison) return;
  state.currentComparisonId = compareId;
  elements.comparisonTitle.textContent = comparison.title;
  elements.comparisonLeftTitle.textContent = comparison.leftTitle;
  elements.comparisonRightTitle.textContent = comparison.rightTitle;
  elements.comparisonLeftFit.textContent = comparison.leftFit;
  elements.comparisonRightFit.textContent = comparison.rightFit;
  elements.comparisonPoints.innerHTML = comparison.differencePoints.map((point) => `<li>${point}</li>`).join("");
  elements.comparisonCaution.textContent = comparison.caution;
  openOverlay(elements.comparisonDrawer);
}

function openConsult(source) {
  state.currentConsultSource = source;
  const lines = [];

  if (source.type === "rider") {
    const rider = findRider(source.id);
    if (rider) {
      lines.push(`현재 보고 있던 항목: ${rider.label}`);
      lines.push(`현재 선택 상태: ${rider.enabled ? rider.selectedAmount : UNSELECTED_AMOUNT}`);
      lines.push(`상담으로 넘길 주제: ${rider.consultTopic}`);
      lines.push(`막힌 포인트: ${rider.helper}`);
    }
  }

  if (source.type === "term") {
    const term = window.prototypeData.terms[source.id];
    if (term) {
      lines.push(`궁금했던 용어: ${term.label}`);
      lines.push("필요했던 설명 유형: 쉬운 설명 및 차이 비교");
    }
  }

  if (source.type === "comparison") {
    const comparison = window.prototypeData.comparisons[source.id];
    if (comparison) {
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

  elements.consultContext.innerHTML = lines.map((line) => `<li>${line}</li>`).join("");
  openOverlay(elements.consultCard);
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
  highlightHintBubble.textContent = "쉬운 설명 확인해요";
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

function showHighlightHintBubble(target) {
  if (!target || state.hasShownHighlightHint) return;

  const bubble = ensureHighlightHintBubble();
  const rect = target.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const bubbleWidth = bubble.offsetWidth || 160;
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

  requestAnimationFrame(() => {
    bubble.classList.add("is-visible");
  });

  state.hasShownHighlightHint = true;
  lastScrollY = window.scrollY || window.pageYOffset || 0;
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
    showHighlightHintBubble(element);
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
      if (currentScrollY > lastScrollY + 2) {
        hideHighlightHintBubble();
      }
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

  elements.openCompareFromTerm.addEventListener("click", () => {
    const term = window.prototypeData.terms[state.currentTermId];
    const targetCompareId = term?.compareTargets?.[0];
    if (targetCompareId) openComparison(targetCompareId);
  });

  elements.openConsultFromTerm.addEventListener("click", () => {
    if (state.currentTermId) openConsult({ type: "term", id: state.currentTermId });
  });

  elements.comparisonConsultBtn.addEventListener("click", () => {
    if (state.currentComparisonId) openConsult({ type: "comparison", id: state.currentComparisonId });
  });

  elements.scrim.addEventListener("click", () => {
    closeOverlay(elements.termSheet);
    closeOverlay(elements.comparisonDrawer);
    closeOverlay(elements.consultCard);
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
