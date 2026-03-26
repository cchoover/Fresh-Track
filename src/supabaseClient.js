import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://thooshgduqnekcogewhv.supabase.co'
const supabaseKey = 'b_publishable_un8JtFtXBj0rxqQDVs5pAQ_z1IMZId8'

export const supabase = createClient(supabaseUrl, supabaseKey)
