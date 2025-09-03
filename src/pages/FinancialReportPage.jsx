import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { getFinancialSnapshots, createFinancialSnapshot } from '../api';
import './OrdersPage.css'; // Используем общие стили

const formatDate = (dateString) => new Date(dateString).toLocaleString('ru-RU');
const formatCurrency = (amount) => parseFloat(amount).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });

const SnapshotDetailsModal = ({ snapshot, onClose }) => {
    if (!snapshot || !snapshot.details) return null;

    const { inventory = [], goods_in_transit = [], cash_by_account = [], goods_sent_to_customer = [] } = snapshot.details;

    const formatCurrency = (amount) => parseFloat(amount).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });

    return ReactDOM.createPortal(
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-dialog" style={{ textAlign: 'left', maxWidth: '1000px' }}>
                <h3>Детализация среза от {formatDate(snapshot.snapshot_date)}</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '2rem' }}>
                    
                    {/* Колонка для денег */}
                    <div>
                        <h4>Деньги в кассе ({cash_by_account.length} счетов)</h4>
                        {/* VVV НАЧАЛО ИЗМЕНЕНИЙ ДЛЯ ПЕРВОЙ ТАБЛИЦЫ VVV */}
                        <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                            <table className="orders-table" style={{ tableLayout: 'fixed' }}>
                                <colgroup>
                                    <col style={{ width: '60%' }} />
                                    <col style={{ width: '40%' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>Счет</th>
                                        <th style={{ textAlign: 'right' }}>Баланс</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cash_by_account.map(item => (
                                        <tr key={`cash-${item.account_name}`}>
                                            <td>{item.account_name}</td>
                                            <td style={{ textAlign: 'right' }}>{item.balance.toLocaleString('ru-RU')} руб.</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <table className="orders-table" style={{ tableLayout: 'fixed' }}>
                            <colgroup>
                                <col style={{ width: '60%' }} />
                                <col style={{ width: '40%' }} />
                            </colgroup>
                            <tfoot>
                                <tr>
                                    <td style={{ fontWeight: 'bold' }}>Итого:</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(snapshot.cash_balance)}</td>
                                </tr>
                            </tfoot>
                        </table>
                        {/* ^^^ КОНЕЦ ИЗМЕНЕНИЙ ^^^ */}
                    </div>

                    {/* Колонка для склада */}
                    <div>
                        <h4>Склад ({inventory.length} шт.)</h4>
                        {/* VVV НАЧАЛО ИЗМЕНЕНИЙ ДЛЯ ВТОРОЙ ТАБЛИЦЫ VVV */}
                        <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                             <table className="orders-table" style={{ tableLayout: 'fixed' }}>
                                <colgroup>
                                    <col style={{ width: '15%' }} />
                                    <col style={{ width: '50%' }} />
                                    <col style={{ width: '35%' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>S/N</th>
                                        <th style={{ textAlign: 'right' }}>Цена</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.map(item => (
                                        <tr key={`inv-${item.id}`}>
                                            <td>{item.id}</td>
                                            <td className="url-cell">{item.sn || 'б/н'}</td>
                                            <td style={{ textAlign: 'right' }}>{item.price.toLocaleString('ru-RU')} руб.</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <table className="orders-table" style={{ tableLayout: 'fixed' }}>
                            <colgroup>
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '50%' }} />
                                <col style={{ width: '35%' }} />
                            </colgroup>
                            <tfoot>
                                <tr>
                                    <td colSpan="2" style={{ fontWeight: 'bold' }}>Итого:</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(snapshot.inventory_value)}</td>
                                </tr>
                            </tfoot>
                        </table>
                        {/* ^^^ КОНЕЦ ИЗМЕНЕНИЙ ^^^ */}
                    </div>
                    
                    {/* Колонка для товаров в пути */}
                    <div>
                        <h4>Товары в пути ({goods_in_transit.length} заказ.)</h4>
                        {/* VVV НАЧАЛО ИЗМЕНЕНИЙ ДЛЯ ТРЕТЬЕЙ ТАБЛИЦЫ VVV */}
                         <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                            <table className="orders-table" style={{ tableLayout: 'fixed' }}>
                                <colgroup>
                                    <col style={{ width: '50%' }} />
                                    <col style={{ width: '50%' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>ID Заказа</th>
                                        <th style={{ textAlign: 'right' }}>Сумма</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {goods_in_transit.map(item => (
                                        <tr key={`transit-${item.order_id}`}>
                                            <td>{item.order_id}</td>
                                            <td style={{ textAlign: 'right' }}>{item.value.toLocaleString('ru-RU')} руб.</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <table className="orders-table" style={{ tableLayout: 'fixed' }}>
                            <colgroup>
                                <col style={{ width: '50%' }} />
                                <col style={{ width: '50%' }} />
                            </colgroup>
                            <tfoot>
                                <tr>
                                    <td style={{ fontWeight: 'bold' }}>Итого:</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(snapshot.goods_in_transit_value)}</td>
                                </tr>
                            </tfoot>
                        </table>
                        {/* ^^^ КОНЕЦ ИЗМЕНЕНИЙ ^^^ */}
                    </div>
                    <div>
                        <h4>Доставка клиенту ({goods_sent_to_customer.length} шт.)</h4>
                         <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                            <table className="orders-table" style={{ tableLayout: 'fixed' }}>
                                <colgroup>
                                    <col style={{ width: '15%' }} />
                                    <col style={{ width: '50%' }} />
                                    <col style={{ width: '35%' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>S/N</th>
                                        <th style={{ textAlign: 'right' }}>Цена</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {goods_sent_to_customer.map(item => (
                                        <tr key={`sent-${item.id}`}>
                                            <td>{item.id}</td>
                                            <td className="url-cell">{item.sn || 'б/н'}</td>
                                            <td style={{ textAlign: 'right' }}>{item.price.toLocaleString('ru-RU')} руб.</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <table className="orders-table" style={{ tableLayout: 'fixed' }}>
                             <colgroup>
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '50%' }} />
                                <col style={{ width: '35%' }} />
                            </colgroup>
                            <tfoot>
                                <tr>
                                    <td colSpan="2" style={{ fontWeight: 'bold' }}>Итого:</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(snapshot.goods_sent_to_customer_value)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="confirm-modal-buttons">
                    <button onClick={onClose} className="btn btn-primary">Закрыть</button>
                </div>
            </div>
        </div>,
        document.getElementById('modal-root')
    );
};


function FinancialReportPage() {
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [selectedSnapshot, setSelectedSnapshot] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getFinancialSnapshots();
            setSnapshots(data);
        } catch (err) {
            setError('Не удалось загрузить отчеты.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateSnapshot = async () => {
        if (!window.confirm('Вы уверены, что хотите создать финансовый срез?')) return;
        try {
            setMessage('Создание среза...');
            setError('');
            await createFinancialSnapshot();
            setMessage('Срез успешно создан!');
            await loadData();
        } catch (err) {
            setError(err.response?.data?.detail || 'Не удалось создать срез.');
            setMessage('');
        }
    };

    if (loading) return <h2>Загрузка...</h2>;

    return (
        <div>
            {/* VVV ЭТА СТРОКА ОТСУТСТВОВАЛА: ВЫЗОВ МОДАЛЬНОГО ОКНА VVV */}
            {selectedSnapshot && <SnapshotDetailsModal snapshot={selectedSnapshot} onClose={() => setSelectedSnapshot(null)} />}
            
            <h1>Финансовые срезы (Рост компании)</h1>
            <div className="order-page-container">
                <button onClick={handleCreateSnapshot} className="btn btn-primary">
                    Сделать срез на сегодня
                </button>
                {error && <p className="form-message error" style={{marginTop: '1rem'}}>{error}</p>}
                {message && <p className="form-message success" style={{marginTop: '1rem'}}>{message}</p>}
            </div>

            <div className="order-page-container">
                <h2>История</h2>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Дата среза</th>
                            <th style={{textAlign: 'right'}}>Деньги в кассе</th>
                            <th style={{textAlign: 'right'}}>Стоимость склада</th>
                            <th style={{textAlign: 'right'}}>Товары в пути (на склад)</th>
                            <th style={{textAlign: 'right'}}>Товары в пути (клиенту)</th>
                            <th style={{textAlign: 'right', fontWeight: 'bold'}}>ИТОГО АКТИВЫ</th>
                            <th>Действие</th>
                        </tr>
                    </thead>
                    <tbody>
                        {snapshots.map(s => (
                            <tr key={s.id}>
                                <td>{formatDate(s.snapshot_date)}</td>
                                <td style={{textAlign: 'right'}}>{formatCurrency(s.cash_balance)}</td>
                                <td style={{textAlign: 'right'}}>{formatCurrency(s.inventory_value)}</td>
                                <td style={{textAlign: 'right'}}>{formatCurrency(s.goods_in_transit_value)}</td>
                                <td style={{textAlign: 'right'}}>{formatCurrency(s.goods_sent_to_customer_value)}</td>
                                <td style={{textAlign: 'right', fontWeight: 'bold'}}>{formatCurrency(s.total_assets)}</td>
                                <td style={{textAlign: 'center'}}>
                                    <button 
                                        onClick={() => setSelectedSnapshot(s)} 
                                        className="btn btn-secondary btn-compact"
                                    >
                                        Детали
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>    
            </div>
        </div>
    );
}

export default FinancialReportPage;