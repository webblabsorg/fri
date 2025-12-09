# Authentication Pages Documentation
**Platform:** Frith AI - Legal AI Platform  
**Domain:** https://frithai.com/sign-up, /sign-in, /reset-password  
**Tech Stack:** Next.js, Tailwind CSS, Shadcn UI, Neon (PostgreSQL), Vercel

---

## 1. Overview

The authentication system handles user registration, login, password management, and session handling for Frith AI. It must be secure, user-friendly, and compliant with legal industry standards (SOC2, GDPR).

### Goals
- Seamless signup/signin experience
- Enterprise-grade security (2FA, SSO)
- Email verification and password recovery
- Integration with Stripe for paid plan upgrades
- Role-based access control (user roles: User, Admin, Enterprise Admin)

---

## 2. Authentication Architecture

### 2.1 Tech Stack
- **Frontend:** Next.js App Router + React
- **UI:** Shadcn components (Form, Input, Button, Card)
- **Backend:** Next.js API Routes + Neon PostgreSQL
- **Authentication:** NextAuth.js (or Clerk for easier SSO)
- **Email:** Resend for transactional emails
- **Session:** JWT tokens (httpOnly cookies)
- **Password Hashing:** bcrypt
- **2FA:** TOTP (Google Authenticator, Authy)

### 2.2 Security Features
- Password strength requirements (min 12 chars, uppercase, lowercase, number, special char)
- Rate limiting (5 failed login attempts → 15 min lockout)
- Email verification required before full access
- CSRF protection
- XSS prevention (sanitized inputs)
- Account lockout after repeated failures
- Audit logs for security events

---

## 3. Sign Up Page

### 3.1 Route
`/sign-up` or `/auth/signup`

### 3.2 Layout
**Split Screen (Desktop):**
- **Left Side (50%):** Branding + social proof
- **Right Side (50%):** Sign-up form

**Mobile:** Single column, logo at top

---

### 3.3 Left Side (Branding)
**Background:** Gradient (brand blue → purple) with subtle legal pattern overlay

**Content:**
- **Logo:** Frith AI (top-left)
- **Headline:** "Join 5,000+ Legal Professionals"
- **Subheadline:** "Save 10+ hours every week with AI-powered legal tools"
- **Feature Bullets:**
  - ✓ 240+ specialized AI tools
  - ✓ No credit card required
  - ✓ 45-day money-back guarantee
- **Testimonial Carousel (3 rotating):**
  ```
  "Frith AI transformed how we handle contract reviews."
  — Sarah Johnson, Partner @ Johnson & Associates
  ```
- **Trust Badges:** SOC2, GDPR, ABA Tech Show

---

### 3.4 Right Side (Form)
**Card Design:** White card with shadow, centered

**Header:**
- **Title:** "Create your account"
- **Subtitle:** "Start using 240+ AI tools for free"
- **Sign In Link:** "Already have an account? Sign in"

---

### 3.5 Sign Up Form Fields

**1. Full Name**
- Input type: text
- Placeholder: "John Doe"
- Required: Yes
- Validation: Min 2 characters, letters/spaces only

**2. Email Address**
- Input type: email
- Placeholder: "you@lawfirm.com"
- Required: Yes
- Validation: Valid email format, check for existing account
- Real-time check: Show "✓ Available" or "✗ Email already registered"

**3. Password**
- Input type: password (with show/hide toggle)
- Placeholder: "Create a strong password"
- Required: Yes
- Validation: 
  - Min 12 characters
  - At least 1 uppercase, 1 lowercase, 1 number, 1 special char
- **Password Strength Indicator:**
  - Weak (red) → Medium (orange) → Strong (green)
  - Show requirements checklist below field

**4. Confirm Password**
- Input type: password
- Placeholder: "Re-enter your password"
- Required: Yes
- Validation: Must match password field
- Real-time validation: Show "✓ Passwords match" or "✗ Passwords don't match"

**5. Law Firm / Company Name** (Optional)
- Input type: text
- Placeholder: "Johnson & Associates"
- Required: No
- Note: "Optional - helps us personalize your experience"

**6. Role** (Optional dropdown)
- Options: 
  - Solo Practitioner
  - Associate
  - Partner
  - General Counsel
  - Paralegal
  - Legal Operations
  - Other
- Default: "Select your role (optional)"

**7. Terms & Privacy Checkbox**
- Required: Yes
- Label: "I agree to the [Terms of Service](/terms) and [Privacy Policy](/privacy)"
- Validation: Must be checked to proceed

**8. Marketing Opt-in Checkbox** (Optional)
- Required: No
- Label: "Send me product updates, legal AI tips, and exclusive offers"
- Default: Unchecked (GDPR compliance)

---

### 3.6 CTA Button
- **Text:** "Create Account" or "Start for Free"
- **Style:** Primary button (full width, large)
- **Loading State:** Show spinner + "Creating account..."
- **Disabled State:** Gray out until all required fields valid

---

### 3.7 Social Sign-Up (Optional - Phase 2)
**Divider:** "Or sign up with"

**Buttons:**
- Google OAuth (most common for professionals)
- Microsoft OAuth (enterprise users)
- LinkedIn OAuth (professional context)

**Note:** Social signup still requires email verification

---

### 3.8 Alternative Actions
**Below form:**
- "Already have an account? [Sign in](/sign-in)"
- "Having trouble? [Contact support](/contact)"

---

### 3.9 Sign Up Flow (Backend)

**Step 1: Form Submission**
```javascript
POST /api/auth/signup
Body: {
  name: string,
  email: string,
  password: string,
  firmName?: string,
  role?: string,
  marketingOptIn: boolean
}
```

**Step 2: Validation**
- Check if email already exists
- Validate password strength
- Check for disposable email domains (block if necessary)

**Step 3: Create User Record**
```sql
INSERT INTO users (
  id, name, email, password_hash, firm_name, role,
  email_verified, created_at, subscription_tier, status
) VALUES (
  uuid_generate_v4(), $1, $2, $3, $4, $5,
  false, NOW(), 'free', 'pending_verification'
)
```

**Step 4: Send Verification Email**
- Generate secure token (JWT with 24h expiry)
- Store token in `email_verifications` table
- Send email via Resend:
  ```
  Subject: "Verify your Frith AI account"
  Body:
    Hi [Name],
    
    Welcome to Frith AI! Click the link below to verify your email:
    
    [Verify Email] → https://frithai.com/verify-email?token=[TOKEN]
    
    This link expires in 24 hours.
    
    Didn't create an account? Ignore this email.
  ```

**Step 5: Response**
```json
{
  "success": true,
  "message": "Account created! Check your email to verify.",
  "userId": "uuid",
  "requiresVerification": true
}
```

**Step 6: Redirect**
- Redirect to: `/verify-email-sent` (confirmation page)

---

### 3.10 Email Verification Sent Page

**Route:** `/verify-email-sent`

**Layout:** Centered card

**Content:**
- Icon: Envelope/mail icon
- **Headline:** "Check your email"
- **Message:** "We sent a verification link to **[user@email.com]**"
- **Instructions:** "Click the link in the email to activate your account and start using Frith AI."
- **Didn't receive?** 
  - "Check your spam folder"
  - Button: "Resend verification email" (rate limited: 1 per 5 min)
- **Wrong email?** 
  - Link: "Change email address" → allows editing before verification

---

### 3.11 Email Verification Page

**Route:** `/verify-email?token=[TOKEN]`

**Flow:**
1. Validate token (check expiry, signature)
2. If valid:
   - Update user: `email_verified = true, status = 'active'`
   - Auto-login (create session)
   - Redirect to: `/welcome` (onboarding)
3. If invalid/expired:
   - Show error: "Invalid or expired verification link"
   - CTA: "Resend verification email"

**Success Page:**
- **Headline:** "Email verified! 🎉"
- **Message:** "Your account is now active. Let's get you started."
- **CTA:** "Continue to Dashboard" → `/welcome` (onboarding flow)

---

## 4. Sign In Page

### 4.1 Route
`/sign-in` or `/auth/signin`

### 4.2 Layout
Same split-screen design as Sign Up (consistent branding)

---

### 4.3 Left Side (Branding)
Same content as Sign Up page (testimonials, features, trust badges)

---

### 4.4 Right Side (Form)
**Card Design:** White card with shadow, centered

**Header:**
- **Title:** "Welcome back"
- **Subtitle:** "Sign in to your Frith AI account"
- **Sign Up Link:** "Don't have an account? Sign up"

---

### 4.5 Sign In Form Fields

**1. Email Address**
- Input type: email
- Placeholder: "you@lawfirm.com"
- Required: Yes
- Autofocus: Yes

**2. Password**
- Input type: password (with show/hide toggle)
- Placeholder: "Enter your password"
- Required: Yes

**3. Remember Me Checkbox** (Optional)
- Label: "Keep me signed in"
- Default: Unchecked
- Note: "Recommended for personal devices only"

**4. Forgot Password Link**
- Link: "Forgot password?" → `/reset-password`
- Positioned below password field (right-aligned)

---

### 4.6 CTA Button
- **Text:** "Sign In"
- **Style:** Primary button (full width, large)
- **Loading State:** Show spinner + "Signing in..."

---

### 4.7 Social Sign-In (Optional - Phase 2)
**Divider:** "Or sign in with"

**Buttons:**
- Google OAuth
- Microsoft OAuth
- LinkedIn OAuth

---

### 4.8 Sign In Flow (Backend)

**Step 1: Form Submission**
```javascript
POST /api/auth/signin
Body: {
  email: string,
  password: string,
  rememberMe: boolean
}
```

**Step 2: Validation**
- Find user by email
- If user not found: "Invalid email or password" (don't reveal which)
- Check password hash using bcrypt
- If password incorrect: Increment failed login attempts
- If failed attempts ≥ 5: Lock account for 15 minutes

**Step 3: Check Email Verification**
- If `email_verified = false`:
  - Redirect to `/verify-email-sent`
  - Show message: "Please verify your email before signing in"

**Step 4: Create Session**
- Generate JWT token
- Set httpOnly cookie
- Log sign-in event in audit log

**Step 5: Response**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@lawfirm.com",
    "role": "user",
    "subscriptionTier": "free"
  },
  "redirectTo": "/dashboard"
}
```

**Step 6: Redirect**
- If first-time login: → `/welcome` (onboarding)
- If returning user: → `/dashboard`

---

### 4.9 Error Handling

**Invalid Credentials:**
- Message: "Invalid email or password. Please try again."
- Style: Red alert banner above form
- Don't reveal which field is wrong (security)

**Account Locked:**
- Message: "Too many failed login attempts. Your account is temporarily locked. Try again in 15 minutes or reset your password."
- CTA: Link to `/reset-password`

**Unverified Email:**
- Message: "Please verify your email address before signing in. Check your inbox for the verification link."
- CTA: "Resend verification email"

---

## 5. Password Reset (Forgot Password)

### 5.1 Request Reset Page

**Route:** `/reset-password` or `/forgot-password`

**Layout:** Centered card (no split screen)

---

### 5.2 Request Reset Form

**Header:**
- **Title:** "Reset your password"
- **Subtitle:** "Enter your email and we'll send you a reset link"

**Form Fields:**

**1. Email Address**
- Input type: email
- Placeholder: "you@lawfirm.com"
- Required: Yes

**CTA Button:**
- **Text:** "Send Reset Link"
- **Style:** Primary button (full width)
- **Loading State:** "Sending..."

**Below Form:**
- "Remember your password? [Sign in](/sign-in)"

---

### 5.3 Request Reset Flow (Backend)

**Step 1: Form Submission**
```javascript
POST /api/auth/request-reset
Body: { email: string }
```

**Step 2: Find User**
- Look up user by email
- **Important:** Always show success message (security best practice)
- Even if email doesn't exist, show: "If an account exists, we sent a reset link"

**Step 3: Generate Reset Token**
- Create secure token (JWT with 1h expiry)
- Store in `password_resets` table with user_id, token, expires_at
- Invalidate any previous reset tokens for this user

**Step 4: Send Reset Email**
```
Subject: "Reset your Frith AI password"
Body:
  Hi [Name],
  
  We received a request to reset your password. Click the link below:
  
  [Reset Password] → https://frithai.com/reset-password/[TOKEN]
  
  This link expires in 1 hour.
  
  Didn't request this? Ignore this email or contact support if concerned.
```

**Step 5: Response**
- Redirect to: `/reset-password-sent`

---

### 5.4 Reset Link Sent Page

**Route:** `/reset-password-sent`

**Layout:** Centered card

**Content:**
- Icon: Lock/key icon
- **Headline:** "Check your email"
- **Message:** "If an account exists for **[email]**, we sent a password reset link."
- **Instructions:** "Check your inbox and click the link to reset your password."
- **Didn't receive?**
  - "Check your spam folder"
  - Button: "Resend reset link" (rate limited: 1 per 5 min)
- **Back to:** [Sign in](/sign-in)

---

### 5.5 Reset Password Page (with token)

**Route:** `/reset-password/[TOKEN]`

**Layout:** Centered card

---

### 5.6 Reset Password Form

**Header:**
- **Title:** "Create new password"
- **Subtitle:** "Enter a strong password for your account"

**Form Fields:**

**1. New Password**
- Input type: password (with show/hide toggle)
- Placeholder: "Enter new password"
- Required: Yes
- Validation: Same rules as signup (min 12 chars, complexity)
- **Password Strength Indicator:** Show strength meter

**2. Confirm New Password**
- Input type: password
- Placeholder: "Confirm new password"
- Required: Yes
- Validation: Must match new password

**CTA Button:**
- **Text:** "Reset Password"
- **Style:** Primary button (full width)
- **Loading State:** "Resetting..."

---

### 5.7 Reset Password Flow (Backend)

**Step 1: Validate Token**
```javascript
GET /api/auth/validate-reset-token/[TOKEN]
```
- Check if token exists and not expired
- If invalid: Show error page with "Resend reset link" button

**Step 2: Form Submission**
```javascript
POST /api/auth/reset-password
Body: {
  token: string,
  newPassword: string
}
```

**Step 3: Update Password**
- Hash new password with bcrypt
- Update user record: `password_hash = [new_hash]`
- Invalidate reset token
- Log password change event in audit log

**Step 4: Send Confirmation Email**
```
Subject: "Your Frith AI password was changed"
Body:
  Hi [Name],
  
  Your password was successfully changed.
  
  If you didn't make this change, contact support immediately.
```

**Step 5: Response**
- Redirect to: `/reset-password-success`

---

### 5.8 Reset Success Page

**Route:** `/reset-password-success`

**Content:**
- Icon: Checkmark/success icon
- **Headline:** "Password reset successful"
- **Message:** "Your password has been changed. You can now sign in with your new password."
- **CTA:** "Sign In" → `/sign-in`

---

## 6. Two-Factor Authentication (2FA)

### 6.1 Enable 2FA (in User Settings)

**Route:** `/settings/security` (within app.frithai.com)

**Flow:**
1. User clicks "Enable 2FA"
2. Backend generates TOTP secret
3. Display QR code + manual entry code
4. User scans with Google Authenticator/Authy
5. User enters verification code
6. If correct: Enable 2FA, show backup codes (one-time use)
7. Store: `two_factor_enabled = true, two_factor_secret = [encrypted]`

---

### 6.2 2FA Sign In Flow

**Step 1: User enters email + password → Success**

**Step 2: Redirect to** `/auth/2fa-verify`

**Layout:** Centered card

**Content:**
- **Headline:** "Enter your authentication code"
- **Subtitle:** "Open your authenticator app to get your code"
- **Input:** 6-digit code (auto-focus, auto-submit when 6 digits entered)
- **Backup option:** "Use a backup code instead"
- **Trouble?** "Lost your device? Contact support"

**Validation:**
- Compare entered code with TOTP generation
- If valid: Complete sign-in, create session, redirect to dashboard
- If invalid: Show error, allow 3 attempts before lockout

---

## 7. SSO (Single Sign-On) - Enterprise Feature

### 7.1 Supported Providers
- **SAML 2.0** (Okta, Azure AD, OneLogin)
- **OAuth 2.0** (Google Workspace, Microsoft 365)

### 7.2 SSO Sign In Flow
1. User clicks "Sign in with SSO"
2. Enter company domain or email
3. Redirect to company's identity provider
4. After authentication, redirect back with token
5. Create session, redirect to dashboard

### 7.3 Configuration (Admin Only)
- Route: `/admin/sso-config`
- Upload SAML metadata or configure OAuth
- Test connection before enabling

---

## 8. Account Security Features

### 8.1 Session Management
- **Session Duration:** 7 days (default), 30 days if "Remember me" checked
- **Concurrent Sessions:** Allow up to 5 active sessions
- **Session Revocation:** Users can view and revoke sessions in settings

### 8.2 Login History
- Route: `/settings/security/login-history`
- Display: Last 50 login attempts with timestamp, IP, location, device
- Allow revoking active sessions

### 8.3 Security Alerts
- Email notification for:
  - New device login
  - Password change
  - 2FA disabled
  - Multiple failed login attempts

---

## 9. User Roles & Permissions

### 9.1 Role Types
1. **Free User** - Default role, limited tool access
2. **Paid User** - Full tool access based on plan
3. **Team Member** - Part of organization, role assigned by admin
4. **Admin** - Org admin, can manage billing and users
5. **Super Admin** - Platform admin (Frith AI staff)

### 9.2 Role Assignment
- Stored in `users.role` column
- Checked on every authenticated request
- Used for feature gating and UI visibility

---

## 10. Database Schema (Neon PostgreSQL)

### 10.1 Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  firm_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active',
  stripe_customer_id VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  status VARCHAR(50) DEFAULT 'pending_verification',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  marketing_opt_in BOOLEAN DEFAULT false,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
```

### 10.2 Email Verifications Table
```sql
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_verifications_token ON email_verifications(token);
```

### 10.3 Password Resets Table
```sql
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_password_resets_token ON password_resets(token);
```

### 10.4 Sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(500) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(session_token);
```

### 10.5 Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 11. API Endpoints

### 11.1 Authentication Endpoints
```javascript
POST   /api/auth/signup          // Create new account
POST   /api/auth/signin          // Sign in
POST   /api/auth/signout         // Sign out
POST   /api/auth/verify-email    // Verify email with token
POST   /api/auth/resend-verification  // Resend verification email
POST   /api/auth/request-reset   // Request password reset
POST   /api/auth/reset-password  // Reset password with token
GET    /api/auth/validate-token  // Validate reset token
POST   /api/auth/enable-2fa      // Enable 2FA
POST   /api/auth/verify-2fa      // Verify 2FA code
POST   /api/auth/disable-2fa     // Disable 2FA
GET    /api/auth/session         // Get current session
DELETE /api/auth/session/:id     // Revoke session
```

### 11.2 User Management Endpoints
```javascript
GET    /api/user/profile         // Get user profile
PATCH  /api/user/profile         // Update profile
GET    /api/user/login-history   // Get login history
GET    /api/user/sessions        // Get active sessions
```

---

## 12. Email Templates (Resend)

### 12.1 Welcome Email (after verification)
```
Subject: "Welcome to Frith AI, [Name]! 🎉"

Hi [Name],

Your account is now active! You have access to:
✓ 15 free AI tool queries per month
✓ 240+ specialized legal AI tools
✓ Secure, encrypted workspace

[Start Using Frith AI] → https://app.frithai.com

Need help getting started? Check our Quick Start Guide.

Questions? Reply to this email or visit support.frithai.com

Best,
The Frith AI Team
```

### 12.2 Password Changed Email
```
Subject: "Your Frith AI password was changed"

Hi [Name],

Your password was successfully changed on [Date] at [Time].

If you didn't make this change, please contact support immediately.

[Contact Support] → https://support.frithai.com

Best,
The Frith AI Team
```

### 12.3 New Device Login Email
```
Subject: "New sign-in to your Frith AI account"

Hi [Name],

We detected a new sign-in to your account:

Device: [User Agent]
Location: [City, Country]
Time: [Timestamp]
IP: [IP Address]

Was this you? If not, secure your account immediately:
[Change Password] → https://frithai.com/reset-password

Best,
The Frith AI Team
```

---

## 13. UI Components (Shadcn)

### 13.1 Components Used
- **Form** (form wrapper with validation)
- **Input** (text, email, password fields)
- **Button** (primary, secondary, loading states)
- **Card** (form container)
- **Label** (form labels)
- **Checkbox** (terms agreement, remember me)
- **Alert** (error/success messages)
- **Badge** (email verification status)
- **Dialog** (2FA QR code modal)

### 13.2 Custom Components to Build
- `PasswordStrengthMeter.tsx` - Visual password strength indicator
- `SocialAuthButtons.tsx` - OAuth provider buttons
- `AuthLayout.tsx` - Split-screen layout wrapper
- `LoadingButton.tsx` - Button with loading spinner

---

## 14. Validation Rules

### 14.1 Email
- Must be valid email format
- Must not already exist (real-time check)
- Max length: 255 chars

### 14.2 Password
- Min length: 12 characters
- Must contain:
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character (!@#$%^&*)
- Cannot be common passwords (check against list)
- Cannot contain user's name or email

### 14.3 Name
- Min length: 2 characters
- Max length: 255 characters
- Letters, spaces, hyphens, apostrophes only

---

## 15. Error Messages

### 15.1 Signup Errors
- "This email is already registered. [Sign in instead](/sign-in)"
- "Password must be at least 12 characters with uppercase, lowercase, number, and special character"
- "You must agree to the Terms of Service to create an account"
- "Invalid email format"

### 15.2 Signin Errors
- "Invalid email or password"
- "Too many failed attempts. Account locked for 15 minutes"
- "Please verify your email before signing in. [Resend verification](/resend-verification)"
- "Your account has been deactivated. Contact support for assistance"

### 15.3 Password Reset Errors
- "Invalid or expired reset link. [Request a new one](/reset-password)"
- "Password reset link already used. [Request a new one](/reset-password)"
- "Passwords do not match"

---

## 16. Accessibility (WCAG 2.1 AA)

### 16.1 Requirements
- Keyboard navigation for all form fields (Tab, Shift+Tab, Enter)
- Focus indicators visible
- Error messages announced by screen readers
- Labels associated with inputs (for attribute)
- ARIA labels for password show/hide toggle
- Color contrast ≥ 4.5:1 for text

### 16.2 Screen Reader Announcements
- "Email address field, required"
- "Password field, required, must be at least 12 characters"
- "Error: Invalid email format"

---

## 17. Mobile Responsiveness

### 17.1 Design Adjustments
- Remove split-screen layout (stack vertically)
- Full-width form inputs
- Larger touch targets (min 44x44px)
- Sticky CTA button at bottom (mobile)
- Auto-zoom disabled on input focus (iOS)

### 17.2 Progressive Enhancement
- Works without JavaScript (form submission via POST)
- Real-time validation enhances experience but not required

---

## 18. Rate Limiting

### 18.1 Limits
- **Signup:** 5 per hour per IP
- **Signin:** 10 per hour per IP (before lockout)
- **Password Reset Requests:** 3 per hour per email
- **Email Verification Resend:** 3 per hour per email
- **2FA Attempts:** 5 per hour per user

### 18.2 Implementation
- Store in Redis or Neon (rate_limits table)
- Return 429 status with Retry-After header

---

## 19. Testing Checklist

### 19.1 Signup Flow
- [ ] Valid signup creates user
- [ ] Duplicate email shows error
- [ ] Weak password rejected
- [ ] Verification email sent
- [ ] Email verification link works
- [ ] Expired token shows error
- [ ] Auto-login after verification

### 19.2 Signin Flow
- [ ] Valid credentials sign in
- [ ] Invalid credentials show error
- [ ] 5 failed attempts lock account
- [ ] Remember me extends session
- [ ] Unverified email redirects to verification page
- [ ] 2FA prompt appears for enabled users

### 19.3 Password Reset Flow
- [ ] Reset email sent for valid email
- [ ] Reset email NOT sent for invalid email (but same message shown)
- [ ] Reset link works
- [ ] Expired reset link shows error
- [ ] Password successfully changed
- [ ] Confirmation email sent

### 19.4 Security Tests
- [ ] CSRF tokens validated
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (sanitized inputs)
- [ ] Rate limiting enforced
- [ ] Session hijacking prevented (httpOnly cookies)

---

## 20. Analytics & Tracking

### 20.1 Events to Track
- Signup started
- Signup completed
- Email verified
- Signin success
- Signin failed
- Password reset requested
- Password reset completed
- 2FA enabled
- Social auth used (Google, Microsoft, LinkedIn)

### 20.2 Metrics to Monitor
- Signup conversion rate (form started → completed)
- Email verification rate
- Signin success rate
- Password reset usage
- Average time to verify email
- Failed login attempts per user

---

## 21. Security Best Practices

### 21.1 Password Storage
- Use bcrypt with salt rounds = 12
- Never store plaintext passwords
- Never log passwords (even hashed)

### 21.2 Token Security
- Use cryptographically secure random tokens
- JWT with short expiry (1h for reset, 24h for verification)
- Rotate session tokens on privilege escalation

### 21.3 Email Security
- Use DKIM/SPF for Resend
- Rate limit email sends
- Verify email deliverability

---

## 22. Deployment Checklist

### Pre-Launch
- [ ] Environment variables set (JWT secret, Resend API key, Neon DB URL)
- [ ] SSL certificate active
- [ ] Rate limiting configured
- [ ] Email templates tested
- [ ] All forms tested (desktop + mobile)
- [ ] Error handling tested
- [ ] Audit logs working
- [ ] Session management working
- [ ] Password reset flow tested
- [ ] 2FA flow tested (if enabled)

### Post-Launch
- [ ] Monitor failed login attempts
- [ ] Monitor email deliverability
- [ ] Watch for suspicious signups (bots)
- [ ] Track signup → verification rate

---

## 23. Future Enhancements

### Phase 2 (3-6 months)
- Social auth (Google, Microsoft, LinkedIn)
- Passwordless login (magic links)
- Passkey/WebAuthn support
- Account recovery without email (backup codes)

### Phase 3 (6-12 months)
- SSO for enterprise (SAML, OAuth)
- SCIM provisioning
- Multi-org support (users belong to multiple firms)
- Advanced session management (location-based restrictions)

---

## 24. Support & Help

### Common User Issues
1. **"I didn't receive the verification email"**
   - Check spam folder
   - Resend verification email
   - Verify email address is correct

2. **"My password reset link expired"**
   - Request a new reset link
   - Links expire after 1 hour

3. **"I'm locked out of my account"**
   - Wait 15 minutes after failed attempts
   - Reset password immediately
   - Contact support if persistent

---

**Document Version:** 1.0  
**Last Updated:** December 9, 2025  
**Status:** Ready for Design & Development
