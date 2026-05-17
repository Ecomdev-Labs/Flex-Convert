export const STORAGE_KEYS = {
    theme: 'universal-converter-theme',
    activeCategory: 'universal-converter-active-category',
    activeCurrencies: 'universal-converter-active-currencies'
};

export const DEFAULT_ACTIVE_CURRENCIES = ['RUB', 'UZS', 'USD', 'EUR'];

export const CURRENCY_PREVIEW_ITEMS = [
    { badge: 'RU', code: 'RUB', name: 'Российский рубль', rate: 91.24 },
    { badge: 'UZ', code: 'UZS', name: 'Узбекский сум', rate: 11542.10 },
    { badge: 'KZ', code: 'KZT', name: 'Казахский тенге', rate: 446.71 },
    { badge: 'US', code: 'USD', name: 'Доллар США', rate: 1 },
    { badge: 'EU', code: 'EUR', name: 'Евро', rate: 0.92 },
    { badge: 'GB', code: 'GBP', name: 'Фунт стерлингов', rate: 0.79 },
    { badge: 'TR', code: 'TRY', name: 'Турецкая лира', rate: 32.18 },
    { badge: 'CN', code: 'CNY', name: 'Китайский юань', rate: 7.24 },
    { badge: 'JP', code: 'JPY', name: 'Японская иена', rate: 155.67 },
    { badge: 'AE', code: 'AED', name: 'Дирхам ОАЭ', rate: 3.67 }
];

export const currencyItemsByCode = new Map(CURRENCY_PREVIEW_ITEMS.map(item => [item.code, item]));

export const DEFAULT_CURRENCY_RATES = Object.fromEntries(
    CURRENCY_PREVIEW_ITEMS.map(item => [item.code, item.rate])
);

export const categoryRegistry = [
    {
        id: 'pressure',
        name: 'Давление',
        shortName: 'Pressure',
        description: 'Пересчет инженерных единиц давления через базовую единицу Па.',
        meta: 'Факторный адаптер, мгновенный пересчет и копирование результатов.',
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
        description: 'Формульный пересчет между шкалами Цельсия, Фаренгейта и Кельвина.',
        meta: 'Температурный адаптер со смещением и мгновенным пересчетом.',
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
        description: 'Мультивалютный пересчет с настраиваемым списком валют и отдельным калькулятором.',
        meta: '',
        adapter: 'planned',
        defaultValue: '1',
        defaultSourceUnit: '',
        defaultActiveUnits: [],
        units: []
    }
];

export const categoriesById = new Map(categoryRegistry.map(category => [category.id, category]));