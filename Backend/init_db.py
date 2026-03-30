import os
import sys

# Add the Backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.db import Base, engine
from app.models.schema import UserSchema, IncidentSchema, CommentSchema, NotificationSchema, ChatMessageSchema, EmailSchema

print("Creating database tables (users, incidents, comments, notifications, chat_messages, gmail_emails)...")
Base.metadata.create_all(bind=engine)
print("Database tables created successfully!")
