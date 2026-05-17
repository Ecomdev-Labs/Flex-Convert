import { STORAGE_KEYS, categoryRegistry } from './config/app-config.js';
import { elements } from './dom/elements.js';
import { convertCategoryValue } from './features/conversion.js';
import {
    applyCurrencyCalculatorAction,
    finalizeCurrencyInput,
    getCurrencyInputDisplayValue,
    handleCurrencyCalculatorInput,
    handleCurrencyInput,
    moveCurrencyByDrop,
    moveCurrencyToTop,
    renderCurrencyCalculatorPanel,
    renderCurrencyPreviewPanel,
    renderCurrencySettingsOptions,
    setCurrencyCalculatorVisibility,
    toggleCurrencySelection
} from './features/currency.js';
import { createInitialState, ensureCategoryState, ensureCurrencyState, getActiveCategory } from './state/app-state.js';
import { copyValue, parseInputValue } from './utils/formatters.js';

const state = createInitialState();
let toastTimeout;
let isInitialized = false;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp, { once: true });
} else {
    initApp();
}

function initApp() {
    if (isInitialized) {
        return;
    }

    isInitialized = true;
    applyStoredTheme();
    ensureCurrencyState(state);
    renderCategoryNavigation();
    renderCurrencySettingsModal();
    ensureCategoryState(state, getActiveCategory(state));
    attachEventListeners();
    renderActiveCategory();
}

function attachEventListeners() {
    elements.inputValue.addEventListener('input', () => {
        const category = getActiveCategory(state);
        state.values[category.id] = elements.inputValue.value;
        renderResults();
    });

    elements.inputUnit.addEventListener('change', () => {
        const category = getActiveCategory(state);
        state.sourceUnits[category.id] = elements.inputUnit.value;
        renderResults();
    });

    elements.calculatorToggleButton.addEventListener('click', () => {
        if (getActiveCategory(state).id !== 'currency') {
            return;
        }

        setCurrencyCalculatorVisibility(state, !state.isCurrencyCalculatorOpen);
        renderResults();

        if (state.isCurrencyCalculatorOpen) {
            focusCurrencyCalculatorInput();
        }
    });

    elements.categoryNav.addEventListener('click', event => {
        const button = event.target.closest('[data-category-id]');
        if (!button) {
            return;
        }

        const nextCategoryId = button.dataset.categoryId;
        if (!nextCategoryId || nextCategoryId === state.activeCategoryId) {
            return;
        }

        state.activeCategoryId = nextCategoryId;
        if (nextCategoryId !== 'currency') {
            state.isCurrencyCalculatorOpen = false;
            state.isCurrencySettingsOpen = false;
            resetCurrencyDragState();
        }

        localStorage.setItem(STORAGE_KEYS.activeCategory, nextCategoryId);
        ensureCategoryState(state, getActiveCategory(state));
        renderActiveCategory();
    });

    elements.resultsGrid.addEventListener('pointerdown', event => {
        const calculatorButton = event.target.closest('[data-calculator-action]');
        if (!calculatorButton) {
            return;
        }

        event.preventDefault();
        applyCurrencyCalculatorAction(state, calculatorButton.dataset.calculatorAction, showToast);
        renderResults();
        focusCurrencyCalculatorInput();
    });

    elements.resultsGrid.addEventListener('input', event => {
        const input = event.target.closest('.currency-calculator-input');
        if (!input) {
            return;
        }

        input.value = handleCurrencyCalculatorInput(state, input.value);
    });

    elements.resultsGrid.addEventListener('click', event => {
        const calculatorToggle = event.target.closest('[data-action="show-currency-calculator"], [data-action="hide-currency-calculator"]');
        if (calculatorToggle) {
            setCurrencyCalculatorVisibility(state, calculatorToggle.dataset.action === 'show-currency-calculator');
            renderResults();
            return;
        }

        const button = event.target.closest('[data-copy-value]');
        if (!button) {
            return;
        }

        copyValue(button.dataset.copyValue, button.dataset.copyLabel || 'Скопировано в буфер', showToast);
    });

    elements.categoryCustomContent.addEventListener('click', event => {
        const copyButton = event.target.closest('[data-copy-value]');
        if (copyButton) {
            copyValue(copyButton.dataset.copyValue, copyButton.dataset.copyLabel || 'Скопировано в буфер', showToast);
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

        if (moveCurrencyToTop(state, moveButton.dataset.currencyCode)) {
            persistCurrencyState();
        }
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

        input.value = handleCurrencyInput(state, input.dataset.currencyCode, input.value);
        refreshCurrencyInputs(input.dataset.currencyCode);
        renderResults();
    });

    elements.categoryCustomContent.addEventListener('focusout', event => {
        const input = event.target.closest('.currency-input[data-currency-code]');
        if (!input) {
            return;
        }

        finalizeCurrencyInput(state);
        refreshCurrencyInputs();
        renderResults();
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

        const result = toggleCurrencySelection(state, checkbox.dataset.currencyCode, checkbox.checked);
        if (result.error) {
            showToast(result.error);
            renderCurrencySettingsModal();
            return;
        }

        if (result.changed) {
            persistCurrencyState();
        }
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
        if (moveCurrencyByDrop(state, state.dragCurrencyCode, option.dataset.currencyCode, state.dragTargetPosition || 'before')) {
            persistCurrencyState();
        }
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
    const category = getActiveCategory(state);
    ensureCategoryState(state, category);
    ensureCurrencyState(state);

    renderCategoryNavigation();
    renderCurrencySettingsModal();
    applyCategorySurface(category);
    updateResultsHeaderState(category);

    elements.categorySummary.textContent = category.description || '';
    elements.categorySummary.classList.toggle('is-hidden', !category.description);
    elements.panelTitle.textContent = category.name;
    elements.categoryMeta.textContent = category.meta || '';
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
    elements.categoryCustomContent.innerHTML = isCurrencyCategory ? renderCurrencyPreviewPanel(state) : '';
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
    const category = getActiveCategory(state);
    updateCurrencyLayoutState(category);
    updateResultsHeaderState(category);

    if (category.id === 'currency' && state.isCurrencyCalculatorOpen) {
        elements.resultsCount.textContent = '';
        elements.resultsGrid.innerHTML = renderCurrencyCalculatorPanel(state);
    } else {
        elements.resultsGrid.innerHTML = '';
    }

    if (category.id === 'currency') {
        elements.resultsCount.textContent = '';
        elements.categoryCustomContent.innerHTML = renderCurrencyPreviewPanel(state);
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

function updateCurrencyLayoutState(category = getActiveCategory(state)) {
    const isCollapsed = category.id !== 'currency' || !state.isCurrencyCalculatorOpen;
    elements.categoryLayout.classList.toggle('is-currency-collapsed', isCollapsed);
}

function updateResultsHeaderState(category = getActiveCategory(state)) {
    const isCurrencyCategory = category.id === 'currency';

    elements.resultsTitle.textContent = state.isCurrencyCalculatorOpen
        ? 'Калькулятор'
        : isCurrencyCategory
            ? 'Калькулятор'
            : `${category.name}: мгновенный пересчет`;

    elements.resultsCount.classList.toggle('is-hidden', isCurrencyCategory || state.isCurrencyCalculatorOpen);
    elements.calculatorToggleButton.classList.toggle('is-hidden', !isCurrencyCategory);
    elements.calculatorToggleLabel.textContent = state.isCurrencyCalculatorOpen ? 'Скрыть калькулятор' : 'Калькулятор';
    elements.calculatorToggleButton.setAttribute('aria-pressed', String(state.isCurrencyCalculatorOpen));
}

function renderCurrencySettingsModal() {
    elements.currencySettingsModal.classList.toggle('hidden', !state.isCurrencySettingsOpen);
    elements.currencySettingsModal.setAttribute('aria-hidden', String(!state.isCurrencySettingsOpen));
    document.body.classList.toggle('modal-open', state.isCurrencySettingsOpen);
    elements.currencySettingsBody.innerHTML = renderCurrencySettingsOptions(state);
}

function openCurrencySettings() {
    if (getActiveCategory(state).id !== 'currency') {
        return;
    }

    state.isCurrencySettingsOpen = true;
    renderCurrencySettingsModal();
}

function closeCurrencySettings() {
    state.isCurrencySettingsOpen = false;
    resetCurrencyDragState();
    renderCurrencySettingsModal();
}

function persistCurrencyState() {
    ensureCurrencyState(state);
    localStorage.setItem(STORAGE_KEYS.activeCurrencies, JSON.stringify(state.activeCurrencies));

    if (getActiveCategory(state).id === 'currency') {
        applyCategorySurface(getActiveCategory(state));
        renderResults();
    }

    renderCurrencySettingsModal();
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

function refreshCurrencyInputs(activeCode = null) {
    const inputs = elements.categoryCustomContent.querySelectorAll('.currency-input[data-currency-code]');

    inputs.forEach(input => {
        const code = input.dataset.currencyCode;
        if (activeCode && code === activeCode) {
            return;
        }

        input.value = getCurrencyInputDisplayValue(state, code);
    });
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

function focusCurrencyCalculatorInput() {
    const input = elements.resultsGrid.querySelector('.currency-calculator-input');
    if (!input) {
        return;
    }

    input.focus({ preventScroll: true });
    const caretPosition = input.value.length;
    input.setSelectionRange(caretPosition, caretPosition);
}