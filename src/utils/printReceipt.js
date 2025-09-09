// src/utils/printReceipt.js

import numberToWords from 'number-to-words-ru';
import { formatCheckNumber } from './formatters'; 

const getWarranty = (item) => {
    if (item.serial_number) return '12 мес.';
    if (item.product_name && item.product_name.toLowerCase().includes('блок')) return '1 мес.';
    return '';
};

const getConditionLabel = (condition) => {
    if (condition === 'Восстановленный') return ' (RFB/Refurbished)';
    if (condition === 'Б/У') return ' (б/у)';
    // Для "Новый" и других случаев ничего не добавляем
    return '';
};

export const printReceipt = (saleData) => {
    const isPreliminary = !saleData.id;
    const checkNumberText = isPreliminary ? 'б/н' : formatCheckNumber(saleData.id);
    const checkTitle = isPreliminary ? 'Предварительный чек' : `Товарный чек № ${saleData.id}`;

    const saleDate = new Date(saleData.sale_date || Date.now());
    const formattedDate = saleDate.toLocaleDateString('ru-RU');

    const totalAmountNum = parseFloat(saleData.total_amount) || 0;
    const subtotalNum = saleData.details.reduce((sum, item) => {
        const price = parseFloat(item.unit_price) || 0;
        const quantity = parseInt(item.quantity, 10) || 0;
        const conditionLabel = getConditionLabel(item.condition);
        return sum + (price * quantity);
    }, 0);
    const discountNum = parseFloat(saleData.discount) || 0;
    const paymentAdjustment = totalAmountNum - (subtotalNum - discountNum);

    const totalAmount = totalAmountNum.toFixed(2);
    const subtotal = subtotalNum.toFixed(2);
    const discountAmount = discountNum.toFixed(2);

    const totalInWords = numberToWords.convert(totalAmountNum, {
        currency: {
            currencyNameCases: ['рубль', 'рубля', 'рублей'],
            fractionalPartNameCases: ['копейка', 'копейки', 'копеек'],
            currencyNounGender: {
                integer: 0, // мужской род для рубля
                fractionalPart: 1, // женский род для копейки
            },
            fractionalPartMinLength: 2,
        },
        convertNumberToWords: {
            integer: true, // Конвертировать рубли в слова
            fractional: false, // Оставить копейки как числа
        }
    });

    const hasPhone = saleData.details.some(item => item.serial_number);

    // 2. В зависимости от наличия телефона, создаем разное содержимое для ячейки подписи покупателя
    let buyerSignatureContentHtml = '';
    if (hasPhone) {
        buyerSignatureContentHtml = `
            <div class="disclaimer-in-signature">
                <p>
                    Покупатель осведомлен и согласен, что на устройстве может отсутствовать возможность установки российских приложений (включая RuStore), что не является недостатком. Претензий к товару не имею.
                </p>
                <div class="line">
                    <span>(Подпись / Ф.И.О.)</span>
                </div>
            </div>
        `;
    } else {
        buyerSignatureContentHtml = `
            <div class="line">
                <span>Претензий к внешнему виду и комплектации не имею</span>
            </div>
        `;
    }

    const receiptHtml = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap" rel="stylesheet">
            <title>${checkTitle}</title>
            <style>
                @page {
                    size: 210mm 148mm;
                    margin: 0;
                }
                body {
                    width: 210mm;
                    height: 148mm;
                    margin: 0 auto;
                    padding: 20px;
                    box-sizing: border-box;
                    font-family: 'Roboto', sans-serif;
                }
                .container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    position: relative;
                }
                .header {
                    text-align: center;
                    margin-bottom: 10px;
                }
                .header h1 {
                    font-size: 14pt;
                    margin: 0;
                }
                .header h2 {
                    font-size: 30pt;
                    margin: 0;
                    font-family: 'Ubuntu';
                }
                .header p {
                    margin: 0;
                    font-size: 10pt;
                }
                .pricelist {
                    flex-grow: 1;
                }
                .price {
                    border-collapse: collapse;
                    width: 100%;
                    background: #fff;
                }
                .price th, .price td {
                    border: 1pt solid black;
                    padding: 4px 8px;
                    font-family: 'PT Sans', sans-serif;
                    font-size: 8pt;
                    color: black;
                    text-align: center;
                }
                /* --- Изменяем ширину столбцов --- */
                .price td:nth-child(2){
                    width: 43%; /* Было 37% */
                    text-align: left;
                }
                .price td:nth-child(6),
                .price td:nth-child(7) {
                    width: 12%; /* Было 15% */
                }
                /* --- Остальные без изменений --- */
                .price td:nth-child(5) {
                    width: 8%;
                }
                .price td:nth-child(3),
                .price td:nth-child(4) {
                    width: 10%;
                }
                .endprice td:first-child{
                    border-bottom: none;
                    border-left: none;
                    font-size: 9pt;
                    color: black;
                    text-align: right;
                    font-weight: bold;
                }
                .endprice td:last-child {
                    text-align: center;
                }
                .totals-summary {
                    padding: 0;
                }
                .totals-summary p {
                    margin: 0;
                    font-size: 9pt;
                    line-height: 1.3;
                }
                .signature-wrapper {
                    flex-shrink: 0;
                    padding-top: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    width: 100%;
                }
                .signature-block {
                    width: 45%;
                    text-align: center;
                }
                .seller-block { width: 30%; }
                .buyer-block { width: 65%; }
                .signature-block .line {
                    border-top: 1pt solid black;
                    padding-top: 3px;
                    margin-top: 15px;
                }
                .signature-block .line span { font-size: 7pt; font-weight: normal; }
                .disclaimer-in-signature {
                    font-weight: normal;
                    font-size: 7pt;
                    text-align: justify;
                    margin-bottom: 3px;
                }
                .disclaimer-in-signature + .line {
                    margin-top: 3px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>resale</h2>
                    <p>ИП Садыков Владислав Аликович</p>
                    <p>пр. Автоматики, 17, г. Оренбург. ПН-ВС 10:00 – 21:00 Тел.: +7 (901) 088-25-23</p>
                    <br>
                    <h1>Товарный чек № ${checkNumberText} от ${formattedDate}</h1>
                </div>
                <div class="pricelist">
                    <table class="price">
                        <tbody>
                            <tr>
                                <th>№</th>
                                <th>Наименование товара</th>
                                <th>Модель</th>
                                <th>Гарантия</th>
                                <th>Кол-во</th>
                                <th>Цена, руб</th>
                                <th>Сумма, руб</th>
                            </tr>
                            ${saleData.details.map((item, index) => {
                                const price = parseFloat(item.unit_price) || 0;
                                const quantity = parseInt(item.quantity, 10) || 0;
                                const conditionLabel = getConditionLabel(item.condition);
                                return `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td class="text-left">
                                        ${item.product_name || item.name}${conditionLabel}
                                        ${item.serial_number ? `<br><small style="font-size: 8pt; color: #333;">S/N: ${item.serial_number}</small>` : ''}
                                    </td>
                                    <td>${item.model_number || 'б/н'}</td>
                                    <td>${getWarranty(item)}</td>
                                    <td>${quantity}</td>
                                    <td>${price.toFixed(2)}</td>
                                    <td>${(quantity * price).toFixed(2)}</td>
                                </tr>
                                `;
                            }).join('')}
                            <tr class="endprice">
                                <td colspan="6">Итого</td>
                                <td>${subtotal}</td>
                            </tr>
                            ${
                                    paymentAdjustment > 0.01
                                    ? `<tr class="endprice"><td colspan="6" style="border-top: none;">Сервисный сбор</td><td>${paymentAdjustment.toFixed(2)}</td></tr>`
                                    : ''
                                }
                            <tr class="endprice">
                                <td colspan="6" style="border-top: none;">Сумма скидки</td>
                                <td>${discountAmount}</td>
                            </tr>
                            <tr class="endprice">
                                <td colspan="6" style="border-top: none;">Всего к оплате</td>
                                <td>${totalAmount}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="totals-summary">
                        <p>Всего наименований ${saleData.details.length} на сумму ${totalAmountNum.toFixed(2)} руб.</p>
                        <p><strong>${totalInWords}</strong></p>
                    </div>
                </div>
                 <div class="signature-wrapper">
                    <div class="signature-block seller-block">
                        <strong>Продавец</strong>
                        <div class="line">
                            <span>(Подпись)</span>
                        </div>
                    </div>
                    <div class="signature-block buyer-block">
                        <strong>Покупатель</strong>
                        ${buyerSignatureContentHtml}
                    </div>
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