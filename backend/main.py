from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio  
import uuid
import sys

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

app = FastAPI(title="SentinAI Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskRequest(BaseModel):
    url: str
    focus: Optional[str] = "general_exploration"

class ActionLog(BaseModel):
    timestamp: str
    action_type: str
    description: str
    screenshot: Optional[str] = None

class AgentReport(BaseModel):
    task_id: str
    url: str
    current_page: str
    status: str
    logs: List[ActionLog]
    issues_found: List[str]

current_report = None
internal_logs_sync = []
agent_state = {"current_url": ""}

@app.get("/")
def health_check():
    return {"status": "SentinAI is online", "version": "1.0.0"}

@app.post("/start-task")
async def start_task(task: TaskRequest, background_tasks: BackgroundTasks):
    global current_report, internal_logs_sync, agent_state
    task_id = str(uuid.uuid4())
    
    internal_logs_sync = []
    agent_state["current_url"] = task.url
    current_report = AgentReport(
        task_id=task_id,
        url=task.url,
        current_page=task.url,
        status="running",
        logs=[],
        issues_found=[]
    )
    
    background_tasks.add_task(run_agent_process, task.url, task.focus or "", current_report)
    
    return {"message": "Agent dispatched", "task_id": task_id}

async def run_agent_process(url: str, goal: str, report_ref: AgentReport):
    import traceback
    try:
        from agent import BrowserAgent
        
        def _run_sync_mission():
            agent = BrowserAgent(external_logs=internal_logs_sync)
            def url_callback(new_url):
                agent_state["current_url"] = new_url
            
            agent.on_url_change = url_callback
            return agent.run_mission(url, goal=goal)

        await asyncio.to_thread(_run_sync_mission)
        report_ref.status = "completed"
    except Exception as e:
        report_ref.status = "failed"
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        report_ref.issues_found.append(error_details)
        print(f"CRITICAL AGENT ERROR: {error_details}")

@app.get("/report")
def get_report():
    global current_report, internal_logs_sync, agent_state
    if not current_report:
        return {"status": "idle"}
    
    formatted_logs = [
        ActionLog(
            timestamp=l["timestamp"], 
            action_type=l["action_type"], 
            description=l["description"],
            screenshot=l.get("screenshot")
        ) for l in internal_logs_sync
    ]
    current_report.logs = formatted_logs
    current_report.current_page = agent_state["current_url"]
    
    return current_report

if __name__ == "__main__":
    import uvicorn
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    uvicorn.run("main:app", host="0.0.0.0", port=8000, loop="asyncio")
