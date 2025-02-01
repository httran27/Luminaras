import { WebSocketServer } from "ws";
import type { Server } from "http";
import { parse } from "url";

interface Message {
  type: "message";
  senderId: number;
  receiverId?: number;
  groupId?: number;
  content: string;
}

// Map to store user connections
const clients = new Map<number, WebSocket>();
// Map to store group connections (groupId -> Set of userIds)
const groupClients = new Map<number, Set<number>>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const { pathname, query } = parse(request.url!, true);

    // Handle direct messages
    if (pathname === "/ws" && query.userId) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        const userId = parseInt(query.userId as string);
        clients.set(userId, ws);

        ws.on("message", (data) => {
          try {
            const message: Message = JSON.parse(data.toString());
            if (message.receiverId) {
              const receiverWs = clients.get(message.receiverId);

              if (receiverWs?.readyState === WebSocket.OPEN) {
                receiverWs.send(JSON.stringify(message));
              }
            }
          } catch (err) {
            console.error("Invalid message format:", err);
          }
        });

        ws.on("close", () => {
          clients.delete(userId);
        });
      });
    }
    // Handle group messages
    else if (pathname?.startsWith("/ws/groups/") && query.userId) {
      const groupId = parseInt(pathname.split("/")[3]);
      const userId = parseInt(query.userId as string);

      if (isNaN(groupId) || isNaN(userId)) return;

      wss.handleUpgrade(request, socket, head, (ws) => {
        // Add user to group's connected clients
        if (!groupClients.has(groupId)) {
          groupClients.set(groupId, new Set());
        }
        groupClients.get(groupId)!.add(userId);
        clients.set(userId, ws);

        ws.on("message", (data) => {
          try {
            const message: Message = JSON.parse(data.toString());
            if (message.groupId === groupId) {
              // Broadcast to all connected group members
              const groupMembers = groupClients.get(groupId) || new Set();
              for (const memberId of groupMembers) {
                const memberWs = clients.get(memberId);
                if (memberWs?.readyState === WebSocket.OPEN && memberId !== userId) {
                  memberWs.send(JSON.stringify(message));
                }
              }
            }
          } catch (err) {
            console.error("Invalid message format:", err);
          }
        });

        ws.on("close", () => {
          clients.delete(userId);
          groupClients.get(groupId)?.delete(userId);
          if (groupClients.get(groupId)?.size === 0) {
            groupClients.delete(groupId);
          }
        });
      });
    }
  });
}