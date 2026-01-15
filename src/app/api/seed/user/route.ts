import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * API endpoint to seed the default user
 * This is needed because Prisma 7.x has issues with standalone scripts
 *
 * Usage: POST to /api/seed/user (only works in development mode)
 */
export async function POST(req: NextRequest) {
  // Only allow in development mode for security
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seed endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  const DEFAULT_USERNAME = 'aaron7c';
  const DEFAULT_PASSWORD = 'KingOfKings12345!';
  const DEFAULT_EMAIL = 'aaron@smartbudget.app';
  const DEFAULT_NAME = 'Aaron Collins';

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: DEFAULT_USERNAME },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: `User "${DEFAULT_USERNAME}" already exists`,
          user: {
            id: existingUser.id,
            username: existingUser.username,
            email: existingUser.email,
            name: existingUser.name,
          }
        },
        { status: 200 }
      );
    }

    // Hash password with bcrypt (cost factor 12)
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    // Create default user
    const user = await prisma.user.create({
      data: {
        username: DEFAULT_USERNAME,
        email: DEFAULT_EMAIL,
        password: hashedPassword,
        name: DEFAULT_NAME,
      },
    });

    return NextResponse.json(
      {
        message: 'Default user created successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
        },
        credentials: {
          username: DEFAULT_USERNAME,
          password: DEFAULT_PASSWORD,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating default user:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
