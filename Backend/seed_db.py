import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.utils.db import SessionLocal, engine
from app.models.schema import (
    UserSchema, IncidentSchema, NotificationSchema, 
    UserRole, UserRelation, IncidentCategory, 
    IncidentStatus, IncidentSeverity
)
from app.utils.auth import get_password_hash

def seed_data():
    db = SessionLocal()
    try:
        print("Seeding sample data...")
        
        # 1. Create an Admin User
        admin_email = "admin@defence.mil"
        existing_admin = db.query(UserSchema).filter(UserSchema.email == admin_email).first()
        if not existing_admin:
            admin_user = UserSchema(
                id=str(uuid.uuid4().hex),
                email=admin_email,
                name="System Administrator",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                service_id="ADM-001",
                relation=UserRelation.PERSONNEL,
                unit="Cyber Defense Command",
                clearance_level="Top Secret",
                is_active=True,
                created_at=datetime.utcnow().isoformat(),
                updated_at=datetime.utcnow().isoformat()
            )
            db.add(admin_user)
            db.flush() # Get the ID
            print(f"Created admin user: {admin_email}")
        else:
            admin_user = existing_admin
            print(f"Admin user {admin_email} already exists.")

        # 2. Create a Regular User
        user_email = "tester@army.mil"
        existing_user = db.query(UserSchema).filter(UserSchema.email == user_email).first()
        if not existing_user:
            regular_user = UserSchema(
                id=str(uuid.uuid4().hex),
                email=user_email,
                name="John Doe",
                password_hash=get_password_hash("password123"),
                role=UserRole.USER,
                service_id="MIL-123",
                relation=UserRelation.PERSONNEL,
                unit="Infantry 1st Div",
                clearance_level="Secret",
                is_active=True,
                created_at=datetime.utcnow().isoformat(),
                updated_at=datetime.utcnow().isoformat()
            )
            db.add(regular_user)
            db.flush() # Get the ID
            print(f"Created regular user: {user_email}")
        else:
            regular_user = existing_user
            print(f"Regular user {user_email} already exists.")

        db.commit()

        # 3. Create Sample Incidents
        incidents_data = [
            {
                "title": "Phishing Attempt via Email",
                "category": IncidentCategory.PHISHING,
                "description": "User reported a suspicious email asking for login credentials to the personnel portal.",
                "status": IncidentStatus.UNDER_REVIEW,
                "severity": IncidentSeverity.HIGH
            },
            {
                "title": "Unauthorized Access Blocked",
                "category": IncidentCategory.OPSEC,
                "description": "Firewall blocked multiple login attempts from an unknown overseas IP address.",
                "status": IncidentStatus.RESOLVED,
                "severity": IncidentSeverity.CRITICAL
            },
            {
                "title": "Malware Detection on Workstation",
                "category": IncidentCategory.MALWARE,
                "description": "Antivirus software flagged and quarantined a suspicious file on a laptop in the HR department.",
                "status": IncidentStatus.PENDING,
                "severity": IncidentSeverity.MEDIUM
            }
        ]

        for i, data in enumerate(incidents_data):
            # Using a slightly more unique ID generation to avoid collisions if re-run
            incident_id = f"INC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4]}"
            
            new_incident = IncidentSchema(
                id=incident_id,
                reporter_id=regular_user.id,
                reporter_name=regular_user.name,
                reporter_email=regular_user.email,
                title=data["title"],
                category=data["category"],
                description=data["description"],
                status=data["status"],
                severity=data["severity"],
                created_at=datetime.utcnow() - timedelta(days=i),
                updated_at=datetime.utcnow()
            )
            db.add(new_incident)
            
            # Add a notification for the admin
            notification = NotificationSchema(
                id=str(uuid.uuid4().hex),
                user_id=admin_user.id,
                title="New Incident Reported",
                message=f"A new {data['category'].value} incident has been reported: {data['title']}",
                type="incident_update",
                is_read=False,
                created_at=datetime.utcnow().isoformat()
            )
            db.add(notification)
            print(f"Created incident: {data['title']}")

        db.commit()
        print("Sample data seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
