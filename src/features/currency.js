import {
    CURRENCY_PREVIEW_ITEMS,
    DEFAULT_CURRENCY_RATES,
    currencyItemsByCode
} from '../config/app-config.js';
import {
    escapeHtmlAttribute,
    formatCurrencyAmount,
    formatCurrencyCalculatorResult,
    formatCurrencyInputDraft,
    normalizeCurrencyCalculatorDisplay,
    parseCurrencyNumber
} from '../utils/formatters.js';

export function renderCurrencyPreviewPanel(state) {
    const activeItems = getActiveCurrencyItems(state);

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
                ${activeItems.map(item => renderCurrencyPreviewRow(state, item)).join('')}
            </div>

            <button type="button" class="currency-settings-btn" data-action="open-currency-settings">
                <span aria-hidden="true">+</span>
                <span>Настройки</span>
            </button>
        </section>
    `;
}

export function renderCurrencyCalculatorPanel(state) {
    const displayValue = escapeHtmlAttribute(getCurrencyCalculatorDisplayValue(state));
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

export function renderCurrencySettingsOptions(state) {
    return getCurrencySettingsItems(state).map(item => {
        const isActive = state.activeCurrencies.includes(item.code);

        return `
            <div class="settings-option ${isActive ? 'is-draggable' : ''}" data-currency-code="${item.code}" data-active-currency="${isActive}" draggable="${isActive}">
                <label class="settings-option-main">
                    <input type="checkbox" data-currency-code="${item.code}" ${isActive ? 'checked' : ''}>
                    <span class="currency-flag" aria-hidden="true">${item.badge}</span>
                    <span>
                        <span class="settings-option-code">${item.code}</span>
                        <span class="settings-option-name">${item.name}</span>
                    </span>
                </label>
                <span class="settings-drag-handle ${isActive ? '' : 'is-disabled'}" aria-hidden="true">::::</span>
            </div>
        `;
    }).join('');
}

export function getCurrencyInputDisplayValue(state, code) {
    if (code === state.currencyLastActiveCode && state.currencyDraftValue !== null) {
        return state.currencyDraftValue;
    }

    const amount = getCurrencyAmount(state, code);
    return amount === null ? '' : formatCurrencyAmount(amount);
}

export function handleCurrencyInput(state, code, rawValue) {
    state.currencyLastActiveCode = code;
    state.currencyDraftValue = formatCurrencyInputDraft(rawValue);

    if (!rawValue.trim()) {
        state.currencyBaseUsdAmount = null;
        return state.currencyDraftValue;
    }

    const parsedValue = parseCurrencyNumber(rawValue);
    if (Number.isNaN(parsedValue)) {
        return state.currencyDraftValue;
    }

    const rate = getCurrencyRate(state, code);
    if (!rate) {
        return state.currencyDraftValue;
    }

    state.currencyBaseUsdAmount = code === 'USD' ? parsedValue : parsedValue / rate;
    return state.currencyDraftValue;
}

export function finalizeCurrencyInput(state) {
    state.currencyDraftValue = null;
}

export function toggleCurrencySelection(state, code, isEnabled) {
    if (!currencyItemsByCode.has(code)) {
        return { changed: false };
    }

    if (isEnabled) {
        if (!state.activeCurrencies.includes(code)) {
            state.activeCurrencies.push(code);
            return { changed: true };
        }

        return { changed: false };
    }

    if (state.activeCurrencies.length === 1) {
        return { changed: false, error: 'Оставьте хотя бы одну валюту' };
    }

    state.activeCurrencies = state.activeCurrencies.filter(activeCode => activeCode !== code);
    return { changed: true };
}

export function moveCurrencyToTop(state, code) {
    if (!state.activeCurrencies.includes(code) || state.activeCurrencies[0] === code) {
        return false;
    }

    state.activeCurrencies = state.activeCurrencies.filter(activeCode => activeCode !== code);
    state.activeCurrencies.unshift(code);
    return true;
}

export function moveCurrencyByDrop(state, dragCode, targetCode, position) {
    if (!state.activeCurrencies.includes(dragCode) || !state.activeCurrencies.includes(targetCode) || dragCode === targetCode) {
        return false;
    }

    const nextOrder = state.activeCurrencies.filter(code => code !== dragCode);
    const targetIndex = nextOrder.indexOf(targetCode);
    const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;

    nextOrder.splice(insertIndex, 0, dragCode);
    state.activeCurrencies = nextOrder;
    return true;
}

export function setCurrencyCalculatorVisibility(state, isOpen) {
    state.isCurrencyCalculatorOpen = isOpen;
}

export function handleCurrencyCalculatorInput(state, rawValue) {
    state.currencyCalculatorValue = normalizeCurrencyCalculatorDisplay(rawValue);
    state.currencyCalculatorShouldResetDisplay = false;

    if (!state.currencyCalculatorPendingOperator) {
        state.currencyCalculatorExpression = '';
        state.currencyCalculatorStoredValue = null;
        state.currencyCalculatorLastOperand = null;
        state.currencyCalculatorLastOperator = null;
    }

    return state.currencyCalculatorValue;
}

export function applyCurrencyCalculatorAction(state, action, showToast) {
    if (action.startsWith('digit-')) {
        appendCurrencyCalculatorDigit(state, action.slice(6));
        return;
    }

    if (action === 'decimal') {
        appendCurrencyCalculatorDecimal(state);
        return;
    }

    if (action === 'sign') {
        toggleCurrencyCalculatorSign(state);
        return;
    }

    if (action === 'clear-entry') {
        clearCurrencyCalculatorEntry(state);
        return;
    }

    if (action === 'clear-all') {
        resetCurrencyCalculator(state);
        return;
    }

    if (action === 'backspace') {
        backspaceCurrencyCalculatorValue(state);
        return;
    }

    if (action === 'percent') {
        applyCurrencyCalculatorPercent(state);
        return;
    }

    if (action === 'reciprocal' || action === 'square' || action === 'sqrt') {
        applyCurrencyCalculatorUnaryOperation(state, action, showToast);
        return;
    }

    if (action === 'divide' || action === 'multiply' || action === 'subtract' || action === 'add') {
        applyCurrencyCalculatorOperator(state, action, showToast);
        return;
    }

    if (action === 'equals') {
        applyCurrencyCalculatorEquals(state, showToast);
    }
}

function getActiveCurrencyItems(state) {
    return state.activeCurrencies
        .map(code => currencyItemsByCode.get(code))
        .filter(Boolean);
}

function getCurrencySettingsItems(state) {
    const activeItems = getActiveCurrencyItems(state);
    const inactiveItems = CURRENCY_PREVIEW_ITEMS.filter(item => !state.activeCurrencies.includes(item.code));
    return [...activeItems, ...inactiveItems];
}

function getCurrencyRate(state, code) {
    return state.currencyRates[code] ?? DEFAULT_CURRENCY_RATES[code] ?? null;
}

function getCurrencyAmount(state, code) {
    if (state.currencyBaseUsdAmount === null) {
        return null;
    }

    const rate = getCurrencyRate(state, code);
    if (!rate) {
        return null;
    }

    return code === 'USD' ? state.currencyBaseUsdAmount : state.currencyBaseUsdAmount * rate;
}

function renderCurrencyPreviewRow(state, item) {
    const displayValue = escapeHtmlAttribute(getCurrencyInputDisplayValue(state, item.code));

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

function renderCalculatorButton(action, label, extraClass = '') {
    const className = ['currency-calculator-button', extraClass].filter(Boolean).join(' ');

    return `
        <button type="button" class="${className}" data-calculator-action="${action}">${label}</button>
    `;
}

function getCurrencyCalculatorDisplayValue(state) {
    return state.currencyCalculatorValue || '0';
}

function getCurrencyCalculatorRawValue(state) {
    return getCurrencyCalculatorDisplayValue(state).replace(/[\s\u00A0\u202F]/g, '');
}

function getCurrencyCalculatorNumber(state) {
    const parsedValue = parseCurrencyNumber(getCurrencyCalculatorDisplayValue(state));
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
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

function setCurrencyCalculatorDisplayFromNumber(state, value) {
    state.currencyCalculatorValue = formatCurrencyCalculatorResult(value);
}

function resetCurrencyCalculator(state) {
    state.currencyCalculatorExpression = '';
    state.currencyCalculatorLastOperand = null;
    state.currencyCalculatorLastOperator = null;
    state.currencyCalculatorPendingOperator = null;
    state.currencyCalculatorShouldResetDisplay = false;
    state.currencyCalculatorStoredValue = null;
    state.currencyCalculatorValue = '0';
}

function clearCurrencyCalculatorEntry(state) {
    state.currencyCalculatorValue = '0';
    state.currencyCalculatorShouldResetDisplay = false;

    if (!state.currencyCalculatorPendingOperator) {
        state.currencyCalculatorExpression = '';
        state.currencyCalculatorStoredValue = null;
    }
}

function appendCurrencyCalculatorDigit(state, digit) {
    const currentRawValue = state.currencyCalculatorShouldResetDisplay ? '' : getCurrencyCalculatorRawValue(state);
    state.currencyCalculatorValue = normalizeCurrencyCalculatorDisplay(appendCurrencyDigit(currentRawValue, digit));
    state.currencyCalculatorShouldResetDisplay = false;
}

function appendCurrencyCalculatorDecimal(state) {
    const currentRawValue = state.currencyCalculatorShouldResetDisplay ? '' : getCurrencyCalculatorRawValue(state);
    if (currentRawValue.includes(',')) {
        return;
    }

    state.currencyCalculatorValue = normalizeCurrencyCalculatorDisplay(currentRawValue ? `${currentRawValue},` : '0,');
    state.currencyCalculatorShouldResetDisplay = false;
}

function toggleCurrencyCalculatorSign(state) {
    const currentRawValue = getCurrencyCalculatorRawValue(state);
    if (!currentRawValue || /^-?0(?:,0*)?$/.test(currentRawValue)) {
        return;
    }

    state.currencyCalculatorValue = normalizeCurrencyCalculatorDisplay(
        currentRawValue.startsWith('-') ? currentRawValue.slice(1) : `-${currentRawValue}`
    );
    state.currencyCalculatorShouldResetDisplay = false;
}

function backspaceCurrencyCalculatorValue(state) {
    if (state.currencyCalculatorShouldResetDisplay) {
        state.currencyCalculatorValue = '0';
        state.currencyCalculatorShouldResetDisplay = false;
        return;
    }

    const nextRawValue = getCurrencyCalculatorRawValue(state).slice(0, -1);
    state.currencyCalculatorValue = normalizeCurrencyCalculatorDisplay(nextRawValue);
}

function applyCurrencyCalculatorPercent(state) {
    const currentValue = getCurrencyCalculatorNumber(state);
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

    setCurrencyCalculatorDisplayFromNumber(state, nextValue);
    state.currencyCalculatorShouldResetDisplay = false;
}

function applyCurrencyCalculatorUnaryOperation(state, action, showToast) {
    const currentValue = getCurrencyCalculatorNumber(state);
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

    setCurrencyCalculatorDisplayFromNumber(state, nextValue);
    state.currencyCalculatorExpression = expression;
    state.currencyCalculatorShouldResetDisplay = true;
}

function applyCurrencyCalculatorOperator(state, action, showToast) {
    const currentValue = getCurrencyCalculatorNumber(state);
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
            state.currencyCalculatorPendingOperator,
            showToast
        );

        if (nextValue === null) {
            return;
        }

        state.currencyCalculatorStoredValue = nextValue;
        setCurrencyCalculatorDisplayFromNumber(state, nextValue);
    } else {
        state.currencyCalculatorStoredValue = currentValue;
    }

    state.currencyCalculatorExpression = `${formatCurrencyCalculatorResult(state.currencyCalculatorStoredValue)} ${operatorSymbol}`;
    state.currencyCalculatorPendingOperator = action;
    state.currencyCalculatorShouldResetDisplay = true;
    state.currencyCalculatorLastOperand = null;
    state.currencyCalculatorLastOperator = null;
}

function applyCurrencyCalculatorEquals(state, showToast) {
    if (state.currencyCalculatorPendingOperator && state.currencyCalculatorStoredValue !== null) {
        const leftValue = state.currencyCalculatorStoredValue;
        const rightValue = state.currencyCalculatorShouldResetDisplay
            ? leftValue
            : getCurrencyCalculatorNumber(state);
        const resultValue = performCurrencyCalculatorBinaryOperation(leftValue, rightValue, state.currencyCalculatorPendingOperator, showToast);

        if (resultValue === null) {
            return;
        }

        state.currencyCalculatorExpression = `${formatCurrencyCalculatorResult(leftValue)} ${getCurrencyCalculatorOperatorSymbol(state.currencyCalculatorPendingOperator)} ${formatCurrencyCalculatorResult(rightValue)} =`;
        setCurrencyCalculatorDisplayFromNumber(state, resultValue);
        state.currencyCalculatorLastOperand = rightValue;
        state.currencyCalculatorLastOperator = state.currencyCalculatorPendingOperator;
        state.currencyCalculatorPendingOperator = null;
        state.currencyCalculatorStoredValue = resultValue;
        state.currencyCalculatorShouldResetDisplay = true;
        return;
    }

    if (state.currencyCalculatorLastOperator && state.currencyCalculatorLastOperand !== null) {
        const leftValue = getCurrencyCalculatorNumber(state);
        const resultValue = performCurrencyCalculatorBinaryOperation(leftValue, state.currencyCalculatorLastOperand, state.currencyCalculatorLastOperator, showToast);

        if (resultValue === null) {
            return;
        }

        state.currencyCalculatorExpression = `${formatCurrencyCalculatorResult(leftValue)} ${getCurrencyCalculatorOperatorSymbol(state.currencyCalculatorLastOperator)} ${formatCurrencyCalculatorResult(state.currencyCalculatorLastOperand)} =`;
        setCurrencyCalculatorDisplayFromNumber(state, resultValue);
        state.currencyCalculatorStoredValue = resultValue;
        state.currencyCalculatorShouldResetDisplay = true;
    }
}

function performCurrencyCalculatorBinaryOperation(leftValue, rightValue, operator, showToast) {
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