
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the session or user object
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { restaurantData } = await req.json()

    // Use the service role client to bypass RLS
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create restaurant first with a temporary owner_user_id that we'll update later
    const { data: restaurantResult, error: restaurantError } = await supabaseServiceClient
      .from('restaurants')
      .insert({
        name: restaurantData.restaurantName,
        type: restaurantData.restaurantType,
        country: restaurantData.country,
        city: restaurantData.city,
        vat_number: restaurantData.vatNumber,
        seats_count: restaurantData.seatsCount,
        owner_user_id: user.id // This should work since user.id exists in auth.users
      })
      .select()
      .single()

    if (restaurantError) {
      console.error('Error creating restaurant:', restaurantError)
      return new Response(
        JSON.stringify({ error: 'Failed to create restaurant' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create user profile after restaurant is created
    const { error: userError } = await supabaseServiceClient
      .from('users')
      .insert({
        id: user.id,
        restaurant_id: restaurantResult.id,
        full_name: restaurantData.fullName,
        email: restaurantData.email,
        password_hash: '', // This will be handled by Supabase Auth
        role: 'owner'
      })

    if (userError) {
      console.error('Error creating user profile:', userError)
      // If user creation fails, we should clean up the restaurant
      await supabaseServiceClient
        .from('restaurants')
        .delete()
        .eq('id', restaurantResult.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, restaurant: restaurantResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
