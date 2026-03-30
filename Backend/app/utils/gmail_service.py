import base64
import re
from typing import Dict, List, Optional, Tuple
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from cryptography.fernet import Fernet
import logging

logger = logging.getLogger(__name__)


class GmailService:
    """Service for handling Gmail OAuth and email operations"""
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str, scopes: List[str], encryption_key: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.scopes = scopes
        self.cipher = Fernet(encryption_key.encode()) if encryption_key else None
        
    def get_auth_url(self, state: str = None) -> Tuple[str, str]:
        """Generate Google OAuth consent screen URL"""
        try:
            flow = Flow.from_client_config(
                {
                    "installed": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.redirect_uri]
                    }
                },
                scopes=self.scopes,
                redirect_uri=self.redirect_uri
            )
            auth_url, state = flow.authorization_url(prompt='consent')
            return auth_url, state
        except Exception as e:
            logger.error(f"Error generating auth URL: {e}")
            raise
    
    def exchange_code_for_token(self, code: str) -> Dict:
        """Exchange authorization code for access token"""
        try:
            flow = Flow.from_client_config(
                {
                    "installed": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.redirect_uri]
                    }
                },
                scopes=self.scopes,
                redirect_uri=self.redirect_uri
            )
            credentials = flow.fetch_token(code=code)
            return credentials
        except Exception as e:
            logger.error(f"Error exchanging code for token: {e}")
            raise
    
    def encrypt_token(self, token: str) -> str:
        """Encrypt token for storage"""
        if not self.cipher:
            return token
        return self.cipher.encrypt(token.encode()).decode()
    
    def decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt token for use"""
        if not self.cipher:
            return encrypted_token
        return self.cipher.decrypt(encrypted_token.encode()).decode()
    
    def get_credentials_from_token_dict(self, token_dict: Dict) -> Credentials:
        """Create Credentials object from token dictionary"""
        return Credentials(
            token=token_dict.get('access_token'),
            refresh_token=token_dict.get('refresh_token'),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=self.client_id,
            client_secret=self.client_secret
        )
    
    def refresh_access_token(self, refresh_token: str) -> Dict:
        """Refresh expired access token"""
        try:
            credentials = self.get_credentials_from_token_dict({
                'refresh_token': refresh_token,
                'access_token': ''
            })
            request = Request()
            credentials.refresh(request)
            return {
                'access_token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'expires_in': 3600
            }
        except Exception as e:
            logger.error(f"Error refreshing access token: {e}")
            raise
    
    def fetch_emails(self, credentials: Credentials, max_results: int = 20) -> List[str]:
        """Fetch latest email message IDs from Gmail"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            results = service.users().messages().list(
                userId='me',
                maxResults=max_results,
                q='is:unread'  # Only fetch unread
            ).execute()
            
            messages = results.get('messages', [])
            return [msg['id'] for msg in messages]
        except Exception as e:
            logger.error(f"Error fetching emails: {e}")
            return []
    
    def get_email_details(self, credentials: Credentials, message_id: str) -> Dict:
        """Extract email subject, body, sender, and URLs"""
        try:
            service = build('gmail', 'v1', credentials=credentials)
            message = service.users().messages().get(
                userId='me',
                id=message_id,
                format='full'
            ).execute()
            
            headers = message['payload'].get('headers', [])
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
            from_addr = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
            to_addr = next((h['value'] for h in headers if h['name'] == 'To'), 'Unknown')
            
            body = self._extract_body(message)
            urls = self._extract_urls(body)
            
            return {
                "subject": subject,
                "from": from_addr,
                "to": to_addr,
                "body": body,
                "urls": urls,
                "message_id": message_id
            }
        except Exception as e:
            logger.error(f"Error getting email details for {message_id}: {e}")
            return None
    
    def _extract_body(self, message: Dict) -> str:
        """Extract email body text from message payload"""
        try:
            if 'parts' in message['payload']:
                parts = message['payload']['parts']
                data = ''
                for part in parts:
                    if part['mimeType'] == 'text/plain':
                        if 'data' in part['body']:
                            data = part['body']['data']
                            break
                    elif part['mimeType'] == 'text/html':
                        if 'data' in part['body']:
                            data = part['body']['data']
            else:
                data = message['payload']['body'].get('data', '')
            
            if data:
                return base64.urlsafe_b64decode(data).decode('utf-8')
            return ""
        except Exception as e:
            logger.error(f"Error extracting body: {e}")
            return ""
    
    def _extract_urls(self, text: str) -> List[str]:
        """Extract URLs from email body"""
        url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        urls = re.findall(url_pattern, text)
        return list(set(urls))  # Remove duplicates
