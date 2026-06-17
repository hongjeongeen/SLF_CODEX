const termDictionary = {};
const comparisonMapping = {};
const eventGuidance = {
  toggle_on: {
    title: "지금은 이 차이만 보면 돼요",
    message: "보장을 켰다고 바로 더 낫다고 보기보다, 어떤 치료 범위와 병원 조건이 포함되는지 같이 보면 이해가 쉬워져요."
  },
  toggle_off: {
    title: "미가입으로 두면 이 보장은 빠져요",
    message: "지금 뺀 항목이 진단 보장인지, 치료 범위 확장인지 나눠서 보면 비교가 더 쉬워져요."
  },
  amount_change: {
    title: "금액을 바꾸면 한도와 구조를 같이 봐요",
    message: "가입금액이 커져도 보장 횟수나 치료 인정 기준은 그대로일 수 있어요. 금액과 구조를 같이 봐야 이해가 쉬워져요."
  }
};

const consultTemplate = {
  title: "권유 없이 필요한 내용만 상담해드려요",
  introCopy: "지금 보고 있던 항목과 막혔던 지점만 전달하는 흐름이라 처음부터 다시 설명하지 않아도 되도록 맥락을 함께 넘겨드려요.",
  contextBlockTitle: "상담으로 바로 전달되는 내용"
};

const categoryNavigation = [];
const categoryGroupMapping = [];
const riderCatalog = [];
const riderCopyByCode = {};
const riderOptionCatalog = {};
const riderRuntimeSeed = {};
const riderHelperMap = {};
const riders = [];

const prototypeData = {
  terms: termDictionary,
  comparisons: comparisonMapping,
  riders,
  categories: categoryNavigation,
  categoryGroups: categoryGroupMapping,
  guideMessages: eventGuidance,
  consultTemplate
};

window.prototypeData = prototypeData;
const SUPABASE_URL = "https://hgmauxdtuqhpkqxapdlk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_oIGwf9HKBXB81boixkMEnA_uiD7owQ1";
const SUPABASE_HEADERS = {
  apikey: SUPABASE_PUBLISHABLE_KEY,
  Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
};

function splitPipeValues(value) {
  if (!value) return [];
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

async function fetchGuideView(viewName, orderClause) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${viewName}`);
  url.searchParams.set("select", "*");

  if (orderClause) {
    url.searchParams.set("order", orderClause);
  }

  const response = await fetch(url.toString(), {
    headers: {
      ...SUPABASE_HEADERS,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${viewName} fetch failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

function buildTermsFromRows(rows) {
  return rows.reduce((acc, row) => {
    acc[row.term_id] = {
      id: row.term_id,
      label: row.term_label,
      aliases: splitPipeValues(row.aliases_csv),
      plainSummary: row.plain_summary || "",
      whyItMatters: row.why_it_matters || "",
      fitCase: row.fit_case || "",
      caution: row.caution || "",
      legalNotice: row.legal_notice || "",
      compareTargets: splitPipeValues(row.compare_target_ids_csv),
      detailExamples: row.detail_example ? [row.detail_example] : []
    };
    return acc;
  }, {});
}

function buildComparisonsFromRows(rows) {
  return rows.reduce((acc, row) => {
    acc[row.comparison_id] = {
      id: row.comparison_id,
      title: row.title || [row.left_title, row.right_title].filter(Boolean).join(" vs "),
      leftTitle: row.left_title || "",
      rightTitle: row.right_title || "",
      leftFit: row.left_fit_case || "",
      rightFit: row.right_fit_case || "",
      differencePoints: [row.difference_point_1, row.difference_point_2, row.difference_point_3].filter(Boolean),
      caution: row.legal_notice || ""
    };
    return acc;
  }, {});
}

function buildGuideMessagesFromRows(rows) {
  return rows.reduce((acc, row) => {
    acc[row.trigger_type] = {
      title: row.title_template || "",
      message: row.message_template || ""
    };
    return acc;
  }, {});
}

function buildCategoriesFromRows(rows) {
  return rows
    .map((row) => ({
      majorCategory: row.major_category,
      label: row.major_label || row.major_category,
      chipSummary: row.chip_summary || "",
      description: row.major_description || "",
      order: Number(row.major_order || 100)
    }))
    .sort((left, right) => left.order - right.order);
}

function buildCategoryGroupsFromRows(rows) {
  return rows
    .map((row) => ({
      majorCategory: row.major_category,
      middleCategory: row.middle_category,
      label: row.middle_label || row.middle_category,
      order: Number(row.middle_order || 100)
    }))
    .sort((left, right) => {
      if (left.majorCategory === right.majorCategory) {
        return left.order - right.order;
      }

      return left.majorCategory.localeCompare(right.majorCategory, "ko");
    });
}

function buildConsultTemplateFromRows(rows) {
  const row = rows[0];

  if (!row) {
    return prototypeData.consultTemplate;
  }

  return {
    title: row.title || prototypeData.consultTemplate.title,
    introCopy: row.intro_copy || prototypeData.consultTemplate.introCopy,
    contextBlockTitle: row.context_block_title || prototypeData.consultTemplate.contextBlockTitle,
    primaryCta: row.primary_cta || ""
  };
}

function buildRidersFromRows(riderRows, optionRows) {
  const optionsByCode = optionRows.reduce((acc, row) => {
    if (!acc[row.product_rider_code]) {
      acc[row.product_rider_code] = [];
    }

    acc[row.product_rider_code].push(row);
    return acc;
  }, {});

  return riderRows
    .map((row) => {
      const orderedOptions = (optionsByCode[row.product_rider_code] || [])
        .slice()
        .sort((a, b) => a.option_order - b.option_order);

      const optionValues = uniqueValues(
        orderedOptions.map((option) => option.option_value_normalized || option.option_label_raw || "")
      );
      const defaultOption =
        orderedOptions.find((option) => option.is_default_option) ||
        orderedOptions.find((option) => option.is_joinable_option) ||
        orderedOptions[0];
      const selectedAmount =
        row.default_selected_amount ||
        defaultOption?.option_value_normalized ||
        defaultOption?.option_label_raw ||
        "미가입";

      return {
        id: row.rider_id,
        productRiderCode: row.product_rider_code,
        majorCategory: row.major_category || "기타",
        middleCategory: row.middle_category || "기타",
        minorCategory: row.minor_category || row.label || row.product_rider_code,
        section: row.section || "기타",
        label: row.label || row.product_rider_code,
        termIds: splitPipeValues(row.linked_term_ids),
        compareId: row.linked_comparison_id || "",
        description: row.description || row.source_tooltip_plain || "",
        consultTopic: row.consult_topic || `${row.label || row.product_rider_code} 내용을 같이 확인해요.`,
        sourceTooltipPlain: row.source_tooltip_plain || "",
        selectedAmount,
        premium: Number(row.display_monthly_premium_krw || 0),
        options: optionValues.length ? optionValues : [selectedAmount],
        helper: row.helper_text || row.consult_topic || "",
        enabled: Boolean(row.default_enabled || selectedAmount !== "미가입")
      };
    })
    .sort((left, right) => left.productRiderCode.localeCompare(right.productRiderCode, "en"));
}

window.loadPrototypeData = async function loadPrototypeData() {
  try {
    const [termRows, comparisonRows, riderRows, optionRows, guideMessageRows, consultRows, categoryRows, categoryGroupRows] =
      await Promise.all([
      fetchGuideView("guide_app_terms", "term_id.asc"),
      fetchGuideView("guide_app_comparisons", "comparison_id.asc"),
      fetchGuideView("guide_app_riders", "product_rider_code.asc"),
      fetchGuideView("guide_app_rider_options", "product_rider_code.asc,option_order.asc"),
      fetchGuideView("guide_app_guide_messages", "event_id.asc"),
      fetchGuideView("guide_app_consult_template", "template_id.asc"),
      fetchGuideView("guide_app_categories", "major_order.asc"),
      fetchGuideView("guide_app_category_groups", "major_category.asc,middle_order.asc")
    ]);

    return {
      terms: buildTermsFromRows(termRows),
      comparisons: buildComparisonsFromRows(comparisonRows),
      riders: buildRidersFromRows(riderRows, optionRows),
      categories: buildCategoriesFromRows(categoryRows),
      categoryGroups: buildCategoryGroupsFromRows(categoryGroupRows),
      guideMessages: buildGuideMessagesFromRows(guideMessageRows),
      consultTemplate: buildConsultTemplateFromRows(consultRows)
    };
  } catch (error) {
    console.warn("Supabase guide data load failed. Falling back to bundled draft data.", error);
    return prototypeData;
  }
};
