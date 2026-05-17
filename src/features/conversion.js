import { formatNumber } from '../utils/formatters.js';

export function convertCategoryValue(category, value, sourceUnitId) {
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