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
            <title>Прайс-лист</title>
            <style>
                @media print {
                    @page { size: A4; margin: 20mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 12pt;
                }
                .header {
                    text-align: center;
                    margin-bottom: 2rem;
                    border-bottom: 2px solid #000;
                    padding-bottom: 1rem;
                }
                .header h1 { margin: 0; }
                .header p { margin: 5px 0 0 0; font-size: 14pt; }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14pt;
                }
                th, td {
                    border: 1px solid #ccc;
                    padding: 12px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                    font-weight: 600;
                }
                /* Стили для центральной и правой колонок */
                td:nth-child(2) {
                    text-align: center;
                    white-space: nowrap;
                }
                td:last-child {
                    text-align: right;
                    font-weight: bold;
                    white-space: nowrap;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Актуальный прайс-лист</h1>
                <p>на ${formatDate()}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Модель</th>
                        <th style="text-align: center;">Память</th>
                        <th style="text-align: right;">Цена</th>
                    </tr>
                </thead>
                <tbody>
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
                </tbody>
            </table>
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