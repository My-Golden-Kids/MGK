import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const GEMINI_TTS_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent';
const DEFAULT_VOICE_NAME = process.env.GEMINI_TTS_VOICE_NAME ?? 'Kore';

function createWavBuffer(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  channels = 1,
  bitDepth = 16,
) {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * channels * bitDepth) / 8;
  const blockAlign = (channels * bitDepth) / 8;

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

function buildPrompt(text: string) {
  return [
    'Read the following Korean text naturally in a warm, friendly tone.',
    'Speak only the provided text exactly as written.',
    text,
  ].join('\n');
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: 'GEMINI_API_KEY is not configured.' },
      { status: 500 },
    );
  }

  let body: { text?: string } | null = null;

  try {
    body = (await request.json()) as { text?: string };
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const text = body?.text?.trim();

  if (!text) {
    return Response.json({ error: 'Text is required.' }, { status: 400 });
  }

  const geminiResponse = await fetch(GEMINI_TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: buildPrompt(text),
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: DEFAULT_VOICE_NAME,
            },
          },
        },
      },
      model: 'gemini-2.5-flash-preview-tts',
    }),
  });

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();

    return Response.json(
      {
        error: 'Gemini TTS request failed.',
        detail: errorText,
      },
      { status: geminiResponse.status },
    );
  }

  const geminiJson = (await geminiResponse.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: {
            data?: string;
          };
        }>;
      };
    }>;
  };

  const base64Audio =
    geminiJson.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Audio) {
    return Response.json(
      { error: 'Gemini TTS returned no audio data.' },
      { status: 502 },
    );
  }

  const pcmBuffer = Buffer.from(base64Audio, 'base64');
  const wavBuffer = createWavBuffer(pcmBuffer);

  return new Response(wavBuffer, {
    headers: {
      'Content-Type': 'audio/wav',
      'Cache-Control': 'no-store',
    },
  });
}
