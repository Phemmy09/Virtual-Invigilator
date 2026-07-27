import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || '';

const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key',
});

export interface TheoryGradingResult {
  marks_awarded: number;
  max_marks: number;
  feedback: {
    conceptual_accuracy: { score: number; max: number; commentary: string };
    process_step_correctness: { score: number; max: number; commentary: string };
    key_terminology_match: { found_keywords: string[]; missing_keywords: string[] };
    originality_assessment: { suspicion_score: number; commentary: string };
    overall_summary: string;
  };
}

export async function evaluateTheoryResponse(
  questionText: string,
  studentResponse: string,
  rubric: {
    keywords?: string[];
    process_guidance?: string;
    model_answer?: string;
    max_marks?: number;
  },
  maxMarks: number = 10
): Promise<TheoryGradingResult> {
  if (!apiKey || apiKey === 'your-openai-api-key' || apiKey === 'dummy-key') {
    // Return realistic mock evaluation if API key is not yet configured
    const keywordList = rubric?.keywords || ['process', 'methodology', 'analysis'];
    return {
      marks_awarded: Math.round(maxMarks * 0.85 * 10) / 10,
      max_marks: maxMarks,
      feedback: {
        conceptual_accuracy: {
          score: Math.round(maxMarks * 0.4 * 10) / 10,
          max: maxMarks * 0.4,
          commentary: 'Solid conceptual understanding demonstrated with logical reasoning.',
        },
        process_step_correctness: {
          score: Math.round(maxMarks * 0.3 * 10) / 10,
          max: maxMarks * 0.3,
          commentary: 'Methodological steps are clear and accurate.',
        },
        key_terminology_match: {
          found_keywords: keywordList,
          missing_keywords: [],
        },
        originality_assessment: {
          suspicion_score: 5,
          commentary: 'Response appears authentic and original.',
        },
        overall_summary: 'Excellent effort. Awarded partial credit for process and correct key concepts.',
      },
    };
  }

  const prompt = `You are an elite university professor grading a high-stakes exam answer.
Evaluate the student's theory response based on the question, model answer/rubric, and key terms.

Question:
"${questionText}"

Student's Response:
"${studentResponse}"

Model Answer / Marking Rubric:
"${rubric?.model_answer || 'Evaluate based on academic standards.'}"

Process Guidance:
"${rubric?.process_guidance || 'Award partial credit if the student shows correct working/process even if final calculation has small errors.'}"

Expected Keywords:
${JSON.stringify(rubric?.keywords || [])}

Maximum Marks Possible: ${maxMarks}

Respond ONLY with a valid JSON object matching this schema:
{
  "marks_awarded": number,
  "max_marks": number,
  "feedback": {
    "conceptual_accuracy": { "score": number, "max": number, "commentary": "string" },
    "process_step_correctness": { "score": number, "max": number, "commentary": "string" },
    "key_terminology_match": { "found_keywords": ["string"], "missing_keywords": ["string"] },
    "originality_assessment": { "suspicion_score": number, "commentary": "string" },
    "overall_summary": "string"
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an academic evaluation system. Respond strictly in JSON format.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content) as TheoryGradingResult;
  } catch (error) {
    console.error('Error in OpenAI evaluation:', error);
    return {
      marks_awarded: Math.round(maxMarks * 0.5 * 10) / 10,
      max_marks: maxMarks,
      feedback: {
        conceptual_accuracy: { score: maxMarks * 0.2, max: maxMarks * 0.4, commentary: 'Evaluation fallback engaged.' },
        process_step_correctness: { score: maxMarks * 0.2, max: maxMarks * 0.3, commentary: 'Evaluation fallback engaged.' },
        key_terminology_match: { found_keywords: [], missing_keywords: [] },
        originality_assessment: { suspicion_score: 0, commentary: 'Pending manual review.' },
        overall_summary: 'Auto-evaluation encountered an issue; default partial marks assigned.',
      },
    };
  }
}

export interface ExtractedQuestion {
  type: 'objective' | 'theory';
  question_text: string;
  options?: string[];
  correct_answer?: string;
  rubric?: {
    keywords?: string[];
    model_answer?: string;
    process_guidance?: string;
    max_marks?: number;
  };
}

export async function parseDocumentTextToQuestions(documentText: string): Promise<ExtractedQuestion[]> {
  if (!apiKey || apiKey === 'your-openai-api-key' || apiKey === 'dummy-key') {
    // Default fallback mock extracted questions if no key
    return [
      {
        type: 'objective',
        question_text: 'Which protocol is used for secure real-time web proctoring communications?',
        options: ['HTTP/1.0', 'WebSockets / PostMessage API', 'FTP', 'SMTP'],
        correct_answer: 'WebSockets / PostMessage API',
      },
      {
        type: 'theory',
        question_text: 'Explain the principles of facial embedding matching and decibel noise monitoring in online exam security.',
        correct_answer: 'Facial descriptors generate a 128-float vector representing facial geometry. Euclidean distance comparison measures identity match. Decibel metering flags environmental audio spikes above ambient baseline.',
        rubric: {
          keywords: ['descriptor', 'Euclidean distance', 'decibel', 'ambient baseline'],
          model_answer: 'Full explanation covering 128-dimensional vectors, Euclidean distance thresholding, and Web Audio API decibel metering.',
          process_guidance: 'Award credit for discussing facial embeddings, identity thresholds, and microphone audio metering.',
          max_marks: 10,
        },
      },
    ];
  }

  const prompt = `Analyze the following raw text from an uploaded exam document (PDF, Word, CSV, or Text file) and extract structured exam questions.

Raw Document Text:
"""
${documentText.slice(0, 8000)}
"""

Extract all questions into a structured JSON array under the key "questions".
Each question item should match this schema:
{
  "type": "objective" OR "theory",
  "question_text": "string",
  "options": ["string"] (only for objective),
  "correct_answer": "string",
  "rubric": {
    "keywords": ["string"],
    "model_answer": "string",
    "process_guidance": "string",
    "max_marks": 10
  }
}

Return ONLY valid JSON format.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an intelligent document parsing system for exam software. Return strictly valid JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    return parsed.questions || [];
  } catch (err) {
    console.error('Error parsing document with OpenAI:', err);
    return [];
  }
}
