import { WebSocketServer } from "ws";
import type { Server } from "http";
import { parse } from "url";

interface Message {
  type: "message";
  senderId: number;
  receiverId: number;
  content: string;
}

const clients = new Map<number, WebSocket>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const { pathname, query } = parse(request.url!, true);
    
    if (pathname === "/ws" && query.userId) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        const userId = parseInt(query.userId as string);
        clients.set(userId, ws);

        ws.on("message", (data) => {
          try {
            const message: Message = JSON.parse(data.toString());
            const receiverWs = clients.get(message.receiverId);
            
            if (receiverWs?.readyState === WebSocket.OPEN) {
              receiverWs.send(JSON.stringify(message));
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
  });
}
