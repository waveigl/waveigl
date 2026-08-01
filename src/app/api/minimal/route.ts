import { NextResponse } from 'next/server'
import { getMockClient, isDevMode } from '@/lib/supabase/mock-db'

export async function GET() {
  if (isDevMode()) {
    const supabase = getMockClient()
    const { data, error } = await supabase.from('discount_links').select('*')
    return NextResponse.json({ success: true, data, error: error?.message })
  }
  return NextResponse.json({ success: false, error: 'Not dev mode' })
}
