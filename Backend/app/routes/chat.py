from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from app.utils.db import get_db
from app.utils.auth import get_current_user
from app.models.chat import ChatMessage
from app.models.schema import ChatMessageSchema

router = APIRouter(tags=["Chat"])

@router.get("/api/v1/chat/history", response_model=List[ChatMessage])
async def get_chat_history(
    current_user: dict = Depends(get_current_user),
    conversation_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve chat history for the current user.
    Optionally filter by conversation_id.
    """
    user_id = current_user["id"]
    
    try:
        query = db.query(ChatMessageSchema).filter(ChatMessageSchema.user_id == user_id)
        if conversation_id:
            query = query.filter(ChatMessageSchema.conversation_id == conversation_id)
            
        chat_docs = query.order_by(ChatMessageSchema.timestamp.asc()).all()
        
        return [
            ChatMessage(
                user_id=doc.user_id,
                conversation_id=doc.conversation_id,
                role=doc.role,
                content=doc.content,
                timestamp=doc.timestamp
            )
            for doc in chat_docs
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve chat history: {e}"
        )
