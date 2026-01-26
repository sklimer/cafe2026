
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';
import { useQuery } from '@tanstack/react-query';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, bonusBalance, hasPhone, logout } = useAuthStore();

  // Загружаем количество заказов и адресов из API
  const {
    data: ordersData
  } = useQuery({
    queryKey: ['orders'],
    queryFn: () => apiClient.getOrders().then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  const {
    data: addressesData
  } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => apiClient.getAddresses().then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  const ordersCount = ordersData?.orders?.length || 0;
  const addressesCount = addressesData?.addresses?.length || 0;

  return (
    <div className="pb-20">
      {/* Шапка */}
      <div className="sticky top-0 z-10 bg-white shadow-sm p-4 flex items-center justify-between">
        <button
          className="text-gray-500 mr-2"
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <h1 className="text-lg font-bold truncate flex-1 text-center">Профиль</h1>
        <div className="ml-2 w-8"></div> {/* Для выравнивания */}
      </div>

      <div className="p-4">
        {/* Информация о пользователе */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center mb-4">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
            <div className="ml-4">
              <h2 className="text-lg font-bold text-gray-900">
                {user?.firstName} {user?.lastName || ''}
              </h2>
              <p className="text-gray-600">@{user?.username || 'username'}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-600">
              <span className="mr-2">📱</span>
              <span>Телеграм ID: {user?.telegramId || '123456789'}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <span className="mr-2">📅</span>
              <span>Дата регистрации: {user ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '01.01.2024'}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <span className="mr-2">📞</span>
              <span>Телефон: {user?.phone || '+7 (999) 123-45-67'}</span>
            </div>
          </div>
        </div>

        {/* Бонусный баланс */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white mb-4">
          <div className="text-sm">Бонусный баланс</div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold">{bonusBalance}</span>
            <span className="ml-1">баллов</span>
            <span className="ml-2 text-sm">(≈ {bonusBalance * 10}₽)</span>
          </div>
          <div className="text-xs mt-1 opacity-80">Можно использовать при оплате заказов</div>
        </div>

        {/* Настройки уведомлений */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h3 className="font-medium mb-3">Рассылки</h3>

          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-3" />
              <span>Получать уведомления</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-3" />
              <span>Получать промоакции</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-3" />
              <span>Получать новости</span>
            </label>
          </div>
        </div>

        {/* Реферальная ссылка */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h3 className="font-medium mb-3">Реферальная программа</h3>
          <div className="bg-gray-50 p-3 rounded-lg mb-2">
            <div className="text-sm break-all">t.me/bot?start=ref_{user?.username || 'ivanov'}</div>
          </div>
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg">
            Копировать
          </button>
        </div>

        {/* Дополнительные разделы */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <button
            className="w-full flex items-center justify-between p-4 border-b"
            onClick={() => navigate('/orders')}
          >
            <span className="flex items-center">
              <span className="mr-3">📋</span>
              <span>Мои заказы</span>
            </span>
            <span className="text-gray-500 text-sm">{ordersCount}</span>
          </button>

          <button
            className="w-full flex items-center justify-between p-4"
            onClick={() => navigate('/addresses')}
          >
            <span className="flex items-center">
              <span className="mr-3">🏠</span>
              <span>Мои адреса</span>
            </span>
            <span className="text-gray-500 text-sm">{addressesCount}</span>
          </button>
        </div>

        {/* Кнопка выхода */}
        <button
          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium"
          onClick={logout}
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;