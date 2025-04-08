
import { supabase } from '../../integrations/supabase/client';

export const updateQuoteStats = async (quoteId: string, wpm: number, accuracy: number) => {
  try {
    const { data: incrementResult, error: incrementError } = await supabase.rpc(
      'increment',
      { 
        row_id: quoteId, 
        table_name: 'script_quotes', 
        column_name: 'typed_count' 
      }
    );

    if (incrementError) {
      console.error('Error incrementing typed count:', incrementError);
    }

    const { error: updateError } = await supabase
      .from('script_quotes')
      .update({
        avg_wpm: wpm,
        avg_accuracy: accuracy,
        best_wpm: wpm
      })
      .eq('id', quoteId);
      
    if (updateError) {
      console.error('Error updating quote stats:', updateError);
    }
  } catch (error) {
    console.error('Error updating quote stats:', error);
  }
};
