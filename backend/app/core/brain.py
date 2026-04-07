import asyncio
import os
import json
import logging
import random
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from emergentintegrations.llm.chat import LlmChat, UserMessage

from app.models.agent import Agent
from app.models.mission import Mission
from app.models.banter import Banter

logger = logging.getLogger(__name__)

class AgentBrain:
    @staticmethod
    async def think(db: AsyncSession, agent_id: str) -> dict:
        """
        Triggers the Gemini 2.5 Pro model to generate a thought process and an action 
        based on the agent's current mission context.
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.error("GEMINI_API_KEY missing. Cannot execute autonomous thought.")
            return None

        # Fetch Agent
        agent = await db.get(Agent, agent_id)
        if not agent:
            return None

        # Fetch Active Missions for this agent
        from app.models.agent_mission import AgentMission
        stmt = select(Mission).join(AgentMission).where(AgentMission.agent_id == agent_id, Mission.status == "in_progress")
        res = await db.execute(stmt)
        mission = res.scalars().first()

        mission_context = "No active mission. Patrol the perimeter."
        if mission:
            mission_context = f"Mission: {mission.name} - {mission.description}"

        persona = agent.persona or {}
        personality = persona.get("personality", "analytical")
        
        system_prompt = f"""
        You are an autonomous cybersecurity agent in the Nexus Command Center.
        Your name is {agent.name}. Personality: {personality}.
        {mission_context}
        
        Based on your current status, what is your next logical step?
        Respond in strict JSON with exactly two keys:
        "thought": "Your internal monologue and reasoning (1-2 sentences max)."
        "action": "One of: scan, exploit, analyze, report, idle."
        """

        try:
            chat = LlmChat(
                api_key=api_key,
                session_id=f"brain_session_{agent_id}",
                system_message=system_prompt
            ).with_model("gemini", "gemini-2.5-pro")

            user_msg = UserMessage(text="Execute next cognitive cycle.")
            response = await chat.send_message(user_msg)
            
            resp_text = response.text.strip()
            if resp_text.startswith("```json"): resp_text = resp_text[7:]
            if resp_text.endswith("```"): resp_text = resp_text[:-3]
            
            data = json.loads(resp_text.strip())
            
            # Post the thought to the Banter feed
            thought_msg = Banter(
                id=str(uuid.uuid4()),
                message=f"[COGNITIVE CYCLE]: {data.get('thought', 'Processing...')}",
                message_type="thought",
                agent_id=agent.id,
                mission_id=mission.id if mission else None,
                created_at=datetime.now(timezone.utc)
            )
            db.add(thought_msg)
            await db.commit()
            
            return data
            
        except Exception as e:
            logger.error(f"Gemini execution failed for {agent.name}: {e}")
            return None

    @staticmethod
    async def execute_action(db: AsyncSession, agent_id: str, action_data: dict) -> None:
        """
        Executes the action decided by the Gemini brain and logs it.
        """
        agent = await db.get(Agent, agent_id)
        if not agent or not action_data:
            return

        action_type = action_data.get("action", "idle")
        
        action_msg = f"Executing protocol: {action_type.upper()}"
        
        log_msg = Banter(
            id=str(uuid.uuid4()),
            message=action_msg,
            message_type="action",
            agent_id=agent.id,
            created_at=datetime.now(timezone.utc)
        )
        db.add(log_msg)
        await db.commit()
