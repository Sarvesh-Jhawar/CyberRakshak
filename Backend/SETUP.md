# CyberRakshak Backend Setup Guide

This guide will help you set up the CyberRakshak backend API for development and production.

## Prerequisites

- Python 3.8 or higher
- Firebase project with Firestore enabled
- Git (for cloning the repository)

## Quick Start

### 1. Environment Setup

```bash
# Navigate to the backend directory
cd Backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
virtual\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Firebase Configuration

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Follow the setup wizard

2. **Enable Firestore**:
   - In your Firebase project, go to "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location for your database

3. **Generate Service Account**:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

4. **Configure Environment**:
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your Firebase credentials
   nano .env  # or use your preferred editor
   ```

   Update these key values in `.env`:
   ```env
   SECRET_KEY=your-very-secure-secret-key-here
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   ML_API_BASE_URL=http://127.0.0.1:8000
   ```

### 3. Run the Development Server

```bash
# Option 1: Use the development script
python start_dev.py

# Option 2: Run directly
python run.py

# Option 3: Use uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Testing the Setup

### 1. Health Check
```bash
curl http://localhost:8000/health
```

### 2. API Documentation
Open http://localhost:8000/docs in your browser to see the interactive API documentation.

### 3. Run Test Script
```bash
python test_api.py
```

## Frontend Integration

The backend is designed to work with the Next.js frontend. Make sure your frontend is configured to use the correct API endpoints:

```javascript
// In your frontend .env.local
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

## API Endpoints Overview

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user info

### Incidents
- `POST /api/v1/incidents/` - Create incident report
- `GET /api/v1/incidents/` - Get incidents
- `GET /api/v1/incidents/{id}` - Get specific incident
- `PUT /api/v1/incidents/{id}` - Update incident (admin only)

### Admin
- `GET /api/v1/admin/summary` - Admin dashboard summary
- `GET /api/v1/admin/users` - Get all users
- `POST /api/v1/admin/notifications/bulk` - Send bulk notifications

### Analytics
- `GET /api/analytics/monthly` - Monthly analytics
- `GET /api/analytics/threat-types` - Threat type distribution
- `GET /api/system/status` - System status

## Database Structure

### Users Collection
```json
{
  "id": "user_id",
  "name": "Full Name",
  "service_id": "DEF-12345",
  "relation": "personnel|family|veteran",
  "email": "user@defence.mil",
  "phone": "+1-555-0123",
  "unit": "Cyber Command",
  "clearance_level": "Secret",
  "role": "USER|ADMIN",
  "is_active": true,
  "created_at": "timestamp",
  "last_login": "timestamp"
}
```

### Incidents Collection
```json
{
  "id": "INC-123456",
  "category": "phishing|malware|fraud|espionage|opsec",
  "description": "Incident description",
  "reporter_id": "user_id",
  "status": "Pending|Under Review|Resolved|Closed",
  "severity": "Low|Medium|High|Critical",
  "ml_analysis": {...},
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## ML Models Integration

The backend integrates with pre-trained ML models located in the `../models/` directory:

- **Malware Detection**: `models/malware/models/malware_rf_model.pkl`
- **Phishing Detection**: `models/phishing/models/phishing_rf_model.pkl`
- **Ransomware Detection**: `models/Ransomware/models/ransomware_rf_model.pkl`

If models are not available, the system will still function but without ML-powered threat analysis.

## Security Configuration

### JWT Settings
```env
SECRET_KEY=your-secure-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### CORS Configuration
```env
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]
```

### Email Domain Validation
The system validates that user emails are from trusted domains:
- defence.mil
- army.mil
- navy.mil
- airforce.mil

## Production Deployment

### 1. Environment Variables
```env
DEBUG=False
SECRET_KEY=your-production-secret-key
FIREBASE_PROJECT_ID=your-production-project
# ... other production settings
```

### 2. Docker Deployment
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 3. Security Considerations
- Use strong, unique secret keys
- Enable Firebase security rules
- Configure proper CORS origins
- Use HTTPS in production
- Regular security updates

## Troubleshooting

### Common Issues

1. **Firebase Connection Error**:
   ```
   Error: Firebase initialization failed
   ```
   - Check Firebase credentials in `.env`
   - Verify Firestore is enabled
   - Ensure service account has proper permissions

2. **Import Errors**:
   ```
   ModuleNotFoundError: No module named 'app'
   ```
   - Make sure you're in the Backend directory
   - Check virtual environment is activated
   - Verify all dependencies are installed

3. **CORS Issues**:
   ```
   Access to fetch at 'http://localhost:8000' from origin 'http://localhost:3000' has been blocked by CORS policy
   ```
   - Update `BACKEND_CORS_ORIGINS` in `.env`
   - Restart the server after changes

4. **ML Models Not Loading**:
   ```
   Warning: ML models directory not found
   ```
   - Verify `../models/` directory exists
   - Check model files are present
   - System will work without models (limited functionality)

### Getting Help

1. Check the logs in the console
2. Verify your `.env` configuration
3. Test individual endpoints using the API docs
4. Run the test script: `python test_api.py`

## Development Tips

1. **Hot Reload**: The development server supports hot reload for code changes
2. **API Docs**: Use http://localhost:8000/docs for interactive testing
3. **Logs**: Check console output for detailed error messages
4. **Testing**: Use `python test_api.py` for basic functionality tests

## Next Steps

1. Set up your Firebase project
2. Configure the environment variables
3. Start the development server
4. Test the API endpoints
5. Integrate with the frontend
6. Deploy to production when ready

For more detailed information, see the main [README.md](README.md) file.