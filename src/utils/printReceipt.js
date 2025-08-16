// src/utils/printReceipt.js

import numberToWords from 'number-to-words-ru';
import { formatCheckNumber } from './formatters'; 

const getWarranty = (item) => {
    if (item.serial_number) return '12 мес.';
    if (item.product_name && item.product_name.toLowerCase().includes('блок')) return '1 мес.';
    return '';
};

export const printReceipt = (saleData) => {
    const isPreliminary = !saleData.id;
    const checkNumberText = isPreliminary ? 'б/н' : formatCheckNumber(saleData.id);
    const checkTitle = isPreliminary ? 'Предварительный чек' : `Товарный чек № ${checkNumberText}`;

    const saleDate = new Date(saleData.sale_date || Date.now());
    const formattedDate = saleDate.toLocaleDateString('ru-RU');

    const totalAmountNum = parseFloat(saleData.total_amount) || 0;
    const subtotalNum = saleData.details.reduce((sum, item) => {
        const price = parseFloat(item.unit_price) || 0;
        const quantity = parseInt(item.quantity, 10) || 0;
        return sum + (price * quantity);
    }, 0);
    const discountNum = parseFloat(saleData.discount) || 0;
    const paymentAdjustment = totalAmountNum - (subtotalNum - discountNum);

    const totalAmount = totalAmountNum.toFixed(2);
    const subtotal = subtotalNum.toFixed(2);
    const discountAmount = discountNum.toFixed(2);

    const receiptHtml = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>${checkTitle}</title>
            <style>
                @media print {
                    @page { size: A5 landscape; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
                html, body {
                    height: 100%; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 10pt; color: #000;
                }
                .container { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
                .header { margin-bottom: 15px; }
                .header-top { font-size: 9pt; margin-bottom: 15px; }
                .header-main { text-align: center; }
                .header-main h1 { font-size: 20pt; font-weight: bold; margin: 0; }
                .header-main p { margin: 1px 0; font-size: 10pt; }
                .sub-header { text-align: center; margin-bottom: 15px; font-size: 12pt; font-weight: 500; }
                table { width: calc(100% - 10mm); margin: 0 5mm; border-collapse: collapse; font-size: 9pt; margin-bottom: 15px; }
                th, td { border: 1px solid #000; padding: 4px; text-align: center; vertical-align: top; }
                th { font-weight: 600; }
                td.text-left { text-align: left; }
                td.text-right { text-align: right; }
                .summary-block { display: flex; justify-content: space-between; align-items: flex-start; font-size: 10pt; padding: 0 5mm; }
                .summary-words { flex-basis: 60%; }
                .summary-total { flex-basis: 35%; text-align: right; font-size: 11pt; font-weight: 500; }
                .summary-total p { margin: 3px 0; }
                .footer { display: flex; justify-content: space-between; align-items: flex-start; font-size: 10pt; padding: 0 5mm; }
                .signature-block { width: 45%; }
                .signature-line { display: block; border-bottom: 1px solid #000; margin-top: 20px; margin-bottom: 3px; }
                .signature-caption { font-size: 8pt; }
            </style>
        </head>
        <body>
            <div class="container">
                <div>
                    <div class="header">
                        <div class="header-top">${formattedDate}</div>
                        <div class="header-main">
                            <h1>resale</h1>
                            <p>г. Оренбург, проезд Автоматики 19</p>
                            <p>тел.: +7 (901) 088-2523</p>
                            <p>режим работы: пн - вс с 10:00 до 21:00</p>
                        </div>
                    </div>

                    <div class="sub-header">
                        Товарный чек &nbsp;&nbsp;&nbsp;&nbsp; № ${checkNumberText} &nbsp;&nbsp;&nbsp;&nbsp; от ${formattedDate}
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>№</th>
                                <th style="width: 40%;">Наименование товара</th>
                                <th>Модель</th>
                                <th>Гарантия</th>
                                <th>Кол-во</th>
                                <th>Цена, руб</th>
                                <th>Сумма, руб</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${saleData.details.map((item, index) => {
                                const price = parseFloat(item.unit_price) || 0;
                                const quantity = parseInt(item.quantity, 10) || 0;
                                return `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td class="text-left">
                                        ${item.product_name || item.name}
                                        ${item.serial_number ? `<br><small style="font-size: 8pt; color: #333;">S/N: ${item.serial_number}</small>` : ''}
                                    </td>
                                    <td>${item.model_number || 'б/н'}</td>
                                    <td>${getWarranty(item)}</td>
                                    <td>${quantity}</td>
                                    <td class="text-right">${price.toFixed(2)}</td>
                                    <td class="text-right">${(quantity * price).toFixed(2)}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    
                    <div class="summary-block">
                        <div class="summary-words">
                            <p>Всего наименований ${saleData.details.length} на сумму ${subtotal} руб</p>
                        </div>
                        <div class="summary-total">
                            <p>Сумма: ${subtotal}</p>
                            <p>Сумма скидки: ${discountAmount}</p>
                            ${
                                paymentAdjustment > 0.01
                                ? `<p>Сервисный сбор: ${paymentAdjustment.toFixed(2)}</p>`
                                : ''
                            }
                            <p>К оплате: ${totalAmount}</p>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <div class="signature-block">
                        <span>Продавец</span>
                        <span class="signature-line"></span>
                    </div>
                    <div class="signature-block">
                        <span class="signature-line"></span>
                        <span class="signature-caption">Претензий к внешнему виду и комплектации не имею</span>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
};

// ИСПРАВЛЕНИЕ: Удалена лишняя закрывающая фигурная скобка