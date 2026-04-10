import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Основная функция обработки
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Создаем клиент Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // GET /courses - получить все курсы
    if (method === 'GET' && path === '/courses') {
      const { data, error } = await supabaseClient
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // GET /courses/:id - получить курс с задачами
    if (method === 'GET' && path.startsWith('/courses/')) {
      const id = path.split('/')[2]
      
      const { data: course, error: courseError } = await supabaseClient
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()

      if (courseError) throw courseError

      const { data: tasks, error: tasksError } = await supabaseClient
        .from('tasks')
        .select('*')
        .eq('course_id', id)
        .order('deadline', { ascending: true })

      if (tasksError) throw tasksError

      return new Response(JSON.stringify({ ...course, tasks }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // POST /courses - создать курс
    if (method === 'POST' && path === '/courses') {
      const { name, description } = await req.json()
      
      if (!name) {
        return new Response(JSON.stringify({ error: 'Название курса обязательно' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      const { data, error } = await supabaseClient
        .from('courses')
        .insert([{ name, description, is_completed: false }])
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      })
    }

    // PUT /courses/:id - обновить курс
    if (method === 'PUT' && path.startsWith('/courses/')) {
      const id = path.split('/')[2]
      const updates = await req.json()
      
      const { data, error } = await supabaseClient
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // DELETE /courses/:id - удалить курс
    if (method === 'DELETE' && path.startsWith('/courses/')) {
      const id = path.split('/')[2]
      
      const { error } = await supabaseClient
        .from('courses')
        .delete()
        .eq('id', id)

      if (error) throw error
      return new Response(JSON.stringify({ message: 'Курс удалён' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ error: 'Route not found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    })

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
