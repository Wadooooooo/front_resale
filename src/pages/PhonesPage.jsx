// src/pages/PhonesPage.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPhones, getModelColorCombos, updateImageForModelColor } from '../api';
import './OrdersPage.css';

// Компонент для вкладки со списком телефонов
const PhoneListTab = () => {
    const [phones, setPhones] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    // Состояния для пагинации
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const PAGE_SIZE = 25; // Количество телефонов на одной странице

    useEffect(() => {
        const fetchPhones = async () => {
            try {
                setLoading(true);
                const skip = (page - 1) * PAGE_SIZE;
                
                // Запрашиваем данные для конкретной страницы
                const data = await getPhones(skip, PAGE_SIZE);
                
                // Сохраняем список телефонов из `data.items`
                setPhones(data.items); 
                
                // Рассчитываем общее количество страниц
                setTotalPages(Math.ceil(data.total / PAGE_SIZE));

            } catch (err) {
                console.error('Ошибка при загрузке телефонов:', err);
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchPhones();
    }, [navigate, page]); // Перезагружаем данные при смене страницы

    if (loading) return <h4>Загрузка списка телефонов...</h4>;

    return (
        <>
            <table className="orders-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Модель</th>
                        <th>S/N</th>
                        <th>Коммерческий статус</th>
                    </tr>
                </thead>
                <tbody>
                    {phones.map(phone => (
                        <tr key={phone.id}>
                            <td>{phone.id}</td>
                            <td>{phone.model?.name || '-'}</td>
                            <td>
                                {phone.serial_number ? (
                                    <Link to={`/phone-history/${phone.serial_number}`} className="clickable-sn">
                                        {phone.serial_number}
                                    </Link>
                                ) : ('-')}
                            </td>
                            <td>{phone.commercial_status || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Блок с кнопками пагинации */}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => setPage(1)} disabled={page <= 1} className="btn btn-secondary">
                    В начало
                </button>
                <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="btn btn-secondary">
                    Назад
                </button>
                <span>Страница {page} из {totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="btn btn-secondary">
                    Вперед
                </button>
                <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="btn btn-secondary">
                    В конец
                </button>
            </div>
        </>
    );
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
};

const ModelManagementTab = () => {
    const [modelColorCombos, setModelColorCombos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingModel, setEditingModel] = useState(null); // Для модального окна
    const [imageUrl, setImageUrl] = useState('');
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getModelColorCombos();
            setModelColorCombos(data);
        } catch (err) {
            console.error("Ошибка загрузки комбинаций моделей и цветов:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleEdit = (combo) => {
        setEditingModel(combo);
        setImageUrl(combo.image_url || '');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!editingModel) return;

        try {
            const updateData = {
                model_name_id: editingModel.model_name_id,
                color_id: editingModel.color_id,
                image_url: imageUrl,
            };
            await updateImageForModelColor(updateData);
            setMessage('Изображение успешно обновлено!');
            setEditingModel(null);
            loadData(); // Перезагружаем данные для отображения изменений
        } catch (err) {
            alert('Ошибка при обновлении изображения.');
        }
    };

    const sortedAndFilteredCombos = modelColorCombos
        .filter(combo => 
            combo.model_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            combo.color_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.model_name.localeCompare(b.model_name));

    if (loading) return <h4>Загрузка моделей...</h4>;

    return (
        <div>
            {editingModel && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-dialog" style={{ textAlign: 'left' }}>
                        <h3>Изменить изображение для</h3>
                        <p><strong>{editingModel.model_name} {editingModel.color_name}</strong></p>
                        <form onSubmit={handleSave}>
                            <div className="form-section">
                                <label>URL изображения</label>
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    className="form-input"
                                    placeholder="Вставьте ссылку на изображение..."
                                />
                            </div>
                            <div className="confirm-modal-buttons">
                                <button type="submit" className="btn btn-primary">Сохранить</button>
                                <button type="button" onClick={() => setEditingModel(null)} className="btn btn-secondary">Отмена</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <div className="form-section">
                <input
                    type="text"
                    placeholder="Поиск по названию или цвету..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                    style={{ maxWidth: '400px' }}
                />
            </div>
             {message && <p className="form-message success">{message}</p>}
            <table className="orders-table">
                <thead>
                    <tr>
                        <th>Модель</th>
                        <th>Цвет</th>
                        <th>Изображение</th>
                        <th>Действие</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedAndFilteredCombos.map(combo => (
                        <tr key={`${combo.model_name_id}-${combo.color_id}`}>
                            <td>{combo.model_name}</td>
                            <td>{combo.color_name}</td>
                            <td>
                                {combo.image_url ? 
                                    <img src={combo.image_url} alt={`${combo.model_name}`} style={{ width: '40px', height: 'auto' }} /> : 
                                    'Нет фото'
                                }
                            </td>
                            <td>
                                <button onClick={() => handleEdit(combo)} className="btn btn-secondary btn-compact">
                                    Изменить
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Компонент для вкладки создания телефона (остается без изменений)
const CreatePhoneTab = () => {
    // Здесь может быть ваша логика для создания телефона
    return (
        <div>
            <h2>Добавить телефон вручную</h2>
            <p>Этот раздел находится в разработке.</p>
        </div>
    );
};


// Основной компонент страницы
function PhonesPage() {
    const [activeTab, setActiveTab] = useState('list');

    return (
        <div>
            <h1>Телефоны</h1>
            <div className="order-page-container">
                <div className="tabs">
                    <button
                        className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
                        onClick={() => setActiveTab('list')}
                    >
                        Список телефонов
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'management' ? 'active' : ''}`}
                        onClick={() => setActiveTab('management')}
                    >
                        Управление моделями
                    </button>
                </div>
                {activeTab === 'list' && <PhoneListTab />}
                {activeTab === 'management' && <ModelManagementTab />}
            </div>
        </div>
    );
}

export default PhonesPage;