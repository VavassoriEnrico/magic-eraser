from app.api.routers import profile
from app.schemas import ProfileUpdate


def test_get_profile_creates_profile_for_authenticated_user(db_session, test_user):
    response = profile.get_my_profile(db_session, test_user)

    assert response.id == "123e4567-e89b-12d3-a456-426614174000"
    assert response.email == "tester@example.com"


def test_patch_profile_updates_normalized_fields(db_session, test_user):
    response = profile.update_my_profile(
        ProfileUpdate(
            name="  Ada  ",
            surname="  Lovelace ",
            username="   ",
        ),
        db_session,
        test_user,
    )

    assert response.name == "Ada"
    assert response.surname == "Lovelace"
    assert response.username is None
