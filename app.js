const STORAGE_KEYS = {
    theme: 'universal-converter-theme',
    activeCategory: 'universal-converter-active-category',
    activeCurrencies: 'universal-converter-active-currencies'
};

const DEFAULT_ACTIVE_CURRENCIES = ['RUB', 'UZS', 'USD', 'EUR'];

const CURRENCY_PREVIEW_ITEMS = [
    { badge: 'RU', code: 'RUB', name: 'Российский рубль', value: '91,24' },
    { badge: 'UZ', code: 'UZS', name: 'Узбекский сум', value: '11 542,10' },
    { badge: 'KZ', code: 'KZT', name: 'Казахский тенге', value: '446,71' },
    { badge: 'US', code: 'USD', name: 'Доллар США', value: '1' },
    { badge: 'EU', code: 'EUR', name: 'Евро', value: '0,92' },
    { badge: 'GB', code: 'GBP', name: 'Фунт стерлингов', value: '0,79' },
    { badge: 'TR', code: 'TRY', name: 'Турецкая лира', value: '32,18' },
    { badge: 'CN', code: 'CNY', name: 'Китайский юань', value: '7,24' },
    { badge: 'JP', code: 'JPY', name: 'Японская иена', value: '155,67' },
    { badge: 'AE', code: 'AED', name: 'Дирхам ОАЭ', value: '3,67' }
];

const currencyItemsByCode = new Map(CURRENCY_PREVIEW_ITEMS.map(item => [item.code, item]));

const DEFAULT_CURRENCY_RATES = Object.fromEntries(
    CURRENCY_PREVIEW_ITEMS.map(item => [item.code, parseCurrencyLiteral(item.value)])
);

const categoryRegistry = [
    {
        id: 'pressure',
        name: 'Давление',
        shortName: 'Pressure',
        description: '',
        meta: '',
        adapter: 'factor',
        defaultValue: '1',
        defaultSourceUnit: 'pa',
        defaultActiveUnits: ['kpa', 'mpa', 'bar', 'kgfcm2', 'atm', 'mmhg'],
        units: [
            { id: 'pa', label: 'Паскаль', shortLabel: 'Па', factor: 1 },
            { id: 'kpa', label: 'Килопаскаль', shortLabel: 'кПа', factor: 1000 },
            { id: 'mpa', label: 'Мегапаскаль', shortLabel: 'МПа', factor: 1000000 },
            { id: 'bar', label: 'Бар', shortLabel: 'бар', factor: 100000 },
            { id: 'kgfcm2', label: 'кгс/см²', shortLabel: 'кгс/см²', factor: 98066.5 },
            { id: 'atm', label: 'Атмосфера', shortLabel: 'атм', factor: 101325 },
            { id: 'mmhg', label: 'Миллиметр ртутного столба', shortLabel: 'мм рт. ст.', factor: 133.322368 }
        ]
    },
    {
        id: 'temperature',
        name: 'Температура',
        shortName: 'Temperature',
        description: '',
        meta: '',
        adapter: 'temperature',
        defaultValue: '0',
        defaultSourceUnit: 'c',
        defaultActiveUnits: ['f', 'k'],
        units: [
            { id: 'c', label: 'Цельсий', shortLabel: '°C' },
            { id: 'f', label: 'Фаренгейт', shortLabel: '°F' },
            { id: 'k', label: 'Кельвин', shortLabel: 'K' }
        ]
    },
    {
        id: 'currency',
        name: 'Валюта',
        shortName: 'Currency',
        description: '',
        meta: '',
        adapter: 'planned',
        defaultValue: '1',
        defaultSourceUnit: '',
        defaultActiveUnits: [],
        units: []
    }
];

const categoriesById = new Map(categoryRegistry.map(category => [category.id, category]));

const elements = {
    appShell: document.getElementById('appShell'),
    categoryLayout: document.getElementById('categoryLayout'),
    categoryNav: document.getElementById('categoryNav'),
    categorySummary: document.getElementById('categorySummary'),
    inputPanel: document.getElementById('inputPanel'),
    calculatorToggleButton: document.getElementById('calculatorToggleButton'),
    calculatorToggleLabel: document.getElementById('calculatorToggleLabel'),
    panelTitle: document.getElementById('panelTitle'),
    inputValue: document.getElementById('inputValue'),
    inputUnit: document.getElementById('inputUnit'),
    genericInputControls: document.getElementById('genericInputControls'),
    categoryMeta: document.getElementById('categoryMeta'),
    categoryCustomContent: document.getElementById('categoryCustomContent'),
    resultsPanel: document.getElementById('resultsPanel'),
    resultsTitle: document.getElementById('resultsTitle'),
    resultsCount: document.getElementById('resultsCount'),
    resultsGrid: document.getElementById('resultsGrid'),
    currencySettingsModal: document.getElementById('currencySettingsModal'),
    currencySettingsBody: document.getElementById('currencySettingsBody'),
    closeCurrencySettings: document.getElementById('closeCurrencySettings'),
    themeToggle: document.getElementById('themeToggle'),
    themeToggleIcon: document.getElementById('themeToggleIcon'),
    themeToggleLabel: document.getElementById('themeToggleLabel'),
    toast: document.getElementById('toast'),
    toastLabel: document.getElementById('toastLabel')
};

const state = {
    activeCategoryId: getInitialCategoryId(),
    activeCurrencies: getInitialCurrencySelection(),
    currencyBaseUsdAmount: 1,
    currencyDraftValue: null,
    currencyCalculatorExpression: '',
    currencyCalculatorLastOperand: null,
    currencyCalculatorLastOperator: null,
    currencyCalculatorPendingOperator: null,
    currencyCalculatorShouldResetDisplay: false,
    currencyCalculatorStoredValue: null,
    currencyCalculatorValue: '0',
    currencyLastActiveCode: 'USD',
    currencyRates: { ...DEFAULT_CURRENCY_RATES },
    dragCurrencyCode: null,
    dragTargetCode: null,
    dragTargetPosition: null,
    isCurrencyCalculatorOpen: false,
    isCurrencySettingsOpen: false,
    values: {},
    sourceUnits: {}
};

let toastTimeout;

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    applyStoredTheme();
    ensureCurrencyState();
    renderCategoryNavigation();
    renderCurrencySettingsModal();
    ensureCategoryState(getActiveCategory());
    attachEventListeners();
    renderActiveCategory();
}

function attachEventListeners() {
    elements.inputValue.addEventListener('input', () => {
        const category = getActiveCategory();
        state.values[category.id] = elements.inputValue.value;
        renderResults();
    });

    elements.inputUnit.addEventListener('change', () => {
        const category = getActiveCategory();
        state.sourceUnits[category.id] = elements.inputUnit.value;
        renderResults();
    });

    elements.calculatorToggleButton.addEventListener('click', () => {
        setCurrencyCalculatorVisibility(!state.isCurrencyCalculatorOpen);
    });

    elements.categoryNav.addEventListener('click', event => {
        const button = event.target.closest('[data-category-id]');
        if (!button) {
            return;
        }

        const nextCategoryId = button.dataset.categoryId;
        if (!categoriesById.has(nextCategoryId) || nextCategoryId === state.activeCategoryId) {
            return;
        }

        state.activeCategoryId = nextCategoryId;
        localStorage.setItem(STORAGE_KEYS.activeCategory, nextCategoryId);
        ensureCategoryState(getActiveCategory());
        renderActiveCategory();
    });

    elements.resultsGrid.addEventListener('pointerdown', event => {
        const calculatorButton = event.target.closest('[data-calculator-action]');
        if (calculatorButton) {
            event.preventDefault();
            applyCurrencyCalculatorAction(calculatorButton.dataset.calculatorAction);
        }
    });

    elements.resultsGrid.addEventListener('input', event => {
        const input = event.target.closest('.currency-calculator-input');
        if (!input) {
            return;
        }

        handleCurrencyCalculatorInput(input.value, input);
    });

    elements.resultsGrid.addEventListener('click', event => {
        const calculatorToggle = event.target.closest('[data-action="show-currency-calculator"], [data-action="hide-currency-calculator"]');
        if (calculatorToggle) {
            setCurrencyCalculatorVisibility(calculatorToggle.dataset.action === 'show-currency-calculator');
            return;
        }

        const calculatorButton = event.target.closest('[data-calculator-action]');
        if (calculatorButton) {
            if (event.detail === 0) {
                applyCurrencyCalculatorAction(calculatorButton.dataset.calculatorAction);
            }

            return;
        }

        const button = event.target.closest('[data-copy-value]');
        if (!button) {
            return;
        }

        copyValue(button.dataset.copyValue, button.dataset.copyLabel || 'Скопировано в буфер');
    });

    elements.categoryCustomContent.addEventListener('click', event => {
        const copyButton = event.target.closest('[data-copy-value]');
        if (copyButton) {
            copyValue(copyButton.dataset.copyValue, copyButton.dataset.copyLabel || 'Скопировано в буфер');
            return;
        }

        const openButton = event.target.closest('[data-action="open-currency-settings"]');
        if (openButton) {
            openCurrencySettings();
            return;
        }

        const moveButton = event.target.closest('[data-action="move-currency-top"]');
        if (!moveButton) {
            return;
        }

        moveCurrencyToTop(moveButton.dataset.currencyCode);
    });

    elements.categoryCustomContent.addEventListener('focusin', event => {
        const input = event.target.closest('.currency-input[data-currency-code]');
        if (!input) {
            return;
        }

        state.currencyLastActiveCode = input.dataset.currencyCode;
        state.currencyDraftValue = input.value;
    });

    elements.categoryCustomContent.addEventListener('input', event => {
        const input = event.target.closest('.currency-input[data-currency-code]');
        if (!input) {
            return;
        }

        handleCurrencyInput(input.dataset.currencyCode, input.value, input);
    });

    elements.categoryCustomContent.addEventListener('focusout', event => {
        const input = event.target.closest('.currency-input[data-currency-code]');
        if (!input) {
            return;
        }

        finalizeCurrencyInput();
    });

    elements.currencySettingsModal.addEventListener('click', event => {
        if (event.target === elements.currencySettingsModal || event.target.closest('[data-action="close-currency-settings"]')) {
            closeCurrencySettings();
        }
    });

    elements.currencySettingsBody.addEventListener('change', event => {
        const checkbox = event.target.closest('input[data-currency-code]');
        if (!checkbox) {
            return;
        }

        toggleCurrencySelection(checkbox.dataset.currencyCode, checkbox.checked);
    });

    elements.currencySettingsBody.addEventListener('dragstart', event => {
        const option = event.target.closest('.settings-option[data-currency-code]');
        if (!option || option.dataset.activeCurrency !== 'true') {
            event.preventDefault();
            return;
        }

        state.dragCurrencyCode = option.dataset.currencyCode;
        state.dragTargetCode = null;
        state.dragTargetPosition = null;

        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', state.dragCurrencyCode);
        }

        requestAnimationFrame(() => {
            option.classList.add('is-dragging');
        });
    });

    elements.currencySettingsBody.addEventListener('dragover', event => {
        const option = event.target.closest('.settings-option[data-currency-code]');
        if (!option || option.dataset.activeCurrency !== 'true' || !state.dragCurrencyCode) {
            return;
        }

        if (option.dataset.currencyCode === state.dragCurrencyCode) {
            clearCurrencyDropTarget();
            return;
        }

        event.preventDefault();

        const optionBounds = option.getBoundingClientRect();
        const position = event.clientY < optionBounds.top + optionBounds.height / 2 ? 'before' : 'after';

        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }

        setCurrencyDropTarget(option.dataset.currencyCode, position);
    });

    elements.currencySettingsBody.addEventListener('drop', event => {
        const option = event.target.closest('.settings-option[data-currency-code]');
        if (!option || option.dataset.activeCurrency !== 'true' || !state.dragCurrencyCode) {
            return;
        }

        if (option.dataset.currencyCode === state.dragCurrencyCode) {
            resetCurrencyDragState();
            return;
        }

        event.preventDefault();
        moveCurrencyByDrop(state.dragCurrencyCode, option.dataset.currencyCode, state.dragTargetPosition || 'before');
        resetCurrencyDragState();
    });

    elements.currencySettingsBody.addEventListener('dragend', () => {
        resetCurrencyDragState();
    });

    elements.currencySettingsBody.addEventListener('dragleave', event => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            clearCurrencyDropTarget();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && state.isCurrencySettingsOpen) {
            closeCurrencySettings();
        }
    });

    elements.themeToggle.addEventListener('click', toggleTheme);
}

function renderCategoryNavigation() {
    elements.categoryNav.innerHTML = categoryRegistry.map(category => `
        <button
            type="button"
            data-category-id="${category.id}"
            class="category-pill ${category.id === state.activeCategoryId ? 'is-active' : ''} rounded-full px-4 py-3 text-sm font-bold uppercase tracking-[0.18em]"
            aria-pressed="${category.id === state.activeCategoryId}"
        >
            <span class="block text-left">${category.name}</span>
            <span class="mt-1 block text-[0.65rem] font-semibold uppercase tracking-[0.22em] opacity-80">${category.shortName}</span>
        </button>
    `).join('');
}

function renderActiveCategory() {
    const category = getActiveCategory();
    ensureCategoryState(category);
    ensureCurrencyState();

    renderCategoryNavigation();
    applyCategorySurface(category);
    updateResultsHeaderState(category);

    elements.categorySummary.textContent = category.description;
    elements.categorySummary.classList.toggle('is-hidden', !category.description);
    elements.panelTitle.textContent = category.name;
    elements.categoryMeta.textContent = category.meta;
    elements.categoryMeta.classList.toggle('is-hidden', !category.meta || category.id === 'currency');
    elements.inputValue.value = state.values[category.id];

    populateSourceUnits(category);
    renderResults();
}

function applyCategorySurface(category) {
    const isCurrencyCategory = category.id === 'currency';
    elements.appShell.dataset.activeCategory = category.id;
    elements.genericInputControls.classList.toggle('is-hidden', isCurrencyCategory);
    elements.resultsCount.classList.toggle('is-hidden', isCurrencyCategory);
    elements.categoryCustomContent.innerHTML = isCurrencyCategory ? renderCurrencyPreviewPanel() : '';
}

function populateSourceUnits(category) {
    if (category.units.length === 0) {
        elements.inputUnit.innerHTML = '<option value="">Будет подключено позже</option>';
        elements.inputUnit.disabled = true;
        elements.inputValue.disabled = true;
        return;
    }

    elements.inputUnit.disabled = false;
    elements.inputValue.disabled = false;

    elements.inputUnit.innerHTML = category.units.map(unit => `
        <option value="${unit.id}">${unit.shortLabel} · ${unit.label}</option>
    `).join('');

    const sourceUnitId = state.sourceUnits[category.id];
    elements.inputUnit.value = category.units.some(unit => unit.id === sourceUnitId)
        ? sourceUnitId
        : category.defaultSourceUnit;
}

function renderResults() {
    const category = getActiveCategory();
    updateCurrencyLayoutState(category);
    updateResultsHeaderState(category);

    if (state.isCurrencyCalculatorOpen) {
        elements.resultsCount.textContent = '';
        elements.resultsGrid.innerHTML = renderCurrencyCalculatorPanel();
    } else {
        elements.resultsGrid.innerHTML = '';
    }

    if (category.id === 'currency') {
        elements.resultsCount.textContent = '';
        elements.categoryCustomContent.innerHTML = renderCurrencyPreviewPanel();
        return;
    }

    const rawValue = elements.inputValue.value.trim();
    if (!rawValue) {
        elements.resultsCount.textContent = '0';
        elements.categoryCustomContent.innerHTML = renderInfoState('Введите число, чтобы получить пересчет по активным единицам.');
        return;
    }

    const parsedValue = parseInputValue(rawValue);
    if (Number.isNaN(parsedValue)) {
        elements.resultsCount.textContent = 'error';
        elements.categoryCustomContent.innerHTML = renderInfoState('Не удалось распознать число. Используйте только цифры, знак минус, точку или запятую.');
        return;
    }

    const sourceUnitId = elements.inputUnit.value;
    state.values[category.id] = elements.inputValue.value;
    state.sourceUnits[category.id] = sourceUnitId;

    const conversionResults = convertCategoryValue(category, parsedValue, sourceUnitId);
    elements.resultsCount.textContent = String(conversionResults.length);

    elements.categoryCustomContent.innerHTML = conversionResults.map(result => `
        <article class="result-card rounded-[1.35rem] p-4 sm:p-5">
            <div class="flex items-start justify-between gap-4">
                <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold uppercase tracking-[0.24em]" style="color: var(--text-soft);">${result.unit.shortLabel}</p>
                    <h3 class="mt-2 text-lg font-bold sm:text-xl">${result.unit.label}</h3>
                    <p class="mt-3 break-all text-2xl font-extrabold sm:text-3xl">${result.formattedValue}</p>
                </div>

                <button
                    type="button"
                    class="copy-button rounded-2xl p-3"
                    title="Скопировать значение"
                    aria-label="Скопировать ${result.unit.label}"
                    data-copy-value="${result.rawValue}"
                    data-copy-label="Скопировано: ${result.unit.shortLabel}"
                    style="background: var(--accent-soft); color: var(--accent); border: 1px solid rgba(184, 93, 24, 0.2);"
                >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </button>
            </div>
        </article>
    `).join('');
}

function renderInfoState(message) {
    return `
        <article class="result-card rounded-[1.35rem] p-5 sm:p-6">
            <p class="text-sm leading-6" style="color: var(--text-soft);">${message}</p>
        </article>
    `;
}

function updateCurrencyLayoutState(category = getActiveCategory()) {
    const isCollapsed = !state.isCurrencyCalculatorOpen;
    elements.categoryLayout.classList.toggle('is-currency-collapsed', isCollapsed);
}

function updateResultsHeaderState(category = getActiveCategory()) {
    elements.resultsTitle.textContent = state.isCurrencyCalculatorOpen
        ? 'Калькулятор'
        : category.id === 'currency'
            ? 'Калькулятор'
            : `${category.name}: мгновенный пересчет`;

    elements.resultsCount.classList.toggle('is-hidden', category.id === 'currency' || state.isCurrencyCalculatorOpen);
    elements.calculatorToggleLabel.textContent = 'Калькулятор';
    elements.calculatorToggleButton.setAttribute('aria-pressed', String(state.isCurrencyCalculatorOpen));
}

function renderCurrencyPreviewPanel() {
    const activeItems = getActiveCurrencyItems();

    return `
        <section class="currency-preview">
            <div class="currency-preview-header">
                <div class="currency-preview-controls">
                    <span class="currency-chip">17.05.2026</span>
                    <span class="currency-chip is-muted">USD</span>
                    <button type="button" class="currency-help" data-action="open-currency-settings" aria-label="Выбор валют">⚙</button>
                </div>
            </div>

            <div class="currency-preview-list">
                ${activeItems.map(renderCurrencyPreviewRow).join('')}
            </div>

            <button type="button" class="currency-settings-btn" data-action="open-currency-settings">
                <span aria-hidden="true">+</span>
                <span>Настройки</span>
            </button>
        </section>
    `;
}

function renderCurrencyPreviewRow(item) {
    const displayValue = escapeHtmlAttribute(getCurrencyInputDisplayValue(item.code));

    return `
        <article class="currency-preview-row">
            <div class="currency-row-label">
                <span class="currency-flag" aria-hidden="true">${item.badge}</span>
                <div>
                    <div class="currency-row-code">${item.code}</div>
                    <div class="currency-row-name">${item.name}</div>
                </div>
            </div>
            <input
                type="text"
                inputmode="decimal"
                autocomplete="off"
                spellcheck="false"
                class="currency-row-input currency-input"
                data-currency-code="${item.code}"
                value="${displayValue}"
                placeholder="0"
                aria-label="Сумма в ${item.code}"
            >
            <button type="button" class="currency-row-action" data-action="move-currency-top" data-currency-code="${item.code}" aria-label="Поднять ${item.code} наверх">↑</button>
        </article>
    `;
}

function renderCurrencyCalculatorPanel() {
    const displayValue = escapeHtmlAttribute(getCurrencyCalculatorDisplayValue());
    const expressionValue = state.currencyCalculatorExpression
        ? escapeHtmlAttribute(state.currencyCalculatorExpression)
        : '&#160;';

    return `
        <section class="currency-calculator">
            <article class="currency-calculator-display">
                <div class="currency-calculator-expression">${expressionValue}</div>
                <input
                    type="text"
                    inputmode="decimal"
                    autocomplete="off"
                    spellcheck="false"
                    class="currency-calculator-input"
                    value="${displayValue}"
                    placeholder="0"
                    aria-label="Поле калькулятора"
                >
            </article>

            <div class="currency-calculator-keypad">
                ${renderCalculatorButton('percent', '%')}
                ${renderCalculatorButton('clear-entry', 'CE')}
                ${renderCalculatorButton('clear-all', 'C', 'is-danger')}
                ${renderCalculatorButton('backspace', '⌫')}
                ${renderCalculatorButton('reciprocal', '1/x')}
                ${renderCalculatorButton('square', 'x²')}
                ${renderCalculatorButton('sqrt', '√x')}
                ${renderCalculatorButton('divide', '÷', 'is-operator')}
                ${renderCalculatorButton('digit-7', '7')}
                ${renderCalculatorButton('digit-8', '8')}
                ${renderCalculatorButton('digit-9', '9')}
                ${renderCalculatorButton('multiply', '×', 'is-operator')}
                ${renderCalculatorButton('digit-4', '4')}
                ${renderCalculatorButton('digit-5', '5')}
                ${renderCalculatorButton('digit-6', '6')}
                ${renderCalculatorButton('subtract', '−', 'is-operator')}
                ${renderCalculatorButton('digit-1', '1')}
                ${renderCalculatorButton('digit-2', '2')}
                ${renderCalculatorButton('digit-3', '3')}
                ${renderCalculatorButton('add', '+', 'is-operator')}
                ${renderCalculatorButton('sign', '±')}
                ${renderCalculatorButton('digit-0', '0')}
                ${renderCalculatorButton('decimal', ',')}
                ${renderCalculatorButton('equals', '=', 'is-equals')}
            </div>
        </section>
    `;
}

function renderCalculatorButton(action, label, extraClass = '') {
    const className = ['currency-calculator-button', extraClass].filter(Boolean).join(' ');

    return `
        <button type="button" class="${className}" data-calculator-action="${action}">${label}</button>
    `;
}

function renderCurrencyEmptyState() {
    return `
        <article class="currency-summary-card" style="grid-column: 1 / -1;">
            <span class="currency-summary-label">Пусто</span>
            <div class="currency-summary-value">—</div>
        </article>
    `;
}

function renderCurrencySummaryCard(item) {
    const value = getCurrencyAmount(item.code);

    return `
        <article class="currency-summary-card">
            <div class="flex items-center justify-between gap-3">
                <span class="currency-summary-label">${item.code}</span>
                <span class="currency-flag" aria-hidden="true">${item.badge}</span>
            </div>
            <div class="currency-summary-value">${value === null ? '—' : formatCurrencyAmount(value)}</div>
        </article>
    `;
}

function renderCurrencySettingsModal() {
    elements.currencySettingsModal.classList.toggle('hidden', !state.isCurrencySettingsOpen);
    elements.currencySettingsModal.setAttribute('aria-hidden', String(!state.isCurrencySettingsOpen));
    document.body.classList.toggle('modal-open', state.isCurrencySettingsOpen);
    elements.currencySettingsBody.innerHTML = getCurrencySettingsItems().map(item => `
        <div class="settings-option ${state.activeCurrencies.includes(item.code) ? 'is-draggable' : ''}" data-currency-code="${item.code}" data-active-currency="${state.activeCurrencies.includes(item.code)}" draggable="${state.activeCurrencies.includes(item.code)}">
            <label class="settings-option-main">
                <input type="checkbox" data-currency-code="${item.code}" ${state.activeCurrencies.includes(item.code) ? 'checked' : ''}>
                <span class="currency-flag" aria-hidden="true">${item.badge}</span>
                <span>
                    <span class="settings-option-code">${item.code}</span>
                    <span class="settings-option-name">${item.name}</span>
                </span>
            </label>
            <span class="settings-drag-handle ${state.activeCurrencies.includes(item.code) ? '' : 'is-disabled'}" aria-hidden="true">::::</span>
        </div>
    `).join('');
}

function openCurrencySettings() {
    state.isCurrencySettingsOpen = true;
    renderCurrencySettingsModal();
}

function closeCurrencySettings() {
    state.isCurrencySettingsOpen = false;
    resetCurrencyDragState();
    renderCurrencySettingsModal();
}

function toggleCurrencySelection(code, isEnabled) {
    if (!currencyItemsByCode.has(code)) {
        return;
    }

    if (isEnabled) {
        if (!state.activeCurrencies.includes(code)) {
            state.activeCurrencies.push(code);
        }
    } else {
        if (state.activeCurrencies.length === 1) {
            showToast('Оставьте хотя бы одну валюту');
            renderCurrencySettingsModal();
            return;
        }

        state.activeCurrencies = state.activeCurrencies.filter(activeCode => activeCode !== code);
    }

    persistCurrencyState();
}

function getActiveCurrencyItems() {
    return state.activeCurrencies
        .map(code => currencyItemsByCode.get(code))
        .filter(Boolean);
}

function getCurrencyInputDisplayValue(code) {
    if (code === state.currencyLastActiveCode && state.currencyDraftValue !== null) {
        return state.currencyDraftValue;
    }

    const amount = getCurrencyAmount(code);
    return amount === null ? '' : formatCurrencyAmount(amount);
}

function getCurrencySettingsItems() {
    const activeItems = getActiveCurrencyItems();
    const inactiveItems = CURRENCY_PREVIEW_ITEMS.filter(item => !state.activeCurrencies.includes(item.code));
    return [...activeItems, ...inactiveItems];
}

function moveCurrencyToTop(code) {
    if (!state.activeCurrencies.includes(code) || state.activeCurrencies[0] === code) {
        return;
    }

    state.activeCurrencies = state.activeCurrencies.filter(activeCode => activeCode !== code);
    state.activeCurrencies.unshift(code);
    persistCurrencyState();
}

function persistCurrencyState() {
    ensureCurrencyState();
    localStorage.setItem(STORAGE_KEYS.activeCurrencies, JSON.stringify(state.activeCurrencies));

    if (getActiveCategory().id === 'currency') {
        applyCategorySurface(getActiveCategory());
        renderResults();
    }

    renderCurrencySettingsModal();
}

function convertCategoryValue(category, value, sourceUnitId) {
    const sourceUnit = category.units.find(unit => unit.id === sourceUnitId);
    if (!sourceUnit) {
        return [];
    }

    const targetUnits = getTargetUnits(category, sourceUnitId);

    return targetUnits.map(unit => {
        const rawValue = convertValueByAdapter(category.adapter, value, sourceUnit, unit);
        return {
            unit,
            rawValue: String(rawValue),
            formattedValue: formatNumber(rawValue)
        };
    });
}

function getTargetUnits(category, sourceUnitId) {
    const preferredOrder = category.defaultActiveUnits.length > 0
        ? category.defaultActiveUnits
        : category.units.map(unit => unit.id);

    return preferredOrder
        .filter(unitId => unitId !== sourceUnitId)
        .map(unitId => category.units.find(unit => unit.id === unitId))
        .filter(Boolean);
}

function convertValueByAdapter(adapter, value, sourceUnit, targetUnit) {
    if (adapter === 'factor') {
        const valueInBase = value * sourceUnit.factor;
        return valueInBase / targetUnit.factor;
    }

    if (adapter === 'temperature') {
        const valueInCelsius = toCelsius(value, sourceUnit.id);
        return fromCelsius(valueInCelsius, targetUnit.id);
    }

    return value;
}

function toCelsius(value, unitId) {
    if (unitId === 'c') {
        return value;
    }

    if (unitId === 'f') {
        return (value - 32) * 5 / 9;
    }

    if (unitId === 'k') {
        return value - 273.15;
    }

    return value;
}

function fromCelsius(value, unitId) {
    if (unitId === 'c') {
        return value;
    }

    if (unitId === 'f') {
        return value * 9 / 5 + 32;
    }

    if (unitId === 'k') {
        return value + 273.15;
    }

    return value;
}

function parseInputValue(value) {
    const normalized = value.replace(/\s+/g, '').replace(',', '.');
    if (!normalized || normalized === '-' || normalized === '.' || normalized === '-.') {
        return Number.NaN;
    }

    return Number.parseFloat(normalized);
}

function formatNumber(value) {
    if (!Number.isFinite(value)) {
        return '—';
    }

    if (value === 0) {
        return '0';
    }

    const absoluteValue = Math.abs(value);
    if (absoluteValue >= 1e9 || absoluteValue < 1e-6) {
        return value.toExponential(6).replace(/\.0+e/, 'e').replace(/(\.\d*?[1-9])0+e/, '$1e');
    }

    const rounded = Number.parseFloat(value.toPrecision(12));
    const maximumFractionDigits = absoluteValue >= 1000 ? 4 : absoluteValue >= 1 ? 6 : 8;
    return new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits,
        useGrouping: true
    }).format(rounded);
}

function copyValue(value, label) {
    const normalizedValue = formatNumber(Number.parseFloat(value));

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(normalizedValue)
            .then(() => showToast(label))
            .catch(() => fallbackCopy(normalizedValue, label));
        return;
    }

    fallbackCopy(normalizedValue, label);
}

function fallbackCopy(value, label) {
    const textArea = document.createElement('textarea');
    textArea.value = value;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        showToast(label);
    } catch (error) {
        console.error('Ошибка копирования:', error);
    }

    document.body.removeChild(textArea);
}

function showToast(label) {
    elements.toastLabel.textContent = label;
    elements.toast.classList.add('toast-visible');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        elements.toast.classList.remove('toast-visible');
    }, 1800);
}

function applyStoredTheme() {
    const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    updateThemeToggle(theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
    updateThemeToggle(nextTheme);
}

function updateThemeToggle(theme) {
    elements.themeToggleIcon.textContent = theme === 'dark' ? '☀' : '◐';
    elements.themeToggleLabel.textContent = theme === 'dark' ? 'Светлая тема' : 'Темная тема';
}

function ensureCategoryState(category) {
    if (!Object.prototype.hasOwnProperty.call(state.values, category.id)) {
        state.values[category.id] = category.defaultValue;
    }

    if (!Object.prototype.hasOwnProperty.call(state.sourceUnits, category.id)) {
        state.sourceUnits[category.id] = category.defaultSourceUnit;
    }
}

function getActiveCategory() {
    return categoriesById.get(state.activeCategoryId) || categoryRegistry[0];
}

function getInitialCategoryId() {
    const storedCategory = localStorage.getItem(STORAGE_KEYS.activeCategory);
    return categoriesById.has(storedCategory) ? storedCategory : categoryRegistry[0].id;
}

function getInitialCurrencySelection() {
    const storedValue = localStorage.getItem(STORAGE_KEYS.activeCurrencies);
    if (!storedValue) {
        return DEFAULT_ACTIVE_CURRENCIES.filter(code => currencyItemsByCode.has(code));
    }

    try {
        const parsedValue = JSON.parse(storedValue);
        if (!Array.isArray(parsedValue)) {
            return DEFAULT_ACTIVE_CURRENCIES.filter(code => currencyItemsByCode.has(code));
        }

        const filteredCodes = parsedValue.filter(code => currencyItemsByCode.has(code));
        return filteredCodes.length > 0 ? filteredCodes : DEFAULT_ACTIVE_CURRENCIES.filter(code => currencyItemsByCode.has(code));
    } catch (error) {
        console.error('Ошибка чтения выбранных валют:', error);
        return DEFAULT_ACTIVE_CURRENCIES.filter(code => currencyItemsByCode.has(code));
    }
}

function moveCurrencyByDrop(dragCode, targetCode, position) {
    if (!state.activeCurrencies.includes(dragCode) || !state.activeCurrencies.includes(targetCode) || dragCode === targetCode) {
        return;
    }

    const nextOrder = state.activeCurrencies.filter(code => code !== dragCode);
    const targetIndex = nextOrder.indexOf(targetCode);
    const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;

    nextOrder.splice(insertIndex, 0, dragCode);
    state.activeCurrencies = nextOrder;
    persistCurrencyState();
}

function setCurrencyDropTarget(code, position) {
    if (state.dragTargetCode === code && state.dragTargetPosition === position) {
        return;
    }

    clearCurrencyDropTarget();
    state.dragTargetCode = code;
    state.dragTargetPosition = position;

    const targetOption = elements.currencySettingsBody.querySelector(`.settings-option[data-currency-code="${code}"]`);
    if (!targetOption) {
        return;
    }

    targetOption.classList.add(position === 'after' ? 'is-drop-after' : 'is-drop-before');
}

function clearCurrencyDropTarget() {
    state.dragTargetCode = null;
    state.dragTargetPosition = null;

    elements.currencySettingsBody
        .querySelectorAll('.settings-option.is-drop-before, .settings-option.is-drop-after')
        .forEach(option => option.classList.remove('is-drop-before', 'is-drop-after'));
}

function resetCurrencyDragState() {
    state.dragCurrencyCode = null;
    clearCurrencyDropTarget();

    elements.currencySettingsBody
        .querySelectorAll('.settings-option.is-dragging')
        .forEach(option => option.classList.remove('is-dragging'));
}

function ensureCurrencyState() {
    const availableCodes = state.activeCurrencies.filter(code => currencyItemsByCode.has(code));
    const fallbackCode = availableCodes.includes('USD') ? 'USD' : availableCodes[0] || 'USD';

    if (!availableCodes.includes(state.currencyLastActiveCode)) {
        state.currencyLastActiveCode = fallbackCode;
        state.currencyDraftValue = null;
    }

    if (typeof state.currencyBaseUsdAmount === 'undefined') {
        state.currencyBaseUsdAmount = 1;
    }
}

function handleCurrencyInput(code, rawValue, inputElement = null) {
    state.currencyLastActiveCode = code;
    state.currencyDraftValue = formatCurrencyInputDraft(rawValue);

    if (inputElement) {
        inputElement.value = state.currencyDraftValue;
    }

    if (!rawValue.trim()) {
        state.currencyBaseUsdAmount = null;
        refreshCurrencyInputs(code);
        renderResults();
        return;
    }

    const parsedValue = parseCurrencyNumber(rawValue);
    if (Number.isNaN(parsedValue)) {
        refreshCurrencyInputs(code);
        renderResults();
        return;
    }

    const rate = getCurrencyRate(code);
    if (!rate) {
        return;
    }

    state.currencyBaseUsdAmount = code === 'USD' ? parsedValue : parsedValue / rate;
    refreshCurrencyInputs(code);
    renderResults();
}

function finalizeCurrencyInput() {
    state.currencyDraftValue = null;
    refreshCurrencyInputs();
    renderResults();
}

function refreshCurrencyInputs(activeCode = null) {
    const inputs = elements.categoryCustomContent.querySelectorAll('.currency-input[data-currency-code]');

    inputs.forEach(input => {
        const code = input.dataset.currencyCode;
        if (activeCode && code === activeCode) {
            return;
        }

        input.value = getCurrencyInputDisplayValue(code);
    });
}

function getCurrencyRate(code) {
    return state.currencyRates[code] ?? DEFAULT_CURRENCY_RATES[code] ?? null;
}

function getCurrencyAmount(code) {
    if (state.currencyBaseUsdAmount === null) {
        return null;
    }

    const rate = getCurrencyRate(code);
    if (!rate) {
        return null;
    }

    return code === 'USD' ? state.currencyBaseUsdAmount : state.currencyBaseUsdAmount * rate;
}

function formatCurrencyAmount(value) {
    if (value === null || !Number.isFinite(value)) {
        return '';
    }

    return new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
    }).format(value).replace(/[\s\u00A0\u202F]/g, ' ');
}

function parseCurrencyNumber(value) {
    if (!value) {
        return Number.NaN;
    }

    const normalized = value.replace(/[\s\u00A0\u202F]/g, '').replace(',', '.');
    if (!normalized || normalized === '-' || normalized === '.' || normalized === '-.') {
        return Number.NaN;
    }

    return Number.parseFloat(normalized);
}

function formatCurrencyInputDraft(value) {
    if (!value) {
        return '';
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return '';
    }

    const normalizedValue = trimmedValue.replace(/[\s\u00A0\u202F]/g, '').replace('.', ',');
    const hasTrailingComma = normalizedValue.endsWith(',');
    const sign = normalizedValue.startsWith('-') ? '-' : '';
    const unsignedValue = sign ? normalizedValue.slice(1) : normalizedValue;
    const [integerPartRaw = '', decimalPartRaw = ''] = unsignedValue.split(',');
    const integerDigits = integerPartRaw.replace(/\D/g, '');
    const decimalDigits = decimalPartRaw.replace(/\D/g, '');

    if (!integerDigits && !decimalDigits) {
        return sign;
    }

    const formattedIntegerPart = integerDigits
        ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number.parseInt(integerDigits, 10))
        : '0';

    if (hasTrailingComma) {
        return `${sign}${formattedIntegerPart},`;
    }

    if (decimalDigits) {
        return `${sign}${formattedIntegerPart},${decimalDigits}`;
    }

    return `${sign}${formattedIntegerPart}`;
}

function parseCurrencyLiteral(value) {
    return Number.parseFloat(value.replace(/[\s\u00A0\u202F]/g, '').replace(',', '.'));
}

function escapeHtmlAttribute(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function applyCurrencyCalculatorAction(action) {
    if (getActiveCategory().id !== 'currency' || !state.isCurrencyCalculatorOpen) {
        return;
    }

    if (action.startsWith('digit-')) {
        appendCurrencyCalculatorDigit(action.slice(6));
    } else if (action === 'decimal') {
        appendCurrencyCalculatorDecimal();
    } else if (action === 'sign') {
        toggleCurrencyCalculatorSign();
    } else if (action === 'clear-entry') {
        clearCurrencyCalculatorEntry();
    } else if (action === 'clear-all') {
        resetCurrencyCalculator();
    } else if (action === 'backspace') {
        backspaceCurrencyCalculatorValue();
    } else if (action === 'percent') {
        applyCurrencyCalculatorPercent();
    } else if (action === 'reciprocal' || action === 'square' || action === 'sqrt') {
        applyCurrencyCalculatorUnaryOperation(action);
    } else if (action === 'divide' || action === 'multiply' || action === 'subtract' || action === 'add') {
        applyCurrencyCalculatorOperator(action);
    } else if (action === 'equals') {
        applyCurrencyCalculatorEquals();
    }

    renderResults();
    focusCurrencyCalculatorInput();
}

function getCurrencyCalculatorDisplayValue() {
    return state.currencyCalculatorValue || '0';
}

function getCurrencyCalculatorRawValue() {
    return getCurrencyCalculatorDisplayValue().replace(/[\s\u00A0\u202F]/g, '');
}

function appendCurrencyDigit(currentRawValue, digit) {
    if (!currentRawValue || currentRawValue === '0') {
        return digit;
    }

    if (currentRawValue === '-0') {
        return `-${digit}`;
    }

    return `${currentRawValue}${digit}`;
}

function handleCurrencyCalculatorInput(rawValue, inputElement = null) {
    state.currencyCalculatorValue = normalizeCurrencyCalculatorDisplay(rawValue);
    state.currencyCalculatorShouldResetDisplay = false;

    if (!state.currencyCalculatorPendingOperator) {
        state.currencyCalculatorExpression = '';
        state.currencyCalculatorStoredValue = null;
        state.currencyCalculatorLastOperand = null;
        state.currencyCalculatorLastOperator = null;
    }

    if (inputElement) {
        inputElement.value = state.currencyCalculatorValue;
    }
}

function setCurrencyCalculatorVisibility(isOpen) {
    state.isCurrencyCalculatorOpen = isOpen;
    renderResults();

    if (isOpen) {
        focusCurrencyCalculatorInput();
    }
}

function resetCurrencyCalculator() {
    state.currencyCalculatorExpression = '';
    state.currencyCalculatorLastOperand = null;
    state.currencyCalculatorLastOperator = null;
    state.currencyCalculatorPendingOperator = null;
    state.currencyCalculatorShouldResetDisplay = false;
    state.currencyCalculatorStoredValue = null;
    state.currencyCalculatorValue = '0';
}

function clearCurrencyCalculatorEntry() {
    state.currencyCalculatorValue = '0';
    state.currencyCalculatorShouldResetDisplay = false;

    if (!state.currencyCalculatorPendingOperator) {
        state.currencyCalculatorExpression = '';
        state.currencyCalculatorStoredValue = null;
    }
}

function appendCurrencyCalculatorDigit(digit) {
    const currentRawValue = state.currencyCalculatorShouldResetDisplay ? '' : getCurrencyCalculatorRawValue();
    state.currencyCalculatorValue = normalizeCurrencyCalculatorDisplay(appendCurrencyDigit(currentRawValue, digit));
    state.currencyCalculatorShouldResetDisplay = false;
}

function appendCurrencyCalculatorDecimal() {
    const currentRawValue = state.currencyCalculatorShouldResetDisplay ? '' : getCurrencyCalculatorRawValue();
    if (currentRawValue.includes(',')) {
        return;
    }

    state.currencyCalculatorValue = normalizeCurrencyCalculatorDisplay(currentRawValue ? `${currentRawValue},` : '0,');
    state.currencyCalculatorShouldResetDisplay = false;
}

function toggleCurrencyCalculatorSign() {
    const currentRawValue = getCurrencyCalculatorRawValue();
    if (!currentRawValue || /^-?0(?:,0*)?$/.test(currentRawValue)) {
        return;
    }

    state.currencyCalculatorValue = normalizeCurrencyCalculatorDisplay(
        currentRawValue.startsWith('-') ? currentRawValue.slice(1) : `-${currentRawValue}`
    );
    state.currencyCalculatorShouldResetDisplay = false;
}

function backspaceCurrencyCalculatorValue() {
    if (state.currencyCalculatorShouldResetDisplay) {
        state.currencyCalculatorValue = '0';
        state.currencyCalculatorShouldResetDisplay = false;
        return;
    }

    const nextRawValue = getCurrencyCalculatorRawValue().slice(0, -1);
    state.currencyCalculatorValue = normalizeCurrencyCalculatorDisplay(nextRawValue);
}

function applyCurrencyCalculatorPercent() {
    const currentValue = getCurrencyCalculatorNumber();
    const hasPendingOperator = state.currencyCalculatorPendingOperator && state.currencyCalculatorStoredValue !== null;
    const nextValue = hasPendingOperator
        ? (state.currencyCalculatorPendingOperator === 'add' || state.currencyCalculatorPendingOperator === 'subtract'
            ? state.currencyCalculatorStoredValue * currentValue / 100
            : currentValue / 100)
        : currentValue / 100;

    if (hasPendingOperator) {
        state.currencyCalculatorExpression = state.currencyCalculatorPendingOperator === 'add' || state.currencyCalculatorPendingOperator === 'subtract'
            ? `${formatCurrencyCalculatorResult(state.currencyCalculatorStoredValue)} ${getCurrencyCalculatorOperatorSymbol(state.currencyCalculatorPendingOperator)} ${formatCurrencyCalculatorResult(currentValue)}%`
            : `${formatCurrencyCalculatorResult(currentValue)}%`;
    } else {
        state.currencyCalculatorExpression = `${formatCurrencyCalculatorResult(currentValue)}%`;
    }

    setCurrencyCalculatorDisplayFromNumber(nextValue);
    state.currencyCalculatorShouldResetDisplay = false;
}

function applyCurrencyCalculatorUnaryOperation(action) {
    const currentValue = getCurrencyCalculatorNumber();
    let nextValue = currentValue;
    let expression = '';

    if (action === 'reciprocal') {
        if (currentValue === 0) {
            showToast('Нельзя делить на 0');
            return;
        }

        nextValue = 1 / currentValue;
        expression = `1/(${formatCurrencyCalculatorResult(currentValue)})`;
    }

    if (action === 'square') {
        nextValue = currentValue * currentValue;
        expression = `sqr(${formatCurrencyCalculatorResult(currentValue)})`;
    }

    if (action === 'sqrt') {
        if (currentValue < 0) {
            showToast('Корень из отрицательного числа недоступен');
            return;
        }

        nextValue = Math.sqrt(currentValue);
        expression = `√(${formatCurrencyCalculatorResult(currentValue)})`;
    }

    setCurrencyCalculatorDisplayFromNumber(nextValue);
    state.currencyCalculatorExpression = expression;
    state.currencyCalculatorShouldResetDisplay = true;
}

function applyCurrencyCalculatorOperator(action) {
    const currentValue = getCurrencyCalculatorNumber();
    const operatorSymbol = getCurrencyCalculatorOperatorSymbol(action);

    if (state.currencyCalculatorPendingOperator && state.currencyCalculatorStoredValue !== null && state.currencyCalculatorShouldResetDisplay) {
        state.currencyCalculatorPendingOperator = action;
        state.currencyCalculatorExpression = `${formatCurrencyCalculatorResult(state.currencyCalculatorStoredValue)} ${operatorSymbol}`;
        return;
    }

    if (state.currencyCalculatorPendingOperator && state.currencyCalculatorStoredValue !== null) {
        const nextValue = performCurrencyCalculatorBinaryOperation(
            state.currencyCalculatorStoredValue,
            currentValue,
            state.currencyCalculatorPendingOperator
        );

        if (nextValue === null) {
            return;
        }

        state.currencyCalculatorStoredValue = nextValue;
        setCurrencyCalculatorDisplayFromNumber(nextValue);
    } else {
        state.currencyCalculatorStoredValue = currentValue;
    }

    state.currencyCalculatorExpression = `${formatCurrencyCalculatorResult(state.currencyCalculatorStoredValue)} ${operatorSymbol}`;
    state.currencyCalculatorPendingOperator = action;
    state.currencyCalculatorShouldResetDisplay = true;
    state.currencyCalculatorLastOperand = null;
    state.currencyCalculatorLastOperator = null;
}

function applyCurrencyCalculatorEquals() {
    if (state.currencyCalculatorPendingOperator && state.currencyCalculatorStoredValue !== null) {
        const leftValue = state.currencyCalculatorStoredValue;
        const rightValue = state.currencyCalculatorShouldResetDisplay
            ? leftValue
            : getCurrencyCalculatorNumber();
        const resultValue = performCurrencyCalculatorBinaryOperation(leftValue, rightValue, state.currencyCalculatorPendingOperator);

        if (resultValue === null) {
            return;
        }

        state.currencyCalculatorExpression = `${formatCurrencyCalculatorResult(leftValue)} ${getCurrencyCalculatorOperatorSymbol(state.currencyCalculatorPendingOperator)} ${formatCurrencyCalculatorResult(rightValue)} =`;
        setCurrencyCalculatorDisplayFromNumber(resultValue);
        state.currencyCalculatorLastOperand = rightValue;
        state.currencyCalculatorLastOperator = state.currencyCalculatorPendingOperator;
        state.currencyCalculatorPendingOperator = null;
        state.currencyCalculatorStoredValue = resultValue;
        state.currencyCalculatorShouldResetDisplay = true;
        return;
    }

    if (state.currencyCalculatorLastOperator && state.currencyCalculatorLastOperand !== null) {
        const leftValue = getCurrencyCalculatorNumber();
        const resultValue = performCurrencyCalculatorBinaryOperation(leftValue, state.currencyCalculatorLastOperand, state.currencyCalculatorLastOperator);

        if (resultValue === null) {
            return;
        }

        state.currencyCalculatorExpression = `${formatCurrencyCalculatorResult(leftValue)} ${getCurrencyCalculatorOperatorSymbol(state.currencyCalculatorLastOperator)} ${formatCurrencyCalculatorResult(state.currencyCalculatorLastOperand)} =`;
        setCurrencyCalculatorDisplayFromNumber(resultValue);
        state.currencyCalculatorStoredValue = resultValue;
        state.currencyCalculatorShouldResetDisplay = true;
    }
}

function performCurrencyCalculatorBinaryOperation(leftValue, rightValue, operator) {
    if (operator === 'divide') {
        if (rightValue === 0) {
            showToast('Нельзя делить на 0');
            return null;
        }

        return leftValue / rightValue;
    }

    if (operator === 'multiply') {
        return leftValue * rightValue;
    }

    if (operator === 'subtract') {
        return leftValue - rightValue;
    }

    if (operator === 'add') {
        return leftValue + rightValue;
    }

    return rightValue;
}

function getCurrencyCalculatorOperatorSymbol(operator) {
    if (operator === 'divide') {
        return '÷';
    }

    if (operator === 'multiply') {
        return '×';
    }

    if (operator === 'subtract') {
        return '−';
    }

    if (operator === 'add') {
        return '+';
    }

    return '';
}

function normalizeCurrencyCalculatorDisplay(rawValue) {
    const formattedValue = formatCurrencyInputDraft(rawValue);
    if (!formattedValue) {
        return '0';
    }

    return formattedValue.replace(/[\s\u00A0\u202F]/g, ' ');
}

function getCurrencyCalculatorNumber() {
    const parsedValue = parseCurrencyNumber(getCurrencyCalculatorDisplayValue());
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

function setCurrencyCalculatorDisplayFromNumber(value) {
    state.currencyCalculatorValue = formatCurrencyCalculatorResult(value);
}

function formatCurrencyCalculatorResult(value) {
    if (!Number.isFinite(value)) {
        return '0';
    }

    const absoluteValue = Math.abs(value);
    const normalizedValue = absoluteValue === 0 ? 0 : Number.parseFloat(value.toPrecision(12));
    const maximumFractionDigits = absoluteValue >= 1 ? 10 : 12;

    return new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits,
        useGrouping: true
    }).format(normalizedValue).replace(/[\s\u00A0\u202F]/g, ' ');
}

function focusCurrencyCalculatorInput() {
    const input = elements.resultsGrid.querySelector('.currency-calculator-input');
    if (!input) {
        return;
    }

    input.focus({ preventScroll: true });
    const caretPosition = input.value.length;
    input.setSelectionRange(caretPosition, caretPosition);
}