import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../src/db/schema';
import { sign, verify } from 'hono/jwt';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export type Bindings = {
    DB: D1Database;
    JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

// Health Check
app.get('/health', (c) => {
    return c.json({
        success: true,
        message: 'Accredify API is running on Cloudflare Pages',
        timestamp: new Date().toISOString(),
    });
});

// ------------- AUTH ROUTES -------------
app.post('/auth/register', async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const { name, email, password, role } = await c.req.json();

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
    const token = await sign({ id: newUser.id }, secret);

    return c.json({
        success: true,
        data: {
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                trustScore: newUser.trustScore
            },
            token
        }
    }, 201);
});

app.post('/auth/login', async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const { email, password } = await c.req.json();

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
    const token = await sign({ id: user.id }, secret);

    return c.json({
        success: true,
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                trustScore: user.trustScore
            },
            token
        }
    });
});


// ------------- AUTH MIDDLEWARE -------------
export const authMiddleware = async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ success: false, message: 'Not authorized, no token' }, 401);
    }

    const token = authHeader.split(' ')[1];
    try {
        const secret = c.env.JWT_SECRET || 'fallback_secret';
        const decoded = await verify(token, secret);
        c.set('userId', decoded.id);
        await next();
    } catch (e) {
        return c.json({ success: false, message: 'Not authorized, invalid token' }, 401);
    }
};

app.get('/auth/me', authMiddleware, async (c) => {
    const db = drizzle(c.env.DB, { schema });
    const userId = c.get('userId');

    const user = await db.query.users.findFirst({
         where: eq(schema.users.id, userId as number)
    });

    if (!user) return c.json({ success: false, message: 'User not found' }, 404);

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
         }
    });
});

// ------------- USERS ROUTES -------------
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

// ------------- EXPORT FOR PAGES -------------
export const onRequest = handle(app);
