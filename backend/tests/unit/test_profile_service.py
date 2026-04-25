from app.repositories import profile_repository
from app.services import profile_service


def test_get_or_create_profile_creates_profile_once(db_session, test_user_id):
    profile = profile_service.get_or_create_profile(
        db_session,
        user_id=test_user_id,
        email="tester@example.com",
    )
    same_profile = profile_service.get_or_create_profile(
        db_session,
        user_id=test_user_id,
        email="other@example.com",
    )

    assert profile.id == test_user_id
    assert profile.email == "tester@example.com"
    assert same_profile.id == profile.id
    assert profile_repository.get_by_id(db_session, test_user_id) is not None


def test_update_profile_normalizes_blank_values_to_none(db_session, test_user_id):
    updated = profile_service.update_profile(
        db_session,
        user_id=test_user_id,
        email="tester@example.com",
        name="  Ada  ",
        surname="   ",
        username="  ada.lovelace ",
    )

    assert updated.name == "Ada"
    assert updated.surname is None
    assert updated.username == "ada.lovelace"
    assert updated.email == "tester@example.com"
