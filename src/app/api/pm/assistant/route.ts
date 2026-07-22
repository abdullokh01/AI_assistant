// PM Assistant Document Generator Route - AI Project Intelligence Platform
// Path: src/app/api/pm/assistant/route.ts

import { NextResponse } from 'next/server';
import { 
  ProjectRepository, MemoryRepository, DocumentRepository, ActivityRepository 
} from '../../../../lib/core/infrastructure/supabase';
import { ClaudeService } from '../../../../lib/core/infrastructure/claude';

export async function POST(request: Request) {
  try {
    let projectId = '';
    let docType = 'PRD';
    let title = 'Product Requirements Document';
    let instructions = 'Create a detailed functional specification.';

    try {
      const body = await request.json();
      projectId = body.projectId;
      if (body.docType) docType = body.docType;
      if (body.title) title = body.title;
      if (body.instructions) instructions = body.instructions;
    } catch {
      const { searchParams } = new URL(request.url);
      projectId = searchParams.get('projectId') || '';
      docType = searchParams.get('docType') || 'PRD';
      title = searchParams.get('title') || 'Product Requirements Document';
      instructions = searchParams.get('instructions') || 'Create a detailed functional specification.';
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const projectRepo = new ProjectRepository();
    const memoryRepo = new MemoryRepository();
    const documentRepo = new DocumentRepository();
    const activityRepo = new ActivityRepository();
    const claudeService = new ClaudeService();

    const project = await projectRepo.getById(projectId);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const memories = await memoryRepo.listByProject(projectId);

    const projectContext = `Project Name: ${project.name}\nDescription: ${project.description || 'N/A'}`;

    // Generate content via Claude
    const content = await claudeService.generatePMDocument(
      docType,
      title,
      instructions,
      projectContext,
      memories
    );

    // Save document
    const savedDoc = await documentRepo.save({
      projectId,
      title,
      content,
      type: docType as any,
      status: 'draft',
      version: 1,
    });

    // Save version history
    await documentRepo.saveGeneratedVersion(savedDoc.id, content, instructions, 1);

    // Log Activity
    await activityRepo.log(
      projectId,
      'Document Generated',
      `PM Assistant generated a new ${docType} document: "${title}"`
    );

    return NextResponse.json({ success: true, document: savedDoc });
  } catch (error: any) {
    console.error('PM assistant route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId') || '';
  const docType = searchParams.get('docType') || 'PRD';

  const url = new URL(request.url);
  const fakeRequest = new Request(url, { method: 'POST', body: JSON.stringify({ projectId, docType }) });
  return await POST(fakeRequest);
}
