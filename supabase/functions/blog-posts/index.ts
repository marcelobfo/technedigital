import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const method = req.method;
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  console.log('Blog Posts API - Method:', method, 'Path:', pathParts);

  // Create Supabase client with service role for admin access
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // POST - Create new post
    if (method === 'POST') {
      const body = await req.json();
      console.log('Creating blog post:', body);
      
      const { data, error } = await supabaseClient
        .from('blog_posts')
        .insert([body])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating post:', error);
        throw error;
      }
      
      console.log('Post created successfully:', data.id);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // GET - List all posts or get specific post
    if (method === 'GET') {
      if (pathParts.length === 0 || pathParts[pathParts.length - 1] === 'blog-posts') {
        // List all posts
        console.log('Fetching all blog posts');
        const { data, error } = await supabaseClient
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching posts:', error);
          throw error;
        }
        
        console.log(`Fetched ${data?.length || 0} posts`);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Get specific post by ID
        const id = pathParts[pathParts.length - 1];
        console.log('Fetching post by ID:', id);
        
        const { data, error } = await supabaseClient
          .from('blog_posts')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching post:', error);
          throw error;
        }
        
        console.log('Post fetched successfully:', data.id);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // PUT - Update post
    if (method === 'PUT') {
      const id = pathParts[pathParts.length - 1];
      const body = await req.json();
      console.log('Updating post:', id, body);
      
      const { data, error } = await supabaseClient
        .from('blog_posts')
        .update(body)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating post:', error);
        throw error;
      }
      
      console.log('Post updated successfully:', data.id);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // DELETE - Delete post
    if (method === 'DELETE') {
      const id = pathParts[pathParts.length - 1];
      console.log('Deleting post:', id);
      
      const { error } = await supabaseClient
        .from('blog_posts')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting post:', error);
        throw error;
      }
      
      console.log('Post deleted successfully:', id);
      return new Response(JSON.stringify({ success: true, id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in blog-posts function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
