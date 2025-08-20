// src/utils/printRepairDoc.js
import QRious from 'qrious'; 

function getUrlQR (serialNumber) {
    if (serialNumber) {
        try {
            const qr = new QRious({
                value: serialNumber,
                size: 120, // Размер QR-кода в пикселях
                level: 'H' // Уровень коррекции ошибок (L, M, Q, H)
            });
            return qr.toDataURL();
        } catch (error) {
            console.error("Ошибка при генерации QR-кода:", error);
            return ''; // В случае ошибки, оставляем пустым
        }
    }
    return '';
}

export function printRepairAcceptanceDoc(phoneData, acceptanceData) {
    const printWindow = window.open('', '_blank');

    const isPaidRepair = acceptanceData.repair_type === 'ПЛАТНЫЙ';
    const qrCodeDataUrl = getUrlQR(phoneData.serial_number);

    const docTitle = isPaidRepair 
        ? 'Акт приема оборудования в платный ремонт'
        : 'Акт приема оборудования в гарантийный ремонт';

    const docLabel = isPaidRepair
        ? 'Оборудование принимается для проведения ремонта, на срок до 45 дней'
        : 'Оборудование принимается для проведения гарантийного ремонта, на срок до 45 дней';

    const htmlContent = `
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap" rel="stylesheet">
            <title>${docTitle}</title>
            <style>
                @page { margin: 0; }
                body { display: grid; grid-template-rows: 1fr auto; font-family: 'Roboto', sans-serif; margin: 0 auto; padding: 0; box-sizing: border-box; width: 210mm; min-height: 297mm; }
                .container { position: relative; width: 100%; height: 100%; padding: 20px; box-sizing: border-box; display: flex; flex-direction: column; }
                .header { position: relative; margin-bottom: 10px; }
                .header h1 { font-size: 14pt; margin: 0; text-align: left; }
                .header h2 { font-size: 32pt; margin: 0; text-align: left; font-family: 'Ubuntu', sans-serif; }
                .header p { margin: 0; font-size: 10pt; text-align: left; }
                .header img { position: absolute; top: 0; right: 0; width: 120px; height: auto; }
                .info { margin: 0; font-size: 12pt; }
                .info p { margin: 0; }
                .info45 { margin: 0; font-size: 9pt; }
                .titleTable{ margin: 5px; font-size: 11pt; text-align: center; }
                table { font-size: 10pt; width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                table, td { border: 1px solid #000; }
                td { padding: 2px; text-align: left; }
                table .bold { text-align: center; font-weight: bold; background-color: #f2f2f2; }
                .conditions { text-align: justify; margin: 0; font-size: 7pt; }
                .conditions p { margin: 0; }
                .signature { text-align: justify; font-size: 9pt; font-weight: bold; margin-top: 10px; }
                .signature table, .signature table td { border: none; }
                .left-align { text-align: left; }
                .right-align { text-align: right; }
                .footer { margin-top: auto; font-size: 9pt; position: relative; }
                .footer p { margin: 0; }
                .footer .footerimg { position: absolute; top: 10px; right: 0; width: 100px; height: auto; }
            </style>
        </head>
        <body>
            <div class="container">
                <div>
                    <div class="header">
                        <img src="${qrCodeDataUrl}" alt="QRCode"> 
                        <h2 style="font-family: Ubuntu;">resale</h2>
                        <h1>${docTitle} от ${new Date().toLocaleDateString('ru-RU')}</h1>
                        <p>Исполнитель: ИП Садыков Владислав Аликович</p>
                        <p>пр. Автоматики, 17, г. Оренбург. ПН-ВС 10:00 – 21:00 Тел.: +7 (901) 088-25-23</p>
                    </div>
                    <div class="info"><p><b>Клиент: </b>${acceptanceData.customer_name}</p><p><b>Телефон: </b>${acceptanceData.customer_phone}</p></div>
                    <div class="info45"><p><i>${docLabel}</i></p></div>
                    <p class="titleTable"><b>Информация об оборудовании</b></p>
                    <table>
                        <tr><td class="bold">Наименование оборудования</td><td class="bold">Серийный номер (S/N)</td></tr>
                        <tr><td>${phoneData.model?.name || 'Модель не указана'}</td><td>${phoneData.serial_number}</td></tr>
                        <tr><td colspan="2" class="bold">Неисправность со слов клиента</td></tr>
                        <tr><td colspan="2">${acceptanceData.problem_description}</td></tr>
                        <tr><td colspan="2" class="bold">Внешний вид</td></tr>
                        <tr><td colspan="2">${acceptanceData.device_condition}</td></tr>
                        <tr><td class="bold">Комплектация</td><td class="bold">Примечания</td></tr>
                        <tr><td>${acceptanceData.included_items || 'Без комплекта'}</td><td>${acceptanceData.notes || 'Нет'}</td></tr>
                    </table>
                    <div class="conditions"><p><b>Условия обслуживания</b></p><p>Я согласен(-на) с тем, что в процессе проверки качества/устранения недостатков возможна потеря моих личных данных с любых носителей информации, принятых от меня в сервисном центре. Я согласен(-на) с тем, что в процессе диагностики, проверки качества, устранения недостатка возможно удаление защитных защитных плёнок и стёкол с любых частей устройства. Я уведомлен, что при установленных паролях безопасности (в том числе включенной функции "найти мой iPhone" для продукции Apple), ремонт, обслуживание и проверка качества сданного товара не могут быть произведены. Устройства принимаются в сервисный центр без SIM-карт и карт памяти. За сохранность ошибочно сданной или оставленной SIM-карты, или карты памяти Исполнитель ответственности не несет.
                    Оборудование с согласия клиента, принято без разборки и проверки неисправностей, без проверки внутренних повреждений, клиент предупрежден о возможно, имеющих место неисправностях, не указанных в квитанции. Клиент (Заказчик) принимает на себя риск, связанный с возможным появлением в сданном устройстве дефектов, не указанных в данном акте. Также риск полной, или частичной утраты работоспособности изделия, или отдельных его узлов, блоков, деталей в процессе ремонта; в случае грубых нарушений пользователем условий эксплуатации устройства, наличия следов коррозии, попадания влаги, либо механических повреждений, либо следов неквалифицированного вмешательства. Исполнитель не несет ответственности если после разборки, при диагностике или ремонте, состояние телефона ухудшится, из-за последствий нарушения Клиентом правил эксплуатации телефона (воздействие жидкости, механические повреждения и т.п.). Заказчик согласен, что все неисправности и внутренние повреждения, скрытые дефекты, которые могут быть обнаружены в устройстве при его техническом обслуживании, возникли до приема устройства по данной квитанции. Заказчик предупрежден о наличии возможных скрытых дефектах. Заказчик дает разрешение Исполнителю на все действия с устройством, направленные на устранение обнаруженных неисправностей, если таковые исполнитель счел нужным устранить, Заказчик разрешает Исполнителю принимать это решение. За неисправности, не указанные в акте приема, Исполнитель ответственности не несет.
                    Оборудование выдается при наличии акта приема/передачи, либо, в случае отсутствия акта, паспорт лица, сдавшего оборудование и письменное заявление/расписка. При утере данного акта клиент обязуется немедленно сообщить в Сервис его номер, модель телефона и Ваши Ф.И.О. по контактному телефону. В противном случае Исполнитель не несет ответственности за получение аппарата другим лицом, предъявившим квитанцию.
                    Устройство Заказчика принимается на ответственное хранение на весь срок обслуживания (включая диагностику и ремонт). В случае неявки заказчика за готовым, или согласованным без ремонта, или неподлежащим ремонту изделием, по истечению 2-х месяцев со дня уведомления заказчика, взымается плата за ответственное хранение устройства в размере 20 рублей в день. В этом случае выдача устройства, производится только после оплаты полной суммы ремонта, диагностики, и суммы просроченного ответственного хранения. В случае неявки Заказчика для получения устройства из ремонта, в течении более чем 2-х месяцев (со дня уведомления о статусе ремонта) Сервисный центр, Исполнитель в праве продать устройство в порядке, предусмотренном ГК РФ (Правила бытового обслуживания населения в РФ, глава IV, пункт 15).
                    </p></div>
                    <div class="signature"><table><tr><td class="left-align">Подпись сотрудника ________________</td><td class="right-align">Подпись клиента ________________</td></tr></table></div>
                </div>
                <div class="footer">
                    <hr><br>
                    <img class="footerimg" src="${qrCodeDataUrl}" alt="QRCode">
                    <div class="footerInfo">
                        <p><b>Заказ-наряд от ${new Date().toLocaleDateString('ru-RU')} (экземпляр для сервиса)</b></p>
                        <p>Заказчик: ${acceptanceData.customer_name} Тел.: ${acceptanceData.customer_phone}</p>
                        <p>Наименование оборудования: ${phoneData.model?.name || 'Модель не указана'}</p>
                        <p>Серийный номер: ${phoneData.serial_number}</p>
                        <p>Неисправность: ${acceptanceData.problem_description}</p><br>
                        <p>С условиями обслуживания ознакомлен и согласен _______________</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
}

// ИЗМЕНЕНА СТРОКА НИЖЕ
export function printRepairFinishDoc(phoneData, repairData, finishData) {
    const printWindow = window.open('', '_blank');
    const qrCodeDataUrl = getUrlQR(phoneData.serial_number);
    const htmlContent = `
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>Акт выполненных работ</title>
            <style>
                @page { margin: 0; }
                body { font-family: 'Roboto', sans-serif; width: 210mm; min-height: 297mm; margin: 0 auto; padding: 20px; box-sizing: border-box; }
                .container { padding: 20px; }
                .header h2 { font-family: Ubuntu, sans-serif; }
                p { margin: 0; }
                .info { font-size: 12pt; }
                .titleTable { margin: 5px; font-size: 11pt; text-align: center; }
                table { font-size: 10pt; width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                table, td { border: 1px solid #000; }
                td { padding: 2px; text-align: left; }
                .bold { font-weight: bold; background-color: #f2f2f2; text-align: center; }
                .conditions { font-size: 10pt; }
                .signature { margin-top: 30px; }
                .signature table, .signature td { border: none; }
                .right { text-align: right; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="font-family: Ubuntu;">resale</h2>
                    <h1>Акт выполненных работ от ${new Date().toLocaleDateString('ru-RU')}</h1>
                    <p>Исполнитель: ИП Садыков Владислав Аликович</p>
                </div>
                <div class="info">
                    <p><b>Клиент: </b>${repairData.customer_name}</p>
                    <p><b>Телефон: </b>${repairData.customer_phone}</p>
                </div>
                <p class="titleTable"><b>Результаты ремонта</b></p>
                <table>
                    <tr><td class="bold">Наименование оборудования</td><td class="bold">Серийный номер</td></tr>
                    <tr><td>${phoneData.model?.name || 'Модель не указана'}</td><td>${phoneData.serial_number}</td></tr>
                    <tr><td colspan="2" class="bold">Проведенные работы</td></tr>
                    <tr><td colspan="2">${finishData.work_performed}</td></tr>
                </table>
                <div class="conditions">
                    <p>Заказчик подтверждает, что работы выполнены в полном объеме и претензий к качеству ремонта не имеет. Устройство было проверено в присутствии заказчика и находится в рабочем состоянии. Гарантия на выполненные работы составляет 30 дней.</p>
                </div>
                <div class="signature">
                    <table>
                        <tr><td>Подпись сотрудника________________</td><td class="right">Подпись клиента________________</td></tr>
                    </table>
                </div>
            </div>
        </body>
        </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
}

export function printLoanerIssuanceDoc(originalPhone, loanerPhone, repairData) {
    const printWindow = window.open('', '_blank');
    // ИЗМЕНЕНИЕ: Используем originalPhone вместо phoneData
    const qrCodeDataUrl = getUrlQR(originalPhone.serial_number);
    const htmlContent = `
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>Акт выдачи подменного оборудования</title>
            <style>
                @page { margin: 0; }
                body { font-family: 'Roboto', sans-serif; width: 210mm; height: 297mm; margin: 0 auto; padding: 20px; box-sizing: border-box; }
                .container { padding: 20px; }
                .header h2 { font-family: Ubuntu, sans-serif; }
                p { margin: 0; }
                .info { font-size: 12pt; }
                .titleTable { margin: 5px; font-size: 11pt; text-align: center; }
                table { font-size: 10pt; width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                table, td { border: 1px solid #000; }
                td { padding: 2px; text-align: left; }
                .bold { font-weight: bold; background-color: #f2f2f2; text-align: center; }
                .conditions { font-size: 9pt; text-align: justify; }
                .signature { margin-top: 30px; }
                .signature table, .signature td { border: none; }
                .right { text-align: right; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="font-family: Ubuntu;">resale</h2>
                    <h1>Акт приема-передачи оборудования от ${new Date().toLocaleDateString('ru-RU')} г.</h1>
                    <p>Арендодатель: ИП Садыков Владислав Аликович</p>
                </div>
                <div class="info">
                    <p><b>Арендатор (клиент): </b>${repairData.customer_name}</p>
                    <p><b>Телефон: </b>${repairData.customer_phone}</p>
                </div>
                <p class="titleTable"><b>Оборудование, сданное в ремонт</b></p>
                <table>
                    <tr><td class="bold">Наименование</td><td class="bold">Серийный номер</td></tr>
                    <tr><td>${originalPhone.model?.name || 'Модель не указана'}</td><td>${originalPhone.serial_number}</td></tr>
                </table>
                <p class="titleTable"><b>Оборудование, выданное на замену</b></p>
                <table>
                    <tr><td class="bold">Наименование</td><td class="bold">Серийный номер</td></tr>
                    <tr><td>${loanerPhone.name}</td><td>${loanerPhone.serial_number || 'б/н'}</td></tr>
                </table>
                <div class="conditions">
                    <p><b>Условия обслуживания</b></p>
                    <p>1. Клиент получает во временное пользование вышеуказанное оборудование на период ремонта собственного устройства.</p>
                    <p>2. Клиент несет полную материальную ответственность за сохранность, комплектность и внешний вид выданного оборудования.</p>
                    <p>3. В случае повреждения или утери оборудования, клиент обязуется возместить его полную рыночную стоимость.</p>
                    <p>4. Оборудование подлежит возврату в сервисный центр в момент получения отремонтированного устройства.</p>
                </div>
                <div class="signature">
                    <table>
                        <tr><td>Подпись сотрудника ________________</td><td class="right">Арендатор ________________</td></tr>
                    </table>
                </div>
            </div>
        </body>
        </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
}

export function printLoanerReturnDoc(originalPhone, loanerPhone, repairData) {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>Акт возврата подменного оборудования</title>
            <style>
                @page { margin: 0; }
                body { font-family: 'Roboto', sans-serif; width: 210mm; height: 297mm; margin: 0 auto; padding: 20px; box-sizing: border-box; }
                .container { padding: 20px; }
                .header h2 { font-family: Ubuntu, sans-serif; }
                p { margin: 0; }
                .info { font-size: 12pt; }
                .titleTable { margin: 5px; font-size: 11pt; text-align: center; }
                table { font-size: 10pt; width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                table, td { border: 1px solid #000; }
                td { padding: 2px; text-align: left; }
                .bold { font-weight: bold; background-color: #f2f2f2; text-align: center; }
                .conditions { font-size: 10pt; }
                .signature { margin-top: 30px; }
                .signature table, .signature td { border: none; }
                .right { text-align: right; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="font-family: Ubuntu;">resale</h2>
                    <h1>Акт возврата подменного оборудования от ${new Date().toLocaleDateString('ru-RU')}</h1>
                    <p>Арендодатель: ИП Садыков Владислав Аликович</p>
                </div>
                <div class="info">
                    <p><b>Арендатор (клиент): </b>${repairData.customer_name}</p>
                    <p><b>Телефон: </b>${repairData.customer_phone}</p>
                </div>
                <p class="titleTable"><b>Возвращаемое оборудование (подменное)</b></p>
                <table>
                    <tr><td class="bold">Наименование</td><td class="bold">Серийный номер</td></tr>
                    <tr><td>${loanerPhone.name}</td><td>${loanerPhone.serial_number || 'б/н'}</td></tr>
                    <tr><td colspan="2" class="bold">Состояние при возврате</td></tr>
                    <tr><td colspan="2" style="height: 40px;"></td></tr>
                </table>
                <div class="conditions">
                    <p>Вышеуказанное оборудование принято от клиента. Претензий к клиенту по состоянию оборудования не имеется / имеются следующие претензии (нужное подчеркнуть).</p>
                </div>
                <div class="signature">
                    <table>
                        <tr><td>Подпись сотрудника________________</td><td class="right">Арендатор________________</td></tr>
                    </table>
                </div>
            </div>
        </body>
        </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
}