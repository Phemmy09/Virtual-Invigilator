-- ====================================================================
-- OmniGuard AI - Complete Production Supabase Database Schema
-- Virtual Invigilator & Multi-Criteria AI Grading Engine
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 2. CREATE TABLES
-- ====================================================================

-- A. Students Table (Registration & Biometric Profiles)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    name TEXT NOT NULL, -- Combined full name
    email TEXT UNIQUE NOT NULL,
    matric_number TEXT UNIQUE NOT NULL, -- Student ID / Matric Number
    phone TEXT,
    dob DATE, -- Date of Birth
    age INT, -- Candidate Age
    photo_url TEXT, -- Base64 encoded snapshot or image URL
    face_descriptor JSONB, -- 128-float array for facial recognition matching
    keystroke_baseline JSONB, -- Optional typing rhythm profile
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- B. Exams Table
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

-- C. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('objective', 'theory')),
    question_text TEXT NOT NULL,
    options JSONB, -- Array of string choices for objective questions
    correct_answer TEXT, -- Model answer string or key
    rubric JSONB, -- Criteria: max_marks, keywords, model_answer, process_guidance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- D. Exam Sessions Table
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

-- E. Proctoring Audit Logs Table
CREATE TABLE IF NOT EXISTS public.proctoring_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'face_mismatch', 'no_face', 'multiple_faces', 'gaze_deviation', 'noise_spike', 'tab_switch', 'fullscreen_exit'
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'critical')),
    details JSONB, -- e.g. { "dB": 78, "gazeAngle": "left", "detailsText": "Loud sound detected" }
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- F. Student Answers Table
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

-- ====================================================================
-- 3. PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_students_matric ON public.students(matric_number);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON public.questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam_id ON public.exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_student_id ON public.exam_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_logs_session_id ON public.proctoring_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_session_id ON public.student_answers(session_id);

-- ====================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctoring_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

-- Grant Anonymous Public Access (for simplified institutional API integration)
DROP POLICY IF EXISTS "Allow public access to students" ON public.students;
CREATE POLICY "Allow public access to students" ON public.students FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to exams" ON public.exams;
CREATE POLICY "Allow public access to exams" ON public.exams FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to questions" ON public.questions;
CREATE POLICY "Allow public access to questions" ON public.questions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to exam_sessions" ON public.exam_sessions;
CREATE POLICY "Allow public access to exam_sessions" ON public.exam_sessions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to proctoring_logs" ON public.proctoring_logs;
CREATE POLICY "Allow public access to proctoring_logs" ON public.proctoring_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to student_answers" ON public.student_answers;
CREATE POLICY "Allow public access to student_answers" ON public.student_answers FOR ALL USING (true);

-- ====================================================================
-- 5. SAMPLE DEMO SEED DATA (OPTIONAL TEST RECORDS)
-- ====================================================================
INSERT INTO public.students (first_name, last_name, name, email, matric_number, phone, dob, age)
VALUES 
  ('Alex', 'Mercer', 'Alex Mercer', 'alex.mercer@harvard.edu', 'HVD-2026-8942', '+1 (555) 234-5678', '2002-05-14', 24)
ON CONFLICT (matric_number) DO NOTHING;

INSERT INTO public.exams (id, title, subject_code, description, max_duration_mins, security_level)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Midterm AI Assessment', 'CS50 - Artificial Intelligence', 'Comprehensive examination covering vector search, neural networks, and computer vision proctoring.', 60, 'strict_ivy')
ON CONFLICT DO NOTHING;

INSERT INTO public.questions (exam_id, type, question_text, options, correct_answer, rubric)
VALUES 
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'objective',
    'Which data structure is optimal for continuous facial embedding vector comparison in 128-dimensional space?',
    '["Binary Search Tree", "k-d Tree / Euclidean Vector Index", "Singly Linked List", "Hash Table without Hashing"]'::jsonb,
    'k-d Tree / Euclidean Vector Index',
    '{"max_marks": 5}'::jsonb
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'theory',
    'Explain how Web Audio API decibel metering and facial descriptor Euclidean distance thresholds prevent remote exam fraud.',
    NULL,
    'Facial descriptors convert facial geometry into a 128-float vector. Calculating Euclidean distance against baseline detects face mismatches. Web Audio API analyzes decibel levels to flag acoustic anomalies above ambient background noise.',
    '{"keywords": ["descriptor", "Euclidean distance", "decibel", "ambient background"], "max_marks": 10}'::jsonb
  )
ON CONFLICT DO NOTHING;

-- ====================================================================
-- SCHEMA COMPLETE! Run this script in the Supabase SQL Editor.
-- ====================================================================
