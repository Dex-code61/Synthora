import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AnalysisJobService } from "@/lib/services/analysis-job";

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Get current user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { jobId } = params;

    // Get job status
    const jobStatus = await AnalysisJobService.getJobStatus(jobId);

    if (!jobStatus) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 }
      );
    }

    // Verify job belongs to current user
    if (jobStatus.data?.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: jobStatus,
    });
  } catch (error) {
    console.error("Failed to get job status:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get job status",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Get current user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { jobId } = params;

    // Get job status to verify ownership
    const jobStatus = await AnalysisJobService.getJobStatus(jobId);

    if (!jobStatus) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 }
      );
    }

    // Verify job belongs to current user
    if (jobStatus.data?.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 403 }
      );
    }

    // Cancel job
    const cancelled = await AnalysisJobService.cancelJob(jobId);

    if (!cancelled) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to cancel job",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        status: "cancelled",
      },
    });
  } catch (error) {
    console.error("Failed to cancel job:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to cancel job",
      },
      { status: 500 }
    );
  }
}
