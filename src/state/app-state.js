import {
    categoriesById,
    categoryRegistry,
    DEFAULT_ACTIVE_CURRENCIES,
    DEFAULT_CURRENCY_RATES,
    STORAGE_KEYS,
    currencyItemsByCode
} from '../config/app-config.js';

export function createInitialState() {
    return {
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
}

export function ensureCategoryState(state, category) {
    if (!Object.prototype.hasOwnProperty.call(state.values, category.id)) {
        state.values[category.id] = category.defaultValue;
    }

    if (!Object.prototype.hasOwnProperty.call(state.sourceUnits, category.id)) {
        state.sourceUnits[category.id] = category.defaultSourceUnit;
    }
}

export function getActiveCategory(state) {
    return categoriesById.get(state.activeCategoryId) || categoryRegistry[0];
}

export function ensureCurrencyState(state) {
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

function getInitialCategoryId() {
    const storedCategory = localStorage.getItem(STORAGE_KEYS.activeCategory);
    return categoriesById.has(storedCategory) ? storedCategory : categoryRegistry[0].id;
}

function getInitialCurrencySelection() {
    const fallbackSelection = DEFAULT_ACTIVE_CURRENCIES.filter(code => currencyItemsByCode.has(code));
    const storedValue = localStorage.getItem(STORAGE_KEYS.activeCurrencies);
    if (!storedValue) {
        return fallbackSelection;
    }

    try {
        const parsedValue = JSON.parse(storedValue);
        if (!Array.isArray(parsedValue)) {
            return fallbackSelection;
        }

        const filteredCodes = parsedValue.filter(code => currencyItemsByCode.has(code));
        return filteredCodes.length > 0 ? filteredCodes : fallbackSelection;
    } catch (error) {
        console.error('Ошибка чтения выбранных валют:', error);
        return fallbackSelection;
    }
}