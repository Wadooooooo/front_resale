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
                body { font-family: sans-serif; margin: 1.5em; }
                h1 { text-align: center; }
                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1em 2em; margin-bottom: 2em; }
                .full-width { grid-column: 1 / -1; }
                .section { margin-bottom: 1.5em; line-height: 1.3; }
                .section h3 { margin-bottom: 0.5em; line-height: 1.3; border-bottom: 1px solid #ccc; padding-bottom: 0.5em; }
                .legal {
                    font-size: 0.6em; /* Уменьшаем размер шрифта */
                    line-height: 1.2; /* Уменьшаем межстрочное расстояние */
                    color: #555;
                    margin-top: 3em;
                }
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
                <p>
                    Я согласен(-на) с тем, что в процессе проверки качества/устранения недостатков возможна потеря моих личных данных с любых носителей информации, принятых от меня в сервисном центре. Я согласен(-на) с тем, что в процессе диагностики, проверки качества, устранения недостатка возможно удаление защитных защитных плёнок и стёкол с любых частей устройства. Я уведомлен, что при установленных паролях безопасности (в том числе включенной функции "найти мой iPhone" для продукции Apple), ремонт, обслуживание и проверка качества сданного товара не могут быть произведены. Устройства принимаются в сервисный центр без SIM-карт и карт памяти. За сохранность ошибочно сданной или оставленной SIM-карты, или карты памяти Исполнитель ответственности не несет.
                    Оборудование с согласия клиента, принято без разборки и проверки неисправностей, без проверки внутренних повреждений, клиент предупрежден о возможно, имеющих место неисправностях, не указанных в квитанции. Клиент (Заказчик) принимает на себя риск, связанный с возможным появлением в сданном устройстве дефектов, не указанных в данном акте. Также риск полной, или частичной утраты работоспособности изделия, или отдельных его узлов, блоков, деталей в процессе ремонта; в случае грубых нарушений пользователем условий эксплуатации устройства, наличия следов коррозии, попадания влаги, либо механических повреждений, либо следов неквалифицированного вмешательства. Исполнитель не несет ответственности если после разборки, при диагностике или ремонте, состояние телефона ухудшится, из-за последствий нарушения Клиентом правил эксплуатации телефона (воздействие жидкости, механические повреждения и т.п.). Заказчик согласен, что все неисправности и внутренние повреждения, скрытые дефекты, которые могут быть обнаружены в устройстве при его техническом обслуживании, возникли до приема устройства по данной квитанции. Заказчик предупрежден о наличии возможных скрытых дефектах. Заказчик дает разрешение Исполнителю на все действия с устройством, направленные на устранение обнаруженных неисправностей, если таковые исполнитель счел нужным устранить, Заказчик разрешает Исполнителю принимать это решение. За неисправности, не указанные в акте приема, Исполнитель ответственности не несет.
                    Оборудование выдается при наличии акта приема/передачи, либо, в случае отсутствия акта, паспорт лица, сдавшего оборудование и письменное заявление/расписка. При утере данного акта клиент обязуется немедленно сообщить в Сервис его номер, модель телефона и Ваши Ф.И.О. по контактному телефону. В противном случае Исполнитель не несет ответственности за получение аппарата другим лицом, предъявившим квитанцию.
                    Устройство Заказчика принимается на ответственное хранение на весь срок обслуживания (включая диагностику и ремонт). В случае неявки заказчика за готовым, или согласованным без ремонта, или неподлежащим ремонту изделием, по истечению 2-х месяцев со дня уведомления заказчика, взымается плата за ответственное хранение устройства в размере 20 рублей в день. В этом случае выдача устройства, производится только после оплаты полной суммы ремонта, диагностики, и суммы просроченного ответственного хранения. В случае неявки Заказчика для получения устройства из ремонта, в течении более чем 2-х месяцев (со дня уведомления о статусе ремонта) Сервисный центр, Исполнитель в праве продать устройство в порядке, предусмотренном ГК РФ (Правила бытового обслуживания населения в РФ, глава IV, пункт 15).
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
                .legal {
                    font-size: 0.7em; /* Уменьшаем размер шрифта */
                    line-height: 1.3; /* Уменьшаем межстрочное расстояние */
                    color: #555;
                    margin-top: 3em;
                }
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
                <h3></h3>
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
