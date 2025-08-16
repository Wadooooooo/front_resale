// src/utils/formatters.js

/**
 * Преобразует ID продажи в кастомный номер чека формата A0XXXXX.
 * @param {number} saleId - Реальный ID продажи из базы данных.
 * @returns {string} - Отформатированный номер чека.
 */
export const formatCheckNumber = (saleId) => {
    // Проверка, что ID - это корректное число
    if (!saleId || typeof saleId !== 'number' || saleId < 1) {
        return 'б/н'; // "без номера"
    }

    // Стартовое значение, с которого начнется нумерация
    const startingNumber = 7695;

    // Вычисляем новый номер: к стартовому прибавляем ID продажи минус 1
    // Пример: для ID=1 будет 7695 + 1 - 1 = 7695
    //         для ID=2 будет 7695 + 2 - 1 = 7696
    const newNumber = startingNumber + saleId - 1;

    // Добавляем префикс "A" и дополняем нулями до 5 знаков (например, 7695 -> "A07695")
    return `A${String(newNumber).padStart(5, '0')}`;
};