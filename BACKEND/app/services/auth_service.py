from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
from app.schemas.auth import LoginResponse
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token
)


class AuthService:

    @staticmethod
    def register_user(db: Session, user_data: UserCreate):
        """
        Register a new user.
        """

        existing_email = (
            db.query(User)
            .filter(User.email == user_data.email)
            .first()
        )

        if existing_email:
            raise ValueError("Email already registered")

        existing_username = (
            db.query(User)
            .filter(User.username == user_data.username)
            .first()
        )

        if existing_username:
            raise ValueError("Username already taken")

        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hash_password(user_data.password),
            full_name=user_data.full_name
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user

    @staticmethod
    def login_user(
        db: Session,
        email: str,
        password: str
    ) -> LoginResponse:
        """
        Authenticate a user and return an access token.
        """

        user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if not user:
            raise ValueError("Invalid UserID")

        if not verify_password(password, user.hashed_password):
            raise ValueError("Invalid password")

        access_token = create_access_token(
            {
                "sub": user.email
            }
        )

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=user
        )

    @staticmethod
    def get_user_by_email(
        db: Session,
        email: str
    ):
        """
        Retrieve a user by email.
        """

        return (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

    @staticmethod
    def get_user_by_id(
        db: Session,
        user_id: int
    ):
        """
        Retrieve a user by ID.
        """

        return (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )