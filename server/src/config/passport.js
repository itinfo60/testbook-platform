import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './prisma.js';
import config from './index.js';

if (config.google.clientId && config.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackURL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google'), null);

          let user = await prisma.user.findFirst({ where: { email } });

          if (user) {
            if (!user.googleId) {
              const data = {
                googleId: profile.id,
                isEmailVerified: true,
              };
              if (!user.avatar && profile.photos?.[0]?.value) {
                data.avatar = profile.photos[0].value;
              }
              user = await prisma.user.update({
                where: { id: user.id },
                data,
              });
            }
          } else {
            user = await prisma.user.create({
              data: {
                name: profile.displayName,
                email,
                googleId: profile.id,
                isEmailVerified: true,
                role: 'student',
                avatar: profile.photos?.[0]?.value || '',
                password: Math.random().toString(36).slice(-12) + 'Aa1!',
              },
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
