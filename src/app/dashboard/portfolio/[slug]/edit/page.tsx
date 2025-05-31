const { data: record, error } = await supabase
  .from('portfolios')
  .select('template, data')
  .eq('slug', slug)
  .single();

  await supabase
  .from('portfolios')
  .update({ data: updatedData, template: updatedTemplate, updated_at: new Date() })
  .eq('slug', slug);
