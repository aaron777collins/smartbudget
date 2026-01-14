import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/filter-presets/:id - Delete a filter preset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: presetId } = await params;

    // Verify preset belongs to user
    const preset = await prisma.filterPreset.findFirst({
      where: {
        id: presetId,
        userId
      }
    });

    if (!preset) {
      return NextResponse.json(
        { error: 'Filter preset not found' },
        { status: 404 }
      );
    }

    // Delete preset
    await prisma.filterPreset.delete({
      where: { id: presetId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Filter preset delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete filter preset' },
      { status: 500 }
    );
  }
}
