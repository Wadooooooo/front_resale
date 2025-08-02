import React, { useState, useEffect } from 'react';
import { getPhones, getStorageOptions, getColorOptions } from '../api';
import { useNavigate } from 'react-router-dom';
import './OrdersPage.css'; // Импортируем общие стили

function PhonesPage() {
  const [phones, setPhones] = useState([]);
  const [storageOptions, setStorageOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPhonesData = async () => {
      try {
        const [phonesData, storageData, colorData] = await Promise.all([
          getPhones(),
          getStorageOptions(),
          getColorOptions()
        ]);

        // Сортируем телефоны по ID в обратном порядке, чтобы новые были сверху
        phonesData.sort((a, b) => b.id - a.id);
        setPhones(phonesData);
        setStorageOptions(storageData);
        setColorOptions(colorData);

      } catch (err) {
        console.error('Ошибка при загрузке телефонов:', err);
        setError('Не удалось загрузить данные с сервера.');
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPhonesData();
  }, [navigate]);

  if (loading) {
    return <h2>Загрузка списка телефонов...</h2>;
  }

  if (error) {
    return <p className="form-message error">{error}</p>;
  }

  return (
    <div>
      <h1>Список телефонов</h1>
      <div className="order-page-container">
        {phones.length === 0 ? (
          <p>Телефоны не найдены.</p>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Модель</th>
                <th>Память</th>
                <th>Цвет</th>
                <th>Серийный номер</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {phones.map(phone => {
                const storageId = phone.model?.storage_id;
                const colorId = phone.model?.color_id;

                // Ищем значение памяти по ID
                const storageDisplay = storageId !== undefined && storageId !== null
                  ? storageOptions.find(s => s.id === storageId)?.storage
                  : null;

                // Ищем название цвета по ID
                const colorDisplay = colorId !== undefined && colorId !== null
                  ? colorOptions.find(c => c.id === colorId)?.color_name || '-'
                  : '-';
                
                const formattedStorage = storageDisplay ? `${storageDisplay}GB` : '-';

                return (
                  <tr key={phone.id}>
                    <td>{phone.id}</td>
                    <td>{phone.model?.base_name || '-'}</td>
                    <td>{formattedStorage}</td>
                    <td>{colorDisplay}</td>
                    <td>{phone.serial_number || '-'}</td>
                    <td>{phone.commercial_status || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default PhonesPage;