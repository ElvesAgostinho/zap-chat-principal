import sqlite3
import uuid
import json
from datetime import datetime

db_path = r'C:\Users\DELL\.n8n\database.sqlite'

nodes = [
    {
        "parameters": {
            "httpMethod": "POST",
            "path": "lead-capture",
            "options": {}
        },
        "id": str(uuid.uuid4()),
        "name": "Webhook Lead Capture",
        "type": "n8n-nodes-base.webhook",
        "typeVersion": 1,
        "position": [100, 300]
    },
    {
        "parameters": {
            "model": "llama3-8b-8192",
            "options": {}
        },
        "id": str(uuid.uuid4()),
        "name": "Groq Lead Scoring",
        "type": "@n8n/n8n-nodes-langchain.lmChatGroq",
        "typeVersion": 1,
        "position": [300, 300]
    },
    {
        "parameters": {
            "table": "leads",
            "data": "={{ $json }}"
        },
        "id": str(uuid.uuid4()),
        "name": "Supabase Update",
        "type": "n8n-nodes-base.supabase",
        "typeVersion": 1,
        "position": [500, 300]
    }
]

connections = {
    "Webhook Lead Capture": {
        "main": [
            [
                {
                    "node": "Groq Lead Scoring",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    },
    "Groq Lead Scoring": {
        "main": [
            [
                {
                    "node": "Supabase Update",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }
}

settings = {"executionOrder": "v1"}

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    workflow_id = str(uuid.uuid4())
    version_id = str(uuid.uuid4())
    
    query = """
    INSERT INTO workflow_entity 
    (id, name, active, nodes, connections, settings, versionId, triggerCount, createdAt, updatedAt) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%f')[:-3]
    
    cursor.execute(query, (
        workflow_id,
        'Lead Qualification Agent',
        0, # active
        json.dumps(nodes),
        json.dumps(connections),
        json.dumps(settings),
        version_id,
        1, # triggerCount
        now,
        now
    ))
    
    conn.commit()
    print(f"Successfully created workflow Lead Qualification Agent with ID: {workflow_id}")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    if conn:
        conn.close()
