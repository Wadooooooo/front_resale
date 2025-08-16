// src/utils/printWarrantyCard.js

// Функция для форматирования даты в формат ДД.ММ.ГГГГ
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU');
};

// Основная функция печати
export const printWarrantyCard = (saleData) => {
    // Отбираем из чека только товары с серийным номером (т.е. телефоны)
    const itemsWithWarranty = saleData.details.filter(item => item.serial_number);

    if (itemsWithWarranty.length === 0) {
        alert('В этом чеке нет товаров, подлежащих гарантии (с серийным номером).');
        return;
    }

    const warrantyHtml = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>Печать гарантийного талона</title>
        <style>
            /* --- Настройки печати --- */
            @media print {
                /* Установите размер вашей физической карточки. A5 - частый размер. */
                /* A5 = 148mm x 210mm */
                @page {
                    size: 148mm 210mm;
                    margin: 0;
                }
                body { -webkit-print-color-adjust: exact; }
            }
            
            /* --- Основные стили --- */
            body {  
                margin: 0;
                font-family: 'Ubuntu', sans-serif; /* Используем ваш шрифт */
                font-size: 11pt; /* Стандартный размер для печати */
            }

            /* --- Контейнер для каждой карточки --- */
            .card {
                position: relative; /* Это основа для позиционирования текста */
                width: 175mm;
                height: 148mm;
                page-break-after: always; /* Каждая карточка на новой странице */
            }

            /* --- Стили для позиционирования текста --- */
            .model-field, .serial-field, .date-field {
                position: absolute;
                /* !!! НАСТРОЙКА ПОЛОЖЕНИЯ ПО ГОРИЗОНТАЛИ !!!
                   Увеличивайте значение, чтобы сдвинуть текст ВПРАВО.
                   Уменьшайте, чтобы сдвинуть ВЛЕВО.
                */
                left: 70mm; 
            }

            .model-field {
                /* !!! НАСТРОЙКА ПОЛОЖЕНИЯ "МОДЕЛЬ" ПО ВЕРТИКАЛИ !!!
                   Увеличивайте значение, чтобы сдвинуть текст ВНИЗ.
                   Уменьшайте, чтобы сдвинуть ВВЕРХ.
                */
                top: 35mm;
            }
            .serial-field {
                /* Настройка положения "Серийный номер" */
                top: 45mm;
            }
            .date-field {
                 /* Настройка положения "Дата продажи" */
                top: 56mm;
            }
        </style>
    </head>
    <body>
        ${itemsWithWarranty.map(item => `
            <div class="card">
                <div class="model-field">${item.product_name || ''}</div>
                <div class="serial-field">${item.serial_number}</div>
                <div class="date-field">${formatDate(saleData.sale_date)}</div>
            </div>
        `).join('')}
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(warrantyHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        // printWindow.close(); // Можно закомментировать, чтобы окно не закрывалось сразу
    }, 250);
};