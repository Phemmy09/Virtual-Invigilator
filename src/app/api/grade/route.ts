import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';
import { evaluateTheoryResponse } from '@/utils/openai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, answers } = body; // answers: array of { questionId, questionType, questionText, studentResponse, correctAnswer, rubric, maxMarks }

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid answers array provided' }, { status: 400 });
    }

    const gradedResults = [];

    for (const item of answers) {
      const maxMarks = item.maxMarks || 10;
      let marksAwarded = 0;
      let feedback = {};

      if (item.questionType === 'objective') {
        const isCorrect = (item.studentResponse || '').trim().toLowerCase() === (item.correctAnswer || '').trim().toLowerCase();
        marksAwarded = isCorrect ? maxMarks : 0;
        feedback = {
          is_correct: isCorrect,
          selected_option: item.studentResponse,
          correct_option: item.correctAnswer,
          summary: isCorrect ? 'Correct choice.' : `Incorrect choice. Correct answer was ${item.correctAnswer}.`,
        };
      } else {
        // Theory question evaluation via OpenAI
        const evaluation = await evaluateTheoryResponse(
          item.questionText,
          item.studentResponse || '',
          item.rubric || { model_answer: item.correctAnswer },
          maxMarks
        );
        marksAwarded = evaluation.marks_awarded;
        feedback = evaluation.feedback;
      }

      gradedResults.push({
        questionId: item.questionId,
        marksAwarded,
        maxMarks,
        feedback,
      });

      // Save to Supabase if configured
      if (isSupabaseConfigured() && sessionId) {
        await supabase.from('student_answers').insert({
          session_id: sessionId,
          question_id: item.questionId,
          student_response: item.studentResponse,
          marks_awarded: marksAwarded,
          max_marks: maxMarks,
          grading_status: 'graded',
          ai_feedback: feedback,
        });
      }
    }

    const totalMarksAwarded = gradedResults.reduce((acc, curr) => acc + curr.marksAwarded, 0);
    const totalPossibleMarks = gradedResults.reduce((acc, curr) => acc + curr.maxMarks, 0);

    return NextResponse.json({
      success: true,
      totalMarksAwarded,
      totalPossibleMarks,
      results: gradedResults,
    });
  } catch (err: any) {
    console.error('Error in grading API:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
