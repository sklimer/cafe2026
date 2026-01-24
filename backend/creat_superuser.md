Выполняем команду 
python manage.py shell

туда вводим код нижке


from users.models import User
import secrets
import string

# 1. Создаем суперпользователя с telegram_id
telegram_id = 5474350538  # ваш Telegram ID
email = "sklimer@yandex.ru"
first_name = "Администратор"

# Генерируем сложный пароль
alphabet = string.ascii_letters + string.digits + "!@#$%"
password = ''.join(secrets.choice(alphabet) for _ in range(16))

# 2. Создаем или обновляем пользователя
try:
    # Проверяем, существует ли пользователь
    user = User.objects.get(telegram_id=telegram_id)
    print(f"⚠️ Пользователь с telegram_id={telegram_id} уже существует, обновляем...")
except User.DoesNotExist:
    # Создаем нового суперпользователя
    user = User.objects.create_superuser(
        telegram_id=telegram_id,
        first_name=first_name,
        email=email,
        is_staff=True,
        is_superuser=True,
        is_active=True
    )
    print(f"✅ Создан новый суперпользователь")

# 3. Устанавливаем email и пароль
user.email = email
user.set_password(password)  # Хешируем пароль
user.save()

print("\n" + "="*50)
print("🎉 СУПЕРПОЛЬЗОВАТЕЛЬ СОЗДАН!")
print("="*50)
print(f"Telegram ID: {user.telegram_id}")
print(f"Email для входа: {user.email}")
print(f"Пароль: {password}")
print(f"Имя: {user.first_name}")
print(f"Дата создания: {user.created_at}")
print("="*50)
print("\n⚠️ Сохраните пароль! Он больше не будет показан.")
print("Для входа в админку используйте:")
print(f"  Логин: {user.email} ИЛИ {user.telegram_id}")
print(f"  Пароль: {password}")

мой пароль: e$!tfwVP%ZqT#JvO

