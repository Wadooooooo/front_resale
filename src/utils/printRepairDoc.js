// src/utils/printRepairDoc.js

export function printRepairAcceptanceDoc(phoneData, acceptanceData) {
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
        <html>
        <head>
            <title>Акт приёма в ремонт</title>
            <style>
                body { font-family: sans-serif; margin: 2em; }
                h1 { text-align: center; }
                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1em 2em; margin-bottom: 2em; }
                .full-width { grid-column: 1 / -1; }
                .section { margin-bottom: 1.5em; }
                .section h3 { margin-bottom: 0.5em; border-bottom: 1px solid #ccc; padding-bottom: 0.5em; }
                .legal { font-size: 0.8em; color: #555; margin-top: 3em; }
                .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 3em; margin-top: 4em; }
                .signatures div { border-top: 1px solid #000; padding-top: 0.5em; }
            </style>
        </head>
        <body>
            <h1>Акт приёма оборудования в гарантийный ремонт</h1>
            <p style="text-align: center;">от ${new Date().toLocaleDateString('ru-RU')}</p>

            <div class="details-grid">
                <div><strong>Клиент:</strong> ${acceptanceData.customer_name}</div>
                <div><strong>Телефон:</strong> ${acceptanceData.customer_phone}</div>
            </div>

            <div class="section">
                <h3>Данные устройства</h3>
                <div><strong>Наименование:</strong> ${phoneData.model?.name || 'Модель не указана'}</div>
                <div><strong>Серийный номер (S/N):</strong> ${phoneData.serial_number}</div>
            </div>

            <div class="section">
                <h3>Описание</h3>
                <div><strong>Заявленная неисправность (со слов клиента):</strong></div>
                <p>${acceptanceData.problem_description}</p>
                
                <div><strong>Внешнее состояние:</strong></div>
                <p>${acceptanceData.device_condition}</p>

                <div><strong>Комплектация:</strong></div>
                <p>${acceptanceData.included_items || 'Без комплекта'}</p>
                
                <div><strong>Примечания:</strong></div>
                <p>${acceptanceData.notes || 'Нет'}</p>
            </div>

            <div class="section legal">
                <h3>Правовой текст (позже ты сможешь его изменить)</h3>
                <p>
                    Заказчик подтверждает, что указанная неисправность верна. Устройство принимается без SIM-карт, карт памяти и аксессуаров, если иное не указано в комплектации. Сервисный центр не несет ответственности за сохранность данных на устройстве. Срок проведения диагностики и ремонта составляет до 45 дней.
                </p>
            </div>

            <div class="signatures">
                <div>Подпись клиента</div>
                <div>Подпись сотрудника</div>
            </div>

        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    // Небольшая задержка перед печатью, чтобы стили успели примениться
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

export function printRepairFinishDoc(phoneData, finishData) {
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
        <html>
        <head>
            <title>Акт выполненных работ</title>
            <style>
                body { font-family: sans-serif; margin: 2em; }
                h1 { text-align: center; }
                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1em 2em; margin-bottom: 2em; }
                .section { margin-bottom: 1.5em; }
                .section h3 { margin-bottom: 0.5em; border-bottom: 1px solid #ccc; padding-bottom: 0.5em; }
                .legal { font-size: 0.8em; color: #555; margin-top: 3em; }
                .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 3em; margin-top: 4em; }
                .signatures div { border-top: 1px solid #000; padding-top: 0.5em; }
            </style>
        </head>
        <body>
            <h1>Акт выполненных работ (выдача из ремонта)</h1>
            <p style="text-align: center;">от ${new Date().toLocaleDateString('ru-RU')}</p>

            <div class="section">
                <h3>Данные устройства</h3>
                <div><strong>Наименование:</strong> ${phoneData.model?.name || 'Модель не указана'}</div>
                <div><strong>Серийный номер (S/N):</strong> ${phoneData.serial_number}</div>
            </div>

            <div class="section">
                <h3>Результаты ремонта</h3>
                <div><strong>Проведенные работы:</strong></div>
                <p>${finishData.work_performed}</p>
            </div>

            <div class="section legal">
                <h3>Правовой текст (позже ты сможешь его изменить)</h3>
                <p>
                    Заказчик подтверждает, что работы выполнены в полном объеме и претензий к качеству ремонта не имеет. Устройство было проверено в присутствии заказчика и находится в рабочем состоянии. Гарантия на выполненные работы составляет 30 дней.
                </p>
            </div>

            <div class="signatures">
                <div>Подпись клиента</div>
                <div>Подпись сотрудника</div>
            </div>

        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}