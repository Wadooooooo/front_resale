// src/utils/printReceipt.js

import numberToWords from 'number-to-words-ru';
console.log('Что внутри numberToWords:', numberToWords); 
import { formatCheckNumber } from './formatters'; 

const getWarranty = (item) => {
    if (item.serial_number) return '12 мес.';
    if (item.product_name && item.product_name.toLowerCase().includes('блок')) return '1 мес.';
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
                    min-height: 24px;
                }
                .price td:not(:nth-child(2)) {
                    border: 1pt solid black;
                    padding: 6px 10px;
                    font-family: 'PT Sans', sans-serif;
                    font-size: 8pt;
                    color: black;
                    text-align: center;
                    min-height: 24px;
                }
                .price td:nth-child(2){
                    width: 37%;
                    border: 1pt solid black;
                    padding: 6px 10px;
                    font-family: 'PT Sans', sans-serif;
                    font-size: 8pt;
                    color: black;
                    text-align: left;
                    min-height: 24px;
                }
                .price td:nth-child(5),
                .price td:nth-child(7) {
                    min-width: 15%;
                    width: 15%;
                }
                .price td:nth-child(3),
                .price td:nth-child(4) {
                    width: 9%;
                }
                .endprice {
            border-collapse: collapse;
            width: 100%;
            background: #fff;
            border-radius: 0;
        }
        .endprice td:nth-child(2){
            padding: 6px 10px;
            font-family: 'PT Sans', sans-serif;
            font-size: 9pt;
            color: black;
            text-align: right;
            font-weight: bold;
            min-height: 24px;
            width: 30%;
        }
        .endprice td:nth-child(3) {
            border-top: none;
            border-bottom: 1pt solid black;
            border-left: 1pt solid black;
            border-right: 1pt solid black;
            padding: 6px 10px;
            font-family: 'PT Sans', sans-serif;
            font-size: 9pt;
            color: black;
            text-align: center;
            min-height: 24px;
            min-width: 15%;
            width: 15%;
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
            width: 100%;
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
                            <th>№</th>
                                <th>Наименование товара</th>
                                <th>Модель</th>
                                <th>Гарантия</th>
                                <th>Кол-во</th>
                                <th>Цена, руб</th>
                                <th>Сумма, руб</th>
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
                    <table class="endprice">
                        <tbody>
                            <tr>
                                <td></td>
                                <td>Итого</td>
                                <td>${subtotal}</td>
                            </tr>
                            <tr>
                                <td></td>
                                <td>Сумма скидки</td>
                                <td>${discountAmount}</td>
                                ${
                                    paymentAdjustment > 0.01
                                    ? `<p>Сервисный сбор: ${paymentAdjustment.toFixed(2)}</p>`
                                    : ''
                                }
                            </tr>
                            <tr>
                                <td></td>
                                <td>Всего к оплате</td>
                                <td> ${totalAmount}</td>
                            </tr>
                        </tbody>
                    </table>
                    <p>Всего наименований ${saleData.details.length} на сумму ${subtotal} руб</p>
                    <p><strong>${totalInWords}</strong></p>
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

// ИСПРАВЛЕНИЕ: Удалена лишняя закрывающая фигурная скобка