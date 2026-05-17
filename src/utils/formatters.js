export function parseInputValue(value) {
    const normalized = value.replace(/\s+/g, '').replace(',', '.');
    if (!normalized || normalized === '-' || normalized === '.' || normalized === '-.') {
        return Number.NaN;
    }

    return Number.parseFloat(normalized);
}

export function formatNumber(value) {
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

export function formatCurrencyAmount(value) {
    if (value === null || !Number.isFinite(value)) {
        return '';
    }

    return new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
    }).format(value).replace(/[\s\u00A0\u202F]/g, ' ');
}

export function parseCurrencyNumber(value) {
    if (!value) {
        return Number.NaN;
    }

    const normalized = value.replace(/[\s\u00A0\u202F]/g, '').replace(',', '.');
    if (!normalized || normalized === '-' || normalized === '.' || normalized === '-.') {
        return Number.NaN;
    }

    return Number.parseFloat(normalized);
}

export function formatCurrencyInputDraft(value) {
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

export function escapeHtmlAttribute(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function normalizeCurrencyCalculatorDisplay(rawValue) {
    const formattedValue = formatCurrencyInputDraft(rawValue);
    if (!formattedValue) {
        return '0';
    }

    return formattedValue.replace(/[\s\u00A0\u202F]/g, ' ');
}

export function formatCurrencyCalculatorResult(value) {
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

export function copyValue(value, label, onSuccess) {
    const normalizedValue = formatNumber(Number.parseFloat(value));

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(normalizedValue)
            .then(() => onSuccess(label))
            .catch(() => fallbackCopy(normalizedValue, label, onSuccess));
        return;
    }

    fallbackCopy(normalizedValue, label, onSuccess);
}

function fallbackCopy(value, label, onSuccess) {
    const textArea = document.createElement('textarea');
    textArea.value = value;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        onSuccess(label);
    } catch (error) {
        console.error('Ошибка копирования:', error);
    }

    document.body.removeChild(textArea);
}