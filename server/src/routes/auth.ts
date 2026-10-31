import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { cryptoService } from '../services/crypto.js';

export const authRouter = Router();

const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

function getOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    'http://localhost:8080/api/auth/callback';

  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

// 1. GET /api/auth/login
authRouter.get('/login', (_req: Request, res: Response) => {
  const oauthClient = getOAuthClient();
  const state = crypto.randomBytes(24).toString('hex');

  // Store state in short-lived httpOnly cookie to prevent CSRF
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  const authUrl = oauthClient.generateAuthUrl({
    access_type: 'online', // Ephemeral session, no offline refresh token stored
    scope: OAUTH_SCOPES,
    state,
    prompt: 'consent',
  });

  return res.redirect(authUrl);
});

// 2. GET /api/auth/callback
authRouter.get('/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;
  const cookieState = req.cookies.oauth_state as string | undefined;

  // Clear anti-CSRF state cookie
  res.clearCookie('oauth_state');

  if (!state || !cookieState || state !== cookieState) {
    return res.status(403).send('OAuth state mismatch (CSRF protection triggered). Please try connecting again.');
  }

  if (!code) {
    return res.status(400).send('Missing authorization code from Google.');
  }

  try {
    const oauthClient = getOAuthClient();
    const { tokens } = await oauthClient.getToken(code);

    if (!tokens.access_token) {
      throw new Error('No access token received from Google OAuth.');
    }

    // Retrieve user identity for personalized UI
    oauthClient.setCredentials(tokens);
    const tokenInfo = await oauthClient.getTokenInfo(tokens.access_token);

    const sessionPayload = {
      accessToken: tokens.access_token,
      expiryDate: tokens.expiry_date ?? undefined,
      email: tokenInfo.email,
    };

    // Encrypt token server-side using AES-256-GCM
    const encryptedSession = cryptoService.encrypt(sessionPayload);

    // Save in secure httpOnly cookie
    res.cookie('si_session', encryptedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 * 1000, // 1 hour session
    });

    return res.redirect('/?mode=drive&auth=success');
  } catch (err) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        route: 'GET /api/auth/callback',
        error: err instanceof Error ? err.message : 'Unknown OAuth error',
        timestamp: new Date().toISOString(),
      })
    );
    return res.redirect('/?auth=error');
  }
});

// 3. GET /api/auth/me
authRouter.get('/me', (req: Request, res: Response) => {
  const sessionCookie = req.cookies.si_session as string | undefined;

  if (!sessionCookie) {
    return res.status(200).json({ authenticated: false });
  }

  try {
    const session = cryptoService.decrypt(sessionCookie);

    // Check expiry
    if (session.expiryDate && Date.now() > session.expiryDate) {
      res.clearCookie('si_session');
      return res.status(200).json({ authenticated: false, expired: true });
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        email: session.email,
        name: session.name || session.email?.split('@')[0],
      },
    });
  } catch {
    res.clearCookie('si_session');
    return res.status(200).json({ authenticated: false });
  }
});

// 4. POST /api/auth/logout
authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('si_session');
  return res.status(200).json({ success: true });
});
