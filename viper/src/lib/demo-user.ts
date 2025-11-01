import { prisma } from "./prisma";

const DEMO_USER_EMAIL = "demo@viper.local";

export async function getDemoUser() {
  let user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { email: DEMO_USER_EMAIL },
    });
  }

  return user;
}

