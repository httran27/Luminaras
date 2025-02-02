import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./ws";
import { db } from "@db";
import { users, matches, messages, achievements, groups, groupMembers, groupMessages } from "@db/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import express from "express";

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: "./uploads/avatars",
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images are allowed"));
  }
});

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  const httpServer = createServer(app);
  setupWebSocket(httpServer);

  // Ensure uploads directory exists
  app.use("/uploads", express.static("uploads"));

  // Add avatar upload route
  app.post("/api/users/:id/avatar", upload.single("avatar"), async (req, res) => {
    if (!req.isAuthenticated() || req.user.id !== parseInt(req.params.id)) {
      return res.status(403).send("Unauthorized");
    }

    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const [user] = await db
      .update(users)
      .set({ avatar: avatarUrl })
      .where(eq(users.id, req.user.id))
      .returning();

    res.json(user);
  });

  // Profile routes
  app.get("/api/users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).send("Invalid user ID");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

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

  app.get("/api/users/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const query = req.query.q?.toString() || '';
    if (!query || query.length < 3) {
      return res.status(400).json({ error: 'Search query must be at least 3 characters' });
    }

    console.log('Search query:', query); // Debug log

    try {
      const searchResults = await db
        .select()
        .from(users)
        .where(
          and(
            sql`${users.id} != ${req.user.id}`,
            sql`LOWER(${users.username}) LIKE ${`%${query.toLowerCase()}%`}`
          )
        )
        .orderBy(desc(users.id))
        .limit(10);

      console.log('Search results:', searchResults); // Debug log
      res.json(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
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

    // Get all users who have either:
    // 1. Exchanged messages with the current user
    // 2. Have a match with the current user
    const conversations = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatar: users.avatar,
        gamerType: users.gamerType
      })
      .from(users)
      .where(
        or(
          // Users who have exchanged messages
          sql`EXISTS (
            SELECT 1 FROM ${messages}
            WHERE (${messages.senderId} = ${users.id} AND ${messages.receiverId} = ${req.user.id})
            OR (${messages.senderId} = ${req.user.id} AND ${messages.receiverId} = ${users.id})
          )`,
          // Users who are matched
          sql`EXISTS (
            SELECT 1 FROM ${matches}
            WHERE (${matches.userId1} = ${users.id} AND ${matches.userId2} = ${req.user.id})
            OR (${matches.userId1} = ${req.user.id} AND ${matches.userId2} = ${users.id})
          )`
        )
      )
      .where(sql`${users.id} != ${req.user.id}`)
      .orderBy(desc(users.id));

    res.json(conversations);
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const { receiverId, content } = req.body;

    // Check if users are matched
    const [match] = await db
      .select()
      .from(matches)
      .where(
        or(
          and(
            eq(matches.userId1, req.user.id),
            eq(matches.userId2, receiverId)
          ),
          and(
            eq(matches.userId1, receiverId),
            eq(matches.userId2, req.user.id)
          )
        )
      );

    if (!match) {
      return res.status(403).send("Can only send messages to matched users");
    }

    const [message] = await db
      .insert(messages)
      .values({
        senderId: req.user.id,
        receiverId: receiverId,
        content: content,
      })
      .returning();

    res.json(message);
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

    app.delete("/api/groups/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");

    const groupId = parseInt(req.params.id);

    // Check if user is admin of the group
    const [member] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, req.user.id),
          eq(groupMembers.role, "admin")
        )
      );

    if (!member) {
      return res.status(403).send("Only group admins can delete groups");
    }

    // Delete group and related data
    await db.transaction(async (tx) => {
      // Delete group messages
      await tx.delete(groupMessages).where(eq(groupMessages.groupId, groupId));
      // Delete group members
      await tx.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
      // Delete the group
      await tx.delete(groups).where(eq(groups.id, groupId));
    });

    res.sendStatus(200);
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