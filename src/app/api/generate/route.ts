import { generatePortfolioStream } from '@/lib/ai';
import type { Field } from '@/lib/types';

export async function POST(request: Request) {
  const { text, field } = await request.json();

  if (!text) {
    return new Response(JSON.stringify({ error: 'Missing text' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let aiResponse: Response;
  try {
    aiResponse = await generatePortfolioStream(text, (field as Field) || 'cs');
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'AI generation failed' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    return new Response(
      JSON.stringify({ error: `AI provider error: ${aiResponse.status}`, details: errorText }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Transform AI stream → SSE stream for client
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = aiResponse.body!.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        }
      } catch {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
