import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';

interface StudentRecord {
  id?: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  idNumber: string;
  email: string;
  dob: string;
  age: number | string;
  photoUrl: string;
  faceDescriptor?: number[];
  createdAt: string;
}

// In-memory fallback database for local development and live demo persistence
const inMemoryStudents: StudentRecord[] = [
  {
    id: 'demo-1',
    firstName: 'Alex',
    lastName: 'Mercer',
    name: 'Alex Mercer',
    phone: '+1 (555) 234-5678',
    idNumber: 'HVD-2026-8942',
    email: 'alex.mercer@harvard.edu',
    dob: '2002-05-14',
    age: 24,
    photoUrl: '/file.svg',
    createdAt: new Date().toISOString(),
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, name, phone, idNumber, email, dob, age, photoUrl, faceDescriptor } = body;

    const finalFirstName = (firstName || '').trim();
    const finalLastName = (lastName || '').trim();
    const fullName = (name || `${finalFirstName} ${finalLastName}`).trim();

    if (!fullName || !idNumber) {
      return NextResponse.json(
        { success: false, error: 'First Name, Last Name, and Student ID Number are required.' },
        { status: 400 }
      );
    }

    const newStudent: StudentRecord = {
      id: `std-${Date.now()}`,
      firstName: finalFirstName,
      lastName: finalLastName,
      name: fullName,
      phone: (phone || '').trim(),
      idNumber: (idNumber || '').trim(),
      email: (email || '').trim(),
      dob: (dob || '').trim(),
      age: age !== undefined ? age : '',
      photoUrl: photoUrl || '',
      faceDescriptor: faceDescriptor || null,
      createdAt: new Date().toISOString(),
    };

    // Save to Supabase if configured
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('students').upsert({
        name: newStudent.name,
        email: newStudent.email || `${newStudent.idNumber.toLowerCase()}@student.edu`,
        matric_number: newStudent.idNumber,
        face_descriptor: newStudent.faceDescriptor,
      });

      if (error) {
        console.warn('Supabase save error, falling back to local memory:', error.message);
      }
    }

    // Upsert into memory store
    const existingIndex = inMemoryStudents.findIndex(
      (s) => s.idNumber.toLowerCase() === newStudent.idNumber.toLowerCase()
    );

    if (existingIndex >= 0) {
      inMemoryStudents[existingIndex] = newStudent;
    } else {
      inMemoryStudents.unshift(newStudent);
    }

    return NextResponse.json({
      success: true,
      message: 'Student registered successfully!',
      student: newStudent,
    });
  } catch (err: any) {
    console.error('Error enrolling student:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idNumber = searchParams.get('idNumber') || searchParams.get('matricNumber');
    const name = searchParams.get('name');

    if (!idNumber && !name) {
      return NextResponse.json({ success: true, students: inMemoryStudents });
    }

    // Try finding in memory store first
    let student = inMemoryStudents.find(
      (s) =>
        (idNumber && s.idNumber.toLowerCase() === idNumber.trim().toLowerCase()) ||
        (name && s.name.toLowerCase() === name.trim().toLowerCase())
    );

    // If not found in memory store and Supabase is configured, check Supabase
    if (!student && isSupabaseConfigured() && idNumber) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('matric_number', idNumber.trim())
        .single();

      if (data && !error) {
        student = {
          id: data.id,
          firstName: data.name.split(' ')[0] || data.name,
          lastName: data.name.split(' ').slice(1).join(' ') || '',
          name: data.name,
          phone: '',
          idNumber: data.matric_number,
          email: data.email,
          dob: '',
          age: '',
          photoUrl: '',
          faceDescriptor: data.face_descriptor,
          createdAt: data.created_at,
        };
      }
    }

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'No registered student found matching the provided details.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, student });
  } catch (err: any) {
    console.error('Error fetching student:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
