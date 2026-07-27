-- OmniGuard AI - Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    matric_number TEXT UNIQUE NOT NULL,
    face_descriptor JSONB, -- 128-float array for facial recognition matching
    keystroke_baseline JSONB, -- Typing rhythm profile
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Exams Table
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    description TEXT,
    passcode TEXT,
    max_duration_mins INT DEFAULT 60,
    security_level TEXT DEFAULT 'strict_ivy', -- 'lenient', 'standard', 'strict_ivy'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('objective', 'theory')),
    question_text TEXT NOT NULL,
    options JSONB, -- Array of string choices for objective
    correct_answer TEXT, -- Choice key (e.g. "A") or model text
    rubric JSONB, -- Criteria: max_marks, keywords, step_breakdown, guidance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Exam Sessions Table
CREATE TABLE IF NOT EXISTS public.exam_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    matric_number TEXT,
    subject TEXT,
    ip_address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    user_agent TEXT,
    device_fingerprint TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'flagged_terminated')),
    trust_score NUMERIC DEFAULT 100 -- Dynamic 0-100% security rating
);

-- 5. Proctoring Audit Logs Table
CREATE TABLE IF NOT EXISTS public.proctoring_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'face_mismatch', 'no_face', 'multiple_faces', 'gaze_deviation', 'noise_spike', 'tab_switch', 'fullscreen_exit', 'keystroke_anomaly', 'clipboard_attempt'
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'critical')),
    details JSONB, -- e.g. { "dB": 78, "gazeAngle": "left", "confidence": 0.92 }
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Student Answers Table
CREATE TABLE IF NOT EXISTS public.student_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    student_response TEXT,
    marks_awarded NUMERIC DEFAULT 0,
    max_marks NUMERIC DEFAULT 10,
    grading_status TEXT DEFAULT 'pending' CHECK (grading_status IN ('pending', 'graded')),
    ai_feedback JSONB, -- Structured 4-tier grading breakdown (Conceptual, Process, Terminology, Originality)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON public.questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam_id ON public.exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_student_id ON public.exam_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_logs_session_id ON public.proctoring_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_session_id ON public.student_answers(session_id);

-- Enable Row Level Security (RLS) and grant anon access for demo simplicity
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctoring_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write access to students" ON public.students FOR ALL USING (true);
CREATE POLICY "Allow public read/write access to exams" ON public.exams FOR ALL USING (true);
CREATE POLICY "Allow public read/write access to questions" ON public.questions FOR ALL USING (true);
CREATE POLICY "Allow public read/write access to exam_sessions" ON public.exam_sessions FOR ALL USING (true);
CREATE POLICY "Allow public read/write access to proctoring_logs" ON public.proctoring_logs FOR ALL USING (true);
CREATE POLICY "Allow public read/write access to student_answers" ON public.student_answers FOR ALL USING (true);
