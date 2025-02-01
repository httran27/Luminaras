import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./ws";
import { db } from "@db";
import { users, matches, messages, achievements } from "@db/schema";
import { eq, and, desc, or } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  // Profile routes
  app.get("/api/users/:id", async (req, res) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(req.params.id)));

    if (!user) return res.status(404).send("User not found");
    res.json(user);
  });

  app.patch("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.id !== parseInt(req.params.id)) {
      return res.status(403).send("Unauthorized");
    }

    const [user] = await db
      .update(users)
      .set(req.body)
      .where(eq(users.id, req.user.id))
      .returning();

    res.json(user);
  });

  // Match routes
  app.get("/api/matches/potential", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const potentialMatches = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, req.user.id).not(),
          // Add more matching criteria here
        )
      )
      .limit(10);

    res.json(potentialMatches);
  });

  app.post("/api/matches", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const [match] = await db
      .insert(matches)
      .values({
        userId1: req.user.id,
        userId2: req.body.userId,
        status: "pending",
      })
      .returning();

    res.json(match);
  });

  app.get("/api/matches", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const userMatches = await db
      .select()
      .from(matches)
      .where(
        or(
          eq(matches.userId1, req.user.id),
          eq(matches.userId2, req.user.id),
        )
      );

    res.json(userMatches);
  });

  // Message routes
  app.get("/api/messages/conversations", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const conversations = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatar: users.avatar,
        gamerType: users.gamerType
      })
      .from(users)
      .innerJoin(
        messages,
        or(
          and(
            eq(messages.senderId, req.user.id),
            eq(messages.receiverId, users.id)
          ),
          and(
            eq(messages.receiverId, req.user.id),
            eq(messages.senderId, users.id)
          )
        )
      )
      .groupBy(users.id)
      .limit(50);

    res.json(conversations);
  });

  // Achievement routes
  app.post("/api/achievements", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const [achievement] = await db
      .insert(achievements)
      .values({ ...req.body, userId: req.user.id })
      .returning();

    res.json(achievement);
  });

  app.get("/api/achievements/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).send("Invalid user ID");
    }

    const userAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.createdAt));

    res.json(userAchievements);
  });

  // News routes (mock data for now)
  app.get("/api/news", (req, res) => {
    const news = [
      {
        id: 1,
        title: "Upcoming Gaming Tournament",
        description: "Join our first community tournament!",
        date: new Date().toISOString(),
        category: "Events",
      },
      // Add more mock news items
    ];
    res.json(news);
  });

  return httpServer;
}