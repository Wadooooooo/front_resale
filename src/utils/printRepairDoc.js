// src/utils/printRepairDoc.js

export function printRepairAcceptanceDoc(phoneData, acceptanceData) {
    const printWindow = window.open('', '_blank');

   // Проверяем, является ли ремонт платным
    const isPaidRepair = acceptanceData.repair_type === 'ПЛАТНЫЙ';

    // В зависимости от типа ремонта, формируем правильный заголовок
    const docTitle = isPaidRepair 
        ? 'Акт приёма оборудования в платный ремонт'
        : 'Акт приёма оборудования в гарантийный ремонт';

    // Если ремонт платный и указана стоимость, создаем для нее HTML-блок
    const costHtml = isPaidRepair && acceptanceData.estimated_cost
        ? `<div><strong>Предварительная стоимость:</strong> ${parseFloat(acceptanceData.estimated_cost).toLocaleString('ru-RU')} руб.</div>`
        : '';
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
            <h1>${docTitle}</h1>
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

// VVV УБЕДИТЕСЬ, ЧТО ЭТА ФУНКЦИЯ ЕСТЬ И ПЕРЕД НЕЙ СТОИТ СЛОВО EXPORT VVV
export function printLoanerIssuanceDoc(originalPhone, loanerPhone, repairData) {
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
        <html>
        <head>
            <title>Акт выдачи подменного оборудования</title>
            <style>
                body { font-family: sans-serif; margin: 2em; }
                h1, h2 { text-align: center; }
                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1em 2em; margin-bottom: 2em; }
                .section { margin-bottom: 1.5em; border: 1px solid #ccc; padding: 1em; border-radius: 8px; }
                .section h3 { margin-top: 0; margin-bottom: 0.5em; border-bottom: 1px solid #ccc; padding-bottom: 0.5em; }
                .legal { font-size: 0.8em; color: #555; margin-top: 3em; }
                .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 3em; margin-top: 4em; }
                .signatures div { border-top: 1px solid #000; padding-top: 0.5em; }
            </style>
        </head>
        <body>
            <h1>Акт приема-передачи оборудования</h1>
            <h2>(на временное пользование)</h2>
            <p style="text-align: center;">от ${new Date().toLocaleDateString('ru-RU')}</p>

            <div class="details-grid">
                <div><strong>Клиент:</strong> ${repairData.customer_name}</div>
                <div><strong>Телефон:</strong> ${repairData.customer_phone}</div>
            </div>

            <div class="section">
                <h3>Оборудование, сданное в ремонт</h3>
                <div><strong>Наименование:</strong> ${originalPhone.model?.name || 'Модель не указана'}</div>
                <div><strong>Серийный номер (S/N):</strong> ${originalPhone.serial_number}</div>
            </div>

            <div class="section">
                <h3>Оборудование, выданное на замену</h3>
                <div><strong>Наименование:</strong> ${loanerPhone.name}</div>
                <div><strong>Серийный номер (S/N):</strong> ${loanerPhone.serial_number || 'б/н'}</div>
            </div>

            <div class="section legal">
                <h3>Условия</h3>
                <p>
                    1. Клиент получает во временное пользование вышеуказанное оборудование на период ремонта собственного устройства.
                    <br>2. Клиент несет полную материальную ответственность за сохранность, комплектность и внешний вид выданного оборудования.
                    <br>3. В случае повреждения или утери оборудования, клиент обязуется возместить его полную рыночную стоимость.
                    <br>4. Оборудование подлежит возврату в сервисный центр в момент получения отремонтированного устройства.
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

export function printLoanerReturnDoc(originalPhone, loanerPhone, repairData) {
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
        <html>
        <head>
            <title>Акт возврата подменного оборудования</title>
            <style>
                body { font-family: sans-serif; margin: 2em; }
                h1, h2 { text-align: center; }
                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1em 2em; margin-bottom: 2em; }
                .section { margin-bottom: 1.5em; border: 1px solid #ccc; padding: 1em; border-radius: 8px; }
                .section h3 { margin-top: 0; margin-bottom: 0.5em; border-bottom: 1px solid #ccc; padding-bottom: 0.5em; }
                .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 3em; margin-top: 4em; }
                .signatures div { border-top: 1px solid #000; padding-top: 0.5em; }
                .condition-check { margin-top: 1em; }
            </style>
        </head>
        <body>
            <h1>Акт возврата оборудования</h1>
            <h2>(из временного пользования)</h2>
            <p style="text-align: center;">от ${new Date().toLocaleDateString('ru-RU')}</p>

            <div class="details-grid">
                <div><strong>Клиент:</strong> ${repairData.customer_name}</div>
                <div><strong>Телефон:</strong> ${repairData.customer_phone}</div>
            </div>

            <div class="section">
                <h3>Возвращаемое оборудование (подменное)</h3>
                <div><strong>Наименование:</strong> ${loanerPhone.name}</div>
                <div><strong>Серийный номер (S/N):</strong> ${loanerPhone.serial_number || 'б/н'}</div>
                <div class="condition-check">
                    <strong>Состояние при возврате:</strong> ____________________________________________________
                    <br>
                    <small>(внешний вид, комплектность, работоспособность)</small>
                </div>
            </div>

            <p>
                Вышеуказанное оборудование принято от клиента. Претензий к клиенту по состоянию оборудования не имеется / имеются следующие претензии (нужное подчеркнуть).
            </p>

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
