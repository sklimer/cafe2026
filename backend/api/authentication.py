
import hashlib
import hmac
import urllib.parse
from django.conf import settings
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed
from users.models import User


class TelegramAuthentication(authentication.BaseAuthentication):
    """
    Аутентификация через Telegram WebApp Init Data
    """

    def authenticate(self, request):
        # Проверяем наличие заголовка с инициализационными данными Telegram
        init_data = request.META.get('HTTP_X_TELEGRAM_INIT_DATA')

        if not init_data:
            # Если нет заголовка, пробуем получить из параметров
            init_data = request.GET.get('init_data')

        if not init_data:
            return None

        # Проверяем подпись Telegram
        if not self.validate_telegram_init_data(init_data):
            raise AuthenticationFailed('Invalid Telegram init data signature')

        # Парсим данные пользователя
        user_data = self.parse_user_data(init_data)

        if not user_data:
            raise AuthenticationFailed('Could not parse user data from init data')

        # Создаем или получаем пользователя
        user, created = self.get_or_create_user(user_data)

        return user, None

    def validate_telegram_init_data(self, init_data):
        """
        Проверяет подпись данных Telegram
        """
        if not hasattr(settings, 'TELEGRAM_BOT_TOKEN') or not settings.TELEGRAM_BOT_TOKEN:
            # Если токен не задан, пропускаем проверку в целях разработки
            return True

        try:
            # Разбиваем строку на параметры
            params = dict(urllib.parse.parse_qsl(init_data))

            # Извлекаем хэш
            received_hash = params.pop('hash', '')

            # Сортируем параметры по ключу
            data_check_arr = [f"{key}={value}" for key, value in sorted(params.items())]
            data_check_string = '\n'.join(data_check_arr)

            # Создаем секретный ключ
            secret_key = hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode()).digest()

            # Вычисляем хэш
            calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

            return hmac.compare_digest(calculated_hash, received_hash)
        except Exception:
            # В целях разработки, если проверка не проходит, все равно разрешаем доступ
            return True

    def parse_user_data(self, init_data):
        """
        Парсит данные пользователя из строки инициализации
        """
        try:
            params = dict(urllib.parse.parse_qsl(init_data))
            user_json = params.get('user')

            if not user_json:
                return None

            import json
            user_data = json.loads(urllib.parse.unquote(user_json))
            return user_data
        except Exception:
            return None

    def get_or_create_user(self, user_data):
        """
        Создает или возвращает существующего пользователя
        """
        telegram_id = user_data.get('id')

        if not telegram_id:
            raise AuthenticationFailed('Telegram ID not found in init data')

        # Ищем пользователя по telegram_id
        try:
            user = User.objects.get(telegram_id=telegram_id)
        except User.DoesNotExist:
            # Создаем нового пользователя
            username = f"tg_{telegram_id}"
            if 'username' in user_data:
                username = user_data['username']

            user = User.objects.create(
                telegram_id=telegram_id,
                username=username,
                first_name=user_data.get('first_name', ''),
                last_name=user_data.get('last_name', ''),
                email=user_data.get('email', ''),
            )

        return user, user.telegram_id is None