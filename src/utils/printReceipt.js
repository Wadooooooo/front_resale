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
                    size: 210mm 148mm ;
                    margin: 0;
                }
                body {
                    display: grid;
                    width: 210mm;
                    height: 148mm;
                    margin: 0 auto;
                    padding: 0px;
                    box-sizing: border-box;
                    background-color: #cecece;
                    font-family: 'Roboto', sans-serif;
                }
                @media print {
                    body {
                        background-color: white;
                    }
                }
                .container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    padding: 20px;
                    box-sizing: border-box;
                }
                .header {
                    position: relative;
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
                margin: 0;
                }
                .price {
                    border-collapse: collapse;
                    width: 100%;
                    background: #fff;
                    border-radius: 0;
                }
                .price th {
                    border: 1pt solid black;
                    padding: 6px 10px;
                    font-family: 'PT Sans', sans-serif;
                    font-size: 9pt;
                    color: black;
                    text-align: center;
                }
                .price td:not(:nth-child(2)) {
                    border: 1pt solid black;
                    padding: 6px 10px;
                    font-family: 'PT Sans', sans-serif;
                    font-size: 8pt;
                    color: black;
                    text-align: center;
                }
                .price td:nth-child(2){
                    width: 37%;
                    border: 1pt solid black;
                    padding: 6px 10px;
                    font-family: 'PT Sans', sans-serif;
                    font-size: 8pt;
                    color: black;
                    text-align: left;
                }
                .price td:nth-child(6),
                .price td:nth-child(7) {
                    min-width: 15%;
                    width: 15%;
                }
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
        .pricelist p{
            padding: 6px 10px;
            margin-top: 10px;
            font-family: 'PT Sans', sans-serif;
            font-size: 10pt;
            color: black;
        }
        .signature {
            position: absolute; 
            bottom: 0;
            font-size: 9pt;
            font-weight: bold;
            margin-top: 10px;
            padding-bottom: 0px;
            width: 95%;
        }
        .signature table{
            table-layout: fixed;
            border: none;
            font-weight: bold;
        }
        .signature table td:nth-child(1),
        .signature table td:nth-child(4){
            border: none;
            width: 5%;
        }
        .signature table td{
            border: none;
            width: 30%;
        }
        .signature .right{
            text-align: right;
        }
        .signature .line {
            border-top: 1pt solid black;
            font-size: 8pt;
            text-align: justify;
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
                    <p style="margin-bottom: 0 !important;">Всего наименований ${saleData.details.length} на сумму ${totalAmount} руб</p>
                    <p style="margin: 0 !important"><strong>${totalInWords}</strong></p>
                </div>
                <div class="signature">
            <table>
                <tr>
                    <td>Продавец</td>
                    <td></td>
                    <td></td>
                    <td class="right">Покупатель</td>
                    <td></td>
                </tr>
                <tr>
                    <td></td>
                    <td class="line"></td>
                    <td></td>
                    <td></td>
                    <td class="line">Претензий к внешнему виду и комплектации не имею</td>
                </tr>
                <tr>
                    <td>&nbsp;</td>
                    <td> </td>
                </tr>
            </table>
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