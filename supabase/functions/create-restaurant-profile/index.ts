
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

    // Use the service role client to bypass RLS for this operation
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Start a database transaction using the service role client
    // Note: We'll implement this as multiple operations with error handling

    console.log('Starting restaurant profile creation for user:', user.id)

    // Step 1: Verify the user exists in public.users (should exist due to trigger)
    const { data: existingUser, error: userCheckError } = await supabaseServiceClient
      .from('users')
      .select('id, restaurant_id')
      .eq('id', user.id)
      .single()

    if (userCheckError) {
      console.error('Error checking user existence:', userCheckError)
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Step 2: Check if user already has a restaurant associated
    if (existingUser.restaurant_id) {
      console.log('User already has restaurant:', existingUser.restaurant_id)
      return new Response(
        JSON.stringify({ error: 'User already has a restaurant associated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Step 3: Create the restaurant
    const { data: restaurantResult, error: restaurantError } = await supabaseServiceClient
      .from('restaurants')
      .insert({
        name: restaurantData.restaurantName,
        type: restaurantData.restaurantType,
        country: restaurantData.country,
        city: restaurantData.city,
        vat_number: restaurantData.vatNumber,
        seats_count: restaurantData.seatsCount,
        owner_user_id: user.id // Set owner immediately
      })
      .select()
      .single()

    if (restaurantError) {
      console.error('Error creating restaurant:', restaurantError)
      return new Response(
        JSON.stringify({ error: 'Failed to create restaurant', details: restaurantError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Restaurant created successfully:', restaurantResult.id)

    // Step 4: Update the user profile with restaurant_id and ensure role is 'owner'
    const { error: userUpdateError } = await supabaseServiceClient
      .from('users')
      .update({ 
        restaurant_id: restaurantResult.id,
        role: 'owner',
        full_name: restaurantData.fullName // Update full name if provided
      })
      .eq('id', user.id)

    if (userUpdateError) {
      console.error('Error updating user profile:', userUpdateError)
      
      // Cleanup: Remove the created restaurant
      await supabaseServiceClient
        .from('restaurants')
        .delete()
        .eq('id', restaurantResult.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to update user profile', details: userUpdateError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('User profile updated successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        restaurant: restaurantResult,
        message: 'Restaurant profile created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
