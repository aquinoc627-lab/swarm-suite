from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.core.tool_registry import get_tool, get_tools_by_category
from app.models.user import User

router = APIRouter()


@router.get("")
async def list_tools(_: User = Depends(get_current_user)):
    """List all tools grouped by category."""
    return get_tools_by_category()


@router.get("/{tool_id}")
async def get_tool_detail(tool_id: str, _: User = Depends(get_current_user)):
    """Get details and parameter schema for a specific tool."""
    tool = get_tool(tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_id}' not found")
    return tool
