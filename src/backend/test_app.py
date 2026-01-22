# backend/tests/test_app.py

import json
import importlib.util
from pathlib import Path

import pytest


# =========================
# helpers (вспомогательные функции)
# =========================

def load_app_module():
    """
    Динамически загружает backend/app.py как модуль.
    Нужно, чтобы в тестах можно было подменять переменные
    (пути к файлам, s3 и т.п.) через monkeypatch.
    """
    backend_dir = Path(__file__).resolve().parents[1]
    app_path = backend_dir / "app.py"

    spec = importlib.util.spec_from_file_location("app", app_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class DummyS3:
    """
    Заглушка для S3.
    Используется, чтобы тесты не ходили в реальное облачное хранилище.
    """
    def upload_fileobj(self, *args, **kwargs):
        return None

    def delete_object(self, *args, **kwargs):
        return None


def read_json(path: Path, default):
    """
    Удобная функция для чтения JSON-файлов.
    Если файл не существует — возвращает default.
    """
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


# =========================
# fixtures (фикстуры pytest)
# =========================

@pytest.fixture()
def client(tmp_path, monkeypatch):
    """
    Создаёт тестовый клиент Flask-приложения.

    - Подменяет пути к JSON-файлам на временные (tmp_path)
    - Подменяет S3 на DummyS3
    - Включает TESTING режим
    """
    app_module = load_app_module()

    # Подмена файлов хранилища на временные
    monkeypatch.setattr(app_module, "USERS_FILE", str(tmp_path / "users.json"))
    monkeypatch.setattr(app_module, "IMAGES_FILE", str(tmp_path / "images.json"))
    monkeypatch.setattr(app_module, "ALBUMS_FILE", str(tmp_path / "albums.json"))
    monkeypatch.setattr(app_module, "GUEST_FILE", str(tmp_path / "guest_uploads.json"))

    # Подмена S3
    monkeypatch.setattr(app_module, "s3", DummyS3())

    app_module.app.config["TESTING"] = True

    # Сохраняем ссылку на модуль, чтобы обращаться к путям файлов в тестах
    app_module.app.config["APP_MODULE"] = app_module

    with app_module.app.test_client() as c:
        yield c


# =========================
# tests: auth (регистрация и вход)
# =========================

def test_sign_up_success(client):
    """
    Успешная регистрация нового пользователя
    """
    res = client.post("/api/sign-up", json={"email": "a@a.com", "password": "123"})
    assert res.status_code == 201

    data = res.get_json()
    assert data["message"] == "registered"
    assert data["user"]["email"] == "a@a.com"
    assert "id" in data["user"]


def test_sign_up_missing_fields(client):
    """
    Регистрация с пустыми email и password → ошибка
    """
    res = client.post("/api/sign-up", json={"email": "", "password": ""})
    assert res.status_code == 400

    data = res.get_json()
    assert data["error"] == "email_or_password_missing"


def test_sign_up_existing_user(client):
    """
    Попытка зарегистрировать пользователя с уже существующим email
    """
    r1 = client.post("/api/sign-up", json={"email": "dup@a.com", "password": "123"})
    assert r1.status_code == 201

    r2 = client.post("/api/sign-up", json={"email": "dup@a.com", "password": "456"})
    assert r2.status_code == 400

    data = r2.get_json()
    assert data["error"] == "user_exists"


def test_sign_in_success(client):
    """
    Успешный вход с корректными данными
    """
    client.post("/api/sign-up", json={"email": "login@a.com", "password": "pass"})
    res = client.post("/api/sign-in", json={"email": "login@a.com", "password": "pass"})

    assert res.status_code == 200
    data = res.get_json()
    assert data["message"] == "ok"
    assert data["user"]["email"] == "login@a.com"


def test_sign_in_wrong_password(client):
    """
    Вход с неправильным паролем
    """
    client.post("/api/sign-up", json={"email": "wp@a.com", "password": "pass"})
    res = client.post("/api/sign-in", json={"email": "wp@a.com", "password": "wrong"})

    assert res.status_code == 400
    data = res.get_json()
    assert data["error"] == "wrong_password"


def test_sign_in_user_not_found(client):
    """
    Вход для несуществующего пользователя
    """
    res = client.post("/api/sign-in", json={"email": "no@a.com", "password": "pass"})
    assert res.status_code == 400

    data = res.get_json()
    assert data["error"] == "user_not_found"


# =========================
# tests: albums (работа с альбомами)
# =========================

def test_create_album_success(client):
    """
    Успешное создание альбома
    """
    u = client.post("/api/sign-up", json={"email": "alb@a.com", "password": "1"}).get_json()["user"]["id"]

    res = client.post("/api/albums", json={"user_id": u, "title": "My album"})
    assert res.status_code == 201

    data = res.get_json()
    assert data["album"]["title"] == "My album"
    assert data["album"]["user_id"] == u
    assert "id" in data["album"]


def test_create_album_missing_title(client):
    """
    Попытка создать альбом без названия
    """
    u = client.post("/api/sign-up", json={"email": "alb2@a.com", "password": "1"}).get_json()["user"]["id"]

    res = client.post("/api/albums", json={"user_id": u, "title": ""})
    assert res.status_code == 400

    data = res.get_json()
    assert data["error"] == "user_id_or_title_missing"


def test_rename_album_forbidden(client):
    """
    Попытка переименовать альбом чужим пользователем
    """
    u1 = client.post("/api/sign-up", json={"email": "u1@a.com", "password": "1"}).get_json()["user"]["id"]
    u2 = client.post("/api/sign-up", json={"email": "u2@a.com", "password": "1"}).get_json()["user"]["id"]

    alb = client.post("/api/albums", json={"user_id": u1, "title": "A"}).get_json()["album"]
    album_id = alb["id"]

    res = client.post(f"/api/album/{album_id}/rename", json={"user_id": u2, "title": "HACK"})
    assert res.status_code == 403

    data = res.get_json()
    assert data["error"] == "forbidden"


def test_delete_album_success_detaches_images(client):
    """
    Удаление альбома:
    - альбом удаляется
    - у всех изображений album_id становится None
    """
    app_module = client.application.config["APP_MODULE"]
    images_path = Path(app_module.IMAGES_FILE)

    u = client.post("/api/sign-up", json={"email": "delalb@a.com", "password": "1"}).get_json()["user"]["id"]
    alb = client.post("/api/albums", json={"user_id": u, "title": "ToDel"}).get_json()["album"]
    album_id = alb["id"]

    # Имитируем изображения, привязанные к альбому
    images = [
        {"id": "img1", "user_id": u, "title": "1", "album_id": album_id, "key": "k1", "url": "u1", "created_at": "1"},
        {"id": "img2", "user_id": u, "title": "2", "album_id": album_id, "key": "k2", "url": "u2", "created_at": "2"},
    ]
    images_path.write_text(json.dumps(images, ensure_ascii=False, indent=2), encoding="utf-8")

    res = client.delete(f"/api/album/{album_id}", json={"user_id": u})
    assert res.status_code == 200

    data = res.get_json()
    assert data["message"] == "ok"

    after_images = read_json(images_path, [])
    assert all(x.get("album_id") is None for x in after_images)


# =========================
# tests: images (работа с изображениями)
# =========================

def test_rename_image_success(client):
    """
    Успешное переименование изображения
    """
    app_module = client.application.config["APP_MODULE"]
    images_path = Path(app_module.IMAGES_FILE)

    u = client.post("/api/sign-up", json={"email": "ri@a.com", "password": "1"}).get_json()["user"]["id"]

    images = [
        {"id": "img1", "user_id": u, "title": "Old", "album_id": None, "key": "k1", "url": "u1", "created_at": "1"}
    ]
    images_path.write_text(json.dumps(images, ensure_ascii=False, indent=2), encoding="utf-8")

    res = client.post("/api/image/img1/rename", json={"user_id": u, "title": "New"})
    assert res.status_code == 200

    data = res.get_json()
    assert data["message"] == "ok"
    assert data["image"]["title"] == "New"

    after_images = read_json(images_path, [])
    assert after_images[0]["title"] == "New"


def test_rename_image_missing_title(client):
    """
    Переименование изображения без нового названия
    """
    app_module = client.application.config["APP_MODULE"]
    images_path = Path(app_module.IMAGES_FILE)

    u = client.post("/api/sign-up", json={"email": "ri2@a.com", "password": "1"}).get_json()["user"]["id"]
    images_path.write_text(
        json.dumps(
            [{"id": "img1", "user_id": u, "title": "Old", "album_id": None, "key": "k1", "url": "u1"}],
            ensure_ascii=False, indent=2
        ),
        encoding="utf-8"
    )

    res = client.post("/api/image/img1/rename", json={"user_id": u, "title": ""})
    assert res.status_code == 400

    data = res.get_json()
    assert data["error"] == "user_id_or_title_missing"


def test_delete_image_forbidden(client):
    """
    Попытка удалить изображение чужим пользователем
    """
    app_module = client.application.config["APP_MODULE"]
    images_path = Path(app_module.IMAGES_FILE)

    u1 = client.post("/api/sign-up", json={"email": "d1@a.com", "password": "1"}).get_json()["user"]["id"]
    u2 = client.post("/api/sign-up", json={"email": "d2@a.com", "password": "1"}).get_json()["user"]["id"]

    images_path.write_text(
        json.dumps(
            [{"id": "imgX", "user_id": u1, "title": "X", "album_id": None, "key": "kX", "url": "uX"}],
            ensure_ascii=False, indent=2
        ),
        encoding="utf-8"
    )

    res = client.delete("/api/image/imgX", json={"user_id": u2})
    assert res.status_code == 403

    data = res.get_json()
    assert data["error"] == "forbidden"


def test_set_image_album_album_not_found(client):
    """
    Попытка привязать изображение к несуществующему альбому
    """
    app_module = client.application.config["APP_MODULE"]
    images_path = Path(app_module.IMAGES_FILE)
    albums_path = Path(app_module.ALBUMS_FILE)

    u = client.post("/api/sign-up", json={"email": "sia@a.com", "password": "1"}).get_json()["user"]["id"]

    images_path.write_text(
        json.dumps(
            [{"id": "img1", "user_id": u, "title": "1", "album_id": None, "key": "k1", "url": "u1"}],
            ensure_ascii=False, indent=2
        ),
        encoding="utf-8"
    )
    albums_path.write_text(json.dumps([], ensure_ascii=False, indent=2), encoding="utf-8")

    res = client.post("/api/image/img1/set-album", json={"user_id": u, "album_id": "no_such_album"})
    assert res.status_code == 404

    data = res.get_json()
    assert data["error"] == "album_not_found"
