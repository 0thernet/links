import { NextRequest, NextResponse } from "next/server";
import { getCachedUser, cacheUser } from "@/lib/redis";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { createUser, ensureUserResources } from "@/lib/user-lifecycle";
import { handleAuth } from "@workos-inc/authkit-nextjs";

export async function GET(request: NextRequest) {
  try {
    // For regular web auth flows, use the AuthKit handler
    // This will handle the code exchange and session creation
    const authHandler = handleAuth({
      // returnPathname: "/", // Redirect to home after successful auth
      onSuccess: async ({ user }) => {
        if (!user) return;

        // Check Redis cache first
        let existingUser = await getCachedUser(user.id);

        // If not in cache, check the database
        if (!existingUser) {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.workosUserId, user.id),
          });

          // Cache the result if found in database
          if (dbUser) {
            existingUser = dbUser;
            await cacheUser(user.id, dbUser);
          }
        }

        // If user doesn't exist, create them
        if (!existingUser) {
          const newUser = await createUser(
            {
              workosUserId: user.id,
              email: user.email,
              firstName: user.firstName || undefined,
              lastName: user.lastName || undefined,
              profileImage: user.profilePictureUrl || undefined,
            },
            db
          );
          // Cache the new user
          await cacheUser(user.id, newUser);
          console.log(`Created new user for WorkOS ID: ${user.id}`);
        } else {
          // Ensure existing user has all required resources
          await ensureUserResources(existingUser.id, db);
        }
      },
    });

    return authHandler(request);
  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
