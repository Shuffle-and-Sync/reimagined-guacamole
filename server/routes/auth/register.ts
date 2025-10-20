import { Router } from "express";
import { storage } from "../../storage";
import { logger } from "../../logger";
import { authRateLimit } from "../../rate-limiting";
import { validateRequest } from "../../validation";
import { registrationSchema } from "./middleware";
import {
  validatePasswordStrength,
  hashPassword,
} from "../../auth/password";
import {
  generateEmailVerificationJWT,
  TOKEN_EXPIRY,
} from "../../auth/tokens";
import { sendEmailVerificationEmail } from "../../email-service";

const router = Router();

// User registration
router.post(
  "/",
  authRateLimit,
  validateRequest(registrationSchema),
  async (req, res) => {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        username,
        primaryCommunity,
      } = req.body;

      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          message: "Password does not meet security requirements",
          errors: passwordValidation.errors,
        });
      }

      // Normalize email and username for consistency
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedUsername = username.toLowerCase().trim();

      // Check if user already exists by email
      const existingUserByEmail =
        await storage.getUserByEmail(normalizedEmail);
      if (existingUserByEmail) {
        logger.warn("Registration attempted with existing email", {
          email: normalizedEmail,
          ip: req.ip,
        });
        return res
          .status(409)
          .json({ message: "An account with this email already exists" });
      }

      // Check if username is already taken
      const existingUserByUsername =
        await storage.getUserByUsername(normalizedUsername);
      if (existingUserByUsername) {
        logger.warn("Registration attempted with existing username", {
          username: normalizedUsername,
          ip: req.ip,
        });
        return res
          .status(409)
          .json({ message: "This username is already taken" });
      }

      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Generate unique user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;

      // Prepare user data with normalized values (correct schema field names)
      const userData = {
        id: userId,
        email: normalizedEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: normalizedUsername,
        primaryCommunity: primaryCommunity || "general",
        passwordHash: hashedPassword, // Correct schema field name
        isEmailVerified: false,
        status: "offline" as const,
        showOnlineStatus: "everyone" as const,
        allowDirectMessages: "everyone" as const,
        isPrivate: false,
        mfaEnabled: false, // Correct schema field name
      };

      // TRANSACTIONAL REGISTRATION PROCESS
      let newUser;
      let verificationToken;
      let emailSent = false;

      try {
        // Create the user
        newUser = await storage.createUser(userData);

        // Generate email verification token
        verificationToken = await generateEmailVerificationJWT(
          userId,
          normalizedEmail,
        );

        // Create email verification record
        await storage.createEmailVerificationToken({
          userId: userId,
          email: normalizedEmail,
          token: verificationToken,
          expiresAt: new Date(
            Date.now() + TOKEN_EXPIRY.EMAIL_VERIFICATION * 1000,
          ),
        });

        // Send verification email
        const baseUrl =
          process.env.AUTH_URL ||
          process.env.PUBLIC_WEB_URL ||
          "https://shuffleandsync.org";
        emailSent = await sendEmailVerificationEmail(
          normalizedEmail,
          verificationToken,
          baseUrl,
        );

        if (!emailSent) {
          logger.error(
            "Failed to send verification email during registration",
            {
              userId,
              email: normalizedEmail,
              ip: req.ip,
            },
          );
          // Don't fail registration if email fails, user can resend later
        }
      } catch (transactionError) {
        logger.error("Registration transaction failed", transactionError, {
          email: normalizedEmail,
          username: normalizedUsername,
          ip: req.ip,
        });

        // Log failed registration attempt
        try {
          await storage.createAuthAuditLog({
            userId: null,
            eventType: "registration",
            ipAddress: req.ip || "unknown",
            userAgent: req.headers["user-agent"] || "unknown",
            isSuccessful: false,
            failureReason: "transaction_error",
            details: JSON.stringify({
              email: normalizedEmail,
              username: normalizedUsername,
              error:
                transactionError instanceof Error
                  ? transactionError.message
                  : "Unknown error",
            }),
          });
        } catch (auditError) {
          logger.error("Failed to log registration failure", auditError);
        }

        return res
          .status(500)
          .json({ message: "Registration failed. Please try again." });
      }

      if (!emailSent) {
        logger.error(
          "Failed to send verification email during registration",
          {
            userId,
            email: normalizedEmail,
            ip: req.ip,
          },
        );

        // Log email sending failure
        await storage.createAuthAuditLog({
          userId: userId,
          eventType: "email_verification",
          ipAddress: req.ip || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
          isSuccessful: false,
          failureReason: "email_send_failed",
          details: JSON.stringify({
            email: normalizedEmail,
            reason: "email_service_error",
          }),
        });
        // Don't fail registration if email fails, user can resend later
      } else {
        // Log successful email verification sent
        await storage.createAuthAuditLog({
          userId: userId,
          eventType: "email_verification",
          ipAddress: req.ip || "unknown",
          userAgent: req.headers["user-agent"] || "unknown",
          isSuccessful: true,
          details: JSON.stringify({
            email: normalizedEmail,
            action: "verification_email_sent",
          }),
        });
      }

      // Log successful registration with complete audit trail
      await storage.createAuthAuditLog({
        userId: userId,
        eventType: "registration",
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        isSuccessful: true,
        details: JSON.stringify({
          email: normalizedEmail,
          username: normalizedUsername,
          emailSent,
          userAgent: req.headers["user-agent"],
          registrationMethod: "email_password",
        }),
      });

      logger.info("User registered successfully", {
        userId,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        ip: req.ip,
        emailSent,
      });

      // Return success response (don't include sensitive data)
      return res.status(201).json({
        message:
          "Registration successful! Please check your email to verify your account.",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          username: newUser.username,
          isEmailVerified: newUser.isEmailVerified,
        },
        emailSent,
      });
    } catch (error) {
      logger.error("Registration failed", error, {
        email: req.body?.email,
        username: req.body?.username,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });

      // Log failed registration attempt
      if (req.body?.email) {
        try {
          await storage.createAuthAuditLog({
            userId: null,
            eventType: "registration",
            ipAddress: req.ip || "unknown",
            userAgent: req.headers["user-agent"] || "unknown",
            isSuccessful: false,
            failureReason: "registration_error",
            details: JSON.stringify({
              email: req.body.email,
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          });
        } catch (auditError) {
          logger.error("Failed to log registration failure", auditError);
        }
      }

      return res
        .status(500)
        .json({ message: "Registration failed. Please try again." });
    }
  },
);

export default router;
