import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { pin, type } = await req.json();

    if (!pin || !type) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    let correctPin: string | undefined;

    if (type === 'staff') {
      correctPin = process.env.STAFF_PIN;
    } else if (type === 'admin_secondary') {
      correctPin = process.env.ADMIN_SECONDARY_PIN;
    }

    if (!correctPin) {
      return NextResponse.json({ success: false }, { status: 500 });
    }

    const valid = pin === correctPin;
    return NextResponse.json({ success: valid }, { status: valid ? 200 : 401 });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
