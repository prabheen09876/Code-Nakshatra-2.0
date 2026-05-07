import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    role: text('role', { enum: ['freelancer', 'client'] }).notNull(),
    trustScore: integer('trustScore').default(50),
    scopeDiscipline: integer('scopeDiscipline').default(100),
    scopeCreepIndex: integer('scopeCreepIndex').default(0),
    disputeRatio: integer('disputeRatio').default(0),
    trustVelocity: integer('trustVelocity').default(0),
    createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const projects = sqliteTable('projects', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    freelancerId: integer('freelancerId').references(() => users.id).notNull(),
    clientId: integer('clientId').references(() => users.id).notNull(),
    title: text('title').notNull(),
    scopeChecklist: text('scopeChecklist', { mode: 'json' }).$type<string[]>().default('[]'),
    revisionLimit: integer('revisionLimit').notNull(),
    revisionsUsed: integer('revisionsUsed').default(0),
    status: text('status', { enum: ['draft', 'active', 'completed'] }).default('draft'),
    deadline: integer('deadline', { mode: 'timestamp' }),
    completedAt: integer('completedAt', { mode: 'timestamp' }),
    trustImpact: integer('trustImpact').default(0),
    createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const deliverables = sqliteTable('deliverables', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    projectId: integer('projectId').references(() => projects.id).notNull(),
    title: text('title').notNull(),
    link: text('link').notNull(),
    description: text('description'),
    type: text('type', { enum: ['link', 'file'] }).default('link'),
    status: text('status', { enum: ['pending', 'accepted', 'revision_requested'] }).default('pending'),
    clientFeedback: text('clientFeedback'),
    submittedAt: integer('submittedAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const messages = sqliteTable('messages', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    projectId: integer('projectId').references(() => projects.id).notNull(),
    senderId: integer('senderId').references(() => users.id).notNull(),
    content: text('content').notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const conversations = sqliteTable('conversations', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    participant1Id: integer('participant1Id').references(() => users.id).notNull(),
    participant2Id: integer('participant2Id').references(() => users.id).notNull(),
    lastMessageAt: integer('lastMessageAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => {
    return {
        participantsIdx: uniqueIndex('participants_idx').on(table.participant1Id, table.participant2Id),
    };
});

export const directMessages = sqliteTable('direct_messages', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    conversationId: integer('conversationId').references(() => conversations.id).notNull(),
    senderId: integer('senderId').references(() => users.id).notNull(),
    content: text('content').notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const changeRequests = sqliteTable('change_requests', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    projectId: integer('projectId').references(() => projects.id).notNull(),
    description: text('description').notNull(),
    classification: text('classification', { enum: ['in-scope', 'out-of-scope'] }),
    priceAdjustment: integer('priceAdjustment').default(0),
    timelineAdjustment: integer('timelineAdjustment').default(0),
    approved: integer('approved', { mode: 'boolean' }).default(false),
    createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
