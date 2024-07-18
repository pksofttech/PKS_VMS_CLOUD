"""Module websocket service"""

from typing import List
from fastapi import APIRouter, WebSocket
from app.stdio import print_success, print_debug


class ConnectionManager:
    """Class to manage WebSocket connections."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Add a WebSocket connection to the list of active connections."""
        await websocket.accept()
        websocket.subscribe = ""
        self.active_connections.append(websocket)
        print_success(f"WebSocket: Client connected from {websocket.client}")

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection from the list of active connections."""
        self.active_connections.remove(websocket)
        print_debug(f"WebSocket: Client disconnected from {websocket.client}")
        print_debug(f"WebSocket: Active connections: {len(self.active_connections)}")

    async def send_notification(self, subscribe: str, message: str) -> int:
        """Send a notification message to WebSocket clients subscribed to a specific channel."""
        success = 0
        for websocket in self.active_connections:
            if websocket.subscribe == subscribe:
                await websocket.send_text(f"notification:{message}")
                success += 1
        return success

    async def send_message(self, message: str, websocket: WebSocket):
        """Send a text message to a specific WebSocket client."""
        await websocket.send_text(message)

    async def send_json(self, json_str: str, websocket: WebSocket):
        """Send a JSON message to a specific WebSocket client."""
        await websocket.send_json(json_str)

    async def broadcast(self, message: str, send_mode="text"):
        """Broadcast a message to all WebSocket clients."""
        for connection in self.active_connections:
            if send_mode == "json":
                await connection.send_json(message)
            else:
                await connection.send_text(message)


# Create a ConnectionManager instance
WebSockets = ConnectionManager()

# Create an APIRouter instance
router = APIRouter()


# WebSocket endpoint
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint to handle incoming WebSocket connections."""
    await WebSockets.connect(websocket)
