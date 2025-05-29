
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

    // First, create the user profile (this must come first due to foreign key constraints)
    const { error: userError } = await supabaseServiceClient
      .from('users')
      .insert({
        id: user.id,
        full_name: restaurantData.fullName,
        email: restaurantData.email,
        password_hash: '', // This will be handled by Supabase Auth
        role: 'owner',
        restaurant_id: '00000000-0000-0000-0000-000000000000' // Temporary placeholder
      })

    if (userError) {
      console.error('Error creating user profile:', userError)
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Now create the restaurant with the user as owner
    const { data: restaurantResult, error: restaurantError } = await supabaseServiceClient
      .from('restaurants')
      .insert({
        name: restaurantData.restaurantName,
        type: restaurantData.restaurantType,
        country: restaurantData.country,
        city: restaurantData.city,
        vat_number: restaurantData.vatNumber,
        seats_count: restaurantData.seatsCount,
        owner_user_id: user.id
      })
      .select()
      .single()

    if (restaurantError) {
      console.error('Error creating restaurant:', restaurantError)
      // Clean up user profile if restaurant creation fails
      await supabaseServiceClient
        .from('users')
        .delete()
        .eq('id', user.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to create restaurant' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Finally, update the user profile with the correct restaurant_id
    const { error: updateError } = await supabaseServiceClient
      .from('users')
      .update({ restaurant_id: restaurantResult.id })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user with restaurant_id:', updateError)
      // Clean up both records if the final update fails
      await supabaseServiceClient.from('restaurants').delete().eq('id', restaurantResult.id)
      await supabaseServiceClient.from('users').delete().eq('id', user.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to complete profile setup' }),
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
