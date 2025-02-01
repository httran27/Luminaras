import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./ws";
import { db } from "@db";
import { users, matches, messages, achievements, groups, groupMembers, groupMessages } from "@db/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";

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

  // Match routes - Find only users
  app.get("/api/matches/potential", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const potentialMatches = await db
      .select()
      .from(users)
      .where(
        sql`${users.id} != ${req.user.id} 
          AND NOT EXISTS (
            SELECT 1 FROM ${matches}
            WHERE (${matches.userId1} = ${req.user.id} AND ${matches.userId2} = ${users.id})
            OR (${matches.userId1} = ${users.id} AND ${matches.userId2} = ${req.user.id})
          )`
      )
      .orderBy(sql`RANDOM()`)
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

    // Simplified query to get all users who have messaged with the current user
    const conversations = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatar: users.avatar,
        gamerType: users.gamerType
      })
      .from(messages)
      .where(or(
        eq(messages.senderId, req.user.id),
        eq(messages.receiverId, req.user.id)
      ))
      .innerJoin(users, or(
        eq(users.id, messages.senderId),
        eq(users.id, messages.receiverId)
      ))
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

    // Group routes
  app.post("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const [group] = await db
      .insert(groups)
      .values({
        ...req.body,
        createdById: req.user.id,
      })
      .returning();

    // Add creator as a member with 'admin' role
    await db.insert(groupMembers).values({
      groupId: group.id,
      userId: req.user.id,
      role: "admin",
    });

    res.json(group);
  });

  app.get("/api/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const userGroups = await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        avatar: groups.avatar,
        background: groups.background,
        isPublic: groups.isPublic,
        gameCategory: groups.gameCategory,
        createdAt: groups.createdAt,
        memberCount: sql`count(${groupMembers.id})::int`,
      })
      .from(groups)
      .innerJoin(
        groupMembers,
        and(
          eq(groupMembers.groupId, groups.id),
          eq(groupMembers.userId, req.user.id)
        )
      )
      .groupBy(groups.id)
      .orderBy(desc(groups.createdAt));

    res.json(userGroups);
  });

  app.get("/api/groups/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, parseInt(req.params.id)));

    if (!group) return res.status(404).send("Group not found");

    const members = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatar: users.avatar,
        role: groupMembers.role,
      })
      .from(groupMembers)
      .innerJoin(users, eq(users.id, groupMembers.userId))
      .where(eq(groupMembers.groupId, group.id));

    res.json({ ...group, members });
  });

  app.post("/api/groups/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const groupId = parseInt(req.params.id);
    const [member] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, req.user.id)
        )
      );

    if (!member) return res.status(403).send("Not a member of this group");

    const [message] = await db
      .insert(groupMessages)
      .values({
        groupId,
        senderId: req.user.id,
        content: req.body.content,
      })
      .returning();

    res.json(message);
  });

  app.get("/api/groups/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const groupId = parseInt(req.params.id);
    const [member] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, req.user.id)
        )
      );

    if (!member) return res.status(403).send("Not a member of this group");

    const messages = await db
      .select({
        id: groupMessages.id,
        content: groupMessages.content,
        createdAt: groupMessages.createdAt,
        sender: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatar: users.avatar,
        },
      })
      .from(groupMessages)
      .innerJoin(users, eq(users.id, groupMessages.senderId))
      .where(eq(groupMessages.groupId, groupId))
      .orderBy(desc(groupMessages.createdAt))
      .limit(50);

    res.json(messages);
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