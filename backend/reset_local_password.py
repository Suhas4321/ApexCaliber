"""Reset the single local account password from the machine that owns the database."""

from getpass import getpass

from sqlalchemy import delete

from app.auth import LOCAL_USER_ID
from app.db import SessionLocal
from app.models import LocalAccount, LocalSession
from app.routers.local_auth import _hash_password


def main() -> None:
    with SessionLocal() as session:
        account = session.get(LocalAccount, LOCAL_USER_ID)
        if account is None:
            raise SystemExit("No local account exists yet. Open the sign-in page to create one.")
        password = getpass("New password (12–128 characters): ")
        if not 12 <= len(password) <= 128:
            raise SystemExit("Password must be 12–128 characters.")
        if password != getpass("Confirm new password: "):
            raise SystemExit("Passwords do not match.")
        account.password_hash = _hash_password(password)
        session.execute(delete(LocalSession))
        session.commit()
    print("Password changed. All previous local sessions were signed out.")


if __name__ == "__main__":
    main()
