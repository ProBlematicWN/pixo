import json
import uuid
from pathlib import Path
from datetime import datetime, timezone
from faker import Faker
import random

# Инициализация генератора фейковых данных
fake = Faker()

# Базовая директория — папка, где лежит этот файл
BASE_DIR = Path(__file__).resolve().parent

# Пути к JSON-файлам, которые будут сгенерированы
USERS_FILE = BASE_DIR / "users.json"
ALBUMS_FILE = BASE_DIR / "albums.json"
IMAGES_FILE = BASE_DIR / "images.json"
GUEST_FILE = BASE_DIR / "guest_uploads.json"

# Параметры S3-хранилища (используются для генерации URL изображений)
S3_ENDPOINT = "https://storage.yandexcloud.net"
S3_BUCKET = "pixo-images"


def now_iso():
    """
    Возвращает текущую дату и время в формате ISO 8601 (UTC).
    Используется для created_at / uploaded_at.
    """
    return datetime.now(timezone.utc).isoformat()


def dump(path: Path, data):
    """
    Сохраняет переданные данные в JSON-файл:
    - с отступами
    - с поддержкой Unicode
    """
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )


def make_user(lang=None):
    """
    Генерирует одного пользователя.

    Поля:
    - id            — уникальный UUID
    - email         — фейковый email
    - password      — фейковый пароль (в открытом виде, для тестов)
    - username      — никнейм
    - lang          — язык интерфейса (ru / en)
    - created_at    — дата создания
    """
    user_id = str(uuid.uuid4())
    email = fake.unique.email()
    password = fake.password(length=8)

    return {
        "id": user_id,
        "email": email,
        "password": password,
        "username": fake.user_name(),
        "lang": lang or random.choice(["ru", "en"]),
        "created_at": now_iso(),
    }


def make_album(user_id):
    """
    Генерирует альбом для конкретного пользователя.

    - user_id       — владелец альбома
    - title         — случайное название
    - created_at    — дата создания
    """
    return {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": fake.sentence(nb_words=2).replace(".", ""),
        "created_at": now_iso(),
    }


def make_image(user_id, album_id=None):
    """
    Генерирует изображение.

    - user_id       — владелец изображения
    - album_id      — альбом (может быть None)
    - key           — путь к файлу в S3
    - url           — публичный URL изображения
    """
    image_id = str(uuid.uuid4())
    ext = random.choice([".jpg", ".png", ".jpeg", ".webp"])

    # S3-ключ формируется по шаблону user/{user_id}/{image_id}.{ext}
    key = f"user/{user_id}/{image_id}{ext}"
    url = f"{S3_ENDPOINT}/{S3_BUCKET}/{key}"

    return {
        "id": image_id,
        "user_id": user_id,
        "title": fake.sentence(nb_words=3).replace(".", ""),
        "album_id": album_id,
        "key": key,
        "url": url,
        "created_at": now_iso(),
    }


def make_guest_upload():
    """
    Генерирует загрузку гостя (без пользователя).

    Возвращает:
    - guest_id      — уникальный идентификатор записи
    - объект с данными загрузки
    """
    guest_id = str(uuid.uuid4())
    ext = random.choice([".jpg", ".png", ".jpeg"])

    # Файлы гостей лежат в guest/
    key = f"guest/{uuid.uuid4()}{ext}"
    url = f"{S3_ENDPOINT}/{S3_BUCKET}/{key}"

    return guest_id, {
        "key": key,
        "title": fake.sentence(nb_words=2).replace(".", ""),
        "uploaded_at": now_iso(),
        "url": url,
    }


def generate(
    users_count=15,
    max_albums_per_user=5,
    images_per_user=(8, 25),
    guest_uploads_count=10,
):
    """
    Основная функция генерации seed-данных.

    Параметры:
    - users_count            — количество пользователей
    - max_albums_per_user    — максимум альбомов на пользователя
    - images_per_user        — диапазон количества изображений
    - guest_uploads_count    — количество гостевых загрузок
    """
    users = []
    albums = []
    images = []
    guests = {}

    # Генерация пользователей
    for _ in range(users_count):
        u = make_user()
        users.append(u)

        # Генерация альбомов пользователя
        user_albums = []
        albums_count = random.randint(0, max_albums_per_user)
        for _ in range(albums_count):
            a = make_album(u["id"])
            albums.append(a)
            user_albums.append(a)

        # Генерация изображений пользователя
        # Часть изображений кладётся в альбомы, часть — без альбома
        count_imgs = random.randint(images_per_user[0], images_per_user[1])
        for _ in range(count_imgs):
            if user_albums and random.random() < 0.6:
                album_id = random.choice(user_albums)["id"]
            else:
                album_id = None

            images.append(make_image(u["id"], album_id=album_id))

    # Генерация гостевых загрузок
    for _ in range(guest_uploads_count):
        gid, obj = make_guest_upload()
        guests[gid] = {
            "key": obj["key"],
            "title": obj["title"],
            "uploaded_at": obj["uploaded_at"],
        }

    # Сохранение данных в JSON-файлы
    dump(USERS_FILE, users)
    dump(ALBUMS_FILE, albums)
    dump(IMAGES_FILE, images)
    dump(GUEST_FILE, guests)

    # Информация в консоль
    print("Seed data generated:")
    print(f"- users:  {len(users)}  -> {USERS_FILE}")
    print(f"- albums: {len(albums)} -> {ALBUMS_FILE}")
    print(f"- images: {len(images)} -> {IMAGES_FILE}")
    print(f"- guests: {len(guests)} -> {GUEST_FILE}")


# Запуск генерации при прямом запуске файла
if __name__ == "__main__":
    generate()
