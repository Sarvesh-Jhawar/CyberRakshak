# CyberRakshak Backend API

A FastAPI-based backend for the CyberRakshak Defence Cybersecurity Portal, featuring incident reporting, ML-powered threat detection, and comprehensive admin management.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Incident Management**: Report, track, and manage cybersecurity incidents
- **ML Integration**: Automated threat detection using pre-trained models
- **Admin Dashboard**: Comprehensive admin tools and analytics
- **Firebase Integration**: Scalable NoSQL database with real-time capabilities
- **RESTful API**: Well-documented API with automatic OpenAPI documentation

## Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **Firebase Firestore**: NoSQL database for scalable data storage
- **JWT**: Secure token-based authentication
- **Pydantic**: Data validation and serialization
- **Scikit-learn**: Machine learning model integration
- **Uvicorn**: ASGI server for production deployment

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd CyberRakshak-v.1.0/Backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**:
   ```bash
   cp env.example .env
   # Edit .env with your Firebase credentials and settings
   ```

5. **Set up Firebase**:
   - Create a Firebase project
   - Enable Firestore Database
   - Generate service account credentials
   - Update the `.env` file with your Firebase configuration

## Configuration

### Environment Variables

Key environment variables to configure:

```env
# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-service-account-email

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Go to Project Settings > Service Accounts
5. Generate a new private key
6. Update your `.env` file with the credentials

## Running the Server

### Development Mode
```bash
python run.py
```

### Production Mode
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user info

### Incidents
- `POST /api/v1/incidents/` - Create incident report
- `GET /api/v1/incidents/` - Get incidents (filtered by user role)
- `GET /api/v1/incidents/{id}` - Get specific incident
- `PUT /api/v1/incidents/{id}` - Update incident (admin only)
- `DELETE /api/v1/incidents/{id}` - Delete incident (admin only)

### Admin
- `GET /api/v1/admin/summary` - Admin dashboard summary
- `GET /api/v1/admin/users` - Get all users
- `POST /api/v1/admin/notifications/bulk` - Send bulk notifications
- `POST /api/v1/admin/system/backup` - Create system backup

### Analytics & Reports
- `GET /api/analytics/monthly` - Monthly analytics
- `GET /api/analytics/threat-types` - Threat type distribution
- `GET /api/analytics/department-risk` - Department risk analysis
- `GET /api/system/status` - System status

## ML Models Integration

The backend integrates with pre-trained ML models for:

- **Malware Detection**: Random Forest model for file analysis
- **Phishing Detection**: URL and email analysis
- **Ransomware Detection**: Advanced threat detection

Models are automatically loaded from the `../models/` directory and used for incident analysis.

## Database Schema

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

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin and user roles
- **Input Validation**: Pydantic models for data validation
- **CORS Protection**: Configurable CORS settings
- **Email Domain Validation**: Trusted domain verification
- **Password Hashing**: Bcrypt password hashing

## Development

### Project Structure
```
Backend/
├── app/
│   ├── models/          # Pydantic models
│   ├── routes/          # API route handlers
│   ├── utils/           # Utility functions
│   ├── config.py        # Configuration settings
│   └── main.py          # FastAPI application
├── requirements.txt     # Python dependencies
├── run.py              # Development server script
└── README.md           # This file
```

### Adding New Endpoints

1. Create route handlers in `app/routes/`
2. Define Pydantic models in `app/models/`
3. Add authentication/authorization as needed
4. Update this README with endpoint documentation

### Testing

```bash
# Run the server
python run.py

# Test endpoints using curl or the interactive docs
curl http://localhost:8000/health
```

## Deployment

### Docker Deployment
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables for Production
- Set `DEBUG=False`
- Use strong `SECRET_KEY`
- Configure production Firebase project
- Set appropriate CORS origins
- Use environment-specific database settings

## Troubleshooting

### Common Issues

1. **Firebase Connection Error**:
   - Verify Firebase credentials in `.env`
   - Check Firestore is enabled in Firebase Console
   - Ensure service account has proper permissions

2. **ML Models Not Loading**:
   - Verify model files exist in `../models/` directory
   - Check file permissions
   - Ensure required Python packages are installed

3. **CORS Issues**:
   - Update `BACKEND_CORS_ORIGINS` in `.env`
   - Check frontend URL matches CORS settings

### Logs
The server logs are available in the console. For production, configure proper logging with:
```python
import logging
logging.basicConfig(level=logging.INFO)
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the CyberRakshak Defence Cybersecurity Portal.
