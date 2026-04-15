import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.utils.db import SessionLocal
from app.utils.gmail_service import GmailService
from app.utils.email_analyzer import EmailAnalyzer
from app.models.schema import UserSchema, EmailSchema, GmailAccountSchema
from app.config import settings
import uuid

logger = logging.getLogger(__name__)


class EmailSyncService:
    """Service for syncing and analyzing Gmail emails in background"""
    
    def __init__(self):
        self.gmail_service = None
        self.email_analyzer = EmailAnalyzer()
        
        if settings.GMAIL_CLIENT_ID and settings.GMAIL_CLIENT_SECRET and settings.ENCRYPTION_KEY:
            self.gmail_service = GmailService(
                settings.GMAIL_CLIENT_ID,
                settings.GMAIL_CLIENT_SECRET,
                settings.GMAIL_REDIRECT_URI,
                settings.gmail_scopes_list,
                settings.ENCRYPTION_KEY
            )
    
    async def sync_user_emails(self, user_id: str, db: Session) -> int:
        """
        Sync and analyze emails for a specific user
        
        Returns:
            Number of emails processed
        """
        try:
            gmail_account = db.query(GmailAccountSchema).filter(GmailAccountSchema.user_id == user_id).first()
            
            if not gmail_account or not gmail_account.gmail_connected:
                return 0
            
            if not gmail_account.gmail_refresh_token:
                logger.warning(f"No refresh token for user {user_id}")
                return 0
            
            # Refresh token if expired
            if gmail_account.gmail_token_expires_at and gmail_account.gmail_token_expires_at <= datetime.utcnow():
                try:
                    refresh_token = self.gmail_service.decrypt_token(gmail_account.gmail_refresh_token)
                    new_credentials = self.gmail_service.refresh_access_token(refresh_token)
                    gmail_account.gmail_access_token = self.gmail_service.encrypt_token(new_credentials['access_token'])
                    gmail_account.gmail_token_expires_at = datetime.utcnow() + timedelta(seconds=new_credentials.get('expires_in', 3600))
                    gmail_account.updated_at = datetime.utcnow()
                    db.commit()
                except Exception as e:
                    logger.error(f"Failed to refresh token for user {user_id}: {e}")
                    gmail_account.gmail_connected = False
                    db.commit()
                    return 0
            
            # Get credentials
            access_token = self.gmail_service.decrypt_token(gmail_account.gmail_access_token)
            credentials = self.gmail_service.get_credentials_from_token_dict({
                'access_token': access_token,
                'refresh_token': gmail_account.gmail_refresh_token
            })
            
            # Fetch emails
            message_ids = self.gmail_service.fetch_emails(credentials, settings.EMAIL_FETCH_LIMIT)
            
            emails_processed = 0
            for message_id in message_ids:
                try:
                    # Check if email already exists
                    existing = db.query(EmailSchema).filter(
                        EmailSchema.gmail_message_id == message_id
                    ).first()
                    
                    if existing:
                        continue
                    
                    # Get email details
                    email_details = self.gmail_service.get_email_details(credentials, message_id)
                    if not email_details:
                        continue
                    
                    # Analyze email
                    analysis = await self.email_analyzer.analyze_email(email_details)
                    
                    # Store in database
                    email_record = EmailSchema(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        gmail_message_id=message_id,
                        subject=email_details.get('subject'),
                        from_address=email_details.get('from'),
                        to_address=email_details.get('to'),
                        body_preview=email_details.get('body', '')[:200],
                        phishing_score=str(analysis.get('phishing_score', 0)),
                        threat_level=analysis.get('threat_level'),
                        ml_analysis=analysis.get('ml_analysis'),  # Now contains both ML and LLM analysis
                        is_read=False,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    db.add(email_record)
                    emails_processed += 1
                    
                except Exception as e:
                    logger.error(f"Error processing email {message_id} for user {user_id}: {e}")
                    continue
            
            db.commit()
            logger.info(f"Synced {emails_processed} emails for user {user_id}")
            return emails_processed
            
        except Exception as e:
            logger.error(f"Error syncing emails for user {user_id}: {e}")
            db.rollback()
            return 0
    
    async def sync_all_users_emails(self):
        """Sync emails for all users with Gmail connected"""
        db = SessionLocal()
        try:
            # Get all Gmail accounts connected
            gmail_accounts = db.query(GmailAccountSchema).filter(GmailAccountSchema.gmail_connected == True).all()
            
            logger.info(f"Starting email sync for {len(gmail_accounts)} users")
            
            total_processed = 0
            for gmail_account in gmail_accounts:
                emails_processed = await self.sync_user_emails(gmail_account.user_id, db)
                total_processed += emails_processed
            
            logger.info(f"Email sync completed. Total emails processed: {total_processed}")
            
        except Exception as e:
            logger.error(f"Error in sync_all_users_emails: {e}")
        finally:
            db.close()
    
    def cleanup_old_emails(self):
        """Delete emails older than retention period"""
        db = SessionLocal()
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=settings.EMAIL_RETENTION_DAYS)
            
            deleted_count = db.query(EmailSchema).filter(
                EmailSchema.created_at < cutoff_date
            ).delete()
            
            db.commit()
            logger.info(f"Deleted {deleted_count} old emails (older than {settings.EMAIL_RETENTION_DAYS} days)")
            
        except Exception as e:
            logger.error(f"Error cleaning up old emails: {e}")
            db.rollback()
        finally:
            db.close()


# Global instance
sync_service = EmailSyncService()


async def start_email_sync_scheduler():
    """Start the APScheduler for email syncing"""
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from apscheduler.triggers.interval import IntervalTrigger
        
        scheduler = BackgroundScheduler()
        
        # Add job for email sync
        scheduler.add_job(
            sync_service.sync_all_users_emails,
            trigger=IntervalTrigger(minutes=settings.EMAIL_SYNC_INTERVAL_MINUTES),
            id='email_sync_job',
            name='Sync Gmail emails for all users',
            replace_existing=True,
            max_instances=1
        )
        
        # Add job for cleanup
        scheduler.add_job(
            sync_service.cleanup_old_emails,
            trigger=IntervalTrigger(hours=24),
            id='email_cleanup_job',
            name='Clean up old emails',
            replace_existing=True,
            max_instances=1
        )
        
        if not scheduler.running:
            scheduler.start()
            logger.info("Email sync scheduler started")
        
        return scheduler
        
    except Exception as e:
        logger.error(f"Error starting email sync scheduler: {e}")
        return None
