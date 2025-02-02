import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { parse } from "url";
import { db } from "@db";
import { messages, groupMessages } from "@db/schema";

interface Message {
  type: "message";
  senderId: number;
  receiverId?: number;
  groupId?: number;
  content: string;
}

interface ExtendedWebSocket extends WebSocket {
  userId?: number;
}

// Map to store user connections
const clients = new Map<number, ExtendedWebSocket>();
// Map to store group connections (groupId -> Set of userIds)
const groupClients = new Map<number, Set<number>>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const { pathname, query } = parse(request.url!, true);

    // Ignore vite HMR requests
    if (query['sec-websocket-protocol'] === 'vite-hmr') {
      return;
    }

    // Handle direct messages
    if (pathname === "/ws" && query.userId) {
      wss.handleUpgrade(request, socket, head, (ws: ExtendedWebSocket) => {
        const userId = parseInt(query.userId as string);
        if (isNaN(userId)) {
          ws.close();
          return;
        }

        ws.userId = userId;
        clients.set(userId, ws);

        ws.on("message", async (data) => {
          try {
            const message = JSON.parse(data.toString()) as Message;

            // Validate direct message structure
            if (!message.type || message.type !== "message" || 
                !message.senderId || !message.receiverId || 
                !message.content) {
              return;
            }

            // Save the message to database
            const [savedMessage] = await db
              .insert(messages)
              .values({
                senderId: message.senderId,
                receiverId: message.receiverId,
                content: message.content,
              })
              .returning();

            // Ensure message is only sent to intended recipient
            if (message.receiverId && message.senderId === userId) {
              const receiverWs = clients.get(message.receiverId);
              if (receiverWs?.readyState === WebSocket.OPEN) {
                receiverWs.send(JSON.stringify({
                  ...savedMessage,
                  type: "message"
                }));
              }
            }
          } catch (err) {
            console.error("Invalid message format or database error:", err);
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

      if (isNaN(groupId) || isNaN(userId)) {
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws: ExtendedWebSocket) => {
        if (!groupClients.has(groupId)) {
          groupClients.set(groupId, new Set());
        }
        groupClients.get(groupId)!.add(userId);
        ws.userId = userId;
        clients.set(userId, ws);

        ws.on("message", async (data) => {
          try {
            const message = JSON.parse(data.toString()) as Message;

            // Validate group message structure
            if (!message.type || message.type !== "message" || 
                !message.senderId || !message.groupId || 
                !message.content || message.groupId !== groupId) {
              return;
            }

            // Save the group message to database
            const [savedMessage] = await db
              .insert(groupMessages)
              .values({
                groupId,
                senderId: message.senderId,
                content: message.content,
              })
              .returning();

            // Only broadcast to other group members
            const groupMembers = groupClients.get(groupId) || new Set();
            groupMembers.forEach(memberId => {
              if (memberId !== userId) {  // Don't send back to sender
                const memberWs = clients.get(memberId);
                if (memberWs?.readyState === WebSocket.OPEN) {
                  memberWs.send(JSON.stringify({
                    ...savedMessage,
                    type: "message"
                  }));
                }
              }
            });
          } catch (err) {
            console.error("Invalid message format or database error:", err);
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