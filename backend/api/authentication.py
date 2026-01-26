import hashlib
import hmac
import urllib.parse
import logging
import json
import time
from typing import Optional, Tuple
from django.conf import settings
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed
from users.models import User

logger = logging.getLogger(__name__)


class TelegramAuthentication(authentication.BaseAuthentication):
    """
    Аутентификация через Telegram WebApp Init Data
    """

    def authenticate(self, request) -> Optional[Tuple[User, None]]:
        init_data = self._extract_init_data(request)
        if not init_data:
            logger.warning("Telegram init_data не найдена в запросе")
            return None

        # Валидируем init_data
        validation_result = self._validate_telegram_init_data(init_data)

        if validation_result is False:
            logger.error("Валидация Telegram init_data не пройдена")
            raise AuthenticationFailed('Invalid Telegram init data signature')

        # Получаем данные пользователя
        user_data = None
        if isinstance(validation_result, str):
            user_data = self._parse_user_json(validation_result)
        elif validation_result is True:
            user_data = self._extract_user_from_init_data(init_data)

        if not user_data:
            logger.error("Не удалось получить данные пользователя из init_data")
            raise AuthenticationFailed('Could not get user data from init data')

        # Создаем или получаем пользователя
        try:
            user, created = self._get_or_create_user(user_data)
            return user, None

        except Exception as e:
            logger.exception(f"Ошибка при создании/получении пользователя")
            raise AuthenticationFailed(f'User creation failed: {str(e)}')

    def _extract_init_data(self, request) -> Optional[str]:
        init_data = request.META.get('HTTP_X_TELEGRAM_INIT_DATA')
        if not init_data:
            init_data = request.GET.get('init_data')
        return init_data

    def _validate_telegram_init_data(self, init_data: str):
        if not init_data:
            logger.error("Пустой init_data")
            return False

        # Пробуем использовать библиотеку telegram-init-data
        try:
            from telegram_init_data import is_valid

            if not hasattr(settings, 'TELEGRAM_BOT_TOKEN') or not settings.TELEGRAM_BOT_TOKEN:
                logger.warning("TELEGRAM_BOT_TOKEN не настроен")
                return True

            result = is_valid(init_data, settings.TELEGRAM_BOT_TOKEN, options=None)

            if result is True:
                return True
            elif isinstance(result, str):
                return result
            elif result is False:
                logger.error("Telegram init data проверка не пройдена")
                return False
            return result

        except ImportError:
            return self._validate_with_builtin(init_data)
        except Exception as e:
            logger.error(f"Ошибка при валидации init data: {str(e)}")
            if settings.DEBUG:
                return self._validate_with_builtin(init_data)
            return False

    def _validate_with_builtin(self, init_data: str) -> bool:
        if not hasattr(settings, 'TELEGRAM_BOT_TOKEN') or not settings.TELEGRAM_BOT_TOKEN:
            logger.warning("TELEGRAM_BOT_TOKEN не настроен")
            return True

        try:
            parsed_params = {}
            for param in init_data.split('&'):
                if '=' in param:
                    key, value = param.split('=', 1)
                    parsed_params[key] = value

            received_hash = parsed_params.get('hash')
            if not received_hash:
                logger.error("Хэш отсутствует в init_data")
                return False

            items_to_sign = []
            for key, value in sorted(parsed_params.items()):
                if key == 'hash':
                    continue
                if key == 'signature':
                    continue

                decoded_value = urllib.parse.unquote(value)
                items_to_sign.append(f"{key}={decoded_value}")

            data_check_string = '\n'.join(items_to_sign)

            secret_key = hmac.new(
                key=b'WebAppData',
                msg=settings.TELEGRAM_BOT_TOKEN.encode(),
                digestmod=hashlib.sha256
            ).digest()

            expected_hash = hmac.new(
                secret_key,
                data_check_string.encode(),
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(expected_hash, received_hash):
                logger.error(f"Хэши не совпадают")
                return False

            return True

        except Exception as e:
            logger.error(f"Ошибка при проверке подписи: {str(e)}")
            if settings.DEBUG:
                return True
            return False

    def _extract_user_from_init_data(self, init_data: str) -> Optional[dict]:
        try:
            parsed_params = {}
            for param in init_data.split('&'):
                if '=' in param:
                    key, value = param.split('=', 1)
                    decoded_value = urllib.parse.unquote(value)
                    parsed_params[key] = decoded_value

            user_json = parsed_params.get('user')
            if not user_json:
                logger.error("Параметр 'user' не найден в init_data")
                return None

            return json.loads(user_json)

        except Exception as e:
            logger.error(f"Ошибка при извлечении данных пользователя: {str(e)}")
            return None

    def _parse_user_json(self, user_json_str: str) -> Optional[dict]:
        try:
            if user_json_str.startswith('user='):
                json_str = user_json_str[5:]
            else:
                json_str = user_json_str

            decoded_json = urllib.parse.unquote(json_str)
            user_data = json.loads(decoded_json)

            if 'id' not in user_data:
                logger.error("В данных пользователя отсутствует поле 'id'")
                return None

            return user_data

        except json.JSONDecodeError as e:
            logger.error(f"Ошибка декодирования JSON: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Ошибка при парсинге JSON: {str(e)}")
            return None

    def _get_or_create_user(self, user_data: dict) -> Tuple[User, bool]:
        telegram_id = user_data.get('id')

        if not telegram_id:
            raise AuthenticationFailed('Telegram ID not found in init data')

        try:
            user = User.objects.get(telegram_id=telegram_id)
            self._update_user_if_needed(user, user_data)
            return user, False

        except User.DoesNotExist:
            username = f"tg_{telegram_id}"
            if user_data.get('username'):
                username = user_data['username']

            user = User.objects.create(
                telegram_id=telegram_id,
                username=username,
                first_name=user_data.get('first_name', ''),
                last_name=user_data.get('last_name', ''),
                email=user_data.get('email', ''),
            )
            logger.info(f"Создан новый пользователь: {username} (telegram_id: {telegram_id})")
            return user, True

    def _update_user_if_needed(self, user: User, user_data: dict) -> None:
        updated = False

        if user.first_name != user_data.get('first_name', ''):
            user.first_name = user_data.get('first_name', '')
            updated = True

        if user.last_name != user_data.get('last_name', ''):
            user.last_name = user_data.get('last_name', '')
            updated = True

        if user.username != user_data.get('username', f"tg_{user.telegram_id}"):
            user.username = user_data.get('username', f"tg_{user.telegram_id}")
            updated = True

        if updated:
            user.save()