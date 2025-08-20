// src/utils/printPriceList.js

const formatDate = () => {
    return new Date().toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export const printPriceList = (phones) => {
    const pricedPhones = phones
        .filter(phone => phone.current_price !== null && phone.current_price !== undefined)
        .sort((a, b) => a.display_name.localeCompare(b.display_name));

    const priceListHtml = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap" rel="stylesheet">
            <title>Прайс-лист</title>
            <style>
                @page {
                    margin: 0;
                }
                body {
                    display: grid;
                    grid-template-rows: 1fr auto;
                    font-family: 'Ubuntu';
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    width: 210mm;
                    height: 297mm;
                    margin: 0 auto;
                    padding: 0px;
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
                    margin-bottom: 30px;
                    text-align: center;
                }
                .header h1 {
                    font-size: 10pt;
                    margin: 0;
                    font-weight: normal;
                }
                .header h2 {
                    font-family: 'Ubuntu';
                    font-size: 50pt;
                    margin: 0;
                }
                .price {
                    font-size: 17pt;
                    border-collapse: collapse;
                    table-layout: fixed;
                    width: 100%;
                    font-weight: bold;
                }
                .price td{
                    padding: 10px 0 10px 0;
                    border-bottom: 1px solid #e0e0e0;
                }
                .price td:nth-child(2),
                .price td:nth-child(3){
                    font-weight: normal !important;
                    text-align: center;
                    width: 25%;
                }
                .footer {
                    position: absolute;
                    text-align: justify;
                    bottom: 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>resale</h2>
                    <h1>прайс-лист на ${formatDate()}</h1>
                </div>
                <table class="price">
                    ${pricedPhones.map(phone => {
                        // ИЗМЕНЕНИЕ 2: Логика для разделения названия и памяти
                        let modelName = phone.display_name;
                        let storage = '—'; // Значение по умолчанию

                        const storageRegex = /(\s\d+(TB|GB))/i;
                        const match = phone.display_name.match(storageRegex);

                        if (match) {
                            storage = match[0].trim();
                            modelName = phone.display_name.replace(storageRegex, '').trim();
                        }
                        
                        // ИЗМЕНЕНИЕ 3: Генерируем строку с тремя ячейками
                        return `
                            <tr>
                                <td>${modelName}</td>
                                <td>${storage}</td>
                                <td>${phone.current_price.toLocaleString('ru-RU')} руб.</td>
                            </tr>
                        `;
                    }).join('')}
                </table>
                <div class="footer">
                    <p style="margin: 0 !important;">*Цены указаны за <b>наличный расчет</b></p>
                    <p style="margin: 0 !important;">*<b>RFB (Refurbished)</b> — это телефон, где ранее был дефект, который устранили и установили  новую запчасть, в пленках, полностью запакованный, как новый.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(priceListHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
};