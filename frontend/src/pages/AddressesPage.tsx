import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Address, Branch } from '../types';

// Mock data
const mockAddresses: Address[] = [
  {
    id: 'addr1',
    userId: 'user1',
    type: 'home',
    street: 'ул. Примерная',
    building: '10',
    apartment: '25',
    label: 'Дом',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'addr2',
    userId: 'user1',
    type: 'work',
    street: 'пр. Рабочий',
    building: '25',
    apartment: '410',
    label: 'Работа',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const mockBranches: Branch[] = [
  {
    id: 'branch1',
    restaurantId: 'rest1',
    name: 'Центральный филиал',
    address: 'ул. Центральная, 1',
    phone: '+7 (999) 123-45-67',
    workTime: '9:00-23:00',
    coordinates: [55.7558, 37.6176],
    isDeliveryAvailable: true,
    deliveryRadius: 5,
    isActive: true
  },
  {
    id: 'branch2',
    restaurantId: 'rest1',
    name: 'Северный филиал',
    address: 'ул. Северная, 15',
    phone: '+7 (999) 123-45-68',
    workTime: '10:00-22:00',
    coordinates: [55.7558, 37.6176],
    isDeliveryAvailable: true,
    deliveryRadius: 7,
    isActive: true
  }
];

const AddressesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'delivery' | 'pickup'>('delivery');

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
        <h1 className="text-lg font-bold truncate flex-1 text-center">Адреса</h1>
        <div className="ml-2 w-8"></div> {/* Для выравнивания */}
      </div>

      <div className="p-4">
        {/* Переключение между доставкой и самовывозом */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button
            className={`flex-1 py-2 px-4 rounded-md text-center ${
              activeTab === 'delivery' ? 'bg-white shadow-sm' : ''
            }`}
            onClick={() => setActiveTab('delivery')}
          >
            Доставка
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-center ${
              activeTab === 'pickup' ? 'bg-white shadow-sm' : ''
            }`}
            onClick={() => setActiveTab('pickup')}
          >
            Самовывоз
          </button>
        </div>

        {activeTab === 'delivery' ? (
          <div>
            <h2 className="font-medium mb-3">Доставка</h2>
            
            {/* Список адресов */}
            <div className="space-y-3 mb-4">
              {mockAddresses.map(address => (
                <div key={address.id} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start">
                    <div className="text-xl mr-3">
                      {address.type === 'home' ? '🏠' : address.type === 'work' ? '🏢' : '📍'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {address.label || (address.type === 'home' ? 'Дом' : address.type === 'work' ? 'Работа' : 'Другое')}
                      </div>
                      <div className="text-gray-600 text-sm">
                        {address.street}, {address.building}{address.apartment ? `, кв. ${address.apartment}` : ''}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">📍 5 мин от ресторана</div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-500 text-sm">Изменить</button>
                      {address.isDefault ? (
                        <span className="text-green-500 text-sm">По умолчанию</span>
                      ) : (
                        <button className="text-gray-500 text-sm">По умолчанию</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Кнопка добавления нового адреса */}
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-medium mb-4">
              + Добавить новый адрес
            </button>
          </div>
        ) : (
          <div>
            <h2 className="font-medium mb-3">Самовывоз</h2>
            
            {/* Список филиалов */}
            <div className="space-y-3">
              {mockBranches.map(branch => (
                <div key={branch.id} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start">
                    <div className="text-xl mr-3">🏪</div>
                    <div className="flex-1">
                      <div className="font-medium">{branch.name}</div>
                      <div className="text-gray-600 text-sm">{branch.address}</div>
                      <div className="text-gray-500 text-xs mt-1">🕐 {branch.workTime}</div>
                      <div className="text-gray-500 text-xs">📞 {branch.phone}</div>
                    </div>
                    <button className="text-blue-500 text-sm">Выбрать</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressesPage;