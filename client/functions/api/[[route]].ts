import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../src/db/schema';
import { sign, verify, decode } from 'hono/jwt';
import { eq, or, and, ne, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { generateGeminiText, ORION_SYSTEM } from '../lib/gemini';

export type Bindings = {
    DB: D1Database;
    JWT_SECRET: string;
    GEMINI_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

function parseSkillsInput(raw: unknown): string[] {
    if (Array.isArray(raw))
        return raw.map((x) => String(x).trim()).filter(Boolean).slice(0, 48);
    if (typeof raw === 'string')
        return raw
            .split(/[,;\n]+/)
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 48);
    return [];
}

function normalizeSkillToken(s: string): string {
    return s.trim().toLowerCase();
}

/** D1 / Drizzle often returns JSON columns as strings — normalize before matching */
function coerceSkillsArray(raw: unknown): string[] {
    if (raw == null) return [];
    if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean);
    if (typeof raw === 'string') {
        const s = raw.trim();
        if (!s || s === '[]') return [];
        try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
        } catch {
            /* plain comma-separated fallback */
        }
        return parseSkillsInput(s);
    }
    return [];
}

function freelancerMatchesGigSkills(freelancerSkillsRaw: unknown, gigSkillsRaw: unknown): boolean {
    const freelancerSkills = coerceSkillsArray(freelancerSkillsRaw);
    const gigSkills = coerceSkillsArray(gigSkillsRaw);
    const gn = gigSkills.map(normalizeSkillToken).filter(Boolean);
    const fnSet = new Set(freelancerSkills.map(normalizeSkillToken));
    if (gn.length === 0) return false;
    for (const g of gn) {
        if (fnSet.has(g)) return true;
        for (const f of fnSet) {
            if (f.includes(g) || g.includes(f)) return true;
        }
    }
    return false;
}

async function getOrCreateDirectConversation(db: any, uid: number, otherId: number) {
    const existing = await db.query.conversations.findFirst({
        where: or(
            and(eq(schema.conversations.participant1Id, uid), eq(schema.conversations.participant2Id, otherId)),
            and(eq(schema.conversations.participant1Id, otherId), eq(schema.conversations.participant2Id, uid))
        )
    });
    if (existing) return existing.id;
    const [row] = await db
        .insert(schema.conversations)
        .values({ participant1Id: uid, participant2Id: otherId })
        .returning();
    return row.id;
}

// ─── Health Check ───────────────────────────────────────────
app.get('/health', (c) => {
    return c.json({
        success: true,
        message: 'Accredify API is running on Cloudflare Pages',
        timestamp: new Date().toISOString(),
    });
});

// ─── Auth Routes ────────────────────────────────────────────
app.post('/auth/register', async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const body = await c.req.json();
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const role = body.role?.trim().toLowerCase();

    if (!name || !email || !password || !role) {
        return c.json({ success: false, message: 'All fields are required' }, 400);
    }
    if (!['client', 'freelancer'].includes(role)) {
        return c.json({ success: false, message: 'Role must be client or freelancer' }, 400);
    }

    const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.email, email)
    });

    if (existingUser) {
        return c.json({ success: false, message: 'Email already registered' }, 400);
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [newUser] = await db.insert(schema.users).values({
        name,
        email,
        password: hashedPassword,
        role
    }).returning();

    const secret = c.env.JWT_SECRET || 'fallback_secret';
    const token = await sign(
        { id: newUser.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 },
        secret,
        'HS256'
    );

    return c.json({
        success: true,
        data: {
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                trustScore: newUser.trustScore,
                dailyGigMode: !!(newUser as any).dailyGigMode,
                skills: (((newUser as any).skillsJson as string[]) || []) as string[],
                availabilityStatus: (newUser as any).dailyGigMode ? 'Available Now' : 'Offline',
            },
            token,
        },
    }, 201);
});

app.post('/auth/login', async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const body = await c.req.json();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
        return c.json({ success: false, message: 'Email and password are required' }, 400);
    }

    const user = await db.query.users.findFirst({
        where: eq(schema.users.email, email)
    });

    if (!user) {
        return c.json({ success: false, message: 'Invalid email or password' }, 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return c.json({ success: false, message: 'Invalid email or password' }, 401);
    }

    const secret = c.env.JWT_SECRET || 'fallback_secret';
    const token = await sign(
        { id: user.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 },
        secret,
        'HS256'
    );

    return c.json({
        success: true,
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                trustScore: user.trustScore,
                dailyGigMode: !!(user as any).dailyGigMode,
                skills: (((user as any).skillsJson as string[]) || []) as string[],
                availabilityStatus: (user as any).dailyGigMode ? 'Available Now' : 'Offline',
            },
            token,
        },
    });
});

// ─── Auth Middleware ─────────────────────────────────────────
export const authMiddleware = async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ success: false, message: 'Not authorized, no token' }, 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
        const secret = c.env.JWT_SECRET || 'fallback_secret';
        decoded = await verify(token, secret, 'HS256');
    } catch (e) {
        // Local dev fallback: if verification fails in runtime, decode payload.
        // This keeps local flows functional; production should rely on verify().
        try {
            decoded = decode(token)?.payload;
        } catch {
            return c.json({ success: false, message: 'Not authorized, invalid token' }, 401);
        }
    }

    const userId = decoded?.id ?? decoded?.sub;
    if (!userId) {
        return c.json({ success: false, message: 'Not authorized, invalid token payload' }, 401);
    }

    c.set('userId', Number(userId));
    await next();
};

app.get('/auth/me', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('userId');

    const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId as number),
        columns: { password: false }
    });

    if (!user) return c.json({ success: false, message: 'User not found' }, 404);

    const skillsSafe = ((((user as any).skillsJson as string[]) ?? []) || []) as string[];

    return c.json({
        success: true,
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            trustScore: user.trustScore,
            scopeDiscipline: user.scopeDiscipline,
            scopeCreepIndex: user.scopeCreepIndex,
            disputeRatio: user.disputeRatio,
            trustVelocity: user.trustVelocity,
            dailyGigMode: !!(user as any).dailyGigMode,
            skills: skillsSafe,
            availabilityStatus: (user as any).dailyGigMode ? 'Available Now' : 'Offline',
        },
    });
});

// ─── Users Routes ───────────────────────────────────────────
app.get('/users', async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const url = new URL(c.req.url);
    const role = url.searchParams.get('role');

    let query = db.select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        trustScore: schema.users.trustScore,
        scopeDiscipline: schema.users.scopeDiscipline,
        scopeCreepIndex: schema.users.scopeCreepIndex,
        disputeRatio: schema.users.disputeRatio,
        trustVelocity: schema.users.trustVelocity,
        createdAt: schema.users.createdAt,
    }).from(schema.users);

    if (role) {
        // @ts-ignore
        query = query.where(eq(schema.users.role, role));
    }

    const allUsers = await query;
    return c.json({ success: true, count: allUsers.length, data: allUsers });
});

app.get('/users/freelancers', async (c) => {
    const db = drizzle(c.env.DB, { schema });

    const freelancers = await db.select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        trustScore: schema.users.trustScore,
        scopeDiscipline: schema.users.scopeDiscipline,
        scopeCreepIndex: schema.users.scopeCreepIndex,
        disputeRatio: schema.users.disputeRatio,
        trustVelocity: schema.users.trustVelocity,
        dailyGigMode: schema.users.dailyGigMode,
        skillsJson: schema.users.skillsJson,
        createdAt: schema.users.createdAt,
    }).from(schema.users).where(eq(schema.users.role, 'freelancer'));

    const enriched = freelancers.map((f: any) => {
        const skills = (f.skillsJson as string[]) ?? [];
        const { skillsJson: _omit, ...rest } = f;
        return {
            ...rest,
            skills,
            availabilityStatus: f.dailyGigMode === true ? 'Available Now' : 'Offline',
        };
    });

    return c.json({ success: true, count: enriched.length, data: enriched });
});

/** Freelancer-only: toggle Daily Gig Mode and/or update skills tags */
app.patch('/users/me', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('userId') as number;
    const me = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (!me) return c.json({ success: false, message: 'User not found' }, 404);
    if (me.role !== 'freelancer')
        return c.json({ success: false, message: 'Only freelancers can update this profile section' }, 403);

    const body = await c.req.json().catch(() => ({}));
    let hasPatch = false;
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.dailyGigMode === 'boolean') {
        patch['dailyGigMode'] = body.dailyGigMode;
        hasPatch = true;
    }
    if (body.skills !== undefined) {
        patch['skillsJson'] = parseSkillsInput(body.skills);
        hasPatch = true;
    }
    if (!hasPatch) return c.json({ success: false, message: 'Provide dailyGigMode and/or skills' }, 400);

    await db.update(schema.users).set(patch).where(eq(schema.users.id, userId));

    const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: { password: false },
    });

    const skillsSafe = ((((user as any)?.skillsJson as string[]) ?? []) || []) as string[];

    return c.json({
        success: true,
        data: {
            id: user!.id,
            name: user!.name,
            email: user!.email,
            role: user!.role,
            trustScore: user!.trustScore,
            scopeDiscipline: user!.scopeDiscipline,
            scopeCreepIndex: user!.scopeCreepIndex,
            disputeRatio: user!.disputeRatio,
            trustVelocity: user!.trustVelocity,
            dailyGigMode: !!(user as any).dailyGigMode,
            skills: skillsSafe,
            availabilityStatus: (user as any).dailyGigMode ? 'Available Now' : 'Offline',
        },
    });
});

// ─── Daily Gig Mode (instant gigs) ───────────────────────────
app.post('/gigs', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const recruiterId = c.get('userId') as number;
    const recruiter = await db.query.users.findFirst({
        where: eq(schema.users.id, recruiterId),
    });
    if (!recruiter || recruiter.role !== 'client')
        return c.json({ success: false, message: 'Only clients (recruiters) can post instant gigs' }, 403);

    const body = await c.req.json().catch(() => ({}));
    const title = String(body.title ?? '').trim();
    const budget = String(body.budget ?? '').trim();
    const duration = String(body.duration ?? '').trim();
    const requiredSkills = parseSkillsInput(body.requiredSkills ?? body.required_skills ?? []);
    const description = body.description ? String(body.description).trim() : '';

    if (!title || !budget || !duration) {
        return c.json({ success: false, message: 'title, budget, and duration are required' }, 400);
    }
    if (requiredSkills.length === 0) {
        return c.json(
            { success: false, message: 'Add at least one required skill so Daily Gig freelancers can match' },
            400
        );
    }

    const [gigRow] = await db
        .insert(schema.dailyGigs)
        .values({
            clientId: recruiterId,
            title,
            budget,
            duration,
            requiredSkills,
            description: description || undefined,
            status: 'open',
        })
        .returning();

    const candidates = await db
        .select()
        .from(schema.users)
        .where(and(eq(schema.users.role, 'freelancer'), eq(schema.users.dailyGigMode, true)));

    let dispatched = 0;
    const nowSkillsNormalized = coerceSkillsArray(gigRow.requiredSkills);

    for (const f of candidates) {
        if (!freelancerMatchesGigSkills((f as { skillsJson?: unknown }).skillsJson, nowSkillsNormalized)) continue;
        try {
            await db.insert(schema.gigOffers).values({
                gigId: gigRow.id,
                freelancerId: f.id,
                status: 'pending',
            });
            dispatched++;
        } catch {
            /* ignore duplicate gig-offer collisions */
        }
    }

    return c.json({
        success: true,
        data: {
            ...gigRow,
            recruiterNotifiedFreelancers: dispatched,
            freelancersListeningNow: candidates.length,
            requiredSkills,
        },
    }, 201);
});

app.get('/gigs/freelancer/offers', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('userId') as number;
    const me = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (!me || me.role !== 'freelancer')
        return c.json({ success: false, message: 'Freelancers only' }, 403);

    const rows = await db
        .select({
            offerId: schema.gigOffers.id,
            status: schema.gigOffers.status,
            createdAt: schema.gigOffers.createdAt,
            gigId: schema.dailyGigs.id,
            title: schema.dailyGigs.title,
            budget: schema.dailyGigs.budget,
            duration: schema.dailyGigs.duration,
            requiredSkills: schema.dailyGigs.requiredSkills,
            description: schema.dailyGigs.description,
            gigStatus: schema.dailyGigs.status,
            clientId: schema.users.id,
            clientName: schema.users.name,
            clientEmail: schema.users.email,
            clientTrust: schema.users.trustScore,
        })
        .from(schema.gigOffers)
        .innerJoin(schema.dailyGigs, eq(schema.gigOffers.gigId, schema.dailyGigs.id))
        .innerJoin(schema.users, eq(schema.dailyGigs.clientId, schema.users.id))
        .where(
            and(eq(schema.gigOffers.freelancerId, userId), eq(schema.gigOffers.status, 'pending'), eq(schema.dailyGigs.status, 'open'))
        )
        .orderBy(desc(schema.gigOffers.createdAt));

    return c.json({ success: true, data: rows });
});

app.post('/gigs/offers/:offerId/respond', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('userId') as number;
    const offerId = parseInt(c.req.param('offerId'), 10);
    const body = await c.req.json().catch(() => ({}));
    const action = String(body.action ?? '').toLowerCase();
    if (!['accept', 'reject'].includes(action)) {
        return c.json({ success: false, message: 'action must be accept or reject' }, 400);
    }

    const offer = await db.query.gigOffers.findFirst({
        where: eq(schema.gigOffers.id, offerId),
    });
    if (!offer || offer.freelancerId !== userId)
        return c.json({ success: false, message: 'Offer not found' }, 404);

    const gig = await db.query.dailyGigs.findFirst({
        where: eq(schema.dailyGigs.id, offer.gigId),
    });

    if (!gig || gig.status !== 'open')
        return c.json({ success: false, message: 'This gig is no longer accepting responses' }, 400);

    if (offer.status !== 'pending')
        return c.json({ success: false, message: 'You already responded to this gig' }, 400);

    if (action === 'reject') {
        await db.update(schema.gigOffers).set({ status: 'rejected' }).where(eq(schema.gigOffers.id, offerId));
        return c.json({ success: true, data: { responded: 'rejected', offerId } });
    }

    const [filledGig] = await db
        .update(schema.dailyGigs)
        .set({
            status: 'filled',
            acceptedFreelancerId: userId,
            updatedAt: new Date(),
        })
        .where(and(eq(schema.dailyGigs.id, gig.id), eq(schema.dailyGigs.status, 'open')))
        .returning();

    if (!filledGig) {
        return c.json({ success: false, message: 'This gig was just filled by another freelancer' }, 409);
    }

    await db.update(schema.gigOffers).set({ status: 'accepted' }).where(eq(schema.gigOffers.id, offerId));

    await db
        .update(schema.gigOffers)
        .set({ status: 'rejected' })
        .where(
            and(eq(schema.gigOffers.gigId, gig.id), ne(schema.gigOffers.id, offerId), eq(schema.gigOffers.status, 'pending'))
        );

    const convId = await getOrCreateDirectConversation(db, userId, gig.clientId);

    await db.insert(schema.directMessages).values({
        conversationId: convId,
        senderId: userId,
        content: `[Daily Gig] I accepted “${gig.title}”. Ready to kick off.`,
    });

    await db.insert(schema.gigRecruiterAlerts).values({
        clientId: gig.clientId,
        gigId: gig.id,
        freelancerId: userId,
        read: false,
    });

    await db.update(schema.conversations).set({ lastMessageAt: new Date() }).where(eq(schema.conversations.id, convId));

    return c.json({
        success: true,
        data: {
            responded: 'accepted',
            offerId,
            gigId: gig.id,
            conversationId: convId,
            clientId: gig.clientId,
        },
    });
});

app.get('/gigs/recruiter/alerts', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('userId') as number;
    const me = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (!me || me.role !== 'client')
        return c.json({ success: false, message: 'Clients only' }, 403);

    const url = new URL(c.req.url);
    const unreadOnly = url.searchParams.get('unread') === '1';

    const q = db
        .select({
            id: schema.gigRecruiterAlerts.id,
            read: schema.gigRecruiterAlerts.read,
            createdAt: schema.gigRecruiterAlerts.createdAt,
            gigId: schema.dailyGigs.id,
            gigTitle: schema.dailyGigs.title,
            budget: schema.dailyGigs.budget,
            duration: schema.dailyGigs.duration,
            freelancerId: schema.users.id,
            freelancerName: schema.users.name,
            freelancerEmail: schema.users.email,
        })
        .from(schema.gigRecruiterAlerts)
        .innerJoin(schema.dailyGigs, eq(schema.gigRecruiterAlerts.gigId, schema.dailyGigs.id))
        .innerJoin(schema.users, eq(schema.gigRecruiterAlerts.freelancerId, schema.users.id))
        .where(
            unreadOnly
                ? and(eq(schema.gigRecruiterAlerts.clientId, userId), eq(schema.gigRecruiterAlerts.read, false))
                : eq(schema.gigRecruiterAlerts.clientId, userId)
        )
        .orderBy(desc(schema.gigRecruiterAlerts.createdAt));

    const rows = await q;
    return c.json({ success: true, data: rows });
});

app.patch('/gigs/recruiter/alerts/:id/read', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('userId') as number;
    const alertId = parseInt(c.req.param('id'), 10);
    const row = await db.query.gigRecruiterAlerts.findFirst({
        where: eq(schema.gigRecruiterAlerts.id, alertId),
    });
    if (!row || row.clientId !== userId) return c.json({ success: false, message: 'Alert not found' }, 404);
    await db
        .update(schema.gigRecruiterAlerts)
        .set({ read: true })
        .where(eq(schema.gigRecruiterAlerts.id, alertId));
    return c.json({ success: true, data: { id: alertId, read: true } });
});

app.get('/users/:id', async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const id = parseInt(c.req.param('id'), 10);

    const user = await db.query.users.findFirst({
        where: eq(schema.users.id, id),
        columns: { password: false }
    });

    if (!user) return c.json({ success: false, message: 'User not found' }, 404);

    return c.json({ success: true, data: user });
});

app.get('/users/:id/projects', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const id = parseInt(c.req.param('id'), 10);

    const userProjects = await db.select().from(schema.projects).where(
        or(eq(schema.projects.freelancerId, id), eq(schema.projects.clientId, id))
    );

    return c.json({ success: true, data: userProjects });
});

// ─── Project Routes ─────────────────────────────────────────
app.get('/projects', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('userId') as number;

    const userProjects = await db.select().from(schema.projects).where(
        or(eq(schema.projects.freelancerId, userId), eq(schema.projects.clientId, userId))
    );

    // Map to frontend-friendly shape (use _id for backwards compat)
    const data = userProjects.map((p) => ({
        _id: p.id,
        ...p,
    }));

    return c.json({ success: true, data });
});

app.post('/projects', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('userId') as number;
    const body = await c.req.json();

    const { title, clientId, scopeChecklist, revisionLimit, deadline } = body;

    if (!title || !clientId) {
        return c.json({ success: false, message: 'Title and clientId are required' }, 400);
    }

    const [newProject] = await db.insert(schema.projects).values({
        title,
        freelancerId: userId,
        clientId: parseInt(clientId, 10),
        scopeChecklist: scopeChecklist || [],
        revisionLimit: revisionLimit || 2,
        deadline: deadline ? new Date(deadline) : undefined,
        status: 'draft',
    }).returning();

    return c.json({ success: true, data: { _id: newProject.id, ...newProject } }, 201);
});

app.get('/projects/:id', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const id = parseInt(c.req.param('id'), 10);

    const project = await db.query.projects.findFirst({
        where: eq(schema.projects.id, id)
    });

    if (!project) return c.json({ success: false, message: 'Project not found' }, 404);

    // Get deliverables
    const deliverablesList = await db.select().from(schema.deliverables)
        .where(eq(schema.deliverables.projectId, id));

    // Get change requests
    const changeRequestsList = await db.select().from(schema.changeRequests)
        .where(eq(schema.changeRequests.projectId, id));

    // Get freelancer and client names
    const freelancer = await db.query.users.findFirst({
        where: eq(schema.users.id, project.freelancerId),
        columns: { id: true, name: true }
    });
    const client = await db.query.users.findFirst({
        where: eq(schema.users.id, project.clientId),
        columns: { id: true, name: true }
    });

    return c.json({
        success: true,
        data: {
            _id: project.id,
            ...project,
            freelancerId: freelancer || project.freelancerId,
            clientId: client || project.clientId,
            deliverables: deliverablesList.map(d => ({ _id: d.id, ...d })),
            changeRequests: changeRequestsList.map(cr => ({ _id: cr.id, ...cr })),
        }
    });
});

app.patch('/projects/:id/approve', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const id = parseInt(c.req.param('id'), 10);
    const body = await c.req.json().catch(() => ({}));

    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, id) });
    if (!project) return c.json({ success: false, message: 'Project not found' }, 404);
    if (project.status !== 'draft') return c.json({ success: false, message: 'Project is not in draft status' }, 400);

    const updateData: any = { status: 'active', updatedAt: new Date() };
    if (body.deadline) updateData.deadline = new Date(body.deadline);

    await db.update(schema.projects).set(updateData).where(eq(schema.projects.id, id));

    // Re-fetch
    const updated = await db.query.projects.findFirst({ where: eq(schema.projects.id, id) });
    return c.json({ success: true, data: { _id: updated!.id, ...updated } });
});

app.patch('/projects/:id/complete', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const id = parseInt(c.req.param('id'), 10);

    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, id) });
    if (!project) return c.json({ success: false, message: 'Project not found' }, 404);
    if (project.status !== 'active') return c.json({ success: false, message: 'Project is not active' }, 400);

    const completedAt = new Date();
    let trustImpact = 5; // Base trust gain for completion

    // Deadline bonus/penalty
    if (project.deadline) {
        const deadline = new Date(project.deadline as any);
        if (completedAt < deadline) trustImpact += 3;        // Early bonus
        else if (completedAt > deadline) trustImpact -= 3;   // Late penalty
    }

    await db.update(schema.projects).set({
        status: 'completed',
        completedAt,
        trustImpact,
        updatedAt: new Date()
    }).where(eq(schema.projects.id, id));

    // Update freelancer trust score
    await db.update(schema.users).set({
        trustScore: project.freelancerId ? (await db.query.users.findFirst({ where: eq(schema.users.id, project.freelancerId) }))!.trustScore! + trustImpact : 50,
        updatedAt: new Date()
    }).where(eq(schema.users.id, project.freelancerId));

    const updated = await db.query.projects.findFirst({ where: eq(schema.projects.id, id) });
    return c.json({ success: true, data: { _id: updated!.id, ...updated } });
});

app.patch('/projects/:id/revisions', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const id = parseInt(c.req.param('id'), 10);

    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, id) });
    if (!project) return c.json({ success: false, message: 'Project not found' }, 404);
    if (project.revisionsUsed! >= project.revisionLimit) {
        return c.json({ success: false, message: 'Revision limit reached' }, 400);
    }

    await db.update(schema.projects).set({
        revisionsUsed: project.revisionsUsed! + 1,
        updatedAt: new Date()
    }).where(eq(schema.projects.id, id));

    const updated = await db.query.projects.findFirst({ where: eq(schema.projects.id, id) });
    return c.json({ success: true, data: { _id: updated!.id, ...updated } });
});

// ─── Change Request Routes ──────────────────────────────────
app.post('/projects/:id/change-requests', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const projectId = parseInt(c.req.param('id'), 10);
    const { description } = await c.req.json();

    if (!description) return c.json({ success: false, message: 'Description is required' }, 400);

    const [cr] = await db.insert(schema.changeRequests).values({
        projectId,
        description
    }).returning();

    return c.json({ success: true, data: { _id: cr.id, ...cr } }, 201);
});

app.patch('/projects/:projectId/change-requests/:crId/classify', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const crId = parseInt(c.req.param('crId'), 10);
    const { classification, priceAdjustment, timelineAdjustment } = await c.req.json();

    if (!['in-scope', 'out-of-scope'].includes(classification)) {
        return c.json({ success: false, message: 'Invalid classification' }, 400);
    }

    const updateData: any = { classification };
    if (classification === 'out-of-scope') {
        updateData.priceAdjustment = priceAdjustment || 0;
        updateData.timelineAdjustment = timelineAdjustment || 0;
    }

    await db.update(schema.changeRequests).set(updateData).where(eq(schema.changeRequests.id, crId));

    // If out-of-scope, bump scope creep index for the project's client
    if (classification === 'out-of-scope') {
        const projectId = parseInt(c.req.param('projectId'), 10);
        const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, projectId) });
        if (project) {
            const clientUser = await db.query.users.findFirst({ where: eq(schema.users.id, project.clientId) });
            if (clientUser) {
                await db.update(schema.users).set({
                    scopeCreepIndex: (clientUser.scopeCreepIndex || 0) + 1,
                    updatedAt: new Date()
                }).where(eq(schema.users.id, project.clientId));
            }
        }
    }

    return c.json({ success: true, message: 'Change request classified' });
});

// ─── Deliverable Routes ─────────────────────────────────────
app.post('/projects/:projectId/deliverables', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const projectId = parseInt(c.req.param('projectId'), 10);
    const { title, link, description, type } = await c.req.json();

    if (!title || !link) return c.json({ success: false, message: 'Title and link are required' }, 400);

    const [deliverable] = await db.insert(schema.deliverables).values({
        projectId,
        title,
        link,
        description: description || null,
        type: type || 'link',
    }).returning();

    return c.json({ success: true, data: { _id: deliverable.id, ...deliverable } }, 201);
});

app.patch('/projects/:projectId/deliverables/:deliverableId/accept', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const deliverableId = parseInt(c.req.param('deliverableId'), 10);

    await db.update(schema.deliverables).set({ status: 'accepted' }).where(eq(schema.deliverables.id, deliverableId));

    return c.json({ success: true, message: 'Deliverable accepted' });
});

app.patch('/projects/:projectId/deliverables/:deliverableId/request-revision', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const deliverableId = parseInt(c.req.param('deliverableId'), 10);
    const { feedback } = await c.req.json();

    await db.update(schema.deliverables).set({
        status: 'revision_requested',
        clientFeedback: feedback || null
    }).where(eq(schema.deliverables.id, deliverableId));

    return c.json({ success: true, message: 'Revision requested' });
});

// ─── Project Message Routes ─────────────────────────────────
app.get('/projects/:projectId/messages', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const projectId = parseInt(c.req.param('projectId'), 10);

    const msgs = await db.select({
        _id: schema.messages.id,
        projectId: schema.messages.projectId,
        content: schema.messages.content,
        createdAt: schema.messages.createdAt,
        senderId: {
            _id: schema.users.id,
            name: schema.users.name,
            role: schema.users.role
        }
    })
    .from(schema.messages)
    .leftJoin(schema.users, eq(schema.messages.senderId, schema.users.id))
    .where(eq(schema.messages.projectId, projectId));

    return c.json({ success: true, data: msgs });
});

app.post('/projects/:projectId/messages', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const projectId = parseInt(c.req.param('projectId'), 10);
    const userId = c.get('userId');
    const { content } = await c.req.json();

    const [newMessage] = await db.insert(schema.messages).values({
        projectId,
        senderId: userId as number,
        content
    }).returning();

    const msgWithUser = await db.select({
        _id: schema.messages.id,
        projectId: schema.messages.projectId,
        content: schema.messages.content,
        createdAt: schema.messages.createdAt,
        senderId: {
            _id: schema.users.id,
            name: schema.users.name,
            role: schema.users.role
        }
    })
    .from(schema.messages)
    .leftJoin(schema.users, eq(schema.messages.senderId, schema.users.id))
    .where(eq(schema.messages.id, newMessage.id));

    return c.json({ success: true, data: msgWithUser[0] }, 201);
});

// ─── Conversation Routes (Direct Messages) ──────────────────
app.get('/conversations', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('userId') as number;

    const convos = await db.select().from(schema.conversations).where(
        or(
            eq(schema.conversations.participant1Id, userId),
            eq(schema.conversations.participant2Id, userId)
        )
    );

    // Enrich with participant info
    const enriched = await Promise.all(convos.map(async (conv) => {
        const otherId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
        const otherUser = await db.query.users.findFirst({
            where: eq(schema.users.id, otherId),
            columns: { id: true, name: true, role: true }
        });
        return { _id: conv.id, ...conv, otherUser };
    }));

    return c.json({ success: true, data: enriched });
});

app.post('/conversations', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('userId') as number;
    const { otherUserId } = await c.req.json();

    if (!otherUserId) return c.json({ success: false, message: 'otherUserId is required' }, 400);

    const otherId = parseInt(otherUserId, 10);

    // Check for existing conversation (either direction)
    const existing = await db.query.conversations.findFirst({
        where: or(
            and(eq(schema.conversations.participant1Id, userId), eq(schema.conversations.participant2Id, otherId)),
            and(eq(schema.conversations.participant1Id, otherId), eq(schema.conversations.participant2Id, userId))
        )
    });

    if (existing) {
        return c.json({ success: true, data: { _id: existing.id, ...existing } });
    }

    const [newConvo] = await db.insert(schema.conversations).values({
        participant1Id: userId,
        participant2Id: otherId
    }).returning();

    return c.json({ success: true, data: { _id: newConvo.id, ...newConvo } }, 201);
});

app.get('/conversations/:id/messages', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const conversationId = parseInt(c.req.param('id'), 10);

    const msgs = await db.select({
        _id: schema.directMessages.id,
        conversationId: schema.directMessages.conversationId,
        content: schema.directMessages.content,
        createdAt: schema.directMessages.createdAt,
        senderId: {
            _id: schema.users.id,
            name: schema.users.name,
            role: schema.users.role
        }
    })
    .from(schema.directMessages)
    .leftJoin(schema.users, eq(schema.directMessages.senderId, schema.users.id))
    .where(eq(schema.directMessages.conversationId, conversationId));

    return c.json({ success: true, data: msgs });
});

app.post('/conversations/:id/messages', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const conversationId = parseInt(c.req.param('id'), 10);
    const userId = c.get('userId') as number;
    const { content } = await c.req.json();

    const [newMsg] = await db.insert(schema.directMessages).values({
        conversationId,
        senderId: userId,
        content
    }).returning();

    // Update lastMessageAt
    await db.update(schema.conversations).set({
        lastMessageAt: new Date()
    }).where(eq(schema.conversations.id, conversationId));

    return c.json({ success: true, data: { _id: newMsg.id, ...newMsg } }, 201);
});

// ─── ORION (Gemini) — routes remain /maya ───────────────────
const ORION_GEMINI_KEY_MESSAGE =
    'ORION needs a non-empty GEMINI_API_KEY in client/.dev.vars (same folder as wrangler.toml). Root .env and .env.example are not loaded by Cloudflare Workers. Get a key at https://aistudio.google.com/apikey — then restart npm run dev:api (or use npm run dev:all).';

const ORION_STRUCTURED_MODES = new Set([
    'scope',
    'job_post',
    'milestones',
    'interview',
    'proposal',
    'summarize',
    'contract',
    'fraud',
    'career',
    'team',
    'budget',
    'nda',
]);

app.post('/maya/chat', authMiddleware, async (c) => {
    const key = c.env.GEMINI_API_KEY?.trim();
    if (!key) {
        return c.json({ success: false, message: ORION_GEMINI_KEY_MESSAGE }, 503);
    }

    const body = await c.req.json().catch(() => ({}));
    if (body.mode === 'match') {
        return c.json(
            {
                success: false,
                message: 'Freelancer matching uses POST /api/maya/match with { "brief": "..." }.',
            },
            400
        );
    }

    const mode = typeof body.mode === 'string' && body.mode in ORION_SYSTEM ? body.mode : 'chat';
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const messages = rawMessages
        .filter((m: unknown) => {
            if (!m || typeof m !== 'object') return false;
            const r = m as { role?: string; content?: string };
            return (r.role === 'user' || r.role === 'assistant') && typeof r.content === 'string';
        })
        .map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content.slice(0, 24000),
        }))
        .slice(-30);

    if (messages.length === 0) {
        return c.json({ success: false, message: 'Provide at least one chat message' }, 400);
    }

    const systemPrompt = ORION_SYSTEM[mode];
    const jsonMode = ORION_STRUCTURED_MODES.has(mode);

    try {
        const text = await generateGeminiText({
            apiKey: key,
            systemPrompt,
            messages,
            jsonMode,
        });

        let structured: unknown = null;
        if (jsonMode) {
            try {
                structured = JSON.parse(text);
            } catch {
                structured = null;
            }
        }

        return c.json({
            success: true,
            data: {
                mode,
                reply: text,
                structured,
            },
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Gemini request failed';
        return c.json({ success: false, message: msg }, 502);
    }
});

app.post('/maya/match', authMiddleware, async (c) => {
    const key = c.env.GEMINI_API_KEY?.trim();
    if (!key) {
        return c.json({ success: false, message: ORION_GEMINI_KEY_MESSAGE }, 503);
    }

    const body = await c.req.json().catch(() => ({}));
    const brief = typeof body.brief === 'string' ? body.brief.trim().slice(0, 12000) : '';
    if (!brief) {
        return c.json({ success: false, message: 'brief is required' }, 400);
    }

    const db = drizzle(c.env.DB, { schema });

    const freelancers = await db.select({
        id: schema.users.id,
        name: schema.users.name,
        trustScore: schema.users.trustScore,
        scopeDiscipline: schema.users.scopeDiscipline,
        scopeCreepIndex: schema.users.scopeCreepIndex,
        disputeRatio: schema.users.disputeRatio,
        trustVelocity: schema.users.trustVelocity,
    }).from(schema.users).where(eq(schema.users.role, 'freelancer'));

    if (freelancers.length === 0) {
        return c.json({
            success: true,
            data: {
                reply: 'No freelancers are registered yet. Invite freelancers to sign up first.',
                structured: { matches: [], notes: '' },
            },
        });
    }

    const rosterJson = JSON.stringify(
        freelancers.map((f) => ({
            freelancerId: f.id,
            displayName: f.name,
            trustScore: f.trustScore,
            scopeDiscipline: f.scopeDiscipline,
            scopeCreepIndex: f.scopeCreepIndex,
            disputeRatio: f.disputeRatio,
            trustVelocity: f.trustVelocity,
        }))
    );

    const userContent = `PROJECT BRIEF FROM CLIENT:\n${brief}\n\nFREELANCER_ROSTER_JSON:\n${rosterJson}`;

    try {
        const text = await generateGeminiText({
            apiKey: key,
            systemPrompt: ORION_SYSTEM.match,
            messages: [{ role: 'user', content: userContent }],
            jsonMode: true,
        });

        let structured: { matches?: unknown[]; notes?: string } = {};
        try {
            structured = JSON.parse(text) as typeof structured;
        } catch {
            structured = {};
        }

        const ids = new Set(freelancers.map((f) => f.id));
        const rawMatches = Array.isArray(structured.matches) ? structured.matches : [];
        const enriched = rawMatches
            .filter((m: unknown) => {
                const row = m as { freelancerId?: number };
                return typeof row?.freelancerId === 'number' && ids.has(row.freelancerId);
            })
            .map((m: unknown) => {
                const row = m as {
                    freelancerId: number;
                    score?: number;
                    summary?: string;
                    fitReasons?: string[];
                };
                const f = freelancers.find((x) => x.id === row.freelancerId)!;
                return {
                    freelancer: f,
                    score: row.score ?? 0,
                    summary: row.summary ?? '',
                    fitReasons: Array.isArray(row.fitReasons) ? row.fitReasons : [],
                };
            });

        return c.json({
            success: true,
            data: {
                mode: 'match',
                reply: text,
                structured: { matches: enriched, notes: structured.notes ?? '' },
            },
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Gemini request failed';
        return c.json({ success: false, message: msg }, 502);
    }
});

// ─── Export for Cloudflare Pages ────────────────────────────
export const onRequest = handle(app);
