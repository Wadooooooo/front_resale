// RESALE-FRONTEND/src/api.js

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Адрес вашего FastAPI бэкенда

// Функция для получения/установки/удаления токена
// Используем 'accessToken', как в вашем App.jsx и LoginPage.jsx
let authToken = localStorage.getItem('accessToken') || null;

export const setAuthTokens = ({ access_token, refresh_token }) => {
    if (access_token) {
        localStorage.setItem('accessToken', access_token);
    } else {
        localStorage.removeItem('accessToken');
    }
    if (refresh_token) {
        localStorage.setItem('refreshToken', refresh_token);
    } else {
        localStorage.removeItem('refreshToken');
    }
};

export const getAuthToken = () => localStorage.getItem('accessToken');
export const getRefreshToken = () => localStorage.getItem('refreshToken');

// --- Новая функция для запроса на обновление ---
export const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token available");

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken
    });
    // Сохраняем оба токена
    setAuthTokens(response.data);
    return response.data.access_token;
};

// --- Новая функция для выхода из системы ---
export const logoutUser = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
        try {
            await axios.post(`${API_BASE_URL}/auth/logout`, {
                refresh_token: refreshToken
            });
        } catch (error) {
            console.error("Logout failed on server:", error);
        }
    }
    // Вне зависимости от ответа сервера, чистим локальное хранилище
    setAuthTokens({ access_token: null, refresh_token: null });
};

// --- Настройка Axios для добавления токена в заголовки ---
// Это позволит избежать повторения кода в каждом запросе
axios.interceptors.request.use(
    config => {
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// --- Настройка Axios для перехвата 401 ошибок ---
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

axios.interceptors.request.use(
    config => {
        const token = getAuthToken();
        if (token) {
            config.headers['Authorization'] = 'Bearer ' + token;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    response => {
        return response;
    },
    async error => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                .then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return axios(originalRequest);
                })
                .catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newAccessToken = await refreshAccessToken();
                processQueue(null, newAccessToken);
                originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
                return axios(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                // Если refresh token тоже невалиден, выходим из системы
                logoutUser();
                window.location = '/login'; // Перенаправляем на страницу входа
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

// --- API для аутентификации ---
export const loginUser = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    // Для логина токен не нужен
    const response = await axios.post(`${API_BASE_URL}/auth/token`, formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    return response.data;
};

// --- API для Телефонов ---
export const getPhones = async (skip = 0, limit = 25) => {
    const response = await axios.get(`${API_BASE_URL}/phones`, { params: { skip, limit } });
    return response.data;
};

export const getPhoneById = async (phoneId) => {
    const response = await axios.get(`${API_BASE_URL}/phones/${phoneId}`);
    return response.data;
};

// --- API для Поставщиков ---
export const getSuppliers = async () => {
    const response = await axios.get(`${API_BASE_URL}/suppliers`);
    return response.data;
};

export const createSupplier = async (supplierData) => {
    const response = await axios.post(`${API_BASE_URL}/suppliers`, supplierData);
    return response.data;
};

export const updateSupplier = async (supplierId, supplierData) => {
    const response = await axios.put(`${API_BASE_URL}/suppliers/${supplierId}`, supplierData);
    return response.data;
};

export const deleteSupplier = async (supplierId) => {
    const response = await axios.delete(`${API_BASE_URL}/suppliers/${supplierId}`);
    return response.data;
};

// --- API для Заказов Поставщиков ---
export const getSupplierOrders = async () => {
    const response = await axios.get(`${API_BASE_URL}/supplier-orders`);
    return response.data;
};

export const createSupplierOrder = async (orderData) => {
    const response = await axios.post(`${API_BASE_URL}/supplier-orders`, orderData);
    return response.data;
};

export const receiveSupplierOrder = async (orderId) => {
    const response = await axios.put(`${API_BASE_URL}/supplier-orders/${orderId}/receive`);
    return response.data;
};

// --- НОВАЯ API-ФУНКЦИЯ: Получение уникальных базовых названий моделей ---
export const getUniqueModelNames = async () => {
    const response = await axios.get(`${API_BASE_URL}/unique_model_names`);
    return response.data;
};


// --- API для получения Моделей и Аксессуаров по названию ---
export const getAllModelsFullInfo = async () => {
    // ПРАВИЛЬНО: этот эндпоинт вернет все комбинации моделей с памятью и цветом
    const response = await axios.get(`${API_BASE_URL}/all_models_full_info`); 
    return response.data;
};

// --- API для получения опций памяти и цвета ---
export const getStorageOptions = async () => {
    const response = await axios.get(`${API_BASE_URL}/storage_options`);
    return response.data;
};

export const getColorOptions = async () => {
    const response = await axios.get(`${API_BASE_URL}/color_options`);
    return response.data;
};


export const getAllAccessoriesInfo = async () => {
    // ИСПРАВЛЕНО: путь должен быть '/accessories_for_orders', как в main.py
    const response = await axios.get(`${API_BASE_URL}/accessories_for_orders`); 
    return response.data;
};


export const getPhonesForInspection = async () => {
    const response = await axios.get(`${API_BASE_URL}/phones/for-inspection`);
    return response.data;
};

export const getChecklistItems = async () => {
    const response = await axios.get(`${API_BASE_URL}/checklist-items`);
    return response.data;
};

export const submitInspection = async (phoneId, inspectionData) => {
    const response = await axios.post(`${API_BASE_URL}/phones/${phoneId}/inspections`, inspectionData);
    return response.data;
};

export const getPhonesForBatteryTest = async () => {
    const response = await axios.get(`${API_BASE_URL}/phones/for-battery-test`);
    return response.data;
};

/**
 * Отправляет результаты первоначальной инспекции (чек-лист)
 * @param {number} phoneId - ID телефона
 * @param {object} inspectionData - Данные инспекции (серийный номер и результаты чек-листа)
 */
export const submitInitialInspection = async (phoneId, inspectionData) => {
    const response = await axios.post(`${API_BASE_URL}/phones/${phoneId}/initial-inspections`, inspectionData);
    return response.data;
};

/**
 * Добавляет результаты теста аккумулятора к существующей инспекции
 * @param {number} inspectionId - ID инспекции (ВНИМАНИЕ: не ID телефона!)
 * @param {object} batteryData - Данные о тесте аккумулятора
 */
export const addBatteryTest = async (inspectionId, batteryData) => {
    const response = await axios.put(`${API_BASE_URL}/inspections/${inspectionId}/battery-test`, batteryData);
    return response.data;
};


export const searchModelNumbers = async (query) => {
    const response = await axios.get(`${API_BASE_URL}/model-numbers/search`, { params: { q: query } });
    return response.data;
};

export const getShops = async () => {
    const response = await axios.get(`${API_BASE_URL}/shops`);
    return response.data;
};

export const getPhonesReadyForStock = async () => {
    const response = await axios.get(`${API_BASE_URL}/phones/ready-for-stock`);
    return response.data;
};

export const acceptPhonesToWarehouse = async (acceptanceData) => {
    const response = await axios.post(`${API_BASE_URL}/warehouse/accept-phones`, acceptanceData);
    return response.data;
};

export const getAllAccessories = async () => {
    const response = await axios.get(`${API_BASE_URL}/accessories`);
    return response.data;
};

export const getProductsForSale = async () => {
    const response = await axios.get(`${API_BASE_URL}/products-for-sale`);
    return response.data;
};

export const getCustomers = async () => {
    const response = await axios.get(`${API_BASE_URL}/customers`);
    return response.data;
};

export const createSale = async (saleData) => {
    const response = await axios.post(`${API_BASE_URL}/sales`, saleData);
    return response.data;
};

export const getPendingSales = async () => {
    const response = await axios.get(`${API_BASE_URL}/sales/pending`);
    return response.data;
};

export const finalizeSale = async (saleId, accountId) => {
    const response = await axios.post(`${API_BASE_URL}/sales/${saleId}/finalize-payment`, {
        account_id: accountId
    });
    return response.data;
};

export const addPhonePrice = async (modelId, priceData) => {
    const response = await axios.post(`${API_BASE_URL}/models/${modelId}/prices`, priceData);
    return response.data;
};

export const addAccessoryPrice = async (accessoryId, priceData) => {
    const response = await axios.post(`${API_BASE_URL}/accessories/${accessoryId}/prices`, priceData);
    return response.data;
};

export const getModelStorageCombos = async () => {
    const response = await axios.get(`${API_BASE_URL}/model-storage-combos`);
    return response.data;
};

export const setPriceForPhoneCombo = async (priceData) => {
    const response = await axios.post(`${API_BASE_URL}/prices/phone-combo`, priceData);
    return response.data;
};

// --- API для Движения Денег ---

export const getCashFlows = async (skip = 0, limit = 50, accountId = null) => {
    const params = { skip, limit };
    if (accountId) {
        params.account_id = accountId;
    }
    const response = await axios.get(`${API_BASE_URL}/cashflow`, { params });
    return response.data;
};

export const createCashFlow = async (data) => {
    const response = await axios.post(`${API_BASE_URL}/cashflow`, data);
    return response.data;
};

export const getOperationCategories = async () => {
    const response = await axios.get(`${API_BASE_URL}/cashflow/categories`);
    return response.data;
};

export const getCounterparties = async () => {
    const response = await axios.get(`${API_BASE_URL}/cashflow/counterparties`);
    return response.data;
};

export const getAccounts = async () => {
    const response = await axios.get(`${API_BASE_URL}/cashflow/accounts`);
    return response.data;
};

export const createAccount = async (data) => {
    const response = await axios.post(`${API_BASE_URL}/cashflow/accounts`, data);
    return response.data;
};

export const createCounterparty = async (data) => {
    const response = await axios.post(`${API_BASE_URL}/cashflow/counterparties`, data);
    return response.data;
};

export const getTotalBalance = async () => {
    const response = await axios.get(`${API_BASE_URL}/cashflow/total-balance`);
    return response.data;
};


export const paySupplierOrder = async (orderId, paymentData) => {
    const response = await axios.post(`${API_BASE_URL}/supplier-orders/${orderId}/pay`, paymentData);
    return response.data;
};

export const getInventoryValuation = async () => {
    const response = await axios.get(`${API_BASE_URL}/warehouse/valuation`);
    return response.data;
};

export const getProfitReport = async (startDate, endDate) => {
    const response = await axios.get(`${API_BASE_URL}/reports/profit`, {
        params: {
            start_date: startDate,
            end_date: endDate
        }
    });
    return response.data;
};

export const getDividendCalculations = async () => {
    const response = await axios.get(`${API_BASE_URL}/reports/dividends`);
    return response.data;
};

export const getMe = async () => {
    const response = await axios.get(`${API_BASE_URL}/users/me/`);
    return response.data;
};


export const getAccessoryCategories = async () => {
    const response = await axios.get(`${API_BASE_URL}/accessory-categories`);
    return response.data;
};

export const createAccessory = async (accessoryData) => {
    const response = await axios.post(`${API_BASE_URL}/accessories`, accessoryData);
    return response.data;
};

export const getAccessoryModelLinks = async () => {
    const response = await axios.get(`${API_BASE_URL}/accessory-model-links`);
    return response.data;
};

export const linkAccessoryToModel = async (linkData) => {
    const response = await axios.post(`${API_BASE_URL}/accessory-model-links`, linkData);
    return response.data;
};

export const unlinkAccessoryFromModel = async (linkId) => {
    await axios.delete(`${API_BASE_URL}/accessory-model-links/${linkId}`);
};

export const getCompatibleAccessories = async (modelNameId) => {
    const response = await axios.get(`${API_BASE_URL}/models/${modelNameId}/compatible-accessories`);
    return response.data;
};

export const getAccessoriesInStock = async () => {
    const response = await axios.get(`${API_BASE_URL}/accessories/in-stock`);
    return response.data;
};

export const getPhoneHistory = async (serialNumber) => {
    const response = await axios.get(`${API_BASE_URL}/phones/history/${serialNumber}`);
    return response.data;
};

export const getDefectivePhones = async () => {
    const response = await axios.get(`${API_BASE_URL}/phones/defective`);
    return response.data;
};

export const getPhonesSentToSupplier = async () => {
    const response = await axios.get(`${API_BASE_URL}/phones/sent-to-supplier`);
    return response.data;
};

export const sendToSupplier = async (phoneIds) => {
    const response = await axios.post(`${API_BASE_URL}/phones/send-to-supplier`, phoneIds);
    return response.data;
};

export const returnFromSupplier = async (phoneId) => {
    const response = await axios.post(`${API_BASE_URL}/phones/${phoneId}/return-from-supplier`);
    return response.data;
};

export const processRefund = async (phoneId, refundData) => {
    const response = await axios.post(`${API_BASE_URL}/phones/${phoneId}/refund`, refundData);
    return response.data;
};

export const startRepair = async (phoneId, acceptanceData) => {
    const response = await axios.post(`${API_BASE_URL}/phones/${phoneId}/start-repair`, acceptanceData);
    return response.data;
};

export const finishRepair = async (repairId, finishData) => {
    const response = await axios.post(`${API_BASE_URL}/repairs/${repairId}/finish`, finishData);
    return response.data;
};

// ДОБАВЬТЕ НОВУЮ ФУНКЦИЮ
export const payForRepair = async (repairId, paymentData) => {
    const response = await axios.post(`${API_BASE_URL}/repairs/${repairId}/pay`, paymentData);
    return response.data;
};

export const getReplacementPhones = async (phoneId) => {
    const response = await axios.get(`${API_BASE_URL}/phones/${phoneId}/replacements`);
    return response.data;
};

export const processExchange = async (originalPhoneId, replacementPhoneId) => {
    const response = await axios.post(`${API_BASE_URL}/phones/${originalPhoneId}/exchange`, {
        replacement_phone_id: replacementPhoneId
    });
    return response.data;
};


export const getReplacementModelOptions = async (modelId) => {
    const response = await axios.get(`${API_BASE_URL}/models/${modelId}/alternatives`);
    return response.data;
};

export const replaceFromSupplier = async (originalPhoneId, replacementData) => {
    const response = await axios.post(`${API_BASE_URL}/phones/${originalPhoneId}/replace-from-supplier`, replacementData);
    return response.data;
};

export const getRoles = async () => {
    const response = await axios.get(`${API_BASE_URL}/roles`);
    return response.data;
};

export const registerEmployee = async (employeeData) => {
    const response = await axios.post(`${API_BASE_URL}/users/register-employee`, employeeData);
    return response.data;
};

export const getUsers = async () => {
    const response = await axios.get(`${API_BASE_URL}/users`);
    return response.data;
};

export const deleteUser = async (userId) => {
    const response = await axios.delete(`${API_BASE_URL}/users/${userId}`);
    return response.data;
};

export const getDashboardSalesSummary = async () => {
    const response = await axios.get(`${API_BASE_URL}/dashboard/sales-summary`);
    return response.data;
};

export const getDashboardReadyForSale = async () => {
    const response = await axios.get(`${API_BASE_URL}/dashboard/ready-for-sale`);
    return response.data;
};

export const getLowStockAccessories = async (threshold = 10) => {
    const response = await axios.get(`${API_BASE_URL}/dashboard/low-stock-accessories`, {
        params: { threshold }
    });
    return response.data;
};

export const getPhonesInStock = async () => {
    const response = await axios.get(`${API_BASE_URL}/phones/in-stock`);
    return response.data;
};

export const getPhonesForPackaging = async () => {
    const response = await axios.get(`${API_BASE_URL}/phones/ready-for-packaging`);
    return response.data;
};

export const submitPackaging = async (phoneIds) => {
    const response = await axios.post(`${API_BASE_URL}/phones/package`, phoneIds);
    return response.data;
};

export const createCustomer = async (customerData) => {
    const response = await axios.post(`${API_BASE_URL}/customers`, customerData);
    return response.data;
};

export const getTrafficSources = async () => {
    const response = await axios.get(`${API_BASE_URL}/traffic-sources`);
    return response.data;
};

export const createTrafficSource = async (sourceData) => {
    const response = await axios.post(`${API_BASE_URL}/traffic-sources`, sourceData);
    return response.data;
};

export const updateTrafficSource = async (sourceId, sourceData) => {
    const response = await axios.put(`${API_BASE_URL}/traffic-sources/${sourceId}`, sourceData);
    return response.data;
};

export const deleteTrafficSource = async (sourceId) => {
    await axios.delete(`${API_BASE_URL}/traffic-sources/${sourceId}`);
};

export const getMySales = async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await axios.get(`${API_BASE_URL}/sales/my-sales`, { params });
    return response.data;
};

// --- API для Заметок ---
export const getNotes = async (showAll = false) => {
    const response = await axios.get(`${API_BASE_URL}/notes`, { params: { show_all: showAll } });
    return response.data;
};

export const createNote = async (content) => {
    const response = await axios.post(`${API_BASE_URL}/notes`, { content });
    return response.data;
};

export const updateNoteStatus = async (noteId, isCompleted) => {
    const response = await axios.put(`${API_BASE_URL}/notes/${noteId}`, { is_completed: isCompleted });
    return response.data;
};

export const getAllPhonesInStockDetailed = async () => {
    const response = await axios.get(`${API_BASE_URL}/phones/stock-details`);
    return response.data;
};

export const movePhoneLocation = async (phoneId, newLocation) => {
    const response = await axios.put(`${API_BASE_URL}/warehouse/move-phone/${phoneId}`, { new_location: newLocation });
    return response.data;
};

export const updateModel = async (modelId, modelData) => {
    const response = await axios.put(`${API_BASE_URL}/models/${modelId}`, modelData);
    return response.data;
};

export const getModelColorCombos = async () => {
    const response = await axios.get(`${API_BASE_URL}/models/color-combos`);
    return response.data;
};

export const updateImageForModelColor = async (updateData) => {
    const response = await axios.put(`${API_BASE_URL}/models/image-by-color`, updateData);
    return response.data;
};

export const getAvailableLoanerPhones = async () => {
    const response = await axios.get(`${API_BASE_URL}/phones/available-for-loaner`);
    return response.data;
};

export const issueLoanerPhone = async (repairId, loanerPhoneId) => {
    const response = await axios.post(`${API_BASE_URL}/repairs/${repairId}/issue-loaner`, { loaner_phone_id: loanerPhoneId });
    return response.data;
};

export const returnLoanerPhone = async (loanerLogId) => {
    const response = await axios.post(`${API_BASE_URL}/loaner-logs/${loanerLogId}/return-loaner`);
    return response.data;
};

export const getPayrollReport = async (startDate, endDate) => {
    const response = await axios.get(`${API_BASE_URL}/reports/payroll`, {
        params: {
            start_date: startDate,
            end_date: endDate
        }
    });
    return response.data;
};

// --- API для Смен ---
export const getActiveShift = async () => {
    const response = await axios.get(`${API_BASE_URL}/shifts/active`);
    return response.data;
};

export const startShift = async () => {
    const response = await axios.post(`${API_BASE_URL}/shifts/start`);
    return response.data;
};

export const endShift = async () => {
    const response = await axios.put(`${API_BASE_URL}/shifts/end`);
    return response.data;
};

export const paySalary = async (userId, paymentData) => {
    const response = await axios.post(`${API_BASE_URL}/reports/payroll/pay?user_id=${userId}`, paymentData);
    return response.data;
};

export const getFinancialSnapshots = async () => {
    const response = await axios.get(`${API_BASE_URL}/reports/financial-snapshots`);
    return response.data;
};

export const createFinancialSnapshot = async () => {
    const response = await axios.post(`${API_BASE_URL}/reports/financial-snapshots`);
    return response.data;
};

export const getAccountsWithBalances = async () => {
    const response = await axios.get(`${API_BASE_URL}/accounts/balances`);
    return response.data;
};

// --- API для Вкладов ---
export const createDeposit = async (depositData) => {
    const response = await axios.post(`${API_BASE_URL}/deposits`, depositData);
    return response.data;
};

export const getDepositsDetails = async (targetDate) => {
    const params = {};
    if (targetDate) {
        params.target_date = targetDate;
    }
    const response = await axios.get(`${API_BASE_URL}/deposits/details`, { params });
    return response.data;
};

export const createDepositPayment = async (paymentData) => {
    const response = await axios.post(`${API_BASE_URL}/deposits/pay`, paymentData);
    return response.data;
};

export const getProductAnalytics = async (startDate, endDate) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/products`, {
        params: {
            start_date: startDate,
            end_date: endDate
        }
    });
    return response.data;
};

export const getFinancialAnalytics = async (startDate, endDate) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/financials`, {
        params: {
            start_date: startDate,
            end_date: endDate
        }
    });
    return response.data;
};

export const getSalesByDate = async (targetDate) => {
    const response = await axios.get(`${API_BASE_URL}/sales/by-date`, {
        params: { target_date: targetDate }
    });
    return response.data;
};

export const getCashflowByDate = async (targetDate) => {
    const response = await axios.get(`${API_BASE_URL}/cashflow/by-date`, {
        params: { target_date: targetDate }
    });
    return response.data;
};

export const getProductAnalyticsDetails = async (modelName, startDate, endDate) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/products/details`, {
        params: {
            model_name: modelName,
            start_date: startDate,
            end_date: endDate
        }
    });
    return response.data;
};

export const getEmployeeAnalytics = async (startDate, endDate) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/employees`, {
        params: {
            start_date: startDate,
            end_date: endDate
        }
    });
    return response.data;
};

export const getCustomerAnalytics = async (startDate, endDate) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/customers`, {
        params: {
            start_date: startDate,
            end_date: endDate
        }
    });
    return response.data;
};

export const getInventoryAnalytics = async (startDate, endDate) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/inventory`, {
        params: {
            start_date: startDate,
            end_date: endDate
        }
    });
    return response.data;
};

export const getTaxReport = async (startDate, endDate) => {
    const response = await axios.get(`${API_BASE_URL}/reports/tax`, {
        params: {
            start_date: startDate,
            end_date: endDate
        }
    });
    return response.data;
};

export const getQuarterlyTaxReport = async (year, quarter) => {
    const response = await axios.get(`${API_BASE_URL}/reports/quarterly-tax`, {
        params: { year, quarter }
    });
    return response.data;
};

export const getMarginAnalytics = async (startDate, endDate) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/margins`, {
        params: {
            start_date: startDate,
            end_date: endDate
        }
    });
    return response.data;
};

export const getSellThroughAnalytics = async (startDate, endDate) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/sell-through`, {
        params: {
            start_date: startDate,
            end_date: endDate
        }
    });
    return response.data;
};

export const getAbcAnalysis = async (startDate, endDate) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/abc-analysis`, {
        params: {
            start_date: startDate,
            end_date: endDate
        }
    });
    return response.data;
};

export const getRepeatCustomerAnalytics = async (startDate, endDate) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/repeat-customers`, {
        params: {
            start_date: startDate,
            end_date: endDate
        }
    });
    return response.data;
};

export const getAverageCheckAnalytics = async (startDate, endDate) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/average-check`, {
        params: {
            start_date: startDate,
            end_date: endDate
        }
    });
    return response.data;
};

export const getCashFlowForecast = async (forecastDays) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/cash-flow-forecast`, {
        params: { forecast_days: forecastDays }
    });
    return response.data;
};

export const getWaitingList = async () => {
    const response = await axios.get(`${API_BASE_URL}/waiting-list`);
    return response.data;
};

export const addToWaitingList = async (data) => {
    const response = await axios.post(`${API_BASE_URL}/waiting-list`, data);
    return response.data;
};

export const updateWaitingListStatus = async (entryId, status) => {
    const response = await axios.put(`${API_BASE_URL}/waiting-list/${entryId}/status`, { status });
    return response.data;
};

export const getUnreadNotifications = async () => {
    const response = await axios.get(`${API_BASE_URL}/notifications`);
    return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
    const response = await axios.put(`${API_BASE_URL}/notifications/${notificationId}/read`);
    return response.data;
};

export const createAccessoryCategory = async (categoryData) => {
    const response = await axios.post(`${API_BASE_URL}/accessory-categories`, categoryData);
    return response.data;
};

export const createModelNumber = async (name) => {
    const response = await axios.post(`${API_BASE_URL}/model-numbers`, { name });
    return response.data;
};

export const getSaleById = async (saleId) => {
    const response = await axios.get(`${API_BASE_URL}/sales/${saleId}`);
    return response.data;
};

export const cancelSale = async (saleId) => {
    const response = await axios.post(`${API_BASE_URL}/sales/${saleId}/cancel`);
    return response.data;
};

export const getCompanyHealthAnalytics = async () => {
    const response = await axios.get(`${API_BASE_URL}/analytics/company-health`);
    return response.data;
};

export const getAccessoryAnalytics = async (startDate, endDate) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/accessories`, {
        params: {
            start_date: startDate,
            end_date: endDate
        }
    });
    return response.data;
};

