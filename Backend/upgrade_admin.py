from sqlalchemy.orm import Session
from app.utils.db import SessionLocal
from app.models.schema import UserSchema, UserRole

def upgrade_admin():
    db = SessionLocal()
    try:
        email = "admin@defence.mil"
        user = db.query(UserSchema).filter(UserSchema.email == email).first()
        if user:
            user.role = UserRole.ADMIN
            db.commit()
            print(f"Successfully upgraded {email} to ADMIN role!")
        else:
            print(f"User {email} not found.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    upgrade_admin()
