import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { prisma } from './db'

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-for-dev'

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// JWT token generation
export function generateToken(payload: object, expiresIn: string = '24h'): string {
  return jwt.sign(payload, NEXTAUTH_SECRET, { expiresIn } as jwt.SignOptions)
}

interface CustomJwtPayload extends jwt.JwtPayload {
  userId?: string
  type?: string
}

export function verifyToken(token: string): CustomJwtPayload | null {
  try {
    const decoded = jwt.verify(token, NEXTAUTH_SECRET)
    if (typeof decoded === 'string') {
      return null
    }
    return decoded as CustomJwtPayload
  } catch {
    return null
  }
}

// Email verification token
export async function generateEmailVerificationToken(userId: string): Promise<string> {
  const token = generateToken({ userId, type: 'email_verification' }, '24h')
  
  // Save token to database
  await prisma.emailVerification.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  })

  return token
}

export async function verifyEmailToken(token: string): Promise<string | null> {
  const decoded = verifyToken(token)
  if (!decoded || decoded.type !== 'email_verification') {
    return null
  }

  // Check if token exists and is not used
  const verificationRecord = await prisma.emailVerification.findUnique({
    where: { token },
  })

  if (!verificationRecord || verificationRecord.used) {
    return null
  }

  // Check expiration
  if (verificationRecord.expiresAt < new Date()) {
    return null
  }

  // Mark as used
  await prisma.emailVerification.update({
    where: { token },
    data: { used: true },
  })

  return decoded.userId
}

// Password reset token
export async function generatePasswordResetToken(userId: string): Promise<string> {
  const token = generateToken({ userId, type: 'password_reset' }, '1h')
  
  await prisma.passwordReset.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  })

  return token
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const decoded = verifyToken(token)
  if (!decoded || decoded.type !== 'password_reset') {
    return null
  }

  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
  })

  if (!resetRecord || resetRecord.used) {
    return null
  }

  if (resetRecord.expiresAt < new Date()) {
    return null
  }

  // Mark as used
  await prisma.passwordReset.update({
    where: { token },
    data: { used: true },
  })

  return decoded.userId
}

// Session management
export async function createSession(userId: string): Promise<string> {
  const sessionToken = generateToken({ userId }, '30d')
  
  await prisma.session.create({
    data: {
      userId,
      sessionToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  })

  return sessionToken
}

export async function getSessionUser(sessionToken: string) {
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return session.user
}

export async function deleteSession(sessionToken: string): Promise<void> {
  await prisma.session.delete({
    where: { sessionToken },
  })
}

// Account lockout management
export async function handleFailedLogin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLoginAttempts: true, lockedUntil: true },
  })

  if (!user) return false

  // Check if already locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return true // Account is locked
  }

  // Increment failed attempts
  const newAttempts = user.failedLoginAttempts + 1

  if (newAttempts >= 5) {
    // Lock account for 30 minutes
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
      },
    })
    return true // Account is now locked
  }

  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: newAttempts },
  })

  return false // Not locked yet
}

export async function resetFailedLoginAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  })
}
