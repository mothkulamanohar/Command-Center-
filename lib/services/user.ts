import { z } from "zod";
import { db } from "@/lib/db";
import { can, UserContext } from "@/lib/auth/can";
import { hashPassword, verifyPassword, validatePasswordStrength, generateOneTimePassword } from "@/lib/auth/password";
import { logAudit } from "@/lib/services/audit";
import { RoleKey } from "@prisma/client";

// Input Schemas
export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  keepMeSignedIn: z.boolean().default(false),
});

export const CreateUserInputSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.nativeEnum(RoleKey).default(RoleKey.MEMBER),
  title: z.string().optional(),
  honorific: z.string().optional(),
  campusId: z.string().optional(),
  teamIds: z.array(z.string()).default([]),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  isSenior: z.boolean().default(false),
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(10, "Password must be at least 10 characters"),
});

export const UpdateProfileSchema = z.object({
  displayName: z.string().optional(),
  title: z.string().optional(),
  avatarUrl: z.string().optional(),
  quietFrom: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietTo: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notifPrefs: z.record(z.unknown()).optional(),
});

/**
 * F-AUTH-01: Email + password login with lockout protection
 */
export async function authenticateUser(input: z.infer<typeof LoginInputSchema>) {
  const data = LoginInputSchema.parse(input);
  const now = new Date();

  const user = await db.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  // Check lockout
  if (user?.lockedUntil && user.lockedUntil > now) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / (60 * 1000));
    return {
      success: false,
      error: `Account is temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`,
    };
  }

  // Generic message per SPEC F-AUTH-01
  const genericError = "Email or password is wrong";

  if (!user || !user.active) {
    return { success: false, error: genericError };
  }

  const isPasswordValid = await verifyPassword(data.password, user.passwordHash);

  if (!isPasswordValid) {
    const failedLogins = user.failedLogins + 1;
    const updateData: { failedLogins: number; lockedUntil?: Date } = { failedLogins };

    // 5 failed attempts -> 15-minute lock per SPEC F-AUTH-01
    if (failedLogins >= 5) {
      updateData.lockedUntil = new Date(now.getTime() + 15 * 60 * 1000);
      updateData.failedLogins = 0;
    }

    await db.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return { success: false, error: genericError };
  }

  // Reset failed logins on success
  await db.user.update({
    where: { id: user.id },
    data: {
      failedLogins: 0,
      lockedUntil: null,
      lastSeenAt: now,
    },
  });

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePw: user.mustChangePw,
    },
  };
}

/**
 * F-AUTH-02: Admin creates user with one-time password
 */
export async function createUser(actor: UserContext, input: z.infer<typeof CreateUserInputSchema>) {
  if (!can(actor, "manage_users")) {
    throw new Error("Unauthorized: Only Admins can create users");
  }

  const data = CreateUserInputSchema.parse(input);
  const tempPassword = generateOneTimePassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: data.name,
        displayName: data.displayName || data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        passwordHash,
        mustChangePw: true,
        role: data.role,
        title: data.title,
        honorific: data.honorific,
        campusId: data.campusId,
        startDate: data.startDate,
        endDate: data.endDate,
        isSenior: data.isSenior,
      },
    });

    if (data.teamIds.length > 0) {
      await tx.teamMember.createMany({
        data: data.teamIds.map((teamId) => ({
          teamId,
          userId: created.id,
          isLead: false,
        })),
      });
    }

    await logAudit(tx, {
      actorId: actor.id,
      action: "CREATE_USER",
      entity: "User",
      entityId: created.id,
      after: { email: created.email, role: created.role },
    });

    return created;
  });

  return {
    user,
    oneTimePassword: tempPassword,
  };
}

/**
 * F-AUTH-03: Password reset by Admin
 */
export async function resetUserPassword(actor: UserContext, targetUserId: string) {
  if (!can(actor, "manage_users")) {
    throw new Error("Unauthorized: Only Admins can reset user passwords");
  }

  const tempPassword = generateOneTimePassword();
  const passwordHash = await hashPassword(tempPassword);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: targetUserId },
      data: {
        passwordHash,
        mustChangePw: true,
        failedLogins: 0,
        lockedUntil: null,
      },
    });

    await logAudit(tx, {
      actorId: actor.id,
      action: "RESET_PASSWORD",
      entity: "User",
      entityId: targetUserId,
    });
  });

  return { oneTimePassword: tempPassword };
}

/**
 * F-AUTH-04: Change own password
 */
export async function changeOwnPassword(
  userId: string,
  input: z.infer<typeof ChangePasswordSchema>
) {
  const data = ChangePasswordSchema.parse(input);
  const strengthCheck = validatePasswordStrength(data.newPassword);
  if (!strengthCheck.valid) {
    return { success: false, error: strengthCheck.reason };
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: "User not found" };

  const isOldCorrect = await verifyPassword(data.oldPassword, user.passwordHash);
  if (!isOldCorrect) {
    return { success: false, error: "Old password is wrong" };
  }

  const newHash = await hashPassword(data.newPassword);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        mustChangePw: false,
      },
    });

    await logAudit(tx, {
      actorId: userId,
      action: "CHANGE_PASSWORD",
      entity: "User",
      entityId: userId,
    });
  });

  return { success: true };
}

/**
 * F-AUTH-05: Deactivate user
 */
export async function deactivateUser(actor: UserContext, targetUserId: string) {
  if (!can(actor, "manage_users")) {
    throw new Error("Unauthorized: Only Admins can deactivate users");
  }

  return await db.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: targetUserId },
      data: { active: false },
    });

    // Count open tasks for reassignment
    const openTasksCount = await tx.task.count({
      where: {
        ownerId: targetUserId,
        status: { notIn: ["DONE", "CANCELLED"] },
      },
    });

    await logAudit(tx, {
      actorId: actor.id,
      action: "DEACTIVATE_USER",
      entity: "User",
      entityId: targetUserId,
    });

    return { user, openTasksCount };
  });
}
