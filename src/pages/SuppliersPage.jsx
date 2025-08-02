// RESALE-FRONTEND/src/pages/SuppliersPage.jsx

import React, { useState, useEffect } from 'react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../api';
import { useNavigate } from 'react-router-dom';
import './OrdersPage.css'; // Импортируем общие стили

// Компонент для модального окна редактирования, теперь тоже в общем стиле
function EditSupplierModal({ supplier, onClose, onSave }) {
  const [name, setName] = useState(supplier.name || '');
  const [contactInfo, setContactInfo] = useState(supplier.contact_info || '');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({ name, contact_info: contactInfo });
  };

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal-dialog" style={{ textAlign: 'left' }}>
        <h3>Редактировать поставщика</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <label>Имя:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <div className="form-section">
            <label>Контактная информация:</label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <div className="confirm-modal-buttons">
            <button type="submit" className="btn btn-primary">Сохранить</button>
            <button type="button" onClick={onClose} className="btn btn-secondary">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}


function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // Добавлено для сообщений об успехе
  const [newName, setNewName] = useState('');
  const [newContactInfo, setNewContactInfo] = useState('');
  const [editingSupplier, setEditingSupplier] = useState(null);
  const navigate = useNavigate();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err) {
      setError('Не удалось загрузить список поставщиков.');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [navigate]);

  const handleAddSupplier = async (event) => {
    event.preventDefault();
    if (!newName || !newContactInfo) return;
    setError('');
    setMessage('');
    try {
      await createSupplier({ name: newName, contact_info: newContactInfo });
      setMessage(`Поставщик "${newName}" успешно добавлен.`);
      setNewName('');
      setNewContactInfo('');
      fetchSuppliers();
    } catch (err) {
      setError('Ошибка при добавлении поставщика.');
    }
  };

  const handleDelete = async (supplierId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого поставщика?')) {
      setError('');
      setMessage('');
      try {
        await deleteSupplier(supplierId);
        setMessage('Поставщик успешно удален.');
        fetchSuppliers();
      } catch (err) {
        setError('Ошибка при удалении поставщика. Возможно, с ним связаны заказы.');
      }
    }
  };

  const handleSaveSupplier = async (updatedData) => {
    setError('');
    setMessage('');
    try {
      await updateSupplier(editingSupplier.id, updatedData);
      setMessage(`Данные поставщика "${updatedData.name}" успешно обновлены.`);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (err) {
      setError('Ошибка при обновлении поставщика.');
    }
  };

  if (loading) return <h2>Загрузка...</h2>;

  return (
    <div>
      {editingSupplier && (
        <EditSupplierModal
          supplier={editingSupplier}
          onClose={() => setEditingSupplier(null)}
          onSave={handleSaveSupplier}
        />
      )}

      <h1>Управление поставщиками</h1>

      <div className="order-page-container">
        <h2>Добавить нового поставщика</h2>
        <form onSubmit={handleAddSupplier}>
          <div className="details-grid">
            <div className="form-section">
                <label>Имя</label>
                <input
                  type="text"
                  placeholder="Введите имя поставщика"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="form-input"
                />
            </div>
            <div className="form-section">
                <label>Контактная информация</label>
                <input
                  type="text"
                  placeholder="Введите контакты"
                  value={newContactInfo}
                  onChange={(e) => setNewContactInfo(e.target.value)}
                  required
                  className="form-input"
                />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Добавить</button>
        </form>
        {error && <p className="form-message error">{error}</p>}
        {message && <p className="form-message success">{message}</p>}
      </div>
      
      <div className="order-page-container">
        <h2>Список поставщиков</h2>
        <table className="orders-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Контактная информация</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(supplier => (
              <tr key={supplier.id}>
                <td>{supplier.id}</td>
                <td>{supplier.name}</td>
                <td>{supplier.contact_info}</td>
                <td>
                  <button onClick={() => setEditingSupplier(supplier)} className="btn btn-secondary btn-compact">Редактировать</button>
                  <button onClick={() => handleDelete(supplier.id)} className="btn btn-danger btn-compact">Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SuppliersPage;