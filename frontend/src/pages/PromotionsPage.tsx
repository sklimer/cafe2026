import React from 'react';
import { useNavigate } from 'react-router-dom';

// Mock data
const mockPromotions = [
  {
    id: 'promo1',
    title: 'Скидка 20% на первый заказ',
    description: 'Для новых пользователей',
    terms: 'Скидка 20% на первый заказ от 500 рублей',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    image: '',
    type: 'discount' as const,
    conditions: {
      minOrderAmount: 500,
      targetGroups: ['new_users'] as const,
      maxUsesPerUser: 1
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'promo2',
    title: 'Бесплатная доставка',
    description: 'При заказе от 1000₽',
    terms: 'Бесплатная доставка при заказе от 1000 рублей',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    image: '',
    type: 'free_delivery' as const,
    conditions: {
      minOrderAmount: 1000,
      targetGroups: ['all'] as const
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'promo3',
    title: 'Скидка в день рождения',
    description: '15% в течение 7 дней',
    terms: 'Пользователи получают скидку 15% за 3 дня до дня рождения и 4 дня после',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    image: '',
    type: 'birthday_discount' as const,
    conditions: {
      targetGroups: ['all'] as const
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const PromotionsPage: React.FC = () => {
  const navigate = useNavigate();

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
        <h1 className="text-lg font-bold truncate flex-1 text-center">Акции и спецпредложения</h1>
        <div className="ml-2 w-8"></div> {/* Для выравнивания */}
      </div>

      <div className="p-4">
        {/* Список акций */}
        <div className="space-y-4">
          {mockPromotions.map(promotion => (
            <div key={promotion.id} className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex">
                <div className="text-2xl mr-4">
                  {promotion.type === 'discount' && '🎁'}
                  {promotion.type === 'free_delivery' && '🚚'}
                  {promotion.type === 'birthday_discount' && '🎂'}
                  {promotion.type === 'gift' && '🎉'}
                  {promotion.type === 'bonus' && '💰'}
                  {promotion.type === 'special' && '✨'}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{promotion.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{promotion.description}</p>
                  <p className="text-gray-500 text-xs mt-2">
                    Действует до {new Date(promotion.endDate).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
              
              <div className="mt-3">
                <button className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm py-2 px-4 rounded-lg">
                  Подробнее
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionsPage;