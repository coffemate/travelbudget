import { createUserSupabase } from '../lib/supabase';
import type { AuthContext, Env } from '../types';
import { errorResponse, json, parseJson } from '../utils/http';

async function syncTripRemainingBudget(supabase: ReturnType<typeof createUserSupabase>, tripId: string) {
  const [{ data: trip, error: tripError }, { data: expenses, error: expensesError }] = await Promise.all([
    supabase.from('trips').select('*').eq('id', tripId).maybeSingle(),
    supabase.from('expenses').select('amount, amount_in_base, fx_rate_to_base').eq('trip_id', tripId),
  ]);
  if (tripError) throw tripError;
  if (expensesError) throw expensesError;
  if (!trip) return null;
  const totalExpense = (expenses ?? []).reduce((sum, expense) => {
    const hasBaseAmount = expense.amount_in_base !== null
      && expense.amount_in_base !== undefined
      && expense.amount_in_base !== '';
    const baseAmount = Number(expense.amount_in_base);
    if (hasBaseAmount && Number.isFinite(baseAmount)) return sum + baseAmount;
    const amount = Number(expense.amount || 0);
    const rate = Number(expense.fx_rate_to_base || 1);
    return Number.isFinite(amount * rate) ? sum + amount * rate : sum;
  }, 0);
  const { data: updatedTrip, error: updateError } = await supabase
    .from('trips')
    .update({ remaining_budget: Number(trip.total_budget || 0) - totalExpense })
    .eq('id', tripId)
    .select('*')
    .single();
  if (updateError) throw updateError;
  return updatedTrip;
}

export async function handleExpenses(request: Request, env: Env, auth: AuthContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/expenses', '') || '/';
  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  const isProduction = runtimeEnv.NODE_ENV === 'production' || runtimeEnv.ENVIRONMENT === 'production';
  if (!isProduction) {
    console.debug('[api] expenses request', {
      method: request.method,
      path,
      userId: auth.user.id,
      hasToken: Boolean(auth.token),
    });
  }

  const supabase = createUserSupabase(env, auth.token);

  try {
    const matched = path.match(/^\/([^/]+)$/);
    if (!matched) return errorResponse('Not found', 404);
    const expenseId = matched[1];

    if (request.method === 'PATCH') {
      const body = await parseJson<Record<string, unknown>>(request);
      const { data, error } = await supabase.from('expenses').update(body).eq('id', expenseId).select('*').maybeSingle();
      if (error) return errorResponse(error.message, 400);
      if (!data) return errorResponse('Expense not found', 404);
      const trip = await syncTripRemainingBudget(supabase, data.trip_id);
      return json({ expense: data, trip });
    }

    if (request.method === 'DELETE') {
      const { data: expense, error: findError } = await supabase.from('expenses').select('trip_id').eq('id', expenseId).maybeSingle();
      if (findError) return errorResponse(findError.message, 400);
      if (!expense) return errorResponse('Expense not found', 404);
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
      if (error) return errorResponse(error.message, 400);
      const trip = await syncTripRemainingBudget(supabase, expense.trip_id);
      return json({ success: true, trip });
    }

    return errorResponse('Not found', 404);
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Internal server error');
    console.error('[error] [worker] expenses route failed', {
      message: error.message,
      stack: error.stack,
      method: request.method,
      path,
      userId: auth.user.id,
    });
    const responseBody = isProduction
      ? { success: false, error: 'Internal server error' }
      : { success: false, error: error.message, stack: error.stack };
    return new Response(
      JSON.stringify(responseBody),
      {
        status: 500,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'access-control-allow-origin': '*',
          'access-control-allow-headers': 'content-type, authorization',
          'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        },
      },
    );
  }
}
