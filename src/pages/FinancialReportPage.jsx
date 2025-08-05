import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { getFinancialSnapshots, createFinancialSnapshot } from '../api';
import './OrdersPage.css'; // Используем общие стили

const formatDate = (dateString) => new Date(dateString).toLocaleString('ru-RU');
const formatCurrency = (amount) => parseFloat(amount).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });

// VVV ЭТОТ БЛОК ОТСУТСТВОВАЛ: ОПИСАНИЕ МОДАЛЬНОГО ОКНА VVV
const SnapshotDetailsModal = ({ snapshot, onClose }) => {
    if (!snapshot || !snapshot.details) return null;

    const { inventory = [], goods_in_transit = [] } = snapshot.details;

    // VVV ИЗМЕНЕНИЯ НАЧИНАЮТСЯ ЗДЕСЬ VVV
    return ReactDOM.createPortal(
        <div className="confirm-modal-overlay">
            <div className="confirm-modal-dialog" style={{ textAlign: 'left', maxWidth: '800px' }}>
                <h3>Детализация среза от {formatDate(snapshot.snapshot_date)}</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <h4>Склад ({inventory.length} шт.)</h4>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table className="orders-table">
                                <thead><tr><th>ID</th><th>S/N</th><th style={{textAlign: 'right'}}>Цена</th></tr></thead>
                                <tbody>
                                    {inventory.map(item => (
                                        <tr key={`inv-${item.id}`}>
                                            <td>{item.id}</td>
                                            <td>{item.sn || 'б/н'}</td>
                                            <td style={{textAlign: 'right'}}>{item.price.toLocaleString('ru-RU')} руб.</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div>
                        <h4>Товары в пути ({goods_in_transit.length} заказ.)</h4>
                         <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table className="orders-table">
                                <thead><tr><th>ID Заказа</th><th style={{textAlign: 'right'}}>Сумма</th></tr></thead>
                                <tbody>
                                    {goods_in_transit.map(item => (
                                        <tr key={`transit-${item.order_id}`}>
                                            <td>{item.order_id}</td>
                                            <td style={{textAlign: 'right'}}>{item.value.toLocaleString('ru-RU')} руб.</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="confirm-modal-buttons">
                    <button onClick={onClose} className="btn btn-primary">Закрыть</button>
                </div>
            </div>
        </div>,
        document.getElementById('modal-root')
    );
    // ^^^ ИЗМЕНЕНИЯ ЗАКАНЧИВАЮТСЯ ЗДЕСЬ ^^^
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
                            <th style={{textAlign: 'right'}}>Товары в пути</th>
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