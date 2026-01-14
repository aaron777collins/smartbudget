/**
 * User Settings API Endpoint
 *
 * GET /api/user/settings - Get user settings
 * PATCH /api/user/settings - Update user settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/settings
 * Get user settings including onboarding status
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId,
          currency: 'CAD',
          dateFormat: 'MM/DD/YYYY',
          firstDayOfWeek: 0,
          theme: 'system',
          notificationsEnabled: true,
          emailDigest: true,
          digestFrequency: 'weekly',
          budgetAlertThreshold: 80,
          hasCompletedOnboarding: false,
          onboardingStep: 0,
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/settings
 * Update user settings including onboarding status
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate and sanitize input
    const allowedFields = [
      'currency',
      'dateFormat',
      'firstDayOfWeek',
      'theme',
      'notificationsEnabled',
      'emailDigest',
      'digestFrequency',
      'budgetAlertThreshold',
      'hasCompletedOnboarding',
      'onboardingStep',
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Check if settings exist
    const existingSettings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    let settings;
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.userSettings.update({
        where: { userId },
        data: updateData
      });
    } else {
      // Create new settings with provided data
      settings = await prisma.userSettings.create({
        data: {
          userId,
          currency: 'CAD',
          dateFormat: 'MM/DD/YYYY',
          firstDayOfWeek: 0,
          theme: 'system',
          notificationsEnabled: true,
          emailDigest: true,
          digestFrequency: 'weekly',
          budgetAlertThreshold: 80,
          hasCompletedOnboarding: false,
          onboardingStep: 0,
          ...updateData
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
}
