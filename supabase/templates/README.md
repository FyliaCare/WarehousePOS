# Email Templates for Supabase Dashboard

Copy these templates into your Supabase Dashboard under **Authentication → Email**.

> **Important:** The `{{ .ConfirmationURL }}` variable is automatically replaced with the actual verification/reset link by Supabase.

---

## AUTH TEMPLATES

### 1. Confirm Signup (Email Verification)

**Subject:** `Welcome to WarehousePOS - Verify Your Email`

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">WarehousePOS</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Your Business, Simplified</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b;">Welcome aboard! 🎉</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
                Thanks for signing up for WarehousePOS. To get started, please verify your email address by clicking the button below.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
                      Verify My Email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; line-height: 1.6; color: #a1a1aa; word-break: break-all;">
                {{ .ConfirmationURL }}
              </p>
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                This link will expire in 24 hours. If you didn't create an account with WarehousePOS, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                © 2026 WarehousePOS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

### 2. Reset Password

**Subject:** `WarehousePOS - Reset Your Password`

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">WarehousePOS</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Your Business, Simplified</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b;">Reset Your Password 🔐</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
                We received a request to reset your password. Click the button below to choose a new password.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; line-height: 1.6; color: #a1a1aa; word-break: break-all;">
                {{ .ConfirmationURL }}
              </p>
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                © 2026 WarehousePOS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

### 3. Magic Link (Passwordless Login)

**Subject:** `WarehousePOS - Your Sign In Link`

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">WarehousePOS</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Your Business, Simplified</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b;">Your Sign In Link ✨</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
                Click the button below to sign in to your WarehousePOS account. No password needed!
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
                      Sign In to WarehousePOS
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                If the button doesn't work, copy and paste this link:
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; line-height: 1.6; color: #a1a1aa; word-break: break-all;">
                {{ .ConfirmationURL }}
              </p>
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                This link will expire in 1 hour. If you didn't request this, you can safely ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                © 2026 WarehousePOS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

### 4. Change Email Address (Confirmation)

**Subject:** `WarehousePOS - Confirm Email Change`

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">WarehousePOS</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Your Business, Simplified</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b;">Confirm Email Change 📧</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">
                You requested to change your email address. Click the button below to confirm this change.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
                      Confirm Email Change
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                If the button doesn't work, copy and paste this link:
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; line-height: 1.6; color: #a1a1aa; word-break: break-all;">
                {{ .ConfirmationURL }}
              </p>
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                If you didn't request this change, please contact support immediately.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                © 2026 WarehousePOS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## SECURITY NOTIFICATION TEMPLATES

These are notification-only emails (no action button needed). Enable them in **Authentication → Email → Notifications**.

---

### 5. Password Changed

**Subject:** `WarehousePOS - Your Password Was Changed`

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">WarehousePOS</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Security Alert</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <div style="width: 60px; height: 60px; margin: 0 auto 24px; background-color: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">🔐</span>
              </div>
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">Password Changed</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b; text-align: center;">
                Your WarehousePOS account password was successfully changed.
              </p>
              <div style="background-color: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #52525b;">
                  <strong>When:</strong> {{ .SentAt }}<br>
                  <strong>Email:</strong> {{ .Email }}
                </p>
              </div>
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a; text-align: center;">
                If you made this change, no further action is needed. If you don't recognize this activity, please contact our support team.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                © 2026 WarehousePOS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

### 6. Email Address Changed

**Subject:** `WarehousePOS - Your Email Address Was Changed`

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">WarehousePOS</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Security Alert</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <div style="width: 60px; height: 60px; margin: 0 auto 24px; background-color: #dbeafe; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">📧</span>
              </div>
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">Email Address Changed</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b; text-align: center;">
                The email address associated with your WarehousePOS account has been changed.
              </p>
              <div style="background-color: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #52525b;">
                  <strong>When:</strong> {{ .SentAt }}<br>
                  <strong>New Email:</strong> {{ .Email }}
                </p>
              </div>
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a; text-align: center;">
                If you made this change, no further action is needed. If you don't recognize this activity, please contact our support team.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                © 2026 WarehousePOS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

### 7. Phone Number Changed

**Subject:** `WarehousePOS - Your Phone Number Was Changed`

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">WarehousePOS</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Security Alert</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <div style="width: 60px; height: 60px; margin: 0 auto 24px; background-color: #d1fae5; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">📱</span>
              </div>
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">Phone Number Changed</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b; text-align: center;">
                The phone number associated with your WarehousePOS account has been changed.
              </p>
              <div style="background-color: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #52525b;">
                  <strong>When:</strong> {{ .SentAt }}<br>
                  <strong>Account:</strong> {{ .Email }}
                </p>
              </div>
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a; text-align: center;">
                <strong>Didn't make this change?</strong><br>
                If you didn't change your phone number, please contact our support team immediately.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                © 2026 WarehousePOS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

### 8. Identity Linked

**Subject:** `WarehousePOS - New Login Method Added`

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">WarehousePOS</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Security Alert</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <div style="width: 60px; height: 60px; margin: 0 auto 24px; background-color: #d1fae5; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">🔗</span>
              </div>
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">New Login Method Added</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b; text-align: center;">
                A new identity provider has been linked to your WarehousePOS account. You can now use this method to sign in.
              </p>
              <div style="background-color: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #52525b;">
                  <strong>When:</strong> {{ .SentAt }}<br>
                  <strong>Account:</strong> {{ .Email }}
                </p>
              </div>
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a; text-align: center;">
                <strong>Didn't do this?</strong><br>
                If you didn't link a new login method, please review your account security settings immediately.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                © 2026 WarehousePOS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

### 9. Identity Unlinked

**Subject:** `WarehousePOS - Login Method Removed`

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">WarehousePOS</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Security Alert</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <div style="width: 60px; height: 60px; margin: 0 auto 24px; background-color: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">🔓</span>
              </div>
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">Login Method Removed</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b; text-align: center;">
                An identity provider has been unlinked from your WarehousePOS account. You can no longer use this method to sign in.
              </p>
              <div style="background-color: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #52525b;">
                  <strong>When:</strong> {{ .SentAt }}<br>
                  <strong>Account:</strong> {{ .Email }}
                </p>
              </div>
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a; text-align: center;">
                <strong>Didn't do this?</strong><br>
                If you didn't remove this login method, please review your account security settings immediately.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                © 2026 WarehousePOS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

### 10. Multi-Factor Authentication Added

**Subject:** `WarehousePOS - Two-Factor Authentication Enabled`

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">WarehousePOS</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Security Alert</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <div style="width: 60px; height: 60px; margin: 0 auto 24px; background-color: #d1fae5; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">🛡️</span>
              </div>
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">2FA Enabled</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b; text-align: center;">
                Two-factor authentication has been enabled on your WarehousePOS account. Your account is now more secure!
              </p>
              <div style="background-color: #d1fae5; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #065f46; font-weight: 600;">
                  ✓ Extra layer of security active
                </p>
              </div>
              <div style="background-color: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #52525b;">
                  <strong>When:</strong> {{ .SentAt }}<br>
                  <strong>Account:</strong> {{ .Email }}
                </p>
              </div>
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a; text-align: center;">
                <strong>Didn't do this?</strong><br>
                If you didn't enable 2FA, please contact support immediately.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                © 2026 WarehousePOS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

### 11. Multi-Factor Authentication Removed

**Subject:** `WarehousePOS - Two-Factor Authentication Disabled`

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">WarehousePOS</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">Security Alert</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <div style="width: 60px; height: 60px; margin: 0 auto 24px; background-color: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">⚠️</span>
              </div>
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">2FA Disabled</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b; text-align: center;">
                Two-factor authentication has been disabled on your WarehousePOS account.
              </p>
              <div style="background-color: #fee2e2; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #991b1b; font-weight: 600;">
                  ⚠ Extra security layer removed
                </p>
              </div>
              <div style="background-color: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #52525b;">
                  <strong>When:</strong> {{ .SentAt }}<br>
                  <strong>Account:</strong> {{ .Email }}
                </p>
              </div>
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a; text-align: center;">
                <strong>Didn't do this?</strong><br>
                If you didn't disable 2FA, your account may be compromised. Please reset your password and contact support immediately.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                © 2026 WarehousePOS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Setup Instructions

### Auth Templates (Authentication → Email Templates)

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication → Email Templates**
3. For each template type (Confirm signup, Reset password, Magic link, Change email), paste the corresponding HTML from above
4. Click **Save**

### Security Notifications (Authentication → Email → Notifications)

1. Go to **Authentication → Email**
2. Scroll to **Notifications** section
3. Click on each notification type (Password changed, Email changed, etc.)
4. Toggle to enable the notification
5. Paste the corresponding HTML template
6. Click **Save changes**

### URL Configuration (Authentication → URL Configuration)

**Site URL:**
```
https://pos.warehousepos.com
```

**Redirect URLs:**
```
https://pos.warehousepos.com/auth/callback
https://pos.warehousepos.com/reset-password
http://localhost:5173/auth/callback
http://localhost:5173/reset-password
```
