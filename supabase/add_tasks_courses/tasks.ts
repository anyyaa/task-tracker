import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // GET /tasks - получить все задачи
    if (method === 'GET' && path === '/tasks') {
      const { data, error } = await supabaseClient
        .from('tasks')
        .select(`
          *,
          courses:course_id (id, name)
        `)
        .order('deadline', { ascending: true, nullsFirst: false })

      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // GET /tasks?course_id=xxx - задачи по курсу
    if (method === 'GET' && path === '/tasks' && url.searchParams.has('course_id')) {
      const courseId = url.searchParams.get('course_id')
      
      const { data, error } = await supabaseClient
        .from('tasks')
        .select('*')
        .eq('course_id', courseId)
        .order('deadline', { ascending: true })

      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // GET /tasks/upcoming - предстоящие дедлайны
    if (method === 'GET' && path === '/tasks/upcoming') {
      const now = new Date().toISOString()
      
      const { data, error } = await supabaseClient
        .from('tasks')
        .select(`
          *,
          courses:course_id (name)
        `)
        .eq('is_completed', false)
        .not('deadline', 'is', null)
        .gte('deadline', now)
        .order('deadline', { ascending: true })
        .limit(10)

      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // GET /tasks/overdue - просроченные задачи
    if (method === 'GET' && path === '/tasks/overdue') {
      const now = new Date().toISOString()
      
      const { data, error } = await supabaseClient
        .from('tasks')
        .select(`
          *,
          courses:course_id (name)
        `)
        .eq('is_completed', false)
        .not('deadline', 'is', null)
        .lt('deadline', now)
        .order('deadline', { ascending: true })

      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // POST /tasks - создать задачу
    if (method === 'POST' && path === '/tasks') {
      const { title, course_id, user_id, deadline } = await req.json()
      
      if (!title || !course_id) {
        return new Response(JSON.stringify({ error: 'Название задачи и ID курса обязательны' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      const { data, error } = await supabaseClient
        .from('tasks')
        .insert([{
          title,
          course_id,
          user_id: user_id || null,
          deadline: deadline || null,
          is_completed: false
        }])
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      })
    }

    // PATCH /tasks/:id/complete - отметить как выполненную
    if (method === 'PATCH' && path.includes('/complete')) {
      const id = path.split('/')[2]
      
      const { data, error } = await supabaseClient
        .from('tasks')
        .update({ is_completed: true })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // PUT /tasks/:id - обновить задачу
    if (method === 'PUT' && path.startsWith('/tasks/') && !path.includes('/complete')) {
      const id = path.split('/')[2]
      const updates = await req.json()
      
      const { data, error } = await supabaseClient
        .from('tasks')
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

    // DELETE /tasks/:id - удалить задачу
    if (method === 'DELETE' && path.startsWith('/tasks/')) {
      const id = path.split('/')[2]
      
      const { error } = await supabaseClient
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
      return new Response(JSON.stringify({ message: 'Задача удалена' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // GET /tasks/stats - статистика
    if (method === 'GET' && path === '/tasks/stats') {
      const now = new Date().toISOString()
      
      const { count: total } = await supabaseClient
        .from('tasks')
        .select('*', { count: 'exact', head: true })

      const { count: completed } = await supabaseClient
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', true)

      const { count: overdue } = await supabaseClient
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', false)
        .lt('deadline', now)
        .not('deadline', 'is', null)

      return new Response(JSON.stringify({
        total_tasks: total || 0,
        completed_tasks: completed || 0,
        overdue_tasks: overdue || 0,
      }), {
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
